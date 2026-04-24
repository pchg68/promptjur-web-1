/**
 * Detecção de Alucinações Jurídicas — Tipos e padrões
 * 
 * Verifica se artigos, súmulas, leis e jurisprudência citados
 * no texto gerado pela IA realmente existem e são válidos.
 */

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type NivelRisco = "critico" | "alto" | "medio" | "baixo" | "ok";

export interface CitacaoDetectada {
  /** Texto original encontrado no prompt */
  textoOriginal: string;
  /** Tipo da citação */
  tipo: "artigo" | "sumula" | "lei" | "jurisprudencia" | "decreto" | "portaria";
  /** Número ou identificador extraído */
  identificador: string;
  /** Código ou tribunal de referência */
  referencia?: string;
  /** Status da verificação */
  status: "verificado" | "suspeito" | "nao_encontrado" | "formato_invalido";
  /** Nível de risco de alucinação */
  risco: NivelRisco;
  /** Explicação do resultado */
  explicacao: string;
  /** Sugestão de correção, se aplicável */
  sugestaoCorrecao?: string;
  /** Link para verificação manual */
  linkVerificacao?: string;
}

export interface ResultadoDeteccao {
  citacoes: CitacaoDetectada[];
  /** Resumo geral */
  resumo: {
    total: number;
    verificadas: number;
    suspeitas: number;
    naoEncontradas: number;
    formatoInvalido: number;
  };
  /** Nível geral de risco */
  riscoGeral: NivelRisco;
  /** Mensagem de alerta para o usuário */
  mensagemAlerta: string;
  /** Tempo de processamento em ms */
  tempoMs: number;
}

// ─── Padrões de Extração ─────────────────────────────────────────────────────

/**
 * Padrões regex para extrair citações jurídicas de textos.
 * Cada padrão captura o tipo, número e referência.
 */
export const PADROES_CITACAO = {
  // Artigos de códigos: "Art. 186 do CC", "artigo 927 do Código Civil", "art. 5º, LVII, da CF"
  artigos: /(?:art(?:igo)?\.?\s*)(\d+)(?:[º°]?)(?:\s*,\s*(?:§\s*\d+[º°]?,?\s*)?(?:inciso\s+)?[IVXLCDM]+(?:\s*,\s*[IVXLCDM]+)*)?(?:\s*,?\s*(?:do|da|dos|das)\s+)((?:C(?:ódigo\s+)?(?:C(?:ivil)?|P(?:enal)?|P(?:rocesso\s+)?C(?:ivil)?|P(?:rocesso\s+)?P(?:enal)?|D(?:efesa\s+do\s+)?C(?:onsumidor)?|T(?:ributário\s+)?N(?:acional)?)|CLT|ECA|CF|Constituição\s+Federal|Lei\s+[\d\.\/]+))/gi,

  // Súmulas: "Súmula 331 do TST", "Súmula Vinculante 11", "Súmula nº 479 do STJ"
  sumulas: /[Ss]úmula\s+(?:Vinculante\s+)?(?:n[º°]?\s*)?(\d+)\s*(?:do|da)?\s*(STF|STJ|TST|TSE|STM|TRT|TRF)/gi,

  // Leis: "Lei 8.078/90", "Lei nº 13.105/2015", "Lei Complementar 123/2006"
  leis: /Lei\s+(?:Complementar\s+)?(?:n[º°]?\s*)?([\d\.]+\/\d{2,4})/gi,

  // Decretos: "Decreto 3.000/99", "Decreto-Lei 2.848/1940"
  decretos: /Decreto(?:-Lei)?\s+(?:n[º°]?\s*)?([\d\.]+\/\d{2,4})/gi,

  // Jurisprudência: "RE 641.320/RS", "HC 126.292/SP", "ADI 4.277/DF", "REsp 1.234.567/SP"
  jurisprudencia: /(RE|HC|ADI|ADC|ADPF|MS|MI|RHC|AgRg|REsp|RMS|CC|Rcl|AI|ARE|RCL|AO|ACO|IF|Pet|SS|SL|STA|TP|EREsp|EDcl)\s*([\d\.]+)(?:\/([\w]{2}))?/gi,
};

// ─── Base de Verificação ─────────────────────────────────────────────────────

