/**
 * Sistema de validação de legislação citada em prompts
 * 
 * Extrai artigos, leis e códigos mencionados e valida sua existência
 * Retorna badges de confiabilidade (verde/amarelo/vermelho)
 * 
 * Usa cache de banco de dados para otimizar performance
 */

import { getCachedValidation, setCachedValidation } from "../db-legislacao-cache";

export interface CitacaoLegal {
  texto: string; // Texto original da citação
  tipo: "artigo" | "lei" | "codigo" | "decreto" | "portaria";
  numero?: string; // Número do artigo, lei, etc.
  codigo?: string; // CC, CPC, CLT, CF, etc.
  confiabilidade: "alta" | "media" | "baixa";
  motivo: string; // Explicação da confiabilidade
  mensagem: string; // Mensagem para exibição na UI (igual a motivo)
  linkOficial?: string; // Link para fonte oficial
  link?: string; // Alias para linkOficial (compatibilidade UI)
}

export interface ResultadoValidacao {
  citacoes: CitacaoLegal[];
  confiabilidadeGeral: "alta" | "media" | "baixa";
  totalCitacoes: number;
  citacoesValidadas: number;
}

/**
 * Extrai citações legais de um texto (com cache)
 */
export async function extrairCitacoes(texto: string): Promise<CitacaoLegal[]> {
  const citacoes: CitacaoLegal[] = [];

  // Padrões de regex para diferentes tipos de citações
  const padroes = {
    // Artigos de códigos: "Art. 186 do CC", "artigo 927 do Código Civil"
    artigos: /(?:art\.?|artigo)\s*(\d+)[^\w]*(?:do|da)?\s*(CC|CPC|CLT|CF|CP|CDC|CTN|ECA|Lei\s*[\d\.\/]+)/gi,
    
    // Leis: "Lei 8.078/90", "Lei nº 13.105/2015"
    leis: /Lei\s*(?:n[º°]?)?\s*([\d\.]+\/\d{2,4})/gi,
    
    // Decretos: "Decreto 3.000/99"
    decretos: /Decreto\s*(?:n[º°]?)?\s*([\d\.]+\/\d{2,4})/gi,
  };

  // Extrair artigos de códigos
  let match;
  while ((match = padroes.artigos.exec(texto)) !== null) {
    const numero = match[1];
    const codigo = match[2].toUpperCase();
    
    citacoes.push({
      texto: match[0],
      tipo: "artigo",
      numero,
      codigo: normalizarCodigo(codigo),
      ...validarArtigo(numero, normalizarCodigo(codigo))
    });
  }

  // Extrair leis
  const leisMatches: Array<{ match: RegExpExecArray, numeroLei: string }> = [];
  while ((match = padroes.leis.exec(texto)) !== null) {
    leisMatches.push({ match, numeroLei: match[1] });
  }
  
  for (const { match, numeroLei } of leisMatches) {
    citacoes.push({
      texto: match[0],
      tipo: "lei",
      numero: numeroLei,
      ...(await validarLei(numeroLei))
    });
  }

  // Extrair decretos
  while ((match = padroes.decretos.exec(texto)) !== null) {
    const numeroDecreto = match[1];
    
    citacoes.push({
      texto: match[0],
      tipo: "decreto",
      numero: numeroDecreto,
      ...validarDecreto(numeroDecreto)
    });
  }

  return citacoes;
}

/**
 * Normaliza abreviações de códigos
 */
function normalizarCodigo(codigo: string): string {
  const mapa: Record<string, string> = {
    "CC": "Código Civil",
    "CPC": "Código de Processo Civil",
    "CLT": "Consolidação das Leis do Trabalho",
    "CF": "Constituição Federal",
    "CP": "Código Penal",
    "CPP": "Código de Processo Penal",
    "CDC": "Código de Defesa do Consumidor",
    "CTN": "Código Tributário Nacional",
    "ECA": "Estatuto da Criança e do Adolescente"
  };

  return mapa[codigo] || codigo;
}

/**
 * Valida um artigo de código
 */
