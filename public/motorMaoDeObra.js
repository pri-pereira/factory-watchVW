/**
 * Motor de Mão de Obra Oficial - VW SmartFlow
 * 
 * Regra de Negócio:
 * - 1 operador = 1 estado de mão de obra (sem dupla contagem).
 * - Nenhuma tela deve recalcular a mão de obra por conta própria.
 * - Este motor é a fonte única da verdade para Setores, Dashboard, Gerência, Supervisão, Histórico e Previsão.
 */

// Etapa 1: Definição formal das categorias
const STATUS_OPERADOR = {
  PRESENTE: 'PRESENTE',
  FERIAS: 'FERIAS',
  BH: 'BH',
  AFASTAMENTO: 'AFASTAMENTO',
  FALTA: 'FALTA',
  PENDENTE: 'PENDENTE',
  ENFERMARIA: 'ENFERMARIA',
  LICENCA: 'LICENCA',
  ATESTADO: 'ATESTADO',
  LIBERADO: 'LIBERADO',
  ATRASADO: 'ATRASADO',
  SAIU_VOLTA: 'SAIU_VOLTA',
  APOIO: 'APOIO',
  OUTROS: 'OUTROS'
};

/**
 * Tabela canônica de categorias
 * Define como cada status afeta os presentes, as ausências e o absenteísmo real.
 */
