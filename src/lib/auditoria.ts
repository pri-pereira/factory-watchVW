// ─────────────────────────────────────────────────────────
// auditoria.ts — Log de alterações de status por usuário
// ─────────────────────────────────────────────────────────

export interface EntradaAuditoria {
  id: string;
  timestamp: string;        // "HH:MM"
  timestampFull: number;    // Date.now() para ordenação
  responsavel: string;      // nome do usuário logado
  cargo: string;            // cargo do responsável
  operadorId: string;
  operadorNome: string;
  statusAnterior: string;
  statusNovo: string;
}

const AUDIT_KEY = "vw_auditoria";
const AUDIT_KEY_LEGACY = "sf_auditoria";

function gerarId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function horaAtual(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

export function getAuditoria(): EntradaAuditoria[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY) || localStorage.getItem(AUDIT_KEY_LEGACY);
    const all = raw ? (JSON.parse(raw) as EntradaAuditoria[]) : [];
    // Retorna só os registros das últimas 24h
    const corte = Date.now() - 24 * 60 * 60 * 1000;
    return all.filter((e) => e.timestampFull > corte);
  } catch {
    return [];
  }
}

export function registrarAlteracao(
  responsavel: string,
  cargo: string,
  operadorId: string,
  operadorNome: string,
  statusAnterior: string,
  statusNovo: string
): EntradaAuditoria {
  const entrada: EntradaAuditoria = {
    id: gerarId(),
    timestamp: horaAtual(),
    timestampFull: Date.now(),
    responsavel,
    cargo,
    operadorId,
    operadorNome,
    statusAnterior,
    statusNovo,
  };

  const lista = getAuditoria();
  lista.unshift(entrada); // mais recente primeiro
  // Guarda no máximo 200 registros
  const serializado = JSON.stringify(lista.slice(0, 200));
  localStorage.setItem(AUDIT_KEY, serializado);
  localStorage.setItem(AUDIT_KEY_LEGACY, serializado);

  // Sincroniza em background com Firebase
  import("./firebase").then(({ db, authReady }) => {
    authReady.then(() => {
      import("firebase/database").then(({ ref, set }) => {
        set(ref(db, `smartflow/dados/${AUDIT_KEY}`), serializado).catch(() => {});
      });
    });
  });

  return entrada;
}

export function limparAuditoria(): void {
  localStorage.removeItem(AUDIT_KEY);
  localStorage.removeItem(AUDIT_KEY_LEGACY);
}