export interface Monitor {
  nome: string;
  status: 'cobrindo' | 'fora';
}

export class MonitoresService {
  /**
   * Obtém os monitores ativos para o setor, turno e data.
   */
  static getMonitores(setor: string, turno: string, data: string): Monitor[] {
    const w = window as any;
    return w.monitores && w.monitores[setor] ? w.monitores[setor] : [];
  }
}
