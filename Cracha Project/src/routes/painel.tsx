import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CalendarOff, CheckCircle2, Download,
  Factory, FileSpreadsheet, FileText, Hourglass, User, Search,
  Users, Stethoscope, LogOut, ClipboardList, Clock,
} from "lucide-react";
import { TURNOS, operators, CELULAS, type Operator, type OperatorStatus } from "@/data/operators";
import { toast } from "sonner";
import { getUsuarioLogado, fazerLogout } from "@/lib/auth";
import { registrarAlteracao, getAuditoria, type EntradaAuditoria } from "@/lib/auditoria";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel de Presenca - Gestao Operacional" },
      { name: "description", content: "Acompanhe em tempo real a presenca dos operadores." },
    ],
  }),
  component: PainelGuarded,
});

function PainelGuarded() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  useEffect(() => {
    if (!usuario) navigate({ to: "/" });
  }, [navigate, usuario]);
  if (!usuario) return null;
  return <Painel />;
}

const statusMeta: Record<OperatorStatus, {
  label: string; dot: string; badge: string; bar: string; icon: typeof CheckCircle2;
}> = {
  presente:   { label: "Presente",       dot: "bg-status-present",     badge: "bg-status-present-soft text-status-present",       bar: "bg-status-present",     icon: CheckCircle2  },
  ausente:    { label: "Ausente",        dot: "bg-status-absent",      badge: "bg-status-absent-soft text-status-absent",         bar: "bg-status-absent",      icon: AlertTriangle },
  pendente:   { label: "Pendente",       dot: "bg-status-pending",     badge: "bg-status-pending-soft text-status-pending",       bar: "bg-status-pending",     icon: Hourglass     },
  afastado:   { label: "Ferias/Licenca", dot: "bg-status-leave",       badge: "bg-status-leave-soft text-status-leave",           bar: "bg-status-leave",       icon: CalendarOff   },
  enfermaria: { label: "Enfermaria",     dot: "bg-status-enfermaria",  badge: "bg-status-enfermaria-soft text-status-enfermaria", bar: "bg-status-enfermaria",  icon: Stethoscope   },
};

function useShiftClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow((prev) => new Date(prev.getTime() + 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
function pad(n: number) { return String(n).padStart(2, "0"); }
function initials(nome: string) { return nome.split(" ").slice(0, 2).map((p) => p[0]).join(""); }

function MetricCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof Users; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-500 sm:p-5">
      <span className={`absolute inset-y-0 left-0 w-1.5 transition-colors duration-500 ${accent}`} aria-hidden />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pl-2">
        <div className="min-w-0">
          <p className="truncate text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="font-display text-4xl font-bold leading-none tabular-nums text-foreground transition-all duration-500 sm:text-5xl">{value}</p>
        </div>
        <Icon className="size-8 shrink-0 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function OperatorCard({ op, onStatusUpdate }: {
  op: Operator & { alteradoPor?: string; alteradoAs?: string };
  onStatusUpdate: (id: string, status: OperatorStatus, timestamp?: string) => void;
}) {
  const meta = statusMeta[op.status];
  const Icon = meta.icon;
  const isClickable = op.status === "presente" || op.status === "enfermaria";

  const handleClick = () => {
    if (op.status === "presente") {
      toast.info(`Deseja alterar o status de ${op.nome}?`, {
        description: "O operador sera movido para a enfermaria.",
        duration: Infinity,
        action: { label: "Confirmar", onClick: () => onStatusUpdate(op.id, "enfermaria") },
      });
    } else if (op.status === "enfermaria") {
      toast.info(`Deseja alterar o status de ${op.nome}?`, {
        description: "O operador retornara ao status presente.",
        duration: Infinity,
        action: { label: "Confirmar", onClick: () => {
          const now = new Date();
          onStatusUpdate(op.id, "presente", `${pad(now.getHours())}:${pad(now.getMinutes())}`);
        }},
      });
    }
  };

  return (
    <li onClick={isClickable ? handleClick : undefined}
      className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all ${isClickable ? "cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-[0.99]" : ""}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.bar}`} aria-hidden />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 pl-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid size-12 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold uppercase text-muted-foreground">
            {initials(op.nome) || <User className="size-5" />}
            <span className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-card ${meta.dot}`} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight text-foreground">{op.nome}</p>
            <p className="truncate text-sm text-muted-foreground">{op.funcao}</p>
            <p className="font-mono text-xs text-muted-foreground/70">Mat. {op.matricula}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${meta.badge}`}>
            <Icon className="size-3.5" />
            {meta.label}
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {op.batida ? `Cracha ${op.batida}` : (op.observacao ?? "Aguardando...")}
          </span>
          {op.alteradoPor && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              <Clock className="size-2.5" />
              {op.alteradoPor} &bull; {op.alteradoAs}
            </span>
          )}
        </div>
      </div>
      {isClickable && (
        <div className="absolute right-2 top-2">
          <div className="size-2 rounded-full bg-primary/20 animate-pulse" />
        </div>
      )}
    </li>
  );
}

function TeamFilterCard({ name, ops, isActive, onClick }: { name: string; ops: Operator[]; isActive: boolean; onClick: () => void }) {
  const percentage = useMemo(() => {
    if (ops.length === 0) return 0;
    return Math.round((ops.filter((o) => o.status === "presente").length / ops.length) * 100);
  }, [ops]);
  return (
    <button onClick={onClick}
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl border p-4 transition-all sm:p-6 ${
        isActive ? "border-primary bg-primary text-primary-foreground shadow-lg scale-[1.02]" : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
      }`}>
      <p className="font-display text-sm font-bold uppercase tracking-widest">{name}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums sm:text-4xl">{percentage}</span>
        <span className="text-sm font-semibold opacity-70">%</span>
      </div>
      <p className="mt-1 text-[0.65rem] font-medium uppercase opacity-60">Presenca Efetiva</p>
      {isActive && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-white/20">
          <div className="h-full bg-white transition-all duration-500" style={{ width: `${percentage}%` }} />
        </div>
      )}
    </button>
  );
}

