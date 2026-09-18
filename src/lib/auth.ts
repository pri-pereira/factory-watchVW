// ─────────────────────────────────────────────────────────
// auth.ts — Autenticação via Firebase Auth com suporte a Realtime Database e fallback local
// ─────────────────────────────────────────────────────────
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db } from "./firebase";

export type Cargo = "Líder" | "Monitor" | "Operador";

export interface Usuario {
  nome: string;
  registro: string; // matrícula (chave única)
  email: string;
  cargo: Cargo;
  senhaHash: string; // hash simples via btoa (para fallback offline)
}

export interface UsuarioLogado {
  nome: string;
  registro: string;
  email?: string;
  cargo: Cargo;
}

const USERS_KEY = "sf_usuarios_v2";
const SESSION_KEY = "sf_sessao";

// Hash simples para fallback local
export function hashSenha(senha: string): string {
  return btoa(encodeURIComponent(senha));
}

// Retorna todos os usuários cadastrados localmente
export function getUsuarios(): Usuario[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Usuario[]) : [];
  } catch {
    return [];
  }
}

// Cadastra um novo usuário no Firebase Auth + Realtime Database + cache local
export async function cadastrarUsuario(
  nome: string,
  registro: string,
  email: string,
  cargo: Cargo,
  senha: string
): Promise<{ ok: boolean; erro?: string }> {
  const nomeTrim = nome.trim();
  const regTrim = registro.trim();
  const emailTrim = email.trim().toLowerCase();

  // Validação: número de registro/matrícula deve conter exatamente 7 dígitos numéricos
  if (!/^\d{7}$/.test(regTrim)) {
    return { ok: false, erro: "O número de registro (matrícula) deve conter exatamente 7 dígitos numéricos (ex: 0263552)." };
  }

  const users = getUsuarios();
  if (users.some((u) => u.registro === regTrim)) {
    return { ok: false, erro: "Este número de registro já está cadastrado." };
  }
  if (users.some((u) => u.email.toLowerCase() === emailTrim)) {
    return { ok: false, erro: "Este e-mail já está em uso." };
  }

  try {
    // 1. Cadastra credencial oficial no Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, emailTrim, senha);

    try {
      await updateProfile(cred.user, { displayName: nomeTrim });
    } catch {
      // Ignora erro de perfil
    }

    // 2. Registra perfil e índice de matrícula no Firebase Realtime Database
    try {
      const userRef = ref(db, `usuarios/${cred.user.uid}`);
      await set(userRef, {
        uid: cred.user.uid,
        nome: nomeTrim,
        registro: regTrim,
        email: emailTrim,
        cargo,
        createdAt: Date.now(),
      });

      const regIndexRef = ref(db, `usuarios_por_registro/${regTrim}`);
      await set(regIndexRef, {
        uid: cred.user.uid,
        email: emailTrim,
      });
    } catch (dbErr) {
      console.warn("[auth] Não foi possível persistir metadados no Realtime Database:", dbErr);
    }

    // 3. Mantém cópia local para resiliência offline
    users.push({ nome: nomeTrim, registro: regTrim, email: emailTrim, cargo, senhaHash: hashSenha(senha) });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    return { ok: true };
  } catch (error: any) {
    console.error("[auth] Erro ao cadastrar usuário no Firebase:", error);
    const code = error?.code || "";

    if (code === "auth/email-already-in-use") {
      return { ok: false, erro: "Este e-mail já está cadastrado no sistema." };
    }
    if (code === "auth/weak-password") {
      return { ok: false, erro: "A senha deve ter pelo menos 6 caracteres para o backend do Firebase." };
    }
    if (code === "auth/invalid-email") {
      return { ok: false, erro: "Endereço de e-mail com formato inválido." };
    }
    if (code === "auth/operation-not-allowed") {
      // Se o provedor Email/Password não estiver ativo no console do Firebase, grava localmente para não travar o usuário
      console.warn("[auth] Provedor Email/Password ainda não ativado no Firebase Console. Salvando localmente.");
      users.push({ nome: nomeTrim, registro: regTrim, email: emailTrim, cargo, senhaHash: hashSenha(senha) });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return { ok: true };
    }

    return { ok: false, erro: error?.message || "Erro ao realizar cadastro no servidor." };
  }
}

