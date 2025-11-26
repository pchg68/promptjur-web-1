/**
 * Módulo de Extração de Citações Legais
 * 
 * Utiliza regex poderosos para extrair citações de legislação brasileira
 * de forma rápida e eficiente, sem necessidade de LLM.
 * 
 * Sugestão implementada pela Gemini AI para otimização de performance e custo.
 */

export interface CitacaoLegal {
  tipo: "lei" | "artigo_cc" | "artigo_cpc" | "artigo_clt" | "artigo_cf" | "decreto" | "medida_provisoria" | "resolucao";
  texto: string;
  numeroLei?: string;
  anoLei?: number;
  artigo?: string;
  paragrafo?: string;
  inciso?: string;
  alinea?: string;
  posicao: {
    inicio: number;
    fim: number;
  };
}

/**
 * Extrai todas as citações legais de um texto
 */
export function extractCitacoesLegais(texto: string): CitacaoLegal[] {
  const citacoes: CitacaoLegal[] = [];

  // 1. LEIS FEDERAIS
  // Exemplos: "Lei nº 10.406/2002", "Lei 13.467/2017", "Lei n. 8.078/90"
  const regexLei = /Lei\s+(?:n[ºº°]?\.?\s*)?(\d{1,5})(?:[\/\-](\d{2,4}))?/gi;
  let match;
  while ((match = regexLei.exec(texto)) !== null) {
    citacoes.push({
      tipo: "lei",
      texto: match[0],
      numeroLei: match[1],
      anoLei: match[2] ? parseInt(match[2].length === 2 ? `20${match[2]}` : match[2]) : undefined,
      posicao: {
        inicio: match.index,
        fim: match.index + match[0].length
      }
    });
  }

  // 2. ARTIGOS DO CÓDIGO CIVIL (CC)
  // Exemplos: "art. 186 do CC", "artigo 927 do Código Civil", "arts. 186 e 927 do CC"
  const regexArtigoCC = /art(?:igo)?s?\.?\s+(\d{1,4})(?:\s+(?:e|ao)\s+(\d{1,4}))?\s+do\s+(?:CC|C[óo]digo\s+Civil)/gi;
  while ((match = regexArtigoCC.exec(texto)) !== null) {
    citacoes.push({
      tipo: "artigo_cc",
      texto: match[0],
      artigo: match[1],
      posicao: {
        inicio: match.index,
        fim: match.index + match[0].length
      }
    });
    
    // Se houver segundo artigo (ex: "arts. 186 e 927")
    if (match[2]) {
      citacoes.push({
        tipo: "artigo_cc",
        texto: `art. ${match[2]} do CC`,
        artigo: match[2],
        posicao: {
          inicio: match.index,
          fim: match.index + match[0].length
        }
      });
    }
  }

  // 3. ARTIGOS DO CÓDIGO DE PROCESSO CIVIL (CPC)
  // Exemplos: "art. 300 do CPC", "artigo 319 do CPC/2015"
  const regexArtigoCPC = /art(?:igo)?s?\.?\s+(\d{1,4})(?:\s+(?:e|ao)\s+(\d{1,4}))?\s+do\s+(?:CPC|C[óo]digo\s+de\s+Processo\s+Civil)(?:\/\d{4})?/gi;
  while ((match = regexArtigoCPC.exec(texto)) !== null) {
    citacoes.push({
      tipo: "artigo_cpc",
      texto: match[0],
      artigo: match[1],
      posicao: {
        inicio: match.index,
        fim: match.index + match[0].length
      }
    });
    
    if (match[2]) {
      citacoes.push({
        tipo: "artigo_cpc",
        texto: `art. ${match[2]} do CPC`,
        artigo: match[2],
        posicao: {
          inicio: match.index,
          fim: match.index + match[0].length
        }
      });
    }
  }

  // 4. ARTIGOS DA CLT
  // Exemplos: "art. 7º da CLT", "artigo 482 da Consolidação das Leis do Trabalho"
  const regexArtigoCLT = /art(?:igo)?s?\.?\s+(\d{1,4})[ºº°]?\s+da\s+(?:CLT|Consolida[çc][ãa]o\s+das\s+Leis\s+do\s+Trabalho)/gi;
  while ((match = regexArtigoCLT.exec(texto)) !== null) {
    citacoes.push({
      tipo: "artigo_clt",
      texto: match[0],
      artigo: match[1],
      posicao: {
        inicio: match.index,
        fim: match.index + match[0].length
      }
    });
  }

  // 5. ARTIGOS DA CONSTITUIÇÃO FEDERAL
  // Exemplos: "art. 5º da CF", "artigo 37 da Constituição Federal", "art. 7º, IV, da CF/88"
  const regexArtigoCF = /art(?:igo)?s?\.?\s+(\d{1,3})[ºº°]?(?:,\s+([IVX]+))?\s+da\s+(?:CF|Constitui[çc][ãa]o\s+Federal)(?:\/88)?/gi;
  while ((match = regexArtigoCF.exec(texto)) !== null) {
    citacoes.push({
      tipo: "artigo_cf",
      texto: match[0],
      artigo: match[1],
      inciso: match[2] || undefined,
      posicao: {
        inicio: match.index,
        fim: match.index + match[0].length
      }
    });
  }

  // 6. DECRETOS
  // Exemplos: "Decreto nº 9.199/2017", "Decreto 10.854/2021"
  const regexDecreto = /Decreto\s+(?:n[ºº°]?\.?\s*)?(\d{1,6})(?:[\/\-](\d{2,4}))?/gi;
  while ((match = regexDecreto.exec(texto)) !== null) {
    citacoes.push({
      tipo: "decreto",
      texto: match[0],
      numeroLei: match[1],
      anoLei: match[2] ? parseInt(match[2].length === 2 ? `20${match[2]}` : match[2]) : undefined,
      posicao: {
        inicio: match.index,
        fim: match.index + match[0].length
      }
    });
  }

  // 7. MEDIDAS PROVISÓRIAS
  // Exemplos: "MP nº 1.108/2022", "Medida Provisória 1.045/2021"
  const regexMP = /(?:MP|Medida\s+Provis[óo]ria)\s+(?:n[ºº°]?\.?\s*)?(\d{1,5})(?:[\/\-](\d{2,4}))?/gi;
  while ((match = regexMP.exec(texto)) !== null) {
    citacoes.push({
      tipo: "medida_provisoria",
      texto: match[0],
      numeroLei: match[1],
      anoLei: match[2] ? parseInt(match[2].length === 2 ? `20${match[2]}` : match[2]) : undefined,
      posicao: {
        inicio: match.index,
        fim: match.index + match[0].length
      }
    });
  }

  // 8. RESOLUÇÕES
  // Exemplos: "Resolução nº 125/2010 do CNJ", "Resolução 466/2012"
  const regexResolucao = /Resolu[çc][ãa]o\s+(?:n[ºº°]?\.?\s*)?(\d{1,5})(?:[\/\-](\d{2,4}))?/gi;
  while ((match = regexResolucao.exec(texto)) !== null) {
    citacoes.push({
      tipo: "resolucao",
      texto: match[0],
      numeroLei: match[1],
      anoLei: match[2] ? parseInt(match[2].length === 2 ? `20${match[2]}` : match[2]) : undefined,
      posicao: {
        inicio: match.index,
        fim: match.index + match[0].length
      }
    });
  }

  // Remover duplicatas (mesma posição)
  const citacoesUnicas = citacoes.filter((citacao, index, self) =>
    index === self.findIndex((c) => c.posicao.inicio === citacao.posicao.inicio)
  );

  // Ordenar por posição no texto
  return citacoesUnicas.sort((a, b) => a.posicao.inicio - b.posicao.inicio);
}

/**
 * Conta o número de citações por tipo
 */
export function contarCitacoesPorTipo(citacoes: CitacaoLegal[]): Record<string, number> {
  const contagem: Record<string, number> = {};
  
  citacoes.forEach(citacao => {
    contagem[citacao.tipo] = (contagem[citacao.tipo] || 0) + 1;
  });
  
  return contagem;
}

/**
 * Formata citações para exibição
 */
export function formatarCitacoes(citacoes: CitacaoLegal[]): string[] {
  return citacoes.map(c => c.texto);
}

/**
 * Verifica se um texto contém citações legais
 */
export function temCitacoesLegais(texto: string): boolean {
  return extractCitacoesLegais(texto).length > 0;
}

/**
 * Extrai apenas citações de um tipo específico
 */
export function extractCitacoesPorTipo(texto: string, tipo: CitacaoLegal["tipo"]): CitacaoLegal[] {
  return extractCitacoesLegais(texto).filter(c => c.tipo === tipo);
}
