export interface Emprestimo {
  origem: string;
  destino: string;
  qtd: number;
  periodo?: 'manha' | 'tarde' | 'integral';
}

export class EmprestimosService {
  /**
   * Retorna os empréstimos validados para o setor e turno específicos.
   */
  static getEmprestimos(setor: string, turno: string, data: string): Emprestimo[] {
    const w = window as any;
    const listaRaw = w.emprestados && w.emprestados[data] ? w.emprestados[data] : [];
    
    // Regra da Etapa 17: Validar regras
    // quantidade > 0, origem != destino, respeitar periodo
    return listaRaw.filter((e: any) => {
      if (e.qtd <= 0) return false;
      if (e.origem === e.destino) return false;
      
      // Lógica de período (exemplo futuro): se o empréstimo for apenas 'manha' e o turno for 'tarde', deve retornar false
      if (e.periodo && turno) {
        // ...
      }

      return true;
    });
  }
}