function validarArtigo(numero: string, codigo: string): Pick<CitacaoLegal, "confiabilidade" | "motivo" | "mensagem" | "linkOficial" | "link"> {
  // Base de dados simplificada de artigos conhecidos
  const artigosConhecidos: Record<string, { max: number, link: string }> = {
    "Código Civil": { max: 2046, link: "http://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
    "Código de Processo Civil": { max: 1072, link: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
    "Consolidação das Leis do Trabalho": { max: 922, link: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm" },
    "Constituição Federal": { max: 250, link: "http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm" },
    "Código Penal": { max: 361, link: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm" },
    "Código de Defesa do Consumidor": { max: 119, link: "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
  };

  const info = artigosConhecidos[codigo];
  
  if (!info) {
    const msg = `Código "${codigo}" não verificado automaticamente`;
    return {
      confiabilidade: "media",
      motivo: msg,
      mensagem: msg,
      linkOficial: undefined,
      link: undefined
    };
  }

  const numeroArtigo = parseInt(numero);
  
  if (numeroArtigo <= info.max) {
    const msg = `Artigo ${numero} existe no ${codigo}`;
    return {
      confiabilidade: "alta",
      motivo: msg,
      mensagem: msg,
      linkOficial: info.link,
      link: info.link
    };
  } else {
    const msg = `Artigo ${numero} excede o total de artigos do ${codigo} (máx: ${info.max})`;
    return {
      confiabilidade: "baixa",
      motivo: msg,
      mensagem: msg,
      linkOficial: info.link,
      link: info.link
    };
  }
}

/**
 * Valida uma lei (com cache)
 */
async function validarLei(numeroLei: string): Promise<Pick<CitacaoLegal, "confiabilidade" | "motivo" | "mensagem" | "linkOficial" | "link">> {
  // Verificar cache primeiro
  const cached = await getCachedValidation(`Lei ${numeroLei}`);
  if (cached) {
    // Converter para objeto simples serializável (sem campos Date do Drizzle)
    return {
      confiabilidade: cached.confiabilidade as "alta" | "media" | "baixa",
      motivo: String(cached.motivo),
      mensagem: String(cached.motivo),
      linkOficial: cached.linkOficial ? String(cached.linkOficial) : undefined,
      link: cached.linkOficial ? String(cached.linkOficial) : undefined
    };
  }
  // Leis conhecidas importantes
  const leisConhecidas: Record<string, { nome: string, link: string }> = {
    "8.078/90": { nome: "Código de Defesa do Consumidor", link: "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
    "13.105/2015": { nome: "Código de Processo Civil", link: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
    "10.406/2002": { nome: "Código Civil", link: "http://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
    "13.709/2018": { nome: "Lei Geral de Proteção de Dados (LGPD)", link: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" },
    "11.101/2005": { nome: "Lei de Recuperação Judicial e Falência", link: "http://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm" },
  };

  const info = leisConhecidas[numeroLei];
  
  if (info) {
    const result = {
      confiabilidade: "alta" as const,
      motivo: `Lei ${numeroLei} - ${info.nome}`,
      mensagem: `Lei ${numeroLei} - ${info.nome}`,
      linkOficial: info.link,
      link: info.link
    };
    // Salvar no cache
    await setCachedValidation(`Lei ${numeroLei}`, "lei", "alta", result.motivo, info.link);
    return result;
  }

  // Validação básica de formato (aceita pontos opcionais: 11.101/2005 ou 11101/2005)
  if (/^[\d\.]{1,8}\/\d{2,4}$/.test(numeroLei)) {
    const msg = `Lei ${numeroLei} - formato válido, verificar no Planalto`;
    const result = {
      confiabilidade: "media" as const,
      motivo: msg,
      mensagem: msg,
      linkOficial: `http://www.planalto.gov.br/ccivil_03/leis/`,
      link: `http://www.planalto.gov.br/ccivil_03/leis/`
    };
    // Salvar no cache
    await setCachedValidation(`Lei ${numeroLei}`, "lei", "media", msg, result.linkOficial);
    return result;
  }

  const msgBaixa = `Lei ${numeroLei} - formato inválido ou não encontrada`;
  return {
    confiabilidade: "baixa",
    motivo: msgBaixa,
    mensagem: msgBaixa,
    linkOficial: undefined
  };
}

/**
 * Valida um decreto
 */
function validarDecreto(numeroDecreto: string): Pick<CitacaoLegal, "confiabilidade" | "motivo" | "mensagem" | "linkOficial" | "link"> {
  // Validação básica de formato
  if (/^\d{1,5}\/\d{2,4}$/.test(numeroDecreto)) {
    const msg = `Decreto ${numeroDecreto} - formato válido, verificar no Planalto`;
    return {
      confiabilidade: "media",
      motivo: msg,
      mensagem: msg,
      linkOficial: `http://www.planalto.gov.br/ccivil_03/decreto/`,
      link: `http://www.planalto.gov.br/ccivil_03/decreto/`
    };
  }

  const msgBaixa = `Decreto ${numeroDecreto} - formato inválido`;
  return {
    confiabilidade: "baixa",
    motivo: msgBaixa,
    mensagem: msgBaixa,
    linkOficial: undefined,
    link: undefined
  };
}

/**
 * Valida todas as citações de um texto e retorna resultado consolidado (com cache)
 */
export async function validarLegislacao(texto: string): Promise<ResultadoValidacao> {
  const citacoes = await extrairCitacoes(texto);
  
  const totalCitacoes = citacoes.length;
  const citacoesValidadas = citacoes.filter(c => c.confiabilidade === "alta").length;
  
  // Calcular confiabilidade geral
  let confiabilidadeGeral: "alta" | "media" | "baixa";
  const percentualValidado = totalCitacoes > 0 ? (citacoesValidadas / totalCitacoes) * 100 : 0;
  
  if (percentualValidado >= 80) {
    confiabilidadeGeral = "alta";
  } else if (percentualValidado >= 50) {
    confiabilidadeGeral = "media";
  } else {
    confiabilidadeGeral = "baixa";
  }

  return {
    citacoes,
    confiabilidadeGeral,
    totalCitacoes,
    citacoesValidadas
  };
}
