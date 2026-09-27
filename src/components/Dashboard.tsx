import React, { useMemo, useState, useEffect } from "react";
import { Users, AlertTriangle, Briefcase, Activity, ChevronRight, UserCheck, Stethoscope } from "lucide-react";
import { calcularMaoDeObraLinha } from "@/domain/maoDeObra";

// Mock data injection for the React view until backend is fully ported
if (typeof window !== "undefined" && !window.SETORES) {
  window.SETORES = ["Fahrwerk", "Motor", "Montagem", "Pintura", "Carroceria"];
  window.quadros = {
    "Fahrwerk": { operadores: 45, operacoes: 40 },
    "Motor": { operadores: 30, operacoes: 28 },
    "Montagem": { operadores: 80, operacoes: 75 },
    "Pintura": { operadores: 25, operacoes: 22 },
    "Carroceria": { operadores: 60, operacoes: 55 }
  };
}

export function Dashboard() {
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [turno, setTurno] = useState("1");
  const [animateId, setAnimateId] = useState(0);

  // Calls the domain logic! Single Source of Truth!
  const linha = useMemo(() => {
    return calcularMaoDeObraLinha(data, { turno });
  }, [data, turno]);

  // Re-trigger animations when data changes
  useEffect(() => {
    setAnimateId((prev) => prev + 1);
  }, [linha]);

  return (
    <div className="min-h-screen bg-[#040B16] text-slate-200 p-4 sm:p-8 font-['Barlow',sans-serif]">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-white">
            Dashboard Operacional
          </h1>
          <p className="text-sm font-bold tracking-widest text-blue-400 mt-1 uppercase">
            VW SmartFlow &bull; Linha Completa
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-xl backdrop-blur-md">
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-white outline-none cursor-pointer"
          />
          <div className="h-6 w-px bg-white/20"></div>
          <select
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-white outline-none cursor-pointer"
          >
            <option value="1" className="bg-[#0f172a]">1º Turno</option>
            <option value="2" className="bg-[#0f172a]">2º Turno</option>
            <option value="3" className="bg-[#0f172a]">3º Turno</option>
          </select>
        </div>
      </header>

      {/* KPIs Grid */}
      <div key={animateId} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <KpiCard
          title="Quadro Total"
          value={linha.quadro}
          icon={Users}
          color="from-slate-600 to-slate-800"
          accent="bg-slate-400"
        />
        <KpiCard
          title="Presentes"
          value={linha.presentes}
          subtitle={`${Math.max(0, linha.quadro - linha.ausenciasTotais)} planejados disponíveis`}
          icon={UserCheck}
          color="from-blue-600 to-blue-900"
          accent="bg-blue-400"
        />
        <KpiCard
          title="Ausências"
          value={linha.ausenciasTotais}
          subtitle={`${linha.percentualAusencia.toFixed(1)}% absenteísmo bruto`}
          icon={AlertTriangle}
          color="from-amber-600 to-amber-900"
          accent="bg-amber-400"
        />
        <KpiCard
          title="Resultado M.O."
          value={linha.resultado > 0 ? `+${linha.resultado}` : linha.resultado}
          subtitle={`Disponível: ${linha.disponivel} / Necessário: ${linha.necessario}`}
          icon={Activity}
          color={linha.resultado < 0 ? "from-red-600 to-red-900" : "from-emerald-600 to-emerald-900"}
          accent={linha.resultado < 0 ? "bg-red-400" : "bg-emerald-400"}
        />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        
        {/* Setores Breakdown */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
          
          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" />
            Visão por Setores
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-slate-400">
                  <th className="pb-3 font-semibold">Setor</th>
                  <th className="pb-3 font-semibold text-right">Quadro</th>
                  <th className="pb-3 font-semibold text-right">Nec.</th>
                  <th className="pb-3 font-semibold text-right">Pres.</th>
                  <th className="pb-3 font-semibold text-right">Aus.</th>
                  <th className="pb-3 font-semibold text-right">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {linha.setores.map((setor, idx) => (
                  <tr key={setor.setor} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-bold text-white">{setor.setor}</td>
                    <td className="py-4 text-right text-slate-300 font-mono">{setor.quadro}</td>
                    <td className="py-4 text-right text-slate-300 font-mono">{setor.necessario}</td>
                    <td className="py-4 text-right text-blue-300 font-mono font-bold">{setor.presentes}</td>
                    <td className="py-4 text-right text-amber-300 font-mono font-bold">{setor.ausenciasTotais}</td>
                    <td className="py-4 text-right">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                        setor.resultado < 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        setor.resultado === 0 ? "bg-slate-500/20 text-slate-300 border border-slate-500/30" :
                        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {setor.resultado > 0 ? `+${setor.resultado}` : setor.resultado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhamento de Ausências */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-amber-400" />
            Detalhamento de Ausências
          </h2>
          
          <div className="space-y-4">
            {Object.entries(linha.ausencias)
              .filter(([_, qtd]) => (qtd || 0) > 0)
              .sort((a, b) => (b[1] || 0) - (a[1] || 0))
              .map(([motivo, qtd]) => (
                <div key={motivo} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-300 uppercase">{motivo.replace(/_/g, " ")}</span>
                    <span className="font-bold text-white font-mono">{qtd}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, ((qtd || 0) / (linha.ausenciasTotais || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            
            {linha.ausenciasTotais === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-xl">
                Nenhuma ausência registrada
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Absenteísmo Real</span>
            <span className="text-xl font-black text-white">{linha.percentualReal.toFixed(1)}%</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, color, accent }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 shadow-xl border border-white/10 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700`} />
      <div className={`absolute left-0 top-0 w-1 h-full ${accent}`} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/80">{title}</h3>
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div>
          <div className="text-4xl font-black text-white tabular-nums tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs font-semibold text-white/60 mt-1 uppercase tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
