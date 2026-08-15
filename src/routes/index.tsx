import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarOff,
  CheckCircle2,
  Clock,
  Download,
  Factory,
  FileSpreadsheet,
  FileText,
  Hourglass,
  User,
  Search,
  Users,
  Stethoscope,
} from "lucide-react";
import { TURNOS, operators, CELULAS, type Operator, type OperatorStatus } from "@/data/operators";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Presença - Célula Vidros" },
      {
        name: "description",
        content:
          "Acompanhe em tempo real a presença dos operadores da Célula Vidros minutos antes do início do turno.",
      },
      { property: "og:title", content: "Painel de Presença - Célula Vidros" },
      {
        property: "og:description",
        content: "Status de presença da equipe de chão de fábrica em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#1f2937" },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
  component: Painel,
});

const statusMeta: Record<
  OperatorStatus,
  { label: string; dot: string; badge: string; bar: string; icon: typeof CheckCircle2 }
> = {
  presente: {
    label: "Presente",
    dot: "bg-status-present",
    badge: "bg-status-present-soft text-status-present",
    bar: "bg-status-present",
    icon: CheckCircle2,
  },
  ausente: {
    label: "Ausente",
    dot: "bg-status-absent",
    badge: "bg-status-absent-soft text-status-absent",
    bar: "bg-status-absent",
    icon: AlertTriangle,
  },
  pendente: {
    label: "Pendente",
    dot: "bg-status-pending",
    badge: "bg-status-pending-soft text-status-pending",
    bar: "bg-status-pending",
    icon: Hourglass,
  },
  afastado: {
    label: "Férias / Licença",
    dot: "bg-status-leave",
    badge: "bg-status-leave-soft text-status-leave",
    bar: "bg-status-leave",
    icon: CalendarOff,
  },
  enfermaria: {
    label: "Enfermaria",
    dot: "bg-status-enfermaria",
    badge: "bg-status-enfermaria-soft text-status-enfermaria",
    bar: "bg-status-enfermaria",
    icon: Stethoscope,
  },
};