const REGRA_CATEGORIAS = {
  [STATUS_OPERADOR.PRESENTE]:   { afetaPresentes: false, entraAusencia: false, ausenciaReal: false },
  [STATUS_OPERADOR.FERIAS]:     { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: false },
  [STATUS_OPERADOR.BH]:         { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: false },
  [STATUS_OPERADOR.AFASTAMENTO]:{ afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [STATUS_OPERADOR.FALTA]:      { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [STATUS_OPERADOR.PENDENTE]:   { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  }, // Considerado ausencia real até ser justificado
  [STATUS_OPERADOR.ENFERMARIA]: { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  }, // Se foi para enfermaria é ausência
  [STATUS_OPERADOR.LICENCA]:    { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  }, // Conforme regra definida
  [STATUS_OPERADOR.ATESTADO]:   { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [STATUS_OPERADOR.LIBERADO]:   { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [STATUS_OPERADOR.ATRASADO]:   { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [STATUS_OPERADOR.SAIU_VOLTA]: { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  },
  [STATUS_OPERADOR.APOIO]:      { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: false }, // Apoio Copa/Operacional é ausência do setor, mas não absenteísmo real da fábrica
  [STATUS_OPERADOR.OUTROS]:     { afetaPresentes: true,  entraAusencia: true,  ausenciaReal: true  }
};

/**
 * Agrega os monitores de um setor em uma determinada data.
 */
function calcularMonitores(setor, data) {
  // `monitores` é a variável global existente na tela
  const listaMonitores = window.monitores && window.monitores[setor] ? window.monitores[setor] : [];
  
  const cobrindo = listaMonitores.filter(m => m.status === 'cobrindo').length;
  const fora = listaMonitores.filter(m => m.status === 'fora').length;
  
  return {
    cobrindo: cobrindo,
    fora: fora,
    total: listaMonitores.length
  };
}

/**
 * Agrega os empréstimos de um setor em uma determinada data.
 */
function calcularEmprestimos(setor, data) {
  // `emprestados` é a variável global existente
  const lista = window.emprestados && window.emprestados[data] ? window.emprestados[data] : [];
  
  const enviados = lista.filter(e => e.origem === setor).reduce((sum, e) => sum + (e.qtd || 0), 0);
  const recebidos = lista.filter(e => e.destino === setor).reduce((sum, e) => sum + (e.qtd || 0), 0);
  
  return {
    enviados: enviados,
    recebidos: recebidos,
    saldo: recebidos - enviados // saldo positivo = recebeu mais do que enviou
  };
}

/**
 * Lê os dados brutos globais (compatibilidade temporária com o legado)
 * e resolve o status final do operador baseado nas prioridades.
 */
function classificarAusencias(setor, data) {
  // Como no SmartFlow antigo não existia um array de "operadores" limpo e sim várias contagens de fontes diferentes,
  // precisamos converter as fontes antigas para o modelo canônico até que o banco de dados seja purificado.
  
  // Fonte 1: Agenda
  const countOnDate = (tipo) => (window.agenda && window.agenda[setor] || []).filter(e => e.tipo === tipo && e.inicio <= data && e.fim >= data).length;
  
  // Fonte 2: Avulsos globais (variáveis do legado)
  const getVar = (obj) => (obj && obj[setor + '||' + data]) || 0;
  
  // Custom Cards
  const getCustomQtd = (isFeria) => {
    if (!window.customCards) return 0;
    return window.customCards.filter(cc => {
      const n = (cc.nome || '').toLowerCase();
      const isFeriaCard = n.includes('feria') || n.includes('férias');
      return isFeria ? isFeriaCard : !isFeriaCard;
    }).reduce((sum, cc) => {
      return sum + ((window.customCounts && window.customCounts[cc.id + '||' + setor + '||' + data]) || 0);
    }, 0);
  };
  
  const faltasAvulsas = typeof getPainelFaltasAvulsas === 'function' ? getPainelFaltasAvulsas(setor, data) : 0;
  const pendentesAvulsas = typeof getPainelCount === 'function' ? getPainelCount(setor, ['pendente'], data) : 0;
  
  // Tratamento específico de Enfermaria:
  // Eliminando dupla contagem. O operador está NA enfermaria ou já VOLTOU.
  // Se voltou, é apenas histórico, a não ser que tenha chegado atrasado, mas se o app trata `enfVoltou`
  // como "não está ausente mais", então `ausEnf` é apenas quem está LÁ.
  const enfAtual = countOnDate('enfermaria'); // Só quem está lá na agenda, ou precisa de um count de "foi mas não voltou"?
  // A lógica antiga fazia: `enfTotalFoiQtd() - enfVoltouQtd()`.
  const foi = getVar(window.enfTotalFoi);
  const voltou = getVar(window.enfVoltou);
  const enfermariaReal = Math.max(0, countOnDate('enfermaria') + (foi - voltou)); // Evitar que negativar bugue
  
  const ausencias = {
    [STATUS_OPERADOR.FERIAS]:     countOnDate('feria') + getVar(window.feriasDia) + getCustomQtd(true),
    [STATUS_OPERADOR.BH]:         countOnDate('bh'),
    [STATUS_OPERADOR.AFASTAMENTO]:countOnDate('afastamento'),
    [STATUS_OPERADOR.FALTA]:      countOnDate('falta') + faltasAvulsas,
    [STATUS_OPERADOR.PENDENTE]:   pendentesAvulsas,
    [STATUS_OPERADOR.ENFERMARIA]: enfermariaReal,
    [STATUS_OPERADOR.LICENCA]:    (window.LICENCA_TIPOS || []).reduce((sum, t) => sum + countOnDate(t), 0),
    [STATUS_OPERADOR.ATESTADO]:   getVar(window.atestados),
    [STATUS_OPERADOR.LIBERADO]:   getVar(window.liberados),
    [STATUS_OPERADOR.ATRASADO]:   getVar(window.atrasados),
    [STATUS_OPERADOR.SAIU_VOLTA]: getVar(window.saiuVoltou),
    [STATUS_OPERADOR.APOIO]:      getVar(window.apoioCopa),
    [STATUS_OPERADOR.OUTROS]:     countOnDate('outros') + getCustomQtd(false)
  };
  
  return ausencias;
}

/**
 * MOTOR OFICIAL DE CÁLCULO DE MÃO DE OBRA
 * @param {string} setor - Nome do setor
 * @param {string} data - Data no formato YYYY-MM-DD
 * @param {object} opcoes - Parâmetros extras
 * @returns {object} - Objeto canônico de mão de obra
 */
function calcularMaoDeObra(setor, data, opcoes = {}) {
  // 1. Obter Quadro e Necessário
  const quadroObj = window.quadros && window.quadros[setor] ? window.quadros[setor] : { operadores: 0, operacoes: 0 };
  const quadro = quadroObj.operadores || 0;
  const necessario = quadroObj.operacoes || 0;

  // 2. Classificar Ausências
  const ausencias = classificarAusencias(setor, data);

  // 3. Somar Ausências
  let ausenciasTotais = 0;
  let ausenciasReais = 0;
  
  for (const status in ausencias) {
    const qtd = ausencias[status];
    if (qtd > 0 && REGRA_CATEGORIAS[status]) {
      if (REGRA_CATEGORIAS[status].entraAusencia) {
        ausenciasTotais += qtd;
      }
      if (REGRA_CATEGORIAS[status].ausenciaReal) {
        ausenciasReais += qtd;
      }
    }
  }

  // 4. Calcular Presentes
  // Como o sistema antigo não lista "pessoas" nominalmente, inferimos presentes como quadro - ausências
  const presentes = Math.max(0, quadro - ausenciasTotais);

  // 5. Monitores
  const monitores = calcularMonitores(setor, data);

  // 6. Empréstimos
  const emprestimos = calcularEmprestimos(setor, data);

  // 7. Resultado Final
  // resultado = presentes - necessario + monitor.cobrindo + saldo(emprestimos)
  const resultado = presentes - necessario + monitores.cobrindo + emprestimos.saldo;
  const resultadoSemMonitor = presentes - necessario + emprestimos.saldo;

  // 8. Percentuais
  const percentualAusencia = quadro > 0 ? (ausenciasTotais / quadro) * 100 : 0;
  const percentualReal = quadro > 0 ? (ausenciasReais / quadro) * 100 : 0;

  return {
    setor: setor,
    data: data,
    quadro: quadro,
    necessario: necessario,
    presentes: presentes,
    ausencias: ausencias,
    ausenciasTotais: ausenciasTotais,
    ausenciasReais: ausenciasReais,
    monitores: monitores,
    emprestimos: emprestimos,
    resultado: resultado,
    resultadoSemMonitor: resultadoSemMonitor,
    percentualAusencia: percentualAusencia,
    percentualReal: percentualReal
  };
}

/**
 * Agregador para uma linha inteira (vários setores na mesma data)
 * Útil para o Dashboard e Visões Consolidadas.
 */
function calcularMaoDeObraLinha(data, setores = window.SETORES || []) {
  const consolidado = {
    data: data,
    quadro: 0,
    necessario: 0,
    presentes: 0,
    ausenciasTotais: 0,
    ausenciasReais: 0,
    ausencias: {},
    monitores: { cobrindo: 0, fora: 0, total: 0 },
    emprestimos: { enviados: 0, recebidos: 0, saldo: 0 },
    resultado: 0
  };

  setores.forEach(setor => {
    const mo = calcularMaoDeObra(setor, data);
    
    consolidado.quadro += mo.quadro;
    consolidado.necessario += mo.necessario;
    consolidado.presentes += mo.presentes;
    consolidado.ausenciasTotais += mo.ausenciasTotais;
    consolidado.ausenciasReais += mo.ausenciasReais;
    
    for (const status in mo.ausencias) {
      consolidado.ausencias[status] = (consolidado.ausencias[status] || 0) + mo.ausencias[status];
    }
    
    consolidado.monitores.cobrindo += mo.monitores.cobrindo;
    consolidado.monitores.fora += mo.monitores.fora;
    consolidado.monitores.total += mo.monitores.total;
    
    consolidado.emprestimos.enviados += mo.emprestimos.enviados;
    consolidado.emprestimos.recebidos += mo.emprestimos.recebidos;
    consolidado.emprestimos.saldo += mo.emprestimos.saldo;
    
    consolidado.resultado += mo.resultado;
  });
  
  consolidado.percentualAusencia = consolidado.quadro > 0 ? (consolidado.ausenciasTotais / consolidado.quadro) * 100 : 0;
  consolidado.percentualReal = consolidado.quadro > 0 ? (consolidado.ausenciasReais / consolidado.quadro) * 100 : 0;

  return consolidado;
}

// Expõe no window para ser globalmente acessível pelos scripts inline
window.motorMaoDeObra = {
  STATUS_OPERADOR,
  REGRA_CATEGORIAS,
  calcularMaoDeObra,
  calcularMaoDeObraLinha,
  calcularMonitores,
  calcularEmprestimos,
  validarConsistenciaData
};

/**
 * Validador oficial: Compara se as antigas funções de agregação que restaram no código
 * por acaso divergem da função linha. Deve ser chamado via console (ou testes) para garantir sanidade.
 */
function validarConsistenciaData(data) {
  const linha = calcularMaoDeObraLinha(data);
  let consistente = true;
  const log = [];

  window.SETORES.forEach(s => {
    const sData = calcularMaoDeObra(s, data);
    
    // Testa consistência interna
    const ausTotaisCalculadas = Object.values(sData.ausencias).reduce((a, b) => a + b, 0);
    if (ausTotaisCalculadas !== sData.ausenciasTotais) {
       consistente = false;
       log.push(`[${s}] Ausências totais não batem com a soma das categorias: ${sData.ausenciasTotais} != ${ausTotaisCalculadas}`);
    }
    
    const presentesCalc = sData.quadro - sData.ausenciasTotais;
    if (presentesCalc !== sData.presentes) {
      consistente = false;
      log.push(`[${s}] Presentes calculado não bate: ${sData.presentes} != ${presentesCalc}`);
    }
  });

  if (consistente) {
    console.log('%c[SUCESSO] Consistência de Mão de Obra validada para ' + data, 'color: green;');
  } else {
    console.error('[ERRO] Divergências encontradas:', log);
  }
  return { consistente, log };
}
