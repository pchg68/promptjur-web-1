/**
 * Sistema de Verificação de Fontes Jurídicas
 * 
 * Detecta e valida citações legais brasileiras em textos jurídicos.
 * Suporta: Leis, Artigos, Constituição Federal, Códigos (CC, CPC, CLT, CP, CDC)
 */

export interface CitacaoLegal {
  tipo: 'lei' | 'artigo' | 'constituicao' | 'codigo';
  texto: string;
  posicao: number;
}

/**
 * Padrões regex para detectar citações legais brasileiras
 */
const PADROES_CITACOES = {
  // Lei 8.112/1990, Lei nº 13.105/2015, Lei 13.105 de 2015
  lei: /Lei\s+n?º?\s*(\d+[\.,]\d+)[\s\/]*(de\s+)?(\d{4})/gi,
  
  // art. 5º, artigo 37, Art. 123
  artigo: /art(?:igo)?\.?\s+(\d+[ºª°]?)/gi,
  
  // CF/88, CF, art. 5º da CF
  constituicao: /(?:art(?:igo)?\.?\s+\d+[ºª°]?\s+)?(?:da\s+)?CF(?:\/88)?/gi,
  
  // CC, CPC, CLT, CP, CDC (Códigos)
  codigo: /\b(CC|CPC|CLT|CP|CDC)\b/g
};

/**
 * Detecta todas as citações legais em um texto
 */
export function detectarCitacoes(texto: string): CitacaoLegal[] {
  const citacoes: CitacaoLegal[] = [];
  
  // Detectar leis
  let match;
  const regexLei = new RegExp(PADROES_CITACOES.lei);
  while ((match = regexLei.exec(texto)) !== null) {
    citacoes.push({
      tipo: 'lei',
      texto: match[0],
      posicao: match.index
    });
  }
  
  // Detectar artigos
  const regexArtigo = new RegExp(PADROES_CITACOES.artigo);
  while ((match = regexArtigo.exec(texto)) !== null) {
    citacoes.push({
      tipo: 'artigo',
      texto: match[0],
      posicao: match.index
    });
  }
  
  // Detectar constituição
  const regexCF = new RegExp(PADROES_CITACOES.constituicao);
  while ((match = regexCF.exec(texto)) !== null) {
    citacoes.push({
      tipo: 'constituicao',
      texto: match[0],
      posicao: match.index
    });
  }
  
  // Detectar códigos
  const regexCodigo = new RegExp(PADROES_CITACOES.codigo);
  while ((match = regexCodigo.exec(texto)) !== null) {
    citacoes.push({
      tipo: 'codigo',
      texto: match[0],
      posicao: match.index
    });
  }
  
  // Ordenar por posição no texto
  return citacoes.sort((a, b) => a.posicao - b.posicao);
}

/**
 * Gera avisos sobre citações detectadas
 */
export function gerarAvisosFontes(texto: string): string[] {
  const citacoes = detectarCitacoes(texto);
  
  if (citacoes.length === 0) {
    return [];
  }
  
  // Remover duplicatas mantendo apenas textos únicos
  const citacoesUnicas = Array.from(
    new Set(citacoes.map(c => c.texto))
  );
  
  return citacoesUnicas.map(citacao => 
    `⚠️ Citação '${citacao}' detectada - verifique em fonte oficial`
  );
}

/**
 * Verifica se um texto contém citações legais
 */
export function contemCitacoes(texto: string): boolean {
  return detectarCitacoes(texto).length > 0;
}
