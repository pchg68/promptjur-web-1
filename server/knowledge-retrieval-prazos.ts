/**
 * Sistema de Cálculo de Prazos Processuais
 * Baseado no CPC/2015 (Art. 219 - contagem em dias úteis)
 * 
 * Integra com API de Feriados para cálculo preciso
 */

import {
  calcularDataFinalDiasUteis,
  calcularDataFinalDiasCorridos,
  ehDiaUtil,
  ehRecessoJudiciario,
  listarFeriadosEntreDatas,
  type EstadoBR,
} from "./knowledge-retrieval-feriados";

/**
 * Tipos de contagem de prazo
 */
export type TipoContagem = "uteis" | "corridos";

/**
 * Base de dados de prazos processuais comuns
 */
export interface PrazoProcessual {
  nome: string;
  dias: number;
  tipo: TipoContagem;
  artigo: string; // Artigo de lei correspondente
  observacoes?: string;
}

/**
 * Prazos processuais mais comuns (CPC/2015)
 */
export const PRAZOS_CPC: Record<string, PrazoProcessual> = {
  contestacao: {
    nome: "Contestação",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 335 do CPC",
    observacoes: "Prazo para o réu apresentar contestação",
  },
  apelacao: {
    nome: "Apelação",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 1.003 do CPC",
    observacoes: "Prazo para interpor recurso de apelação",
  },
  agravo_instrumento: {
    nome: "Agravo de Instrumento",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 1.003, §5º do CPC",
    observacoes: "Prazo para interpor agravo de instrumento",
  },
  embargos_declaracao: {
    nome: "Embargos de Declaração",
    dias: 5,
    tipo: "uteis",
    artigo: "Art. 1.023 do CPC",
    observacoes: "Prazo para opor embargos de declaração",
  },
  recurso_especial: {
    nome: "Recurso Especial",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 1.003 do CPC",
    observacoes: "Prazo para interpor recurso especial ao STJ",
  },
  recurso_extraordinario: {
    nome: "Recurso Extraordinário",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 1.003 do CPC",
    observacoes: "Prazo para interpor recurso extraordinário ao STF",
  },
  manifestacao_prova: {
    nome: "Manifestação sobre Provas",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 437 do CPC",
    observacoes: "Prazo para se manifestar sobre provas produzidas",
  },
  impugnacao_cumprimento: {
    nome: "Impugnação ao Cumprimento de Sentença",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 525 do CPC",
    observacoes: "Prazo para impugnar cumprimento de sentença",
  },
  embargos_execucao: {
    nome: "Embargos à Execução",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 915 do CPC",
    observacoes: "Prazo para opor embargos à execução",
  },
  resposta_reconvencao: {
    nome: "Resposta à Reconvenção",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 343, §5º do CPC",
    observacoes: "Prazo para responder à reconvenção",
  },
};

/**
 * Prazos processuais trabalhistas (CLT)
 */
export const PRAZOS_CLT: Record<string, PrazoProcessual> = {
  recurso_ordinario: {
    nome: "Recurso Ordinário",
    dias: 8,
    tipo: "uteis",
    artigo: "Art. 895 da CLT",
    observacoes: "Prazo para interpor recurso ordinário",
  },
  recurso_revista: {
    nome: "Recurso de Revista",
    dias: 8,
    tipo: "uteis",
    artigo: "Art. 896 da CLT",
    observacoes: "Prazo para interpor recurso de revista ao TST",
  },
  embargos_declaracao_trab: {
    nome: "Embargos de Declaração (Trabalhista)",
    dias: 5,
    tipo: "uteis",
    artigo: "Art. 897-A da CLT",
    observacoes: "Prazo para opor embargos de declaração",
  },
  defesa_reclamada: {
    nome: "Defesa da Reclamada",
    dias: 15,
    tipo: "uteis",
    artigo: "Art. 847 da CLT",
    observacoes: "Prazo para apresentar defesa na reclamação trabalhista",
  },
};

