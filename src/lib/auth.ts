// ─────────────────────────────────────────────────────────
// auth.ts — Autenticação via Matrícula/Registro e Senha
// Sincronização direta com Realtime Database e cache offline
// ─────────────────────────────────────────────────────────
import { ref, set, get } from "firebase/database";
import { db } from "./firebase";

export type Cargo = "Líder" | "Monitor" | "Operador";

export interface Usuario {
  nome: string;
  registro: string; // matrícula de 7 dígitos (chave única)
  cargo: Cargo;
  senhaHash: string; // hash simples via btoa
}

export interface UsuarioLogado {
  nome: string;
  registro: string;
  cargo: Cargo;
}

const USERS_KEY = "sf_usuarios_v2";
const SESSION_KEY = "sf_sessao";

// Hash simples
export function hashSenha(senha: string): string {
  return btoa(encodeURIComponent(senha));
}

// Retorna todos os usuários cadastrados no cache local
export function getUsuarios(): Usuario[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Usuario[]) : [];
  } catch {
    return [];
  }
}

// Salva lista de usuários localmente
function salvarUsuariosLocais(usuarios: Usuario[]): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
    }
  } catch {}
}

// Cadastra um novo colaborador apenas com Nome, Registro (7 dígitos), Cargo e Senha
export async function cadastrarUsuario(
  nome: string,
  registro: string,
  cargo: Cargo,
  senha: string
): Promise<{ ok: boolean; erro?: string }> {
  const nomeTrim = nome.trim();
  const regTrim = registro.trim();

  // Validação: exatamente 7 dígitos numéricos
  if (!/^\d{7}$/.test(regTrim)) {
    return {
      ok: false,
      erro: "O número de registro (matrícula) deve conter exatamente 7 dígitos numéricos (ex: 0263552).",
    };
  }

  if (senha.length < 4) {
    return { ok: false, erro: "A senha deve conter pelo menos 4 caracteres." };
  }

  const users = getUsuarios();
  if (users.some((u) => u.registro === regTrim)) {
    return { ok: false, erro: "Este número de registro já está cadastrado no sistema." };
  }

  const novoUsuario: Usuario = {
    nome: nomeTrim,
    registro: regTrim,
    cargo,
    senhaHash: hashSenha(senha),
  };

  // 1. Salva imediatamente no localStorage
  users.push(novoUsuario);
  salvarUsuariosLocais(users);

  // 2. Tenta sincronizar com o Realtime Database em nuvem
  try {
    const userRef = ref(db, `usuarios/${regTrim}`);
    await set(userRef, {
      nome: nomeTrim,
      registro: regTrim,
      cargo,
      senhaHash: hashSenha(senha),
      criadoEm: Date.now(),
    });
  } catch (err) {
    console.warn("[auth] Não foi possível salvar em nuvem (salvo localmente):", err);
  }

  return { ok: true };
}

// Faz login por Matrícula (7 dígitos) e Senha
export async function fazerLogin(
  registro: string,
  senha: string
): Promise<UsuarioLogado | null> {
  const regTrim = registro.trim();
  const senhaLimpa = senha;

  if (!/^\d{7}$/.test(regTrim)) return null;

  // 1. Tenta autenticar no cache local
  const users = getUsuarios();
  let user = users.find((u) => u.registro === regTrim && u.senhaHash === hashSenha(senhaLimpa));

  // 2. Se não encontrou localmente, busca no Realtime Database do Firebase
  if (!user) {
    try {
      const snap = await get(ref(db, `usuarios/${regTrim}`));
      if (snap.exists()) {
        const remoto = snap.val() as Usuario;
        if (remoto.senhaHash === hashSenha(senhaLimpa)) {
          user = remoto;
          // Adiciona ao cache local
          users.push(user);
          salvarUsuariosLocais(users);
        }
      }
    } catch (err) {
      console.warn("[auth] Erro ao consultar nuvem:", err);
    }
  }

  if (!user) return null;

  const sessao: UsuarioLogado = {
    nome: user.nome,
    registro: user.registro,
    cargo: user.cargo,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
  }

  return sessao;
}

// Redefine senha diretamente por Matrícula (sem precisar de e-mail)
export async function redefinirSenhaDireta(
  registro: string,
  novaSenha: string
): Promise<{ ok: boolean; mensagem: string }> {
  const regTrim = registro.trim();

  if (!/^\d{7}$/.test(regTrim)) {
    return { ok: false, mensagem: "Informe uma matrícula válida com 7 dígitos numéricos." };
  }

  if (novaSenha.length < 4) {
    return { ok: false, mensagem: "A nova senha deve ter pelo menos 4 caracteres." };
  }

  const users = getUsuarios();
  const userIndex = users.findIndex((u) => u.registro === regTrim);

  let encontrado = false;

  if (userIndex >= 0) {
    users[userIndex]!.senhaHash = hashSenha(novaSenha);
    salvarUsuariosLocais(users);
    encontrado = true;
  }

  // Atualiza também no Realtime Database
  try {
    const userRef = ref(db, `usuarios/${regTrim}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      await set(ref(db, `usuarios/${regTrim}/senhaHash`), hashSenha(novaSenha));
      encontrado = true;
    }
  } catch (err) {
    console.warn("[auth] Não foi possível atualizar senha em nuvem:", err);
  }

  if (!encontrado) {
    return { ok: false, mensagem: "Nenhum colaborador encontrado com esta matrícula." };
  }

  return { ok: true, mensagem: "Senha redefinida com sucesso! Você já pode fazer login." };
}

// Retorna o usuário logado atualmente (ou null)
export function getUsuarioLogado(): UsuarioLogado | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UsuarioLogado) : null;
  } catch {
    return null;
  }
}

// Encerra a sessão
export function fazerLogout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}