export interface RegistroAuditoriaMaoDeObra {
  id: string;
  dataHora: string;
  usuario: string;
  setor: string;
  turno: string;
  operadorId?: string;
  statusAnterior: string;
  statusNovo: string;
  quantidadeAnterior: number;
  quantidadeNova: number;
  motivo?: string;
}

export class AuditoriaService {
  /**
   * Registra uma alteração de mão de obra para fins de rastreabilidade (Etapa 26).
   */
  static registrarAlteracao(registro: Omit<RegistroAuditoriaMaoDeObra, 'id' | 'dataHora'>): void {
    const entry: RegistroAuditoriaMaoDeObra = {
      id: crypto.randomUUID(),
      dataHora: new Date().toISOString(),
      ...registro
    };
    
    // Para fins de POC / frontend, vamos persistir no localStorage para visualização posterior
    const w = window as any;
    const historico = JSON.parse(localStorage.getItem('vw_auditoria_maodeobra') || '[]');
    historico.push(entry);
    localStorage.setItem('vw_auditoria_maodeobra', JSON.stringify(historico));
    
    console.log('[AUDITORIA] Mão de obra alterada:', entry);
  }

  /**
   * Obtém o histórico de alterações.
   */
  static getHistorico(): RegistroAuditoriaMaoDeObra[] {
    return JSON.parse(localStorage.getItem('vw_auditoria_maodeobra') || '[]');
  }
}
