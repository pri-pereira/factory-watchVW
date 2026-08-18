// ─────────────────────────────────────────────────────────
// auth.ts — Autenticação simples via localStorage
// ─────────────────────────────────────────────────────────

export type Cargo = "Líder" | "Monitor" | "Operador";

export interface Usuario {
  nome: string;
  registro: string; // matrícula (chave única)
  cargo: Cargo;
  senhaHash: string; // hash simples via btoa
}

export interface UsuarioLogado {
  nome: string;
  registro: string;
  cargo: Cargo;
}

const USERS_KEY = "sf_usuarios";
const SESSION_KEY = "sf_sessao";

// Hash simples (não é criptografia real — apenas ofusca a senha)
export function hashSenha(senha: string): string {
  return btoa(encodeURIComponent(senha));
}

// Retorna todos os usuários cadastrados
export function getUsuarios(): Usuario[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Usuario[]) : [];
  } catch {
    return [];
  }
}

// Cadastra um novo usuário (retorna erro se registro já existir)
export function cadastrarUsuario(
  nome: string,
  registro: string,
  cargo: Cargo,
  senha: string
): { ok: boolean; erro?: string } {
  const users = getUsuarios();
  if (users.some((u) => u.registro === registro)) {
    return { ok: false, erro: "Este número de registro já está cadastrado." };
  }
  users.push({ nome, registro, cargo, senhaHash: hashSenha(senha) });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { ok: true };
}

// Faz login — retorna o usuário ou null
export function fazerLogin(
  registro: string,
  senha: string
): UsuarioLogado | null {
  const users = getUsuarios();
  const user = users.find(
    (u) => u.registro === registro && u.senhaHash === hashSenha(senha)
  );
  if (!user) return null;
  const sessao: UsuarioLogado = {
    nome: user.nome,
    registro: user.registro,
    cargo: user.cargo,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
  return sessao;
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
  localStorage.removeItem(SESSION_KEY);
}