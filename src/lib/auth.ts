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

const USERS_KEY = "vw_usuarios_v2";
const USERS_KEY_LEGACY = "sf_usuarios_v2";
const SESSION_KEY = "sf_sessao";

// Hash simples
export function hashSenha(senha: string): string {
  return btoa(encodeURIComponent(senha));
}

// Retorna todos os usuários cadastrados no cache local (com fallback de migração)
export function getUsuarios(): Usuario[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(USERS_KEY) || localStorage.getItem(USERS_KEY_LEGACY);
    if (!raw) return [];
    const lista = JSON.parse(raw) as Usuario[];
    if (Array.isArray(lista)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(lista));
      return lista;
    }
    return [];
  } catch {
    return [];
  }
}

// Salva lista de usuários localmente
function salvarUsuariosLocais(usuarios: Usuario[]): void {
  try {
    if (typeof window !== "undefined") {
      const serializado = JSON.stringify(usuarios);
      localStorage.setItem(USERS_KEY, serializado);
      localStorage.setItem(USERS_KEY_LEGACY, serializado);
    }
  } catch {}
}

// Sincroniza lista completa na nuvem
async function sincronizarListaNuvem(usuarios: Usuario[]): Promise<void> {
  try {
    const { authReady } = await import("./firebase");
    await authReady;
    const serializado = JSON.stringify(usuarios);
    await set(ref(db, `smartflow/dados/${USERS_KEY}`), serializado);
  } catch (err) {
    console.warn("[auth] Falha ao sincronizar lista no Firebase:", err);
  }
}

// Inicializa a sincronização automática em segundo plano com o Firebase
export async function inicializarSyncUsuarios(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { authReady } = await import("./firebase");
    await authReady;
    const snap = await get(ref(db, `smartflow/dados/${USERS_KEY}`));
    if (snap.exists()) {
      const raw = snap.val();
      const remota = typeof raw === "string" ? (JSON.parse(raw) as Usuario[]) : (raw as Usuario[]);
      if (Array.isArray(remota) && remota.length > 0) {
        const locais = getUsuarios();
        const map = new Map<string, Usuario>();
        remota.forEach((u) => map.set(u.registro, u));
        locais.forEach((u) => map.set(u.registro, u)); // preserva locais recentes
        const uniao = Array.from(map.values());
        salvarUsuariosLocais(uniao);
      }
    }
  } catch (err) {
    console.warn("[auth] Não foi possível carregar usuários remotos no startup:", err);
  }
}

// Executa sincronização em background na inicialização do módulo no cliente
if (typeof window !== "undefined") {
  setTimeout(() => {
    inicializarSyncUsuarios();
  }, 100);
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

  // 2. Sincroniza lista completa na nuvem
  await sincronizarListaNuvem(users);

  // 3. Salva nós individuais no Firebase
  try {
    const { authReady } = await import("./firebase");
    await authReady;
    const payload = {
      nome: nomeTrim,
      registro: regTrim,
      cargo,
      senhaHash: hashSenha(senha),
      criadoEm: Date.now(),
    };
    await Promise.allSettled([
      set(ref(db, `smartflow/usuarios/${regTrim}`), payload),
      set(ref(db, `usuarios/${regTrim}`), payload),
    ]);
  } catch (err) {
    console.warn("[auth] Não foi possível salvar registro individual em nuvem:", err);
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
  let users = getUsuarios();
  let user = users.find((u) => u.registro === regTrim && u.senhaHash === hashSenha(senhaLimpa));

  // 2. Se não encontrou localmente, busca no Realtime Database do Firebase
  if (!user) {
    try {
      const { authReady } = await import("./firebase");
      await authReady;

      // 2a. Tenta obter lista atualizada em nuvem
      const snapLista = await get(ref(db, `smartflow/dados/${USERS_KEY}`));
      if (snapLista.exists()) {
        const raw = snapLista.val();
        const remota = typeof raw === "string" ? (JSON.parse(raw) as Usuario[]) : (raw as Usuario[]);
        if (Array.isArray(remota)) {
          const map = new Map<string, Usuario>();
          users.forEach((u) => map.set(u.registro, u));
          remota.forEach((u) => map.set(u.registro, u));
          users = Array.from(map.values());
          salvarUsuariosLocais(users);
          user = users.find((u) => u.registro === regTrim && u.senhaHash === hashSenha(senhaLimpa));
        }
      }

      // 2b. Tenta buscar no nó individual de smartflow/usuarios
      if (!user) {
        const snapSmart = await get(ref(db, `smartflow/usuarios/${regTrim}`));
        if (snapSmart.exists()) {
          const remoto = snapSmart.val() as Usuario;
          if (remoto.senhaHash === hashSenha(senhaLimpa)) {
            user = remoto;
            users.push(user);
            salvarUsuariosLocais(users);
          }
        }
      }

      // 2c. Fallback no nó usuarios
      if (!user) {
        const snapRoot = await get(ref(db, `usuarios/${regTrim}`));
        if (snapRoot.exists()) {
          const remoto = snapRoot.val() as Usuario;
          if (remoto.senhaHash === hashSenha(senhaLimpa)) {
            user = remoto;
            users.push(user);
            salvarUsuariosLocais(users);
          }
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
    await sincronizarListaNuvem(users);
    encontrado = true;
  }

  // Atualiza também no Realtime Database
  try {
    const { authReady } = await import("./firebase");
    await authReady;
    const novaHash = hashSenha(novaSenha);
    await Promise.allSettled([
      set(ref(db, `smartflow/usuarios/${regTrim}/senhaHash`), novaHash),
      set(ref(db, `usuarios/${regTrim}/senhaHash`), novaHash),
    ]);
    encontrado = true;
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