// Faz login conectando ao Firebase Auth (com suporte a matrícula ou e-mail)
export async function fazerLogin(
  identificacao: string, // Pode ser número de registro (matrícula) ou e-mail
  senha: string
): Promise<UsuarioLogado | null> {
  const idLimpo = identificacao.trim();
  const senhaLimpa = senha;

  let emailParaLogin = idLimpo.includes("@") ? idLimpo.toLowerCase() : "";

  // Se o usuário digitou a matrícula, consulta o Firebase Realtime DB para achar o e-mail
  if (!emailParaLogin) {
    try {
      const regSnapshot = await get(ref(db, `usuarios_por_registro/${idLimpo}`));
      if (regSnapshot.exists()) {
        const data = regSnapshot.val();
        emailParaLogin = data.email;
      }
    } catch {
      // Ignora erro de leitura
    }

    if (!emailParaLogin) {
      const users = getUsuarios();
      const localUser = users.find((u) => u.registro === idLimpo);
      if (localUser) {
        emailParaLogin = localUser.email;
      }
    }
  }

  // Tenta autenticar no Firebase
  if (emailParaLogin) {
    try {
      const cred = await signInWithEmailAndPassword(auth, emailParaLogin, senhaLimpa);

      let nome = cred.user.displayName || "";
      let registro = idLimpo;
      let cargo: Cargo = "Operador";

      try {
        const userSnap = await get(ref(db, `usuarios/${cred.user.uid}`));
        if (userSnap.exists()) {
          const uData = userSnap.val();
          nome = uData.nome || nome;
          registro = uData.registro || registro;
          cargo = uData.cargo || cargo;
        }
      } catch {
        // Ignora
      }

      if (!nome) {
        const users = getUsuarios();
        const local = users.find((u) => u.email.toLowerCase() === emailParaLogin.toLowerCase() || u.registro === idLimpo);
        if (local) {
          nome = local.nome;
          registro = local.registro;
          cargo = local.cargo;
        } else {
          nome = emailParaLogin.split("@")[0];
        }
      }

      const sessao: UsuarioLogado = {
        nome: nome || "Colaborador",
        registro,
        email: emailParaLogin,
        cargo,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
      return sessao;
    } catch (fbError: any) {
      console.warn("[auth] Falha de autenticação no Firebase:", fbError?.code);
    }
  }

  // Fallback offline / contas locais legadas
  const users = getUsuarios();
  const user = users.find(
    (u) =>
      (u.registro === idLimpo || u.email.toLowerCase() === idLimpo.toLowerCase()) &&
      u.senhaHash === hashSenha(senhaLimpa)
  );

  if (!user) return null;

  const sessao: UsuarioLogado = {
    nome: user.nome,
    registro: user.registro,
    email: user.email,
    cargo: user.cargo,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
  return sessao;
}

// Recuperação de senha real via Firebase Authentication
export async function recuperarSenha(email: string): Promise<{ ok: boolean; mensagem: string }> {
  const emailLimpo = email.trim().toLowerCase();
  if (!emailLimpo) {
    return { ok: false, mensagem: "Por favor, informe um endereço de e-mail válido." };
  }

  try {
    // Dispara o envio oficial de e-mail pelo servidor do Firebase
    await sendPasswordResetEmail(auth, emailLimpo);
    return {
      ok: true,
      mensagem: "E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada e a pasta de spam para criar sua nova senha.",
    };
  } catch (error: any) {
    console.error("[auth] Erro ao disparar redefinição de senha pelo Firebase:", error);
    const code = error?.code || "";

    if (code === "auth/user-not-found") {
      return { ok: false, mensagem: "Nenhum usuário cadastrado com este e-mail no sistema." };
    }
    if (code === "auth/invalid-email") {
      return { ok: false, mensagem: "O formato do e-mail informado é inválido." };
    }
    if (code === "auth/too-many-requests") {
      return { ok: false, mensagem: "Muitas solicitações recentes. Aguarde alguns minutos antes de tentar novamente." };
    }
    if (code === "auth/network-request-failed") {
      return { ok: false, mensagem: "Falha de conexão com os servidores. Verifique sua conexão com a internet." };
    }
    if (code === "auth/operation-not-allowed") {
      return {
        ok: false,
        mensagem:
          "O envio de e-mails requer ativação do provedor Email/Password no console do Firebase (Authentication > Sign-in method).",
      };
    }

    return {
      ok: false,
      mensagem: error?.message || "Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.",
    };
  }
}

// Retorna o usuário logado atualmente (ou null)
export function getUsuarioLogado(): UsuarioLogado | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UsuarioLogado) : null;
  } catch {
    return null;
  }
}

// Encerra a sessão
export function fazerLogout(): void {
  try {
    signOut(auth).catch(() => {});
  } catch {
    // Silencioso
  }
  localStorage.removeItem(SESSION_KEY);
}