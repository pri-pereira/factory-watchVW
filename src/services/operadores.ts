export interface Operador {
  id: string;
  nome: string;
  setor: string;
  turno: string;
}

export interface QuadroData {
  operadores: number;
  operacoes: number;
}

export class OperadoresService {
  /**
   * Obtém a lista de operadores planejados para o turno e data específicos.
   */
  static getOperadoresDoTurno(setor: string, turno: string, data: string): Operador[] {
    // Integração futura com Firebase/banco
    // Por enquanto, retorna vazio se não houver backend
    return [];
  }

  /**
   * Obtém o quadro (operadores e operações) já filtrado pelo turno.
   */
  static getQuadro(setor: string, turno: string, data: string): QuadroData {
    // Compatibilidade com o legado temporariamente
    const quadrosLegados = (window as any).quadros || {};
    if (quadrosLegados[setor]) {
      return {
        operadores: quadrosLegados[setor].operadores || 0,
        operacoes: quadrosLegados[setor].operacoes || 0
      };
    }
    return { operadores: 0, operacoes: 0 };
  }
}