/**
 * Resultado do cálculo de prazo
 */
export interface ResultadoCalculoPrazo {
  dataInicial: Date;
  dataFinal: Date;
  diasCorridos: number;
  diasUteis: number;
  prazo: PrazoProcessual;
  feriadosNoIntervalo: Array<{
    data: string;
    nome: string;
  }>;
  alertas: string[];
}

/**
 * Calcular prazo processual
 */
export async function calcularPrazoProcessual(
  dataIntimacao: Date,
  chavePrazo: string,
  estado?: EstadoBR
): Promise<ResultadoCalculoPrazo> {
  // Buscar prazo na base de dados
  const prazo = PRAZOS_CPC[chavePrazo] || PRAZOS_CLT[chavePrazo];

  if (!prazo) {
    throw new Error(`Prazo "${chavePrazo}" não encontrado na base de dados`);
  }

  // Data inicial: primeiro dia útil após a intimação (Art. 224 CPC)
  let dataInicial = new Date(dataIntimacao);
  dataInicial.setDate(dataInicial.getDate() + 1); // Dia seguinte

  // Garantir que é dia útil
  while (!(await ehDiaUtil(dataInicial, estado))) {
    dataInicial.setDate(dataInicial.getDate() + 1);
  }

  // Calcular data final
  let dataFinal: Date;
  if (prazo.tipo === "uteis") {
    dataFinal = await calcularDataFinalDiasUteis(dataInicial, prazo.dias, estado);
  } else {
    dataFinal = calcularDataFinalDiasCorridos(dataInicial, prazo.dias);
  }

  // Calcular dias corridos e úteis
  const diasCorridos = Math.ceil(
    (dataFinal.getTime() - dataInicial.getTime()) / (1000 * 60 * 60 * 24)
  );

  let diasUteis = 0;
  let dataTemp = new Date(dataInicial);
  while (dataTemp <= dataFinal) {
    if (await ehDiaUtil(dataTemp, estado)) {
      diasUteis++;
    }
    dataTemp.setDate(dataTemp.getDate() + 1);
  }

  // Listar feriados no intervalo
  const feriadosLista = await listarFeriadosEntreDatas(dataInicial, dataFinal, estado);
  const feriadosNoIntervalo = feriadosLista.map((f) => ({
    data: f.date,
    nome: f.name,
  }));

  // Gerar alertas
  const alertas: string[] = [];

  // Alerta de recesso judiciário
  if (ehRecessoJudiciario(dataFinal)) {
    alertas.push(
      "⚠️ A data final cai durante o recesso judiciário (20/12 a 06/01). Prazos podem ser suspensos."
    );
  }

  // Alerta de prazo curto
  const diasAteVencimento = Math.ceil(
    (dataFinal.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diasAteVencimento <= 3 && diasAteVencimento >= 0) {
    alertas.push(`⏰ URGENTE: Prazo vence em ${diasAteVencimento} dia(s)!`);
  }

  // Alerta de feriados
  if (feriadosNoIntervalo.length > 0) {
    alertas.push(
      `📅 Atenção: ${feriadosNoIntervalo.length} feriado(s) no intervalo do prazo.`
    );
  }

  return {
    dataInicial,
    dataFinal,
    diasCorridos,
    diasUteis,
    prazo,
    feriadosNoIntervalo,
    alertas,
  };
}

/**
 * Calcular prazo personalizado
 */
export async function calcularPrazoPersonalizado(
  dataIntimacao: Date,
  dias: number,
  tipo: TipoContagem,
  estado?: EstadoBR
): Promise<Omit<ResultadoCalculoPrazo, "prazo">> {
  // Data inicial: primeiro dia útil após a intimação
  let dataInicial = new Date(dataIntimacao);
  dataInicial.setDate(dataInicial.getDate() + 1);

  while (!(await ehDiaUtil(dataInicial, estado))) {
    dataInicial.setDate(dataInicial.getDate() + 1);
  }

  // Calcular data final
  let dataFinal: Date;
  if (tipo === "uteis") {
    dataFinal = await calcularDataFinalDiasUteis(dataInicial, dias, estado);
  } else {
    dataFinal = calcularDataFinalDiasCorridos(dataInicial, dias);
  }

  // Calcular dias corridos e úteis
  const diasCorridos = Math.ceil(
    (dataFinal.getTime() - dataInicial.getTime()) / (1000 * 60 * 60 * 24)
  );

  let diasUteis = 0;
  let dataTemp = new Date(dataInicial);
  while (dataTemp <= dataFinal) {
    if (await ehDiaUtil(dataTemp, estado)) {
      diasUteis++;
    }
    dataTemp.setDate(dataTemp.getDate() + 1);
  }

  // Listar feriados
  const feriadosLista = await listarFeriadosEntreDatas(dataInicial, dataFinal, estado);
  const feriadosNoIntervalo = feriadosLista.map((f) => ({
    data: f.date,
    nome: f.name,
  }));

  // Alertas
  const alertas: string[] = [];
  if (ehRecessoJudiciario(dataFinal)) {
    alertas.push("⚠️ Data final durante recesso judiciário.");
  }

  const diasAteVencimento = Math.ceil(
    (dataFinal.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diasAteVencimento <= 3 && diasAteVencimento >= 0) {
    alertas.push(`⏰ URGENTE: Prazo vence em ${diasAteVencimento} dia(s)!`);
  }

  if (feriadosNoIntervalo.length > 0) {
    alertas.push(`📅 ${feriadosNoIntervalo.length} feriado(s) no intervalo.`);
  }

  return {
    dataInicial,
    dataFinal,
    diasCorridos,
    diasUteis,
    feriadosNoIntervalo,
    alertas,
  };
}

/**
 * Listar todos os prazos disponíveis
 */
export function listarPrazosDisponiveis(): Array<PrazoProcessual & { chave: string }> {
  const prazos: Array<PrazoProcessual & { chave: string }> = [];

  Object.entries(PRAZOS_CPC).forEach(([chave, prazo]) => {
    prazos.push({ ...prazo, chave });
  });

  Object.entries(PRAZOS_CLT).forEach(([chave, prazo]) => {
    prazos.push({ ...prazo, chave });
  });

  return prazos;
}

/**
 * Formatar resultado de cálculo para texto
 */
export function formatarResultadoPrazo(resultado: ResultadoCalculoPrazo): string {
  const dataInicialStr = resultado.dataInicial.toLocaleDateString("pt-BR");
  const dataFinalStr = resultado.dataFinal.toLocaleDateString("pt-BR");

  let texto = `
**${resultado.prazo.nome}**
${resultado.prazo.artigo}

**Data de Intimação:** ${dataInicialStr}
**Data Final do Prazo:** ${dataFinalStr}
**Dias Corridos:** ${resultado.diasCorridos}
**Dias Úteis:** ${resultado.diasUteis}
**Tipo de Contagem:** ${resultado.prazo.tipo === "uteis" ? "Dias Úteis" : "Dias Corridos"}
  `.trim();

  if (resultado.feriadosNoIntervalo.length > 0) {
    texto += "\n\n**Feriados no Intervalo:**\n";
    resultado.feriadosNoIntervalo.forEach((feriado) => {
      const dataFeriado = new Date(feriado.data + "T00:00:00");
      texto += `- ${dataFeriado.toLocaleDateString("pt-BR")}: ${feriado.nome}\n`;
    });
  }

  if (resultado.alertas.length > 0) {
    texto += "\n\n**Alertas:**\n";
    resultado.alertas.forEach((alerta) => {
      texto += `${alerta}\n`;
    });
  }

  if (resultado.prazo.observacoes) {
    texto += `\n\n**Observações:** ${resultado.prazo.observacoes}`;
  }

  return texto;
}
