export interface EventoAgenda {
  tipo: string;
  inicio: string;
  fim: string;
  operadorId?: string;
  motivo?: string;
}

export class AgendaService {
  /**
   * Obtém os eventos de agenda ativos para o setor, turno e data.
   */
  static getEventosAtivos(setor: string, turno: string, data: string): EventoAgenda[] {
    const w = window as any;
    const agendaRaw = (w.agenda && w.agenda[setor]) || [];
    
    return agendaRaw.filter((e: any) => e.inicio <= data && e.fim >= data);
  }
}