/** Limites conhecidos de artigos por código */
export const LIMITES_ARTIGOS: Record<string, { max: number; nome: string; url: string }> = {
  "CC": { max: 2046, nome: "Código Civil", url: "http://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
  "Código Civil": { max: 2046, nome: "Código Civil", url: "http://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
  "CPC": { max: 1072, nome: "Código de Processo Civil", url: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
  "Código de Processo Civil": { max: 1072, nome: "Código de Processo Civil", url: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
  "CP": { max: 361, nome: "Código Penal", url: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm" },
  "Código Penal": { max: 361, nome: "Código Penal", url: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm" },
  "CPP": { max: 811, nome: "Código de Processo Penal", url: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm" },
  "CLT": { max: 922, nome: "Consolidação das Leis do Trabalho", url: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm" },
  "CDC": { max: 119, nome: "Código de Defesa do Consumidor", url: "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
  "Código de Defesa do Consumidor": { max: 119, nome: "Código de Defesa do Consumidor", url: "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
  "CTN": { max: 218, nome: "Código Tributário Nacional", url: "http://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm" },
  "Código Tributário Nacional": { max: 218, nome: "Código Tributário Nacional", url: "http://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm" },
  "CF": { max: 250, nome: "Constituição Federal", url: "http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm" },
  "Constituição Federal": { max: 250, nome: "Constituição Federal", url: "http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm" },
  "ECA": { max: 267, nome: "Estatuto da Criança e do Adolescente", url: "http://www.planalto.gov.br/ccivil_03/leis/l8069.htm" },
};

/** Limites de súmulas por tribunal */
export const LIMITES_SUMULAS: Record<string, { max: number; maxVinculante?: number }> = {
  "STF": { max: 736, maxVinculante: 58 },
  "STJ": { max: 660 },
  "TST": { max: 463 },
  "TSE": { max: 73 },
  "STM": { max: 25 },
};

/** Leis conhecidas e verificadas */
export const LEIS_CONHECIDAS: Record<string, { nome: string; url: string }> = {
  "8.078/90": { nome: "Código de Defesa do Consumidor", url: "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
  "8.078/1990": { nome: "Código de Defesa do Consumidor", url: "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
  "10.406/2002": { nome: "Código Civil", url: "http://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
  "13.105/2015": { nome: "Código de Processo Civil", url: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
  "13.709/2018": { nome: "LGPD", url: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" },
  "11.101/2005": { nome: "Lei de Falências", url: "http://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm" },
  "8.069/90": { nome: "ECA", url: "http://www.planalto.gov.br/ccivil_03/leis/l8069.htm" },
  "8.069/1990": { nome: "ECA", url: "http://www.planalto.gov.br/ccivil_03/leis/l8069.htm" },
  "9.099/95": { nome: "Lei dos Juizados Especiais", url: "http://www.planalto.gov.br/ccivil_03/leis/l9099.htm" },
  "9.099/1995": { nome: "Lei dos Juizados Especiais", url: "http://www.planalto.gov.br/ccivil_03/leis/l9099.htm" },
  "12.846/2013": { nome: "Lei Anticorrupção", url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12846.htm" },
  "6.404/76": { nome: "Lei das S.A.", url: "http://www.planalto.gov.br/ccivil_03/leis/l6404compilada.htm" },
  "6.404/1976": { nome: "Lei das S.A.", url: "http://www.planalto.gov.br/ccivil_03/leis/l6404compilada.htm" },
  "8.666/93": { nome: "Lei de Licitações (antiga)", url: "http://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm" },
  "8.666/1993": { nome: "Lei de Licitações (antiga)", url: "http://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm" },
  "14.133/2021": { nome: "Nova Lei de Licitações", url: "http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm" },
  "9.784/99": { nome: "Lei do Processo Administrativo Federal", url: "http://www.planalto.gov.br/ccivil_03/leis/l9784.htm" },
  "9.784/1999": { nome: "Lei do Processo Administrativo Federal", url: "http://www.planalto.gov.br/ccivil_03/leis/l9784.htm" },
};

// ─── Funções de Verificação Local ────────────────────────────────────────────

/**
 * Normaliza a referência de código para busca nos limites.
 */
function normalizarReferencia(ref: string): string {
  const mapa: Record<string, string> = {
    "Código Civil": "CC", "Código de Processo Civil": "CPC",
    "Código Penal": "CP", "Código de Processo Penal": "CPP",
    "Código de Defesa do Consumidor": "CDC", "Código Tributário Nacional": "CTN",
    "Constituição Federal": "CF",
  };
  // Remove "do/da" e normaliza
  const limpo = ref.replace(/^(?:do|da|dos|das)\s+/i, "").trim();
  return mapa[limpo] || limpo.toUpperCase().replace(/\s+/g, "");
}

/**
 * Verifica um artigo de código localmente.
 */
export function verificarArtigo(numero: number, referencia: string): Pick<CitacaoDetectada, "status" | "risco" | "explicacao" | "sugestaoCorrecao" | "linkVerificacao"> {
  const refNorm = normalizarReferencia(referencia);
  const info = LIMITES_ARTIGOS[refNorm] || LIMITES_ARTIGOS[referencia];

  if (!info) {
    return {
      status: "suspeito",
      risco: "medio",
      explicacao: `Código "${referencia}" não está na base de verificação. Verifique manualmente.`,
      linkVerificacao: "http://www.planalto.gov.br/ccivil_03/",
    };
  }

  if (numero > info.max) {
    return {
      status: "nao_encontrado",
      risco: "critico",
      explicacao: `Art. ${numero} excede o total de artigos do ${info.nome} (máx: ${info.max}). Possível alucinação da IA.`,
      sugestaoCorrecao: `Verifique se o artigo correto é outro número (1 a ${info.max}).`,
      linkVerificacao: info.url,
    };
  }

  if (numero <= 0) {
    return {
      status: "formato_invalido",
      risco: "alto",
      explicacao: `Número de artigo inválido: ${numero}.`,
      sugestaoCorrecao: "Corrija o número do artigo.",
    };
  }

  return {
    status: "verificado",
    risco: "ok",
    explicacao: `Art. ${numero} está dentro do intervalo válido do ${info.nome} (1 a ${info.max}).`,
    linkVerificacao: info.url,
  };
}

/**
 * Verifica uma súmula localmente.
 */
export function verificarSumula(numero: number, tribunal: string, vinculante: boolean = false): Pick<CitacaoDetectada, "status" | "risco" | "explicacao" | "sugestaoCorrecao" | "linkVerificacao"> {
  const info = LIMITES_SUMULAS[tribunal];

  if (!info) {
    return {
      status: "suspeito",
      risco: "medio",
      explicacao: `Tribunal "${tribunal}" não está na base de verificação de súmulas.`,
    };
  }

  const max = vinculante && info.maxVinculante ? info.maxVinculante : info.max;
  const tipoSumula = vinculante ? "Súmula Vinculante" : "Súmula";

  if (numero > max) {
    return {
      status: "nao_encontrado",
      risco: "critico",
      explicacao: `${tipoSumula} ${numero} do ${tribunal} excede o total conhecido (máx: ${max}). Possível alucinação.`,
      sugestaoCorrecao: `Verifique se a súmula correta é outro número (1 a ${max}).`,
      linkVerificacao: tribunal === "STF"
        ? "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp"
        : tribunal === "STJ"
          ? "https://scon.stj.jus.br/SCON/sumulas/"
          : undefined,
    };
  }

  if (numero <= 0) {
    return {
      status: "formato_invalido",
      risco: "alto",
      explicacao: `Número de súmula inválido: ${numero}.`,
    };
  }

  return {
    status: "verificado",
    risco: "ok",
    explicacao: `${tipoSumula} ${numero} do ${tribunal} está dentro do intervalo válido (1 a ${max}).`,
    linkVerificacao: tribunal === "STF"
      ? `https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=${1200 + numero}`
      : tribunal === "STJ"
        ? `https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=${numero}&b=SUMU`
        : undefined,
  };
}

/**
 * Verifica uma lei localmente.
 */
export function verificarLei(numeroLei: string): Pick<CitacaoDetectada, "status" | "risco" | "explicacao" | "sugestaoCorrecao" | "linkVerificacao"> {
  const info = LEIS_CONHECIDAS[numeroLei];

  if (info) {
    return {
      status: "verificado",
      risco: "ok",
      explicacao: `Lei ${numeroLei} — ${info.nome}. Verificada.`,
      linkVerificacao: info.url,
    };
  }

  // Formato válido mas não na base
  if (/^[\d\.]{1,10}\/\d{2,4}$/.test(numeroLei)) {
    return {
      status: "suspeito",
      risco: "medio",
      explicacao: `Lei ${numeroLei} tem formato válido mas não está na base de verificação. Confirme no Planalto.`,
      linkVerificacao: "http://www.planalto.gov.br/ccivil_03/leis/",
    };
  }

  return {
    status: "formato_invalido",
    risco: "alto",
    explicacao: `Lei "${numeroLei}" tem formato inválido.`,
    sugestaoCorrecao: "O formato correto é: número/ano (ex: 8.078/90).",
  };
}

/**
 * Calcula o nível de risco geral baseado nas citações detectadas.
 */
export function calcularRiscoGeral(citacoes: CitacaoDetectada[]): NivelRisco {
  if (citacoes.length === 0) return "ok";

  const criticas = citacoes.filter(c => c.risco === "critico").length;
  const altas = citacoes.filter(c => c.risco === "alto").length;
  const medias = citacoes.filter(c => c.risco === "medio").length;

  if (criticas > 0) return "critico";
  if (altas > 0) return "alto";
  if (medias > citacoes.length * 0.5) return "medio";
  if (medias > 0) return "baixo";
  return "ok";
}

/**
 * Gera mensagem de alerta baseada no nível de risco.
 */
export function gerarMensagemAlerta(risco: NivelRisco, resumo: ResultadoDeteccao["resumo"]): string {
  switch (risco) {
    case "critico":
      return `ATENÇÃO CRÍTICA: ${resumo.naoEncontradas} citação(ões) provavelmente inexistente(s) detectada(s). O texto pode conter alucinações graves da IA. Revise TODAS as referências antes de usar.`;
    case "alto":
      return `ALERTA: ${resumo.formatoInvalido + resumo.naoEncontradas} citação(ões) com problemas detectada(s). Verifique as referências marcadas em vermelho.`;
    case "medio":
      return `ATENÇÃO: ${resumo.suspeitas} citação(ões) não puderam ser verificadas automaticamente. Recomenda-se conferência manual.`;
    case "baixo":
      return `Algumas citações requerem verificação manual, mas nenhum problema grave foi detectado.`;
    case "ok":
      return `Todas as ${resumo.verificadas} citações verificadas estão dentro dos parâmetros esperados.`;
  }
}
