import { AREAS_JURIDICAS, PALAVRAS_CHAVE_AREAS } from "@shared/juridico";

/**
 * Sugerir área jurídica baseada no contexto fornecido
 */
export function sugerirArea(contexto: string, objetivo?: string): {
  area: string;
  confianca: number;
  motivo: string;
} {
  const textoCompleto = `${contexto} ${objetivo || ""}`.toLowerCase();
  
  // Pontuação por área
  const pontuacoes: Record<string, { pontos: number; palavrasEncontradas: string[] }> = {};
  
  // Inicializar pontuações
  AREAS_JURIDICAS.forEach(area => {
    pontuacoes[area] = { pontos: 0, palavrasEncontradas: [] };
  });
  
  // Analisar palavras-chave
  Object.entries(PALAVRAS_CHAVE_AREAS).forEach(([area, palavras]) => {
    palavras.forEach(palavra => {
      const regex = new RegExp(`\\b${palavra.toLowerCase()}\\b`, 'gi');
      const matches = textoCompleto.match(regex);
      if (matches) {
        const pontos = matches.length;
        pontuacoes[area].pontos += pontos;
        if (!pontuacoes[area].palavrasEncontradas.includes(palavra)) {
          pontuacoes[area].palavrasEncontradas.push(palavra);
        }
      }
    });
  });
  
  // Encontrar área com maior pontuação
  let melhorArea = "Civil"; // Padrão
  let maiorPontuacao = 0;
  let palavrasChave: string[] = [];
  
  Object.entries(pontuacoes).forEach(([area, dados]) => {
    if (dados.pontos > maiorPontuacao) {
      maiorPontuacao = dados.pontos;
      melhorArea = area;
      palavrasChave = dados.palavrasEncontradas;
    }
  });
  
  // Calcular confiança (0-100)
  const confianca = Math.min(100, Math.round((maiorPontuacao / Math.max(1, contexto.split(' ').length)) * 100 * 10));
  
  // Gerar motivo
  let motivo = "";
  if (confianca >= 70) {
    motivo = `Alta confiança: encontradas ${palavrasChave.length} palavras-chave relacionadas a ${melhorArea} (${palavrasChave.slice(0, 3).join(", ")})`;
  } else if (confianca >= 40) {
    motivo = `Confiança média: algumas palavras-chave de ${melhorArea} identificadas (${palavrasChave.slice(0, 2).join(", ")})`;
  } else {
    motivo = `Confiança baixa: poucas palavras-chave identificadas. Sugestão baseada em contexto geral.`;
  }
  
  return {
    area: melhorArea,
    confianca,
    motivo
  };
}
