import { CalculoMaoDeObra, CalculoLinha } from './tipos';

export interface ValidacaoResultado {
  consistente: boolean;
  log: string[];
}

export function validarConsistenciaSetor(calculo: CalculoMaoDeObra): ValidacaoResultado {
  let consistente = true;
  const log: string[] = [];

  const ausTotaisCalculadas = Object.values(calculo.ausencias).reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
  if (ausTotaisCalculadas !== calculo.ausenciasTotais) {
    consistente = false;
    log.push(`[${calculo.setor}] Ausências totais não batem: ${calculo.ausenciasTotais} != ${ausTotaisCalculadas}`);
  }

  const presentesCalc = calculo.quadro - calculo.ausenciasTotais;
  if (presentesCalc !== calculo.presentes) {
    consistente = false;
    log.push(`[${calculo.setor}] Presentes não batem: ${calculo.presentes} != ${presentesCalc}`);
  }

  if (calculo.ausenciasTotais > calculo.quadro) {
    consistente = false;
    log.push(`[${calculo.setor}] Ausências excedem o quadro: ${calculo.ausenciasTotais} > ${calculo.quadro}`);
  }

  if (calculo.presentes < 0) {
    consistente = false;
    log.push(`[${calculo.setor}] Presentes negativos: ${calculo.presentes}`);
  }

  if (calculo.necessario < 0) {
    consistente = false;
    log.push(`[${calculo.setor}] Necessário negativo: ${calculo.necessario}`);
  }

  return { consistente, log };
}

export function validarConsistenciaLinha(calculoLinha: CalculoLinha): ValidacaoResultado {
  let consistente = true;
  const log: string[] = [];

  const validacoesSetores = calculoLinha.setores.map(validarConsistenciaSetor);
  
  for (const val of validacoesSetores) {
    if (!val.consistente) {
      consistente = false;
      log.push(...val.log);
    }
  }

  return { consistente, log };
}
