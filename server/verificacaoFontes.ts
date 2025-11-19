/**
 * Módulo de Verificação de Fontes Jurídicas
 * 
 * Valida citações legais e fornece avisos sobre confiabilidade
 */

export interface CitacaoValidada {
  texto: string;
  valida: boolean;
  tipo?: 'lei' | 'artigo' | 'paragrafo' | 'inciso' | 'jurisprudencia' | 'desconhecido';
  avisos: string[];
}

export interface ResultadoVerificacao {
  citacoesEncontradas: CitacaoValidada[];
  score: number; // 0-100
  avisos: string[];
  recomendacoes: string[];
}

/**
 * Padrões regex para identificar citações jurídicas
 */
const PADROES = {
  // Lei: "Lei 12.345/2020", "Lei nº 12.345/2020", "Lei Federal 12.345/2020"
  lei: /Lei\s+(Federal\s+|Complementar\s+|n[º°]\s+)?(\d{1,5})[\/\-](\d{4})/gi,
  
  // Artigo: "art. 5º", "artigo 5", "Art. 5º, § 1º"
  artigo: /art\.?\s+(\d{1,4})[º°]?/gi,
  
  // Parágrafo: "§ 1º", "§1º", "parágrafo 1º"
  paragrafo: /[§¶]\s*(\d{1,3})[º°]?|par[áa]grafo\s+(\d{1,3})[º°]?/gi,
  
  // Inciso: "inciso I", "inc. II", "inciso III"
  inciso: /inc\.?\s+([IVX]+)/gi,
  
  // Jurisprudência: "STF", "STJ", "TST", "TRT", "Súmula"
  jurisprudencia: /(STF|STJ|TST|TRT|TSE|TCU|S[úu]mula)\s+(\d+)/gi,
};

/**
 * Valida formato de citação de lei
 */
function validarLei(texto: string): CitacaoValidada {
  const match = texto.match(PADROES.lei);
  const avisos: string[] = [];
  
  if (!match) {
    avisos.push('Formato de lei não reconhecido');
    return { texto, valida: false, avisos };
  }
  
  // Extrair número e ano
  const partes = match[0].match(/(\d{1,5})[\/\-](\d{4})/);
  if (partes) {
    const numero = parseInt(partes[1]);
    const ano = parseInt(partes[2]);
    
    // Validações básicas
    if (ano < 1500 || ano > new Date().getFullYear()) {
      avisos.push(`Ano ${ano} parece inválido`);
    }
    
    if (numero < 1 || numero > 99999) {
      avisos.push(`Número ${numero} parece inválido`);
    }
  }
  
  avisos.push('⚠️ Citação não verificada em base oficial');
  
  return {
    texto,
    valida: avisos.length === 1, // Válida se só tiver o aviso de não verificação
    tipo: 'lei',
    avisos,
  };
}

/**
 * Extrai e valida todas as citações de um texto
 */
export function verificarFontes(texto: string): ResultadoVerificacao {
  const citacoesEncontradas: CitacaoValidada[] = [];
  const avisos: string[] = [];
  const recomendacoes: string[] = [];
  
  // Buscar leis
  const leis = texto.match(PADROES.lei) || [];
  leis.forEach(lei => {
    citacoesEncontradas.push(validarLei(lei));
  });
  
  // Buscar artigos
  const artigos = texto.match(PADROES.artigo) || [];
  artigos.forEach(artigo => {
    citacoesEncontradas.push({
      texto: artigo,
      valida: true,
      tipo: 'artigo',
      avisos: ['Artigo encontrado, mas lei de origem não especificada'],
    });
  });
  
  // Buscar jurisprudência
  const jurisprudencias = texto.match(PADROES.jurisprudencia) || [];
  jurisprudencias.forEach(juris => {
    citacoesEncontradas.push({
      texto: juris,
      valida: false,
      tipo: 'jurisprudencia',
      avisos: ['⚠️ Jurisprudência não verificada em base oficial'],
    });
  });
  
  // Calcular score de confiabilidade
  let score = 100;
  
  if (citacoesEncontradas.length === 0) {
    score = 0;
    avisos.push('❌ Nenhuma citação legal encontrada');
    recomendacoes.push('Adicione referências legais específicas (leis, artigos, jurisprudência)');
  } else {
    const citacoesInvalidas = citacoesEncontradas.filter(c => !c.valida).length;
    score = Math.max(0, 100 - (citacoesInvalidas * 20));
    
    if (citacoesInvalidas > 0) {
      avisos.push(`⚠️ ${citacoesInvalidas} citação(ões) com formato inválido ou não verificado`);
    }
  }
  
  // Avisos gerais
  avisos.push('⚠️ IMPORTANTE: Citações não foram verificadas em bases oficiais (Planalto, STF, STJ)');
  avisos.push('⚠️ Sempre confira as fontes antes de usar em documentos oficiais');
  
  // Recomendações
  recomendacoes.push('Verifique todas as citações em fontes oficiais antes do uso profissional');
  recomendacoes.push('Consulte www.planalto.gov.br para legislação federal');
  recomendacoes.push('Consulte portais dos tribunais (STF, STJ) para jurisprudência');
  
  return {
    citacoesEncontradas,
    score,
    avisos,
    recomendacoes,
  };
}

/**
 * Formata resultado de verificação para exibição
 */
export function formatarResultado(resultado: ResultadoVerificacao): string {
  let output = `## Verificação de Fontes Jurídicas\n\n`;
  output += `**Score de Confiabilidade:** ${resultado.score}/100\n\n`;
  
  if (resultado.citacoesEncontradas.length > 0) {
    output += `### Citações Encontradas (${resultado.citacoesEncontradas.length})\n\n`;
    resultado.citacoesEncontradas.forEach((citacao, i) => {
      output += `${i + 1}. **${citacao.texto}**\n`;
      output += `   - Tipo: ${citacao.tipo || 'desconhecido'}\n`;
      output += `   - Status: ${citacao.valida ? '✅ Formato válido' : '❌ Formato inválido'}\n`;
      if (citacao.avisos.length > 0) {
        output += `   - Avisos: ${citacao.avisos.join('; ')}\n`;
      }
      output += `\n`;
    });
  }
  
  if (resultado.avisos.length > 0) {
    output += `### ⚠️ Avisos\n\n`;
    resultado.avisos.forEach(aviso => {
      output += `- ${aviso}\n`;
    });
    output += `\n`;
  }
  
  if (resultado.recomendacoes.length > 0) {
    output += `### 💡 Recomendações\n\n`;
    resultado.recomendacoes.forEach(rec => {
      output += `- ${rec}\n`;
    });
  }
  
  return output;
}