function FeedAuditoria({ logs }: { logs: EntradaAuditoria[] }) {
  const statusLabel: Record<string, string> = {
    presente: "Presente", ausente: "Ausente", pendente: "Pendente", afastado: "Ferias/Licenca", enfermaria: "Enfermaria"
  };
  if (logs.length === 0) {
    return <p className="py-6 text-center text-xs uppercase tracking-widest text-muted-foreground">Nenhuma alteracao registrada neste turno.</p>;
  }
  return (
    <ul className="space-y-2">
      {logs.map((e) => (
        <li key={e.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ClipboardList className="size-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              <span className="text-primary">{e.responsavel}</span>
              <span className="font-normal text-muted-foreground"> ({e.cargo}) alterou </span>
              <span>{e.operadorNome}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {statusLabel[e.statusAnterior] ?? e.statusAnterior}{" "}
              <span className="mx-1">&rarr;</span>
              <span className="font-bold text-foreground">{statusLabel[e.statusNovo] ?? e.statusNovo}</span>
            </p>
          </div>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{e.timestamp}</span>
        </li>
      ))}
    </ul>
  );
}

function Painel() {
  const navigate = useNavigate();
  const now = useShiftClock();
  const usuario = getUsuarioLogado()!;

  const [selectedTurno, setSelectedTurno] = useState(TURNOS[0]);
  const [selectedCelula, setSelectedCelula] = useState(CELULAS[0]);
  const [selectedEquipe, setSelectedEquipe] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OperatorStatus | "todos">("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [dynamicOperators, setDynamicOperators] = useState<(Operator & { alteradoPor?: string; alteradoAs?: string })[]>(operators);
  const [logs, setLogs] = useState<EntradaAuditoria[]>(() => getAuditoria());
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    if (!selectedTurno) return;
    const interval = setInterval(() => {
      setDynamicOperators((current) =>
        current.map((op) => {
          if ((op.status === "pendente" || op.status === "ausente") && Math.random() > 0.8) {
            return { ...op, status: "presente" as OperatorStatus, batida: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
          }
          return op;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [now, selectedTurno]);

  useEffect(() => { setSelectedEquipe(null); }, [selectedCelula]);

  const handleStatusUpdate = (id: string, newStatus: OperatorStatus, timestamp?: string) => {
    const op = dynamicOperators.find((o) => o.id === id);
    if (!op) return;
    const entrada = registrarAlteracao(usuario.nome, usuario.cargo, id, op.nome, op.status, newStatus);
    setLogs((prev) => [entrada, ...prev]);
    setDynamicOperators((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        return { ...o, status: newStatus, batida: timestamp ?? o.batida, alteradoPor: usuario.nome, alteradoAs: entrada.timestamp };
      })
    );
  };

  const handleLogout = () => { fazerLogout(); navigate({ to: "/" }); };

  const filteredByCelula = useMemo(
    () => dynamicOperators.filter((op) => op.id.startsWith(selectedCelula || "")),
    [selectedCelula, dynamicOperators]
  );

  const counts = useMemo(() => {
    const by = (s: OperatorStatus) => filteredByCelula.filter((o) => o.status === s).length;
    return { total: filteredByCelula.length, presentes: by("presente"), ausentes: by("ausente") + by("pendente"), enfermaria: by("enfermaria"), programadas: by("afastado") };
  }, [filteredByCelula]);

  const [h, m] = (selectedTurno?.inicio || "06:00").split(":").map(Number) as [number, number];
  const start = new Date(now); start.setHours(h, m, 0, 0);
  const minutesLeft = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 60000));

  const equipesInCelula = useMemo(() => {
    const groups: Record<string, (Operator & { alteradoPor?: string; alteradoAs?: string })[]> = {};
    filteredByCelula.forEach((op) => {
      const eq = op.equipe || "Sem Equipe";
      if (!groups[eq]) groups[eq] = [];
      groups[eq].push(op);
    });
    return groups;
  }, [filteredByCelula]);

  const operatorsToShow = useMemo(() => {
    if (!selectedEquipe) return [];
    const ops = (equipesInCelula[selectedEquipe] || []).filter((op) => {
      const matchSearch = op.nome.toLowerCase().includes(searchQuery.toLowerCase()) || op.matricula.includes(searchQuery);
      const matchStatus = selectedStatus === "todos" || op.status === selectedStatus;
      return matchSearch && matchStatus;
    });
    const ordem: OperatorStatus[] = ["ausente", "pendente", "enfermaria", "presente", "afastado"];
    return [...ops].sort((a, b) => ordem.indexOf(a.status) - ordem.indexOf(b.status) || a.nome.localeCompare(b.nome));
  }, [selectedEquipe, equipesInCelula, searchQuery, selectedStatus]);

  const exportCSV = () => {
    const headers = ["Turno", "Celula", "Equipe", "Nome", "Matricula", "Status", "Batida", "Alterado Por", "Horario Alteracao"];
    const rows = dynamicOperators.map((op) => [
      selectedTurno?.nome ?? "", op.id.split("-")[0], op.equipe, op.nome, op.matricula,
      statusMeta[op.status].label, op.batida || "-", op.alteradoPor || "-", op.alteradoAs || "-",
    ]);
    const csv = [headers, ...rows].map((e) => e.map((v) => `"${v}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }));
    link.download = `relatorio_${(selectedTurno?.nome ?? "").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Relatorio de Presenca - ${selectedTurno?.nome ?? ""}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Celula: ${selectedCelula} | Gerado por: ${usuario.nome} (${usuario.cargo}) em ${new Date().toLocaleString("pt-BR")}`, 14, 30);
    doc.save(`relatorio_presenca_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary-foreground/10">
              <Factory className="size-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">Gestao Operacional</h1>
              <div className="flex items-center gap-2">
                <select value={selectedTurno?.id}
                  onChange={(e) => { const t = TURNOS.find((tx) => tx.id === e.target.value); if (t) setSelectedTurno(t); }}
                  className="bg-transparent text-sm font-bold uppercase tracking-wider text-primary-foreground focus:outline-none cursor-pointer border border-primary-foreground/20 rounded px-1">
                  {TURNOS.map((t) => <option key={t.id} value={t.id} className="text-foreground">{t.nome}</option>)}
                </select>
                <span className="text-sm text-primary-foreground/70">
                  &middot; {selectedTurno?.inicio} as {selectedTurno?.fim} &middot;{" "}
                  {minutesLeft > 0 ? `inicio em ${minutesLeft} min` : "turno em andamento"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="hidden sm:flex flex-col text-right mr-2">
              <p className="font-mono text-lg font-bold tabular-nums text-primary-foreground/90">
                {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(now)}
              </p>
              <p className="font-mono text-base font-bold tabular-nums text-primary-foreground/80">
                {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now)}
              </p>
              <p className="text-[0.6rem] text-primary-foreground/50 uppercase tracking-widest">
                {usuario.nome} &bull; {usuario.cargo}
              </p>
            </div>

            {/* Botao Log Auditoria */}
            <button onClick={() => setShowAudit((v) => !v)}
              className="relative flex items-center gap-1.5 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground/20 transition-colors">
              <ClipboardList className="size-4" /> Log
              {logs.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-black">
                  {logs.length > 9 ? "9+" : logs.length}
                </span>
              )}
            </button>

            {/* Smart Flow */}
            <a id="btn-smartflow" href="/smartflow.html" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-400/20 transition-all">
              Smart Flow
            </a>

            {/* Sair */}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground/20 transition-colors">
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Feed de Auditoria */}
      {showAudit && (
        <div className="border-b border-border bg-muted/40 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground">
                <ClipboardList className="size-4 text-primary" />
                Log de Alteracoes do Turno
              </h2>
              <button onClick={() => setShowAudit(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Fechar
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto pr-1">
              <FeedAuditoria logs={logs} />
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Celulas + Exportar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-2">
            {CELULAS.map((c) => (
              <button key={c} onClick={() => setSelectedCelula(c)}
                className={`rounded-lg border px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                  selectedCelula === c ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}>
                {c}
              </button>
            ))}
          </nav>
          <div className="flex gap-2">
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/50 hover:text-primary">
                <Download className="size-4" /> Exportar
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex group-focus-within:flex flex-col min-w-[140px] rounded-lg border border-border bg-card shadow-lg z-30 py-1 overflow-hidden">
                <button onClick={exportCSV} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold uppercase hover:bg-muted text-muted-foreground hover:text-primary border-b border-border/50">
                  <FileSpreadsheet className="size-4" /> CSV
                </button>
                <button onClick={exportPDF} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold uppercase hover:bg-muted text-muted-foreground hover:text-primary">
                  <FileText className="size-4" /> PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <MetricCard label="Total da celula" value={counts.total} icon={Users} accent="bg-primary" />
          <MetricCard label="Presentes" value={counts.presentes} icon={CheckCircle2} accent="bg-status-present" />
          <MetricCard label="Ausentes" value={counts.ausentes} icon={AlertTriangle} accent="bg-status-absent" />
          <MetricCard label="Enfermaria" value={counts.enfermaria} icon={Stethoscope} accent="bg-status-enfermaria" />
          <MetricCard label="Programadas" value={counts.programadas} icon={CalendarOff} accent="bg-status-leave" />
        </section>

        {/* Equipes */}
        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">Equipes de {selectedCelula}</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Selecione uma equipe</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Object.entries(equipesInCelula).sort().map(([equipe, ops]) => (
              <TeamFilterCard key={equipe} name={equipe} ops={ops} isActive={selectedEquipe === equipe} onClick={() => setSelectedEquipe(equipe)} />
            ))}
          </div>
        </div>

        {/* Lista de operadores */}
        {selectedEquipe ? (
          <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="mb-6 flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Users className="size-5 text-primary" />
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">Integrantes da {selectedEquipe}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["todos", "presente", "pendente", "ausente", "afastado", "enfermaria"] as const).map((s) => (
                    <button key={s} onClick={() => setSelectedStatus(s)}
                      className={`rounded-md px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest transition-all border ${
                        selectedStatus === s ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                      }`}>
                      {s === "todos" ? "Todos" : statusMeta[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Buscar por nome ou mat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
              </div>
            </div>
            {operatorsToShow.length > 0 ? (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {operatorsToShow.map((op) => <OperatorCard key={op.id} op={op} onStatusUpdate={handleStatusUpdate} />)}
              </ul>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p className="font-medium uppercase tracking-widest">Nenhum operador encontrado</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-20 flex flex-col items-center justify-center text-muted-foreground">
            <div className="rounded-full bg-muted p-6"><Users className="size-12 opacity-20" /></div>
            <p className="mt-4 font-medium uppercase tracking-widest">Escolha uma equipe acima para listar os operadores</p>
          </div>
        )}
      </main>
    </div>
  );
}
