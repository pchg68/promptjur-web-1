/**
 * Módulo de extração de citações legais (versão frontend)
 * Baseado em server/extractCitacoesLegais.ts mas otimizado para uso no navegador
 */

export interface CitacaoLegal {
  tipo: 'lei' | 'artigo' | 'sumula' | 'jurisprudencia' | 'outro';
  textoOriginal: string;
  numero?: string;
  artigo?: string;
  fonte?: string;
  confiabilidade?: 'alta' | 'media' | 'baixa';
}

/**
 * Extrai citações legais de um texto
 */
export function extractCitacoesLegais(texto: string): CitacaoLegal[] {
  const citacoes: CitacaoLegal[] = [];

  // Padrão para leis (Lei 8.078/90, Lei nº 10.406/2002, etc.)
  const leiPattern = /[Ll]ei\s+(?:n[ºº°]?\s*)?(\d+[\./]\d+)/g;
  let match;

  while ((match = leiPattern.exec(texto)) !== null) {
    citacoes.push({
      tipo: 'lei',
      textoOriginal: match[0],
      numero: match[1],
      confiabilidade: validarLei(match[1])
    });
  }

  // Padrão para artigos (Art. 5º, Artigo 927, etc.)
  const artigoPattern = /[Aa]rt(?:igo)?\.?\s*(\d+)[ºº°]?(?:[-,]\s*(?:§|caput|inciso|alínea)\s*[\w]+)?/g;
  
  while ((match = artigoPattern.exec(texto)) !== null) {
    citacoes.push({
      tipo: 'artigo',
      textoOriginal: match[0],
      artigo: match[1],
      confiabilidade: 'media' // Artigos precisam de contexto da lei
    });
  }

  // Padrão para súmulas (Súmula 297, Súmula Vinculante 11, etc.)
  const sumulaPattern = /[Ss]úmula\s+(?:[Vv]inculante\s+)?(\d+)/g;
  
  while ((match = sumulaPattern.exec(texto)) !== null) {
    citacoes.push({
      tipo: 'sumula',
      textoOriginal: match[0],
      numero: match[1],
      confiabilidade: 'alta' // Súmulas são bem específicas
    });
  }

  // Padrão para jurisprudência (STF, STJ, TJ, etc.)
  const jurisprudenciaPattern = /(STF|STJ|TST|TSE|STM|TJ[A-Z]{2}|TRF-?\d|TRT-?\d+)\s+[-–]\s*[\w\s]+\s+n[ºº°]?\s*[\d.\/\-]+/gi;
  
  while ((match = jurisprudenciaPattern.exec(texto)) !== null) {
    citacoes.push({
      tipo: 'jurisprudencia',
      textoOriginal: match[0],
      fonte: match[1],
      confiabilidade: 'alta'
    });
  }

  // Padrão para CF/88 (Constituição Federal)
  const cfPattern = /CF\/88|Constituição\s+Federal/gi;
  
  while ((match = cfPattern.exec(texto)) !== null) {
    citacoes.push({
      tipo: 'lei',
      textoOriginal: match[0],
      numero: 'CF/88',
      fonte: 'Constituição Federal de 1988',
      confiabilidade: 'alta'
    });
  }

  return citacoes;
}

/**
 * Valida se uma lei é conhecida (lista das mais comuns)
 */
function validarLei(numero: string): 'alta' | 'media' | 'baixa' {
  // Normalizar número (remover pontos e barras)
  const normalizado = numero.replace(/[.\/]/g, '');

  // Lista de leis mais comuns (formato normalizado)
  const leisComuns = [
    '807890',    // CDC
    '1040602',   // Código Civil
    '551373',    // CPC
    '384141',    // CPP
    '543343',    // CLT
    '1340916',   // Lei de Licitações
    '1276595',   // Marco Civil da Internet
    '1370918',   // LGPD
    '940903',    // ECA
    '1040105',   // Código Penal
    '532064',    // CTN
    '1110105',   // Lei de Recuperação Judicial
    '640476',    // Lei das S.A.
    '1140605',   // Lei do Mandado de Segurança
    '1340117',   // Lei Maria da Penha
    '1349006',   // Lei de Improbidade Administrativa
    '1301316',   // Novo CPC
  ];

  if (leisComuns.includes(normalizado)) {
    return 'alta';
  }

  // Se o número parece válido (formato correto), retorna média
  if (/^\d{4,5}\/?\d{2,4}$/.test(numero)) {
    return 'media';
  }

  return 'baixa';
}

/**
 * Conta quantas citações de cada tipo foram encontradas
 */
export function contarCitacoes(citacoes: CitacaoLegal[]) {
  return {
    total: citacoes.length,
    leis: citacoes.filter(c => c.tipo === 'lei').length,
    artigos: citacoes.filter(c => c.tipo === 'artigo').length,
    sumulas: citacoes.filter(c => c.tipo === 'sumula').length,
    jurisprudencias: citacoes.filter(c => c.tipo === 'jurisprudencia').length,
    alta: citacoes.filter(c => c.confiabilidade === 'alta').length,
    media: citacoes.filter(c => c.confiabilidade === 'media').length,
    baixa: citacoes.filter(c => c.confiabilidade === 'baixa').length,
  };
}