function useShiftClock() {
  // Cenário simulado: faltam 10 minutos para o início do turno (05:50).
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow((prev) => new Date(prev.getTime() + 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function initials(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-500 sm:p-5">
      <span className={`absolute inset-y-0 left-0 w-1.5 transition-colors duration-500 ${accent}`} aria-hidden />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pl-2">
        <div className="min-w-0">
          <p className="truncate text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-4xl font-bold leading-none tabular-nums text-foreground transition-all duration-500 sm:text-5xl">
            {value}
          </p>
        </div>
        <Icon className="size-8 shrink-0 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function OperatorCard({ 
  op, 
  onStatusUpdate 
}: { 
  op: Operator; 
  onStatusUpdate: (id: string, status: OperatorStatus, timestamp?: string) => void;
}) {
  const meta = statusMeta[op.status];
  const Icon = meta.icon;

  const handleClick = () => {
    if (op.status === "presente") {
      toast.info(`Deseja alterar o status de ${op.nome}?`, {
        description: "O operador será movido para a enfermaria.",
        duration: Infinity,
        action: {
          label: "Confirmar",
          onClick: () => onStatusUpdate(op.id, "enfermaria"),
        },
      });
    } else if (op.status === "enfermaria") {
      toast.info(`Deseja alterar o status de ${op.nome}?`, {
        description: "O operador retornará ao status presente.",
        duration: Infinity,
        action: {
          label: "Confirmar",
          onClick: () => {
            const now = new Date();
            const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
            onStatusUpdate(op.id, "presente", timestamp);
          },
        },
      });
    }
  };

  const isClickable = op.status === "presente" || op.status === "enfermaria";


  return (
    <li 
      onClick={isClickable ? handleClick : undefined}
      className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all ${
        isClickable ? "cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-[0.99]" : ""
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.bar}`} aria-hidden />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 pl-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid size-12 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold uppercase text-muted-foreground">
            {initials(op.nome) || <User className="size-5" />}
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-card ${meta.dot}`}
              aria-hidden
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight text-foreground">{op.nome}</p>
            <p className="truncate text-sm text-muted-foreground">{op.funcao}</p>
            <p className="font-mono text-xs text-muted-foreground/70">Mat. {op.matricula}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${meta.badge}`}
          >
            <Icon className="size-3.5" />
            {meta.label}
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {op.batida ? `Crachá ${op.batida}` : (op.observacao ?? "Aguardando...")}
          </span>
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


function TeamFilterCard({
  name,
  ops,
  isActive,
  onClick,
}: {
  name: string;
  ops: Operator[];
  isActive: boolean;
  onClick: () => void;
}) {
  const percentage = useMemo(() => {
    const total = ops.length;
    if (total === 0) return 0;
    const presents = ops.filter((o) => o.status === "presente").length;
    return Math.round((presents / total) * 100);
  }, [ops]);

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl border p-4 transition-all sm:p-6 ${
        isActive
          ? "border-primary bg-primary text-primary-foreground shadow-lg scale-[1.02]"
          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      <p className="font-display text-sm font-bold uppercase tracking-widest">{name}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums sm:text-4xl">{percentage}</span>
        <span className="text-sm font-semibold opacity-70">%</span>
      </div>
      <p className="mt-1 text-[0.65rem] font-medium uppercase opacity-60">Presença Efetiva</p>
      {isActive && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-white/20">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </button>
  );
}

function Painel() {
  const now = useShiftClock();
  const [selectedTurno, setSelectedTurno] = useState(TURNOS[0]);
  const [selectedCelula, setSelectedCelula] = useState(CELULAS[0]);
  const [selectedEquipe, setSelectedEquipe] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OperatorStatus | "todos">("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [dynamicOperators, setDynamicOperators] = useState<Operator[]>(operators);

  // Simulação de tempo real: atualiza status aleatórios a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setDynamicOperators((current) =>
        current.map((op) => {
          // Operadores pendentes ou ausentes mudam para presente assim que "passam o crachá"
          if ((op.status === "pendente" || op.status === "ausente") && Math.random() > 0.8) {
            return {
              ...op,
              status: "presente",
              batida: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
            };
          }
          return op;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [now]);

  const handleStatusUpdate = (id: string, newStatus: OperatorStatus, timestamp?: string) => {
    setDynamicOperators(prev => 
      prev.map(op => {
        if (op.id === id) {
          const updated = { ...op, status: newStatus };
          if (timestamp) updated.batida = timestamp;
          return updated;
        }
        return op;
      })
    );
  };


  const filteredByCelula = useMemo(() => {
    return dynamicOperators.filter((op) => op.id.startsWith(selectedCelula || ""));
  }, [selectedCelula, dynamicOperators]);


  // Reset selected team when cell changes
  useEffect(() => {
    setSelectedEquipe(null);
  }, [selectedCelula]);

  const counts = useMemo(() => {
    const by = (s: OperatorStatus) => filteredByCelula.filter((o) => o.status === s).length;
    return {
      total: filteredByCelula.length,
      presentes: by("presente"),
      ausentes: by("ausente") + by("pendente"),
      enfermaria: by("enfermaria"),
      programadas: by("afastado"),
    };
  }, [filteredByCelula]);

  const [h, m] = (selectedTurno?.inicio || "06:00").split(":").map(Number) as [number, number];
  const start = new Date(now);
  start.setHours(h, m, 0, 0);

  const minutesLeft = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 60000));

  const equipesInCelula = useMemo(() => {
    const groups: Record<string, Operator[]> = {};
    filteredByCelula.forEach((op) => {
      const eq = op.equipe || "Sem Equipe";
      if (!groups[eq]) groups[eq] = [];
      groups[eq].push(op);
    });
    return groups;
  }, [filteredByCelula]);

  const operatorsToShow = useMemo(() => {
    if (!selectedEquipe) return [];
    const ops = equipesInCelula[selectedEquipe] || [];
    const filtered = ops.filter((op) => {
      const matchesSearch = op.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           op.matricula.includes(searchQuery);
      const matchesStatus = selectedStatus === "todos" || op.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
    
    // Custom sort: ausente/pendente first, then enfermaria, then presente, then afastado
    const ordem: OperatorStatus[] = ["ausente", "pendente", "enfermaria", "presente", "afastado"];
    return [...filtered].sort(
      (a, b) => ordem.indexOf(a.status) - ordem.indexOf(b.status) || a.nome.localeCompare(b.nome)
    );
  }, [selectedEquipe, equipesInCelula, searchQuery, selectedStatus]);

  const exportCSV = () => {
    if (!selectedTurno) return;
    const headers = ["Turno", "Célula", "Equipe", "Nome", "Matrícula", "Status", "Batida"];
    const rows = dynamicOperators.map(op => [
      selectedTurno.nome,
      op.id.split('-')[0],
      op.equipe,
      op.nome,
      op.matricula,
      statusMeta[op.status].label,
      op.batida || "-"
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_presenca_${selectedTurno.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    if (!selectedTurno) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Relatório de Presença - ${selectedTurno.nome}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Célula: ${selectedCelula} | Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    const tableData = Object.entries(equipesInCelula).map(([equipe, ops]) => {
      const by = (s: OperatorStatus) => ops.filter(o => o.status === s).length;
      return [
        equipe,
        ops.length,
        by("presente"),
        by("ausente") + by("pendente"),
        by("enfermaria"),
        by("afastado")
      ];
    });

    (doc as any).autoTable({
      startY: 40,
      head: [["Equipe", "Total", "Presentes", "Ausentes/Pend.", "Enfermaria", "Afastados"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: 'dark', fillColor: [31, 41, 55] }
    });

    doc.save(`relatorio_presenca_${selectedTurno.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-20 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary-foreground/10">
              <Factory className="size-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">
                Gestão Operacional
              </h1>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTurno?.id}
                  onChange={(e) => {
                    const t = TURNOS.find((tx) => tx.id === e.target.value);
                    if (t) setSelectedTurno(t);
                  }}
                  className="bg-transparent text-sm font-bold uppercase tracking-wider text-primary-foreground focus:outline-none cursor-pointer border border-primary-foreground/20 rounded px-1"
                >
                  {TURNOS.map((t) => (
                    <option key={t.id} value={t.id} className="text-foreground">
                      {t.nome}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-primary-foreground/70">
                  · {selectedTurno?.inicio} às {selectedTurno?.fim} ·{" "}
                  {minutesLeft > 0 ? `início em ${minutesLeft} min` : "turno em andamento"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right">
              <p className="font-mono text-xl font-bold leading-none tabular-nums sm:text-2xl text-primary-foreground/90">
                {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(now)}
              </p>
              <p className="font-mono text-lg font-bold leading-none tabular-nums text-primary-foreground/80 mt-1">
                {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now)}
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[0.6rem] uppercase tracking-widest text-primary-foreground/60">
                Data e Hora Atual
              </p>
            </div>
            <Link
              to="/auth/login"
              className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-foreground/20"
            >
              Sair
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-2">
            {CELULAS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCelula(c)}
                className={`rounded-lg border px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                  selectedCelula === c
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                {c}
              </button>
            ))}
          </nav>
          
          <div className="flex gap-2">
            <div className="relative group">
              <button
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-all hover:border-primary/50 hover:text-primary active:bg-muted"
              >
                <Download className="size-4" /> Exportar
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex group-focus-within:flex flex-col min-w-[140px] rounded-lg border border-border bg-card shadow-lg z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={exportCSV}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold uppercase hover:bg-muted transition-colors text-muted-foreground hover:text-primary cursor-pointer border-b border-border/50 last:border-0"
                >
                  <FileSpreadsheet className="size-4" /> CSV
                </button>
                <button
                  onClick={exportPDF}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold uppercase hover:bg-muted transition-colors text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <FileText className="size-4" /> PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <MetricCard
            label="Total da célula"
            value={counts.total}
            icon={Users}
            accent="bg-primary"
          />
          <MetricCard
            label="Presentes"
            value={counts.presentes}
            icon={CheckCircle2}
            accent="bg-status-present"
          />
          <MetricCard
            label="Ausentes"
            value={counts.ausentes}
            icon={AlertTriangle}
            accent="bg-status-absent"
          />
          <MetricCard
            label="Enfermaria"
            value={filteredByCelula.filter(o => o.status === "enfermaria").length}
            icon={Stethoscope}
            accent="bg-status-enfermaria"
          />
          <MetricCard
            label="Programadas"
            value={counts.programadas}
            icon={CalendarOff}
            accent="bg-status-leave"
          />
        </section>

        {/* Filtro de Equipes Lado a Lado */}
        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
              Equipes de {selectedCelula}
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Selecione uma equipe para ver os detalhes
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Object.entries(equipesInCelula)
              .sort()
              .map(([equipe, ops]) => (
                <TeamFilterCard
                  key={equipe}
                  name={equipe}
                  ops={ops}
                  isActive={selectedEquipe === equipe}
                  onClick={() => setSelectedEquipe(equipe)}
                />
              ))}
          </div>
        </div>

        {/* Lista de Funcionários da Equipe Selecionada */}
        {selectedEquipe ? (
          <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="mb-6 flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Users className="size-5 text-primary" />
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                    Integrantes da {selectedEquipe}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["todos", "presente", "pendente", "ausente", "afastado", "enfermaria"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedStatus(s)}
                      className={`rounded-md px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest transition-all border ${
                        selectedStatus === s
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {s === "todos" ? "Todos" : statusMeta[s].label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou mat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
            
            {operatorsToShow.length > 0 ? (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {operatorsToShow.map((op) => (
                  <OperatorCard 
                    key={op.id} 
                    op={op} 
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}

              </ul>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p className="font-medium uppercase tracking-widest">Nenhum operador encontrado</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-20 flex flex-col items-center justify-center text-muted-foreground">
            <div className="rounded-full bg-muted p-6">
              <Users className="size-12 opacity-20" />
            </div>
            <p className="mt-4 font-medium uppercase tracking-widest">
              Escolha uma equipe acima para listar os operadores
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
