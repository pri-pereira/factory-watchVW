// ─────────────────────────────────────────────────────────
// auth.ts — Autenticação simples via localStorage
// ─────────────────────────────────────────────────────────

export type Cargo = "Líder" | "Monitor" | "Operador";

export interface Usuario {
  nome: string;
  registro: string; // matrícula (chave única)
  email: string;
  cargo: Cargo;
  senhaHash: string; // hash simples via btoa
}

export interface UsuarioLogado {
  nome: string;
  registro: string;
  email?: string;
  cargo: Cargo;
}

const USERS_KEY = "sf_usuarios_v2"; // Mudança de chave limpa os logins anteriores automaticamente
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

// Cadastra um novo usuário (retorna erro se registro ou email já existir)
export function cadastrarUsuario(
  nome: string,
  registro: string,
  email: string,
  cargo: Cargo,
  senha: string
): { ok: boolean; erro?: string } {
  const users = getUsuarios();
  if (users.some((u) => u.registro === registro)) {
    return { ok: false, erro: "Este número de registro já está cadastrado." };
  }
  if (users.some((u) => u.email === email)) {
    return { ok: false, erro: "Este e-mail já está em uso." };
  }
  users.push({ nome, registro, email, cargo, senhaHash: hashSenha(senha) });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { ok: true };
}

// Faz login — retorna o usuário ou null
// Permite logar tanto pelo registro quanto pelo e-mail
export function fazerLogin(
  identificacao: string, // Pode ser registro ou e-mail
  senha: string
): UsuarioLogado | null {
  const users = getUsuarios();
  const user = users.find(
    (u) => (u.registro === identificacao || u.email === identificacao) && u.senhaHash === hashSenha(senha)
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

// Recuperação de senha (Fake)
export function recuperarSenha(email: string): { ok: boolean; mensagem: string } {
  const users = getUsuarios();
  const user = users.find((u) => u.email === email);
  if (!user) {
    // Por segurança, sistemas reais não devem revelar se o e-mail existe,
    // mas aqui avisamos para facilitar os testes.
    return { ok: false, mensagem: "E-mail não encontrado no sistema." };
  }
  return { ok: true, mensagem: "Um link de recuperação foi enviado para o seu e-mail!" };
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