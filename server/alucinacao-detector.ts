/**
 * Detector de Alucinações Jurídicas — Motor de Verificação
 * 
 * Extrai citações jurídicas do texto gerado e verifica cada uma
 * contra a base de conhecimento local e padrões conhecidos.
 */

import { logger } from "./_core/logger";
import {
  type CitacaoDetectada,
  type ResultadoDeteccao,
  PADROES_CITACAO,
  verificarArtigo,
  verificarSumula,
  verificarLei,
  calcularRiscoGeral,
  gerarMensagemAlerta,
} from "@shared/alucinacao-detector";

// ─── Extração de Citações ────────────────────────────────────────────────────

function extrairArtigos(texto: string): CitacaoDetectada[] {
  const citacoes: CitacaoDetectada[] = [];
  const regex = new RegExp(PADROES_CITACAO.artigos.source, PADROES_CITACAO.artigos.flags);
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const numero = parseInt(match[1], 10);
    const referencia = match[2].trim();
    const resultado = verificarArtigo(numero, referencia);

    citacoes.push({
      textoOriginal: match[0],
      tipo: "artigo",
      identificador: match[1],
      referencia,
      ...resultado,
    });
  }

  return citacoes;
}

function extrairSumulas(texto: string): CitacaoDetectada[] {
  const citacoes: CitacaoDetectada[] = [];
  const regex = new RegExp(PADROES_CITACAO.sumulas.source, PADROES_CITACAO.sumulas.flags);
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const numero = parseInt(match[1], 10);
    const tribunal = match[2].toUpperCase();
    const vinculante = /vinculante/i.test(match[0]);
    const resultado = verificarSumula(numero, tribunal, vinculante);

    citacoes.push({
      textoOriginal: match[0],
      tipo: "sumula",
      identificador: match[1],
      referencia: tribunal,
      ...resultado,
    });
  }

  return citacoes;
}

function extrairLeis(texto: string): CitacaoDetectada[] {
  const citacoes: CitacaoDetectada[] = [];
  const regex = new RegExp(PADROES_CITACAO.leis.source, PADROES_CITACAO.leis.flags);
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const numeroLei = match[1];
    const resultado = verificarLei(numeroLei);

    citacoes.push({
      textoOriginal: match[0],
      tipo: "lei",
      identificador: numeroLei,
      ...resultado,
    });
  }

  return citacoes;
}

function extrairDecretos(texto: string): CitacaoDetectada[] {
  const citacoes: CitacaoDetectada[] = [];
  const regex = new RegExp(PADROES_CITACAO.decretos.source, PADROES_CITACAO.decretos.flags);
  let match;

  while ((match = regex.exec(texto)) !== null) {
    citacoes.push({
      textoOriginal: match[0],
      tipo: "decreto",
      identificador: match[1],
      status: "suspeito",
      risco: "medio",
      explicacao: `Decreto ${match[1]} detectado. Verifique no Planalto.`,
      linkVerificacao: "http://www.planalto.gov.br/ccivil_03/decreto/",
    });
  }

  return citacoes;
}

function extrairJurisprudencia(texto: string): CitacaoDetectada[] {
  const citacoes: CitacaoDetectada[] = [];
  const regex = new RegExp(PADROES_CITACAO.jurisprudencia.source, PADROES_CITACAO.jurisprudencia.flags);
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const tipo = match[1].toUpperCase();
    const numero = match[2];
    const uf = match[3] || "";

    // Verificação básica de formato
    const numLimpo = numero.replace(/\./g, "");
    const numInt = parseInt(numLimpo, 10);

    let status: CitacaoDetectada["status"] = "suspeito";
    let risco: CitacaoDetectada["risco"] = "medio";
    let explicacao = `${tipo} ${numero}${uf ? "/" + uf : ""} detectado. Recomenda-se verificação manual.`;
    let linkVerificacao: string | undefined;

    // Verificações básicas de plausibilidade
    if (numInt > 9999999) {
      status = "nao_encontrado";
      risco = "alto";
      explicacao = `Número ${numero} parece excessivamente alto para ${tipo}. Possível alucinação.`;
    } else if (numInt <= 0) {
      status = "formato_invalido";
      risco = "alto";
      explicacao = `Número inválido para ${tipo}.`;
    }

    // Links de verificação por tipo
    if (["RE", "HC", "ADI", "ADC", "ADPF", "MS", "MI", "ARE"].includes(tipo)) {
      linkVerificacao = `https://portal.stf.jus.br/processos/detalhe.asp?incidente=${numLimpo}`;
    } else if (["REsp", "RMS", "CC", "Rcl", "AgRg", "EREsp", "EDcl"].includes(tipo)) {
      linkVerificacao = `https://processo.stj.jus.br/processo/pesquisa/?tipoPesquisa=tipoPesquisaNumeroRegistro&termo=${numLimpo}`;
    }

    citacoes.push({
      textoOriginal: match[0],
      tipo: "jurisprudencia",
      identificador: `${tipo} ${numero}${uf ? "/" + uf : ""}`,
      referencia: tipo,
      status,
      risco,
      explicacao,
      linkVerificacao,
    });
  }

  return citacoes;
}

// ─── Motor Principal ─────────────────────────────────────────────────────────

/**
 * Detecta e verifica todas as citações jurídicas em um texto.
 */
export async function detectarAlucinacoes(texto: string): Promise<ResultadoDeteccao> {
  const startTime = Date.now();

  logger.info("[AlucinacaoDetector] Iniciando detecção", { textLength: texto.length });

  // Extrair todas as citações
  const todasCitacoes: CitacaoDetectada[] = [
    ...extrairArtigos(texto),
    ...extrairSumulas(texto),
    ...extrairLeis(texto),
    ...extrairDecretos(texto),
    ...extrairJurisprudencia(texto),
  ];

  // Deduplicar por textoOriginal
  const citacoesUnicas = todasCitacoes.filter(
    (c, idx, arr) => arr.findIndex(x => x.textoOriginal === c.textoOriginal) === idx,
  );

  // Calcular resumo
  const resumo = {
    total: citacoesUnicas.length,
    verificadas: citacoesUnicas.filter(c => c.status === "verificado").length,
    suspeitas: citacoesUnicas.filter(c => c.status === "suspeito").length,
    naoEncontradas: citacoesUnicas.filter(c => c.status === "nao_encontrado").length,
    formatoInvalido: citacoesUnicas.filter(c => c.status === "formato_invalido").length,
  };

  const riscoGeral = calcularRiscoGeral(citacoesUnicas);
  const mensagemAlerta = gerarMensagemAlerta(riscoGeral, resumo);
  const tempoMs = Date.now() - startTime;

  logger.info("[AlucinacaoDetector] Detecção concluída", { resumo, riscoGeral, tempoMs });

  return {
    citacoes: citacoesUnicas,
    resumo,
    riscoGeral,
    mensagemAlerta,
    tempoMs,
  };
}
