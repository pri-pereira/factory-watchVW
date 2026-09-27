import { StatusOperador, CalculoMaoDeObra, AusenciasPorCategoria, Emprestimos, Monitores } from './tipos';
import { REGRA_CATEGORIAS } from './categorias';
import { OperadoresService } from '../../services/operadores';
import { AgendaService } from '../../services/agenda';
import { MonitoresService } from '../../services/monitores';
import { EmprestimosService } from '../../services/emprestimos';

function classificarAusencias(setor: string, turno: string, data: string): Partial<AusenciasPorCategoria> {
  const eventosAgenda = AgendaService.getEventosAtivos(setor, turno, data);
  const countOnDate = (tipo: string) => eventosAgenda.filter(e => e.tipo === tipo).length;
  
  const getVar = (obj: Record<string, number> | undefined) => (obj && obj[setor + '||' + data]) || 0;
  
  const getCustomQtd = (isFeria: boolean) => {
    if (!window.customCards) return 0;
    return window.customCards.filter(cc => {
      const n = (cc.nome || '').toLowerCase();
      const isFeriaCard = n.includes('feria') || n.includes('férias');
      return isFeria ? isFeriaCard : !isFeriaCard;
    }).reduce((sum, cc) => {
      return sum + ((window.customCounts && window.customCounts[cc.id + '||' + setor + '||' + data]) || 0);
    }, 0);
  };
  
  const w = window as any;
  const faltasAvulsas = typeof w.getPainelFaltasAvulsas === 'function' ? w.getPainelFaltasAvulsas(setor, data) : 0;
  const pendentesAvulsas = typeof w.getPainelCount === 'function' ? w.getPainelCount(setor, ['pendente'], data) : 0;
  
  const foi = getVar(w.enfTotalFoi);
  const voltou = getVar(w.enfVoltou);
  const enfermariaReal = Math.max(0, countOnDate('enfermaria') + (foi - voltou));
  
  return {
    [StatusOperador.FERIAS]: countOnDate('feria') + getVar(w.feriasDia) + getCustomQtd(true),
    [StatusOperador.BH]: countOnDate('bh'),
    [StatusOperador.AFASTAMENTO]: countOnDate('afastamento'),
    [StatusOperador.FALTA]: countOnDate('falta') + faltasAvulsas,
    [StatusOperador.PENDENTE]: pendentesAvulsas,
    [StatusOperador.ENFERMARIA]: enfermariaReal,
    [StatusOperador.LICENCA]: (w.LICENCA_TIPOS || []).reduce((sum: number, t: string) => sum + countOnDate(t), 0),
    [StatusOperador.ATESTADO]: getVar(w.atestados),
    [StatusOperador.LIBERADO]: getVar(w.liberados),
    [StatusOperador.ATRASADO]: getVar(w.atrasados),
    [StatusOperador.SAIU_VOLTA]: getVar(w.saiuVoltou),
    [StatusOperador.APOIO]: getVar(w.apoioCopa),
    [StatusOperador.OUTROS]: countOnDate('outros') + getCustomQtd(false)
  };
}

export interface OpcoesCalculo {
  turno?: string;
  // Outras opções futuras
}

export function calcularMaoDeObra(setor: string, data: string, opcoes: OpcoesCalculo = {}): CalculoMaoDeObra {
  const turno = opcoes.turno || '1'; // Default para o 1º turno se não informado

  // 1. Obter Quadro e Necessário injetado pelo Service (Etapa 16 - Turno)
  const quadroObj = OperadoresService.getQuadro(setor, turno, data);
  const quadro = quadroObj.operadores || 0;
  const necessario = quadroObj.operacoes || 0;

  // 2. Classificar ausências de acordo com o catálogo (Etapa 1 a 7)
  const ausencias = classificarAusencias(setor, turno, data);
  let ausenciasTotais = 0;
  let ausenciasReais = 0;

  for (const [key, qtd] of Object.entries(ausencias)) {
    const status = key as StatusOperador;
    const regra = REGRA_CATEGORIAS[status];
    const amount = Number(qtd) || 0;
    
    if (regra && regra.entraAusencia) {
      ausenciasTotais += amount;
    }
    
    if (regra && regra.ausenciaReal) {
      ausenciasReais += amount;
    }
  }

  // Previne saldo negativo
  ausenciasTotais = Math.min(ausenciasTotais, quadro);
  ausenciasReais = Math.min(ausenciasReais, quadro);

  // 3. Obter Monitores e Empréstimos pelos Services
  const presentes = Math.max(0, quadro - ausenciasTotais);
  
  const monitoresRaw = MonitoresService.getMonitores(setor, turno, data);
  const monitores: Monitores = {
    cobrindo: monitoresRaw.filter(m => m.status === 'cobrindo').length,
    fora: monitoresRaw.filter(m => m.status === 'fora').length,
    total: monitoresRaw.length
  };

  const emprestimosRaw = EmprestimosService.getEmprestimos(setor, turno, data);
  const emprestimos = {
    enviados: emprestimosRaw.filter(e => e.origem === setor).reduce((s, e) => s + e.qtd, 0),
    recebidos: emprestimosRaw.filter(e => e.destino === setor).reduce((s, e) => s + e.qtd, 0),
    saldo: emprestimosRaw.filter(e => e.destino === setor).reduce((s, e) => s + e.qtd, 0) - emprestimosRaw.filter(e => e.origem === setor).reduce((s, e) => s + e.qtd, 0)
  };

  const disponivel = presentes + monitores.cobrindo + emprestimos.saldo;
  const resultadoSemMonitor = presentes - necessario + emprestimos.saldo;
  const resultado = disponivel - necessario;

  return {
    setor,
    data,
    quadro,
    necessario,
    ausencias,
    ausenciasTotais,
    ausenciasReais,
    presentes,
    monitores,
    emprestimos,
    disponivel,
    resultado,
    resultadoSemMonitor,
    percentualAusencia: quadro > 0 ? (ausenciasTotais / quadro) * 100 : 0,
    percentualReal: quadro > 0 ? (ausenciasReais / quadro) * 100 : 0
  };
}
