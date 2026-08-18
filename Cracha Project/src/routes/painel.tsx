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
      { title: "VW SmartFlow - Painel Operacional" },
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
  presente:   { label: "Presente",       dot: "bg-success",          badge: "bg-success/10 text-success border border-success/20",             bar: "bg-success",          icon: CheckCircle2  },
  ausente:    { label: "Ausente",        dot: "bg-destructive",      badge: "bg-destructive/10 text-destructive border border-destructive/20", bar: "bg-destructive",      icon: AlertTriangle },
  pendente:   { label: "Pendente",       dot: "bg-warning",          badge: "bg-warning/10 text-warning-foreground border border-warning/20",  bar: "bg-warning",          icon: Hourglass     },
  afastado:   { label: "Ferias/Licenca", dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border border-border",             bar: "bg-muted-foreground", icon: CalendarOff   },
  enfermaria: { label: "Enfermaria",     dot: "bg-primary",          badge: "bg-primary/10 text-primary border border-primary/20",             bar: "bg-primary",          icon: Stethoscope   },
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
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pl-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold leading-none tabular-nums text-foreground mt-1 sm:text-4xl">{value}</p>
        </div>
        <Icon className="size-8 shrink-0 text-muted-foreground/30" strokeWidth={1.5} />
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
      className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all ${isClickable ? "cursor-pointer hover:shadow-md hover:border-primary/50" : ""}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${meta.bar}`} aria-hidden />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 pl-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid size-12 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold uppercase text-muted-foreground">
            {initials(op.nome) || <User className="size-5" />}
            <span className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-card ${meta.dot}`} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{op.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{op.funcao}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Mat. {op.matricula}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badge}`}>
            <Icon className="size-3" />
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {op.batida ? `Crachá ${op.batida}` : (op.observacao ?? "Aguardando")}
          </span>
          {op.alteradoPor && (
            <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
              <Clock className="size-3" />
              {op.alteradoPor} • {op.alteradoAs}
            </span>
          )}
        </div>
      </div>
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
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl border p-4 transition-all sm:p-5 ${
        isActive ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
      }`}>
      <p className="text-sm font-semibold">{name}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums">{percentage}</span>
        <span className="text-sm font-semibold opacity-80">%</span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wider opacity-70">Presença Efetiva</p>
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
    presente: "Presente", ausente: "Ausente", pendente: "Pendente", afastado: "Férias/Licença", enfermaria: "Enfermaria"
  };
  if (logs.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma alteração registrada neste turno.</p>;
  }
  return (
    <ul className="space-y-3">
      {logs.map((e) => (
        <li key={e.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ClipboardList className="size-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              <span className="text-primary">{e.responsavel}</span>
              <span className="font-normal text-muted-foreground"> ({e.cargo}) alterou </span>
              <span>{e.operadorNome}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {statusLabel[e.statusAnterior] ?? e.statusAnterior}{" "}
              <span className="mx-1 text-border">&rarr;</span>
              <span className="font-semibold text-foreground">{statusLabel[e.statusNovo] ?? e.statusNovo}</span>
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{e.timestamp}</span>
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
    doc.text(`Relatório de Presença - ${selectedTurno?.nome ?? ""}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Célula: ${selectedCelula} | Gerado por: ${usuario.nome} (${usuario.cargo}) em ${new Date().toLocaleString("pt-BR")}`, 14, 30);
    doc.save(`relatorio_presenca_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header SmartAndon */}
      <header className="sticky top-0 z-20 border-b border-border bg-card shadow-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Factory className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-foreground">VW SmartFlow</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <select value={selectedTurno?.id}
                  onChange={(e) => { const t = TURNOS.find((tx) => tx.id === e.target.value); if (t) setSelectedTurno(t); }}
                  className="bg-transparent text-xs font-semibold text-muted-foreground focus:outline-none cursor-pointer hover:text-foreground transition-colors">
                  {TURNOS.map((t) => <option key={t.id} value={t.id} className="text-foreground">{t.nome}</option>)}
                </select>
                <span className="text-xs text-muted-foreground">
                  &middot; {selectedTurno?.inicio} às {selectedTurno?.fim}
                </span>
                {minutesLeft > 0 && <span className="ml-1 text-xs text-primary font-medium">(início em {minutesLeft} min)</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="hidden sm:flex flex-col text-right mr-2 border-r border-border pr-4">
              <p className="text-sm font-semibold text-foreground">
                {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now)}
              </p>
              <p className="text-xs text-muted-foreground">
                {usuario.nome}
              </p>
            </div>

            {/* Botão Log Auditoria */}
            <button onClick={() => setShowAudit((v) => !v)}
              className="relative flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
              <ClipboardList className="size-4 text-muted-foreground" />
              <span>Log</span>
              {logs.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {logs.length > 9 ? "9+" : logs.length}
                </span>
              )}
            </button>

            {/* Smart Flow */}
            <a id="btn-smartflow" href="/smartflow.html" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
              <span>Smart Flow</span>
            </a>

            {/* Sair */}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Feed de Auditoria */}
      {showAudit && (
        <div className="border-b border-border bg-muted/30 shadow-inner">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ClipboardList className="size-4 text-primary" />
                Histórico do Turno
              </h2>
              <button onClick={() => setShowAudit(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                Fechar
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto pr-2">
              <FeedAuditoria logs={logs} />
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Células + Exportar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-2">
            {CELULAS.map((c) => (
              <button key={c} onClick={() => setSelectedCelula(c)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  selectedCelula === c ? "bg-primary text-primary-foreground shadow-sm" : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                {c}
              </button>
            ))}
          </nav>
          <div className="flex gap-2">
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted shadow-sm">
                <Download className="size-4 text-muted-foreground" /> Exportar
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex group-focus-within:flex flex-col min-w-[140px] rounded-md border border-border bg-popover shadow-md z-30 py-1">
                <button onClick={exportCSV} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"><FileSpreadsheet className="size-4 text-muted-foreground" /> CSV</button>
                <button onClick={exportPDF} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"><FileText className="size-4 text-muted-foreground" /> PDF</button>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <MetricCard label="Total da célula" value={counts.total} icon={Users} accent="bg-primary" />
          <MetricCard label="Presentes" value={counts.presentes} icon={CheckCircle2} accent="bg-success" />
          <MetricCard label="Ausentes" value={counts.ausentes} icon={AlertTriangle} accent="bg-destructive" />
          <MetricCard label="Enfermaria" value={counts.enfermaria} icon={Stethoscope} accent="bg-primary" />
          <MetricCard label="Férias/Licença" value={counts.programadas} icon={CalendarOff} accent="bg-muted-foreground" />
        </section>

        {/* Equipes */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Equipes de {selectedCelula}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Object.entries(equipesInCelula).sort().map(([equipe, ops]) => (
              <TeamFilterCard key={equipe} name={equipe} ops={ops} isActive={selectedEquipe === equipe} onClick={() => setSelectedEquipe(equipe)} />
            ))}
          </div>
        </div>

        {/* Lista de operadores */}
        {selectedEquipe ? (
          <div className="mt-10 animate-in fade-in duration-500">
            <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">Integrantes da {selectedEquipe}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["todos", "presente", "pendente", "ausente", "afastado", "enfermaria"] as const).map((s) => (
                    <button key={s} onClick={() => setSelectedStatus(s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                        selectedStatus === s ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-input"
                      }`}>
                      {s === "todos" ? "Todos" : statusMeta[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Buscar operador..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm" />
              </div>
            </div>
            {operatorsToShow.length > 0 ? (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {operatorsToShow.map((op) => <OperatorCard key={op.id} op={op} onStatusUpdate={handleStatusUpdate} />)}
              </ul>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-sm font-medium">Nenhum operador encontrado.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center justify-center text-muted-foreground">
            <div className="rounded-full bg-muted p-4"><Users className="size-8 opacity-40 text-muted-foreground" /></div>
            <p className="mt-3 text-sm font-medium">Selecione uma equipe para visualizar os operadores</p>
          </div>
        )}
      </main>
    </div>
  );
}
