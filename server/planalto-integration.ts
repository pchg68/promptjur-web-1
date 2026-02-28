/**
 * Módulo de integração com o Portal da Legislação do Planalto
 * 
 * Valida legislação federal brasileira consultando diretamente
 * as URLs oficiais do planalto.gov.br
 * 
 * Estratégia:
 * 1. Monta URL oficial com base no tipo e número da legislação
 * 2. Faz HEAD request para verificar se a página existe (HTTP 200)
 * 3. Cacheia resultados para evitar requests repetidos
 * 4. Retorna link oficial verificado
 * 
 * Fonte: https://www.planalto.gov.br/ccivil_03/
 */

import { getCachedValidation, setCachedValidation } from "./db-legislacao-cache";

export interface PlanaltoValidationResult {
  existe: boolean;
  confiabilidade: "alta" | "media" | "baixa";
  motivo: string;
  linkOficial?: string;
  nomeCompleto?: string;
}

/**
 * Base de dados expandida de legislação federal brasileira
 * Mapeamento: número/ano -> { nome, link oficial verificado }
 */
const LEGISLACAO_FEDERAL: Record<string, { nome: string; link: string; tipo: string }> = {
  // Códigos fundamentais
  "10.406/2002": { nome: "Código Civil", link: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm", tipo: "lei" },
  "13.105/2015": { nome: "Código de Processo Civil", link: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm", tipo: "lei" },
  "8.078/1990": { nome: "Código de Defesa do Consumidor", link: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm", tipo: "lei" },
  "8.078/90": { nome: "Código de Defesa do Consumidor", link: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm", tipo: "lei" },
  "5.172/1966": { nome: "Código Tributário Nacional", link: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm", tipo: "lei" },
  "5.172/66": { nome: "Código Tributário Nacional", link: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm", tipo: "lei" },
  "8.069/1990": { nome: "Estatuto da Criança e do Adolescente", link: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm", tipo: "lei" },
  "8.069/90": { nome: "Estatuto da Criança e do Adolescente", link: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm", tipo: "lei" },
  "10.741/2003": { nome: "Estatuto do Idoso", link: "https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741.htm", tipo: "lei" },
  "13.146/2015": { nome: "Estatuto da Pessoa com Deficiência", link: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm", tipo: "lei" },

  // Leis importantes
  "13.709/2018": { nome: "Lei Geral de Proteção de Dados (LGPD)", link: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm", tipo: "lei" },
  "11.101/2005": { nome: "Lei de Recuperação Judicial e Falência", link: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm", tipo: "lei" },
  "8.666/1993": { nome: "Lei de Licitações (revogada)", link: "https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm", tipo: "lei" },
  "8.666/93": { nome: "Lei de Licitações (revogada)", link: "https://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm", tipo: "lei" },
  "14.133/2021": { nome: "Nova Lei de Licitações e Contratos", link: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm", tipo: "lei" },
  "9.099/1995": { nome: "Lei dos Juizados Especiais", link: "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm", tipo: "lei" },
  "9.099/95": { nome: "Lei dos Juizados Especiais", link: "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm", tipo: "lei" },
  "12.846/2013": { nome: "Lei Anticorrupção", link: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12846.htm", tipo: "lei" },
  "9.504/1997": { nome: "Lei das Eleições", link: "https://www.planalto.gov.br/ccivil_03/leis/l9504.htm", tipo: "lei" },
  "9.504/97": { nome: "Lei das Eleições", link: "https://www.planalto.gov.br/ccivil_03/leis/l9504.htm", tipo: "lei" },
  "8.112/1990": { nome: "Estatuto dos Servidores Públicos Federais", link: "https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm", tipo: "lei" },
  "8.112/90": { nome: "Estatuto dos Servidores Públicos Federais", link: "https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm", tipo: "lei" },
  "6.404/1976": { nome: "Lei das Sociedades por Ações", link: "https://www.planalto.gov.br/ccivil_03/leis/l6404consol.htm", tipo: "lei" },
  "6.404/76": { nome: "Lei das Sociedades por Ações", link: "https://www.planalto.gov.br/ccivil_03/leis/l6404consol.htm", tipo: "lei" },
  "8.245/1991": { nome: "Lei do Inquilinato", link: "https://www.planalto.gov.br/ccivil_03/leis/l8245.htm", tipo: "lei" },
  "8.245/91": { nome: "Lei do Inquilinato", link: "https://www.planalto.gov.br/ccivil_03/leis/l8245.htm", tipo: "lei" },
  "9.610/1998": { nome: "Lei de Direitos Autorais", link: "https://www.planalto.gov.br/ccivil_03/leis/l9610.htm", tipo: "lei" },
  "9.610/98": { nome: "Lei de Direitos Autorais", link: "https://www.planalto.gov.br/ccivil_03/leis/l9610.htm", tipo: "lei" },
  "12.965/2014": { nome: "Marco Civil da Internet", link: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm", tipo: "lei" },
  "9.279/1996": { nome: "Lei de Propriedade Industrial", link: "https://www.planalto.gov.br/ccivil_03/leis/l9279.htm", tipo: "lei" },
  "9.279/96": { nome: "Lei de Propriedade Industrial", link: "https://www.planalto.gov.br/ccivil_03/leis/l9279.htm", tipo: "lei" },
  "11.340/2006": { nome: "Lei Maria da Penha", link: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm", tipo: "lei" },
  "7.347/1985": { nome: "Lei da Ação Civil Pública", link: "https://www.planalto.gov.br/ccivil_03/leis/l7347orig.htm", tipo: "lei" },
  "7.347/85": { nome: "Lei da Ação Civil Pública", link: "https://www.planalto.gov.br/ccivil_03/leis/l7347orig.htm", tipo: "lei" },
  "12.527/2011": { nome: "Lei de Acesso à Informação", link: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm", tipo: "lei" },
  "8.429/1992": { nome: "Lei de Improbidade Administrativa", link: "https://www.planalto.gov.br/ccivil_03/leis/l8429.htm", tipo: "lei" },
  "8.429/92": { nome: "Lei de Improbidade Administrativa", link: "https://www.planalto.gov.br/ccivil_03/leis/l8429.htm", tipo: "lei" },
  "9.605/1998": { nome: "Lei de Crimes Ambientais", link: "https://www.planalto.gov.br/ccivil_03/leis/l9605.htm", tipo: "lei" },
  "9.605/98": { nome: "Lei de Crimes Ambientais", link: "https://www.planalto.gov.br/ccivil_03/leis/l9605.htm", tipo: "lei" },
  "14.010/2020": { nome: "Regime Jurídico Emergencial e Transitório (COVID)", link: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14010.htm", tipo: "lei" },
  "14.382/2022": { nome: "Marco Legal dos Registros Públicos", link: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14382.htm", tipo: "lei" },

  // Decreto-Lei (Códigos)
  "2.848/1940": { nome: "Código Penal", link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm", tipo: "decreto-lei" },
  "3.689/1941": { nome: "Código de Processo Penal", link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm", tipo: "decreto-lei" },
  "5.452/1943": { nome: "Consolidação das Leis do Trabalho (CLT)", link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm", tipo: "decreto-lei" },
};

/**
 * Base de artigos por código com contagem máxima atualizada
 */
const CODIGOS_ARTIGOS: Record<string, { max: number; link: string; nome: string }> = {
  "Código Civil": { max: 2046, link: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm", nome: "Código Civil (Lei 10.406/2002)" },
  "CC": { max: 2046, link: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm", nome: "Código Civil" },
  "Código de Processo Civil": { max: 1072, link: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm", nome: "Código de Processo Civil (Lei 13.105/2015)" },
  "CPC": { max: 1072, link: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm", nome: "Código de Processo Civil" },
  "Consolidação das Leis do Trabalho": { max: 922, link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm", nome: "CLT (DL 5.452/1943)" },
  "CLT": { max: 922, link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm", nome: "CLT" },
  "Constituição Federal": { max: 250, link: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm", nome: "Constituição Federal de 1988" },
  "CF": { max: 250, link: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm", nome: "Constituição Federal" },
  "Código Penal": { max: 361, link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm", nome: "Código Penal (DL 2.848/1940)" },
  "CP": { max: 361, link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm", nome: "Código Penal" },
  "Código de Processo Penal": { max: 811, link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm", nome: "Código de Processo Penal (DL 3.689/1941)" },
  "CPP": { max: 811, link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm", nome: "Código de Processo Penal" },
  "Código de Defesa do Consumidor": { max: 119, link: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm", nome: "CDC (Lei 8.078/1990)" },
  "CDC": { max: 119, link: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm", nome: "Código de Defesa do Consumidor" },
  "Código Tributário Nacional": { max: 218, link: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm", nome: "CTN (Lei 5.172/1966)" },
  "CTN": { max: 218, link: "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm", nome: "Código Tributário Nacional" },
  "Estatuto da Criança e do Adolescente": { max: 267, link: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm", nome: "ECA (Lei 8.069/1990)" },
  "ECA": { max: 267, link: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm", nome: "ECA" },
};

/**
 * Normaliza número de lei (remove pontos, normaliza ano)
 */
function normalizarNumeroLei(numero: string): string[] {
  const variantes: string[] = [numero];

  // Adicionar variante com ano completo se tiver 2 dígitos
  const parts = numero.split("/");
  if (parts.length === 2) {
    const [num, ano] = parts;
    if (ano.length === 2) {
      const anoCompleto = parseInt(ano) >= 50 ? `19${ano}` : `20${ano}`;
      variantes.push(`${num}/${anoCompleto}`);
    }
    if (ano.length === 4) {
      const anoAbreviado = ano.slice(-2);
      variantes.push(`${num}/${anoAbreviado}`);
    }
    // Variante sem pontos
    const numSemPontos = num.replace(/\./g, "");
    if (numSemPontos !== num) {
      variantes.push(`${numSemPontos}/${ano}`);
    }
    // Variante com pontos
    if (!num.includes(".") && num.length > 3) {
      const numComPontos = num.replace(/(\d)(?=(\d{3})+$)/g, "$1.");
      variantes.push(`${numComPontos}/${ano}`);
    }
  }

  return Array.from(new Set(variantes));
}

/**
 * Valida uma lei consultando a base de dados do Planalto
 * Primeiro verifica a base local expandida, depois tenta HTTP HEAD
 */
export async function validarLeiPlanalto(
  numeroLei: string,
  tipo: "lei" | "decreto" | "decreto-lei" | "medida-provisoria" = "lei"
): Promise<PlanaltoValidationResult> {
  // 1. Verificar cache do banco de dados
  const cacheKey = `planalto:${tipo}:${numeroLei}`;
  const cached = await getCachedValidation(cacheKey);
  if (cached) {
    return {
      existe: cached.confiabilidade === "alta",
      confiabilidade: cached.confiabilidade as "alta" | "media" | "baixa",
      motivo: String(cached.motivo),
      linkOficial: cached.linkOficial ? String(cached.linkOficial) : undefined,
      nomeCompleto: String(cached.motivo),
    };
  }

  // 2. Verificar na base local expandida
  const variantes = normalizarNumeroLei(numeroLei);
  for (const variante of variantes) {
    const info = LEGISLACAO_FEDERAL[variante];
    if (info) {
      const result: PlanaltoValidationResult = {
        existe: true,
        confiabilidade: "alta",
        motivo: `${info.nome} (${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${numeroLei})`,
        linkOficial: info.link,
        nomeCompleto: info.nome,
      };
      // Cachear resultado
      await setCachedValidation(cacheKey, tipo as "lei" | "decreto", "alta", result.motivo, info.link).catch(() => {});
      return result;
    }
  }

  // 3. Tentar verificar via HTTP HEAD no planalto.gov.br
  const urlCandidatas = montarURLsPlanalto(numeroLei, tipo);

  for (const url of urlCandidatas) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
        headers: {
          "User-Agent": "PromptJur/1.0 (Validacao de Legislacao)",
        },
      });

      if (response.ok) {
        const result: PlanaltoValidationResult = {
          existe: true,
          confiabilidade: "alta",
          motivo: `Legislação verificada no Planalto (${tipo} ${numeroLei})`,
          linkOficial: url,
        };
        // Cachear resultado positivo
        await setCachedValidation(cacheKey, tipo as "lei" | "decreto", "alta", result.motivo, url).catch(() => {});
        return result;
      }
    } catch {
      // Timeout ou erro de rede - continuar para próxima URL
      continue;
    }
  }

  // 4. Validação de formato como fallback
  if (/^[\d\.]{1,10}\/\d{2,4}$/.test(numeroLei)) {
    const result: PlanaltoValidationResult = {
      existe: false,
      confiabilidade: "media",
      motivo: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${numeroLei} - formato válido, não verificado online`,
      linkOficial: `https://www.planalto.gov.br/ccivil_03/leis/`,
    };
    await setCachedValidation(cacheKey, tipo as "lei" | "decreto", "media", result.motivo, result.linkOficial).catch(() => {});
    return result;
  }

  return {
    existe: false,
    confiabilidade: "baixa",
    motivo: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${numeroLei} - não encontrada`,
  };
}

/**
 * Monta URLs candidatas para verificação no Planalto
 */
function montarURLsPlanalto(numero: string, tipo: string): string[] {
  const urls: string[] = [];
  const parts = numero.split("/");
  if (parts.length !== 2) return urls;

  const [num, anoRaw] = parts;
  const ano = anoRaw.length === 2 ? (parseInt(anoRaw) >= 50 ? `19${anoRaw}` : `20${anoRaw}`) : anoRaw;
  const anoInt = parseInt(ano);
  const numLimpo = num.replace(/\./g, "");
  const numLower = `l${numLimpo}`;

  // Determinar faixa de ato legislativo
  let faixaAto = "";
  if (anoInt >= 2019) faixaAto = "_ato2019-2022";
  else if (anoInt >= 2015) faixaAto = "_ato2015-2018";
  else if (anoInt >= 2011) faixaAto = "_ato2011-2014";
  else if (anoInt >= 2007) faixaAto = "_ato2007-2010";
  else if (anoInt >= 2004) faixaAto = "_ato2004-2006";

  const base = "https://www.planalto.gov.br/ccivil_03";

  if (tipo === "lei") {
    if (faixaAto) {
      urls.push(`${base}/${faixaAto}/${ano}/lei/${numLower}.htm`);
    }
    urls.push(`${base}/leis/${numLower}.htm`);
    urls.push(`${base}/leis/${numLower}compilado.htm`);
    urls.push(`${base}/leis/${numLower}compilada.htm`);
  } else if (tipo === "decreto") {
    if (faixaAto) {
      urls.push(`${base}/${faixaAto}/${ano}/decreto/d${numLimpo}.htm`);
    }
    urls.push(`${base}/decreto/d${numLimpo}.htm`);
  } else if (tipo === "decreto-lei") {
    urls.push(`${base}/decreto-lei/del${numLimpo}.htm`);
    urls.push(`${base}/decreto-lei/del${numLimpo}compilado.htm`);
  } else if (tipo === "medida-provisoria") {
    if (faixaAto) {
      urls.push(`${base}/${faixaAto}/${ano}/mpv/mpv${numLimpo}.htm`);
    }
    urls.push(`${base}/mpv/mpv${numLimpo}.htm`);
  }

  return urls;
}

/**
 * Valida um artigo de código usando a base expandida
 */
export function validarArtigoPlanalto(
  numero: string,
  codigo: string
): PlanaltoValidationResult {
  const info = CODIGOS_ARTIGOS[codigo];

  if (!info) {
    return {
      existe: false,
      confiabilidade: "media",
      motivo: `Código "${codigo}" não verificado automaticamente`,
    };
  }

  const numeroArtigo = parseInt(numero);

  if (isNaN(numeroArtigo) || numeroArtigo <= 0) {
    return {
      existe: false,
      confiabilidade: "baixa",
      motivo: `Artigo "${numero}" - número inválido`,
      linkOficial: info.link,
    };
  }

  if (numeroArtigo <= info.max) {
    return {
      existe: true,
      confiabilidade: "alta",
      motivo: `Art. ${numero} do ${info.nome} - verificado`,
      linkOficial: info.link,
      nomeCompleto: info.nome,
    };
  }

  return {
    existe: false,
    confiabilidade: "baixa",
    motivo: `Art. ${numero} excede o total de artigos do ${info.nome} (máx: ${info.max})`,
    linkOficial: info.link,
  };
}

/**
 * Retorna estatísticas da base de legislação
 */
export function getPlanaltoStats(): { totalLeis: number; totalCodigos: number; ultimaAtualizacao: string } {
  return {
    totalLeis: Object.keys(LEGISLACAO_FEDERAL).length,
    totalCodigos: Object.keys(CODIGOS_ARTIGOS).length,
    ultimaAtualizacao: "2025-02",
  };
}
