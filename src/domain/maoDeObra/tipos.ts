export enum StatusOperador {
  PRESENTE = 'PRESENTE',
  FERIAS = 'FERIAS',
  BH = 'BH',
  AFASTAMENTO = 'AFASTAMENTO',
  FALTA = 'FALTA',
  PENDENTE = 'PENDENTE',
  ENFERMARIA = 'ENFERMARIA',
  LICENCA = 'LICENCA',
  ATESTADO = 'ATESTADO',
  LIBERADO = 'LIBERADO',
  ATRASADO = 'ATRASADO',
  SAIU_VOLTA = 'SAIU_VOLTA',
  APOIO = 'APOIO',
  OUTROS = 'OUTROS'
}

export interface RegraCategoria {
  afetaPresentes: boolean;
  entraAusencia: boolean;
  ausenciaReal: boolean;
}

export type AusenciasPorCategoria = Record<StatusOperador, number>;

export interface Monitores {
  cobrindo: number;
  fora: number;
  total: number;
}

export interface Emprestimos {
  enviados: number;
  recebidos: number;
  saldo: number;
}

export interface CalculoMaoDeObra {
  setor: string;
  data: string;
  quadro: number;
  necessario: number;
  ausencias: Partial<AusenciasPorCategoria>;
  ausenciasTotais: number;
  ausenciasReais: number;
  presentes: number;
  monitores: Monitores;
  emprestimos: Emprestimos;
  disponivel: number;
  resultado: number;
  resultadoSemMonitor: number;
  percentualAusencia: number;
  percentualReal: number;
}

export interface CalculoLinha extends Omit<CalculoMaoDeObra, 'setor'> {
  setores: CalculoMaoDeObra[];
}
