import { useState, useEffect, useRef } from "react";

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────
type StatusCard = "aguardando" | "presente" | "ausente";

interface Operador {
  id: number;
  nome: string;
  sigla: string;
  cargo: string;
  presente: boolean;
}

// ──────────────────────────────────────────────
// Dados dos operadores fictícios
// ──────────────────────────────────────────────
const OPERADORES: Operador[] = [
  { id: 1, nome: "Carlos Mendonça",  sigla: "CM", cargo: "Operador Pleno",   presente: true  },
  { id: 2, nome: "Fernanda Lima",    sigla: "FL", cargo: "Operadora Sênior", presente: true  },
  { id: 3, nome: "Ricardo Souza",    sigla: "RS", cargo: "Operador Pleno",   presente: true  },
  { id: 4, nome: "Juliana Teixeira", sigla: "JT", cargo: "Multi-habilidade", presente: true  },
  { id: 5, nome: "Marcos Pereira",   sigla: "MP", cargo: "Operador Jr.",     presente: false },
  { id: 6, nome: "Patrícia Alves",   sigla: "PA", cargo: "Operadora Plena",  presente: true  },
];

const SEQUENCIA = [0, 1, 2, 3, 5, 4];
const SUBSTITUTO = "André Rodrigues";

// ──────────────────────────────────────────────
// Sub-componente: Card de operador
// ──────────────────────────────────────────────
function OperadorCard({ op, status }: { op: Operador; status: StatusCard }) {
  const colorMap: Record<StatusCard, {
    card: string; avatar: string; name: string; role: string; badge: string; badgeText: string;
  }> = {
    aguardando: {
      card:   "border-white/10 bg-white/5",
      avatar: "bg-white/10 text-slate-400 border border-white/10",
      name:   "text-slate-400",
      role:   "text-slate-600",
      badge:  "bg-white/5 text-slate-500 border border-white/10",
      badgeText: "⏳ Aguardando crachá",
    },
    presente: {
      card:   "border-emerald-500/40 bg-emerald-950/60 shadow-emerald-500/10 shadow-lg -translate-y-1 scale-[1.02]",
      avatar: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
      name:   "text-emerald-200",
      role:   "text-emerald-500/70",
      badge:  "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      badgeText: "✅ Presente",
    },
    ausente: {
      card:   "border-red-500/40 bg-red-950/60 shadow-red-500/10 shadow-lg",
      avatar: "bg-red-500/20 text-red-400 border border-red-500/40",
      name:   "text-red-300",
      role:   "text-red-500/70",
      badge:  "bg-red-500/20 text-red-400 border border-red-500/30",
      badgeText: "🔴 Não encontrado",
    },
  };

  const c = colorMap[status];

  return (
    <div className={`relative flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-500 ${c.card}`}>
      <div className={`relative flex h-16 w-16 items-center justify-center rounded-full text-lg font-black transition-all duration-500 ${c.avatar}`}>
        {op.sigla}
        {status !== "aguardando" && (
          <span className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${status === "presente" ? "bg-emerald-400 text-white" : "bg-red-400 text-white"}`}>
            {status === "presente" ? "✓" : "✕"}
          </span>
        )}
      </div>
      <div className="text-center">
        <p className={`text-sm font-bold leading-tight transition-colors duration-500 ${c.name}`}>{op.nome}</p>
        <p className={`mt-0.5 text-xs transition-colors duration-500 ${c.role}`}>{op.cargo}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-500 ${c.badge}`}>
        {c.badgeText}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────
interface SetupTurnoProps {
  onLiberar: () => void;
}

export function SetupTurno({ onLiberar }: SetupTurnoProps) {
  const [statuses, setStatuses] = useState<Record<number, StatusCard>>(
    Object.fromEntries(OPERADORES.map((op) => [op.id, "aguardando"])) as Record<number, StatusCard>
  );
  const [simulando, setSimulando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [progLabel, setProgLabel] = useState("Aguardando início da simulação...");
  const [hora, setHora] = useState("");
  const [fadeOut, setFadeOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setHora(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  function iniciarSimulacao() {
    if (simulando) return;
    setSimulando(true);

    let idx = 0;
    const total = SEQUENCIA.length;

    intervalRef.current = setInterval(() => {
      if (idx >= total) {
        clearInterval(intervalRef.current!);
        setConcluido(true);
        setProgresso(100);
        setProgLabel("Verificação concluída · 5 presentes · 1 ausência");
        return;
      }

      const opIdx = SEQUENCIA[idx] as number;
      const op = OPERADORES[opIdx] as Operador;
      setProgLabel(`Lendo crachá: ${op.nome}...`);

      if (op.presente) {
        setStatuses((prev) => ({ ...prev, [op.id]: "presente" }));
      } else {
        setStatuses((prev) => ({ ...prev, [op.id]: "ausente" }));
        setMostrarAlerta(true);
      }

      idx++;
      setProgresso(Math.round((idx / total) * 100));
    }, 2000);
  }

  function handleLiberar() {
    if (!concluido) return;
    setFadeOut(true);
    setTimeout(onLiberar, 600);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto px-4 py-8 transition-all duration-500 ${fadeOut ? "opacity-0 scale-[1.03] pointer-events-none" : "opacity-100"}`}
      style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #0a1628 100%)" }}
    >
      {/* Cabeçalho */}
      <div className="mb-8 w-full max-w-3xl text-center">
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 6px 20px rgba(59,130,246,0.35)" }}>
            🏭
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-[2.5px] text-slate-500">VW Smart Flow</p>
            <h1 className="text-2xl font-black tracking-wide text-white">Controle de Presença</h1>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
          <span className="text-xs font-bold tracking-wider text-blue-400">Célula Vidros</span>
        </span>
      </div>

      {/* Grid de operadores */}
      <div className="mb-5 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {OPERADORES.map((op) => (
          <OperadorCard key={op.id} op={op} status={statuses[op.id] ?? "aguardando"} />
        ))}
      </div>

      {/* Barra de progresso */}
      {simulando && (
        <div className="mb-5 w-full max-w-3xl">
          <div className="mb-2 flex justify-between text-xs font-semibold text-slate-400">
            <span>{progLabel}</span>
            <span className="tabular-nums">{progresso}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progresso}%`, background: "linear-gradient(90deg, #6366f1, #34d399)" }}
            />
          </div>
        </div>
      )}

      {/* Alerta de cobertura */}
      {mostrarAlerta && (
        <div className="mb-5 w-full max-w-3xl rounded-2xl border-2 border-red-500/40 bg-red-950/60 p-4 shadow-[0_8px_32px_rgba(248,113,113,0.2)] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 animate-pulse items-center justify-center rounded-xl bg-red-500/20 text-lg">
              🚨
            </div>
            <div>
              <p className="text-sm font-black text-red-300">Alerta de Cobertura</p>
              <p className="text-[11px] text-red-500/70">Ausência detectada no início do turno</p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm font-semibold text-amber-200">
              Sugestão de remanejamento: {SUBSTITUTO} - 100% versatilidade.
            </p>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex w-full max-w-3xl flex-wrap justify-center gap-4">
        <button
          id="btn-simular-turno"
          onClick={iniciarSimulacao}
          disabled={simulando}
          className="flex items-center gap-2 rounded-xl border-2 border-indigo-500/40 bg-indigo-500/15 px-8 py-3.5 text-sm font-bold text-indigo-300 transition-all hover:enabled:border-indigo-400/70 hover:enabled:bg-indigo-500/25 hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_8px_24px_rgba(99,102,241,0.25)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>📡</span>
          <span>Simular Entrada de Turno</span>
        </button>

        <button
          id="btn-liberar-seq"
          onClick={handleLiberar}
          disabled={!concluido}
          className={`flex items-center gap-2 rounded-xl border-2 px-8 py-3.5 text-sm font-black transition-all duration-300 ${
            concluido
              ? "animate-pulse border-emerald-400 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_8px_32px_rgba(52,211,153,0.35)] hover:-translate-y-0.5 hover:scale-[1.02] cursor-pointer"
              : "cursor-not-allowed border-emerald-500/20 bg-emerald-950/30 text-emerald-500/30"
          }`}
        >
          <span>🔓</span>
          <span>Liberar SEQ e Iniciar Turno</span>
        </button>
      </div>

      {/* Rodapé */}
      <p className="mt-6 text-[11px] font-medium text-slate-600">
        Leitura por crachá RFID · Turno 2 · {hora}
      </p>
    </div>
  );
}