import { StatusOperador, RegraCategoria } from './tipos';

/**
 * Tabela canônica de categorias
 * Define como cada status afeta os presentes, as ausências e o absenteísmo real.
 */
export const REGRA_CATEGORIAS: Record<StatusOperador, RegraCategoria> = {
  [StatusOperador.PRESENTE]:   { afetaPresentes: false, entraAusencia: false, ausenciaReal: false },
  [StatusOperador.FERIAS]:     { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: false },
  [StatusOperador.BH]:         { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: false },
  [StatusOperador.AFASTAMENTO]:{ afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [StatusOperador.FALTA]:      { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [StatusOperador.PENDENTE]:   { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [StatusOperador.ENFERMARIA]: { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [StatusOperador.LICENCA]:    { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [StatusOperador.ATESTADO]:   { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [StatusOperador.LIBERADO]:   { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [StatusOperador.ATRASADO]:   { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [StatusOperador.SAIU_VOLTA]: { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [StatusOperador.APOIO]:      { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: false },
  [StatusOperador.OUTROS]:     { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  }
};
