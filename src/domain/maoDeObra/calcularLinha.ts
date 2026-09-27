import { CalculoLinha, StatusOperador } from './tipos';
import { calcularMaoDeObra } from './calcularMaoDeObra';

declare global {
  interface Window {
    SETORES?: string[];
  }
}

export function calcularMaoDeObraLinha(data: string, opcoes: any = {}): CalculoLinha {
  const setoresIds = window.SETORES || [];
  
  const consolidado: CalculoLinha = {
    data,
    quadro: 0,
    necessario: 0,
    ausencias: {},
    ausenciasTotais: 0,
    ausenciasReais: 0,
    presentes: 0,
    monitores: { cobrindo: 0, fora: 0, total: 0 },
    emprestimos: { enviados: 0, recebidos: 0, saldo: 0 },
    disponivel: 0,
    resultado: 0,
    resultadoSemMonitor: 0,
    percentualAusencia: 0,
    percentualReal: 0,
    setores: []
  };

  setoresIds.forEach(setor => {
    const calc = calcularMaoDeObra(setor, data, opcoes);
    consolidado.setores.push(calc);

    consolidado.quadro += calc.quadro;
    consolidado.necessario += calc.necessario;
    consolidado.ausenciasTotais += calc.ausenciasTotais;
    consolidado.ausenciasReais += calc.ausenciasReais;
    consolidado.presentes += calc.presentes;
    
    consolidado.monitores.cobrindo += calc.monitores.cobrindo;
    consolidado.monitores.fora += calc.monitores.fora;
    consolidado.monitores.total += calc.monitores.total;
    
    consolidado.emprestimos.enviados += calc.emprestimos.enviados;
    consolidado.emprestimos.recebidos += calc.emprestimos.recebidos;
    consolidado.emprestimos.saldo += calc.emprestimos.saldo;
    
    consolidado.disponivel += calc.disponivel;
    consolidado.resultado += calc.resultado;
    consolidado.resultadoSemMonitor += calc.resultadoSemMonitor;
    
    for (const [key, qtd] of Object.entries(calc.ausencias)) {
      const status = key as StatusOperador;
      if (!consolidado.ausencias[status]) consolidado.ausencias[status] = 0;
      consolidado.ausencias[status]! += (qtd || 0);
    }
  });
  
  consolidado.percentualAusencia = consolidado.quadro > 0 ? (consolidado.ausenciasTotais / consolidado.quadro) * 100 : 0;
  consolidado.percentualReal = consolidado.quadro > 0 ? (consolidado.ausenciasReais / consolidado.quadro) * 100 : 0;

  return consolidado;
}
