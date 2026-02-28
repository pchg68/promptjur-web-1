/**
 * Estratégias avançadas de IA para geração de documentos jurídicos
 * Baseado nos conceitos do Manus AI (Chain of Thought, Knowledge Retrieval, etc.)
 */

import { invokeUnifiedLLM } from "./unified-llm";

export type EstrategiaIA = "direct" | "chain_of_thought" | "knowledge_retrieval";

export interface ParametrosGeracao {
  tipoDocumento: string;
  areaJuridica: string;
  contexto: string;
  objetivo?: string;
  partesEnvolvidas?: string;
  legislacao?: string;
  detalhes?: string;
  estrategia: EstrategiaIA;
  provider?: "manus" | "openai" | "anthropic" | "google" | "perplexity";
  model?: string;
}

/**
 * Gera documento usando estratégia Direct Answer (resposta direta)
 */
async function gerarComDirect(params: ParametrosGeracao): Promise<string> {
  const systemPrompt = `Você é um assistente jurídico especializado em elaborar documentos legais de alta qualidade.
Sua tarefa é gerar um ${params.tipoDocumento} completo e profissional na área de ${params.areaJuridica}.

INSTRUÇÕES:
- Use linguagem jurídica formal e técnica apropriada
- Estruture o documento conforme as normas da ABNT e padrões jurídicos brasileiros
- Inclua todas as seções necessárias para este tipo de documento
- Cite legislação relevante quando apropriado
- Mantenha clareza e objetividade

Gere APENAS o documento final, sem explicações adicionais.`;

  const userPrompt = `Contexto: ${params.contexto}

${params.objetivo ? `Objetivo: ${params.objetivo}` : ''}
${params.partesEnvolvidas ? `Partes Envolvidas: ${params.partesEnvolvidas}` : ''}
${params.legislacao ? `Legislação Relevante: ${params.legislacao}` : ''}
${params.detalhes ? `Detalhes Adicionais: ${params.detalhes}` : ''}

Gere o ${params.tipoDocumento} completo:`;

  const response = await invokeUnifiedLLM({
    provider: params.provider,
    model: params.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
  });

  return response.content;
}

/**
 * Gera documento usando estratégia Chain of Thought (raciocínio passo a passo)
 */
async function gerarComChainOfThought(params: ParametrosGeracao): Promise<string> {
  const systemPrompt = `Você é um assistente jurídico especializado que usa raciocínio estruturado passo a passo.
Ao elaborar documentos jurídicos, você primeiro analisa o caso, identifica os pontos-chave, e então constrói o documento de forma lógica e fundamentada.

Sua tarefa é gerar um ${params.tipoDocumento} completo na área de ${params.areaJuridica}.`;

  // Passo 1: Análise do caso
  const analisePrompt = `Analise o seguinte caso jurídico e identifique:
1. Pontos-chave e questões jurídicas principais
2. Legislação aplicável
3. Argumentos jurídicos relevantes
4. Estrutura ideal para o documento

Contexto: ${params.contexto}
${params.objetivo ? `Objetivo: ${params.objetivo}` : ''}
${params.partesEnvolvidas ? `Partes: ${params.partesEnvolvidas}` : ''}
${params.legislacao ? `Legislação: ${params.legislacao}` : ''}

Forneça uma análise estruturada:`;

  const analiseResponse = await invokeUnifiedLLM({
    provider: params.provider,
    model: params.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: analisePrompt }
    ],
  });

  const analise = analiseResponse.content;

  // Passo 2: Geração do documento baseado na análise
  const geracaoPrompt = `Com base na análise anterior, agora gere o ${params.tipoDocumento} completo e profissional.

ANÁLISE PRÉVIA:
${analise}

INSTRUÇÕES FINAIS:
- Use linguagem jurídica formal e técnica
- Estruture conforme normas ABNT e padrões jurídicos brasileiros
- Inclua todas as seções necessárias
- Fundamente com a legislação identificada
- Mantenha coerência com a análise realizada

${params.detalhes ? `Detalhes Adicionais: ${params.detalhes}` : ''}

Gere APENAS o documento final, sem incluir a análise:`;

  const documentoResponse = await invokeUnifiedLLM({
    provider: params.provider,
    model: params.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: analisePrompt },
      { role: "assistant", content: analise },
      { role: "user", content: geracaoPrompt }
    ],
  });

  return documentoResponse.content;
}

/**
 * Gera documento usando estratégia Knowledge Retrieval (recuperação de conhecimento)
 * AGORA COM INTEGRAÇÃO REAL: API DataJud, Feriados e Cálculo de Prazos
 */
async function gerarComKnowledgeRetrieval(params: ParametrosGeracao): Promise<string> {
  // Importar módulos de Knowledge Retrieval
  const { buscarPrecedentesSimilares, formatarProcessoParaTexto } = await import("./knowledge-retrieval-datajud");
  const { calcularPrazoProcessual, listarPrazosDisponiveis, formatarResultadoPrazo } = await import("./knowledge-retrieval-prazos");

  const systemPrompt = `Você é um assistente jurídico especializado com acesso a amplo conhecimento jurídico brasileiro.
Antes de elaborar documentos, você recupera e sintetiza conhecimento relevante sobre legislação, jurisprudência e doutrinas aplicáveis.

Sua tarefa é gerar um ${params.tipoDocumento} completo na área de ${params.areaJuridica}.`;

  // Passo 1: RECUPERAR CONHECIMENTO REAL das APIs
  console.log("[Knowledge Retrieval] Buscando precedentes processuais reais...");
  
  // Buscar precedentes similares na API DataJud
  const precedentes = await buscarPrecedentesSimilares(
    params.contexto,
    params.areaJuridica,
    params.tipoDocumento,
    ["STJ", "TRF1", "TJSP"], // Tribunais prioritários
    5 // Limite por tribunal
  );

  // Formatar precedentes para inclusão no prompt
  let precedentesTexto = "";
  if (precedentes.length > 0) {
    precedentesTexto = "\n\n**PRECEDENTES PROCESSUAIS REAIS RECUPERADOS:**\n";
    precedentes.slice(0, 5).forEach((proc, idx) => {
      precedentesTexto += `\n${idx + 1}. ${formatarProcessoParaTexto(proc)}\n`;
    });
    console.log(`[Knowledge Retrieval] ${precedentes.length} precedentes encontrados`);
  } else {
    console.log("[Knowledge Retrieval] Nenhum precedente encontrado");
  }

  // Listar prazos processuais relevantes
  const prazosDisponiveis = listarPrazosDisponiveis();
  const prazosRelevantes = prazosDisponiveis
    .filter(p => 
      params.tipoDocumento.toLowerCase().includes(p.nome.toLowerCase().split(" ")[0]) ||
      params.contexto.toLowerCase().includes(p.nome.toLowerCase())
    )
    .slice(0, 3);

  let prazosTexto = "";
  if (prazosRelevantes.length > 0) {
    prazosTexto = "\n\n**PRAZOS PROCESSUAIS RELEVANTES:**\n";
    prazosRelevantes.forEach(prazo => {
      prazosTexto += `- ${prazo.nome}: ${prazo.dias} dias ${prazo.tipo} (${prazo.artigo})\n`;
    });
  }

  // Passo 2: Prompt de recuperação com conhecimento real
  const retrievalPrompt = `Para o seguinte caso jurídico, sintetize o conhecimento recuperado:

Tipo de Documento: ${params.tipoDocumento}
Área Jurídica: ${params.areaJuridica}
Contexto: ${params.contexto}
${params.objetivo ? `Objetivo: ${params.objetivo}` : ''}
${params.legislacao ? `Legislação Mencionada: ${params.legislacao}` : ''}
${precedentesTexto}
${prazosTexto}

Com base nos precedentes processuais REAIS acima e nos prazos aplicáveis, sintetize:
1. Legislação aplicável (códigos, leis, artigos específicos)
2. Análise dos precedentes recuperados e sua relevância
3. Doutrinas e princípios jurídicos pertinentes
4. Requisitos formais para este tipo de documento
5. Prazos processuais que devem ser mencionados
6. Estrutura recomendada baseada nos precedentes

Forneça uma síntese estruturada do conhecimento recuperado:`;

  const knowledgeResponse = await invokeUnifiedLLM({
    provider: params.provider,
    model: params.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: retrievalPrompt }
    ],
  });

  const knowledge = knowledgeResponse.content;

  // Passo 3: Gerar documento usando o conhecimento recuperado (precedentes + prazos)
  const geracaoPrompt = `Agora, utilizando o conhecimento jurídico recuperado, gere o ${params.tipoDocumento} completo e profissional.

CONHECIMENTO RECUPERADO:
${knowledge}

INFORMAÇÕES DO CASO:
Contexto: ${params.contexto}
${params.objetivo ? `Objetivo: ${params.objetivo}` : ''}
${params.partesEnvolvidas ? `Partes Envolvidas: ${params.partesEnvolvidas}` : ''}
${params.detalhes ? `Detalhes Adicionais: ${params.detalhes}` : ''}

INSTRUÇÕES:
- Aplique a legislação e jurisprudência identificadas
- Use linguagem jurídica formal e técnica
- Estruture conforme normas ABNT e padrões jurídicos
- Cite adequadamente as fontes legais
- Fundamente os argumentos com base no conhecimento recuperado

Gere APENAS o documento final, sem incluir a síntese de conhecimento:`;

  const documentoResponse = await invokeUnifiedLLM({
    provider: params.provider,
    model: params.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: retrievalPrompt },
      { role: "assistant", content: knowledge },
      { role: "user", content: geracaoPrompt }
    ],
  });

  return documentoResponse.content;
}

/**
 * Função principal que roteia para a estratégia apropriada
 */
export async function gerarDocumentoComEstrategia(params: ParametrosGeracao): Promise<{
  documento: string;
  estrategiaUsada: EstrategiaIA;
  metadados: {
    tipoDocumento: string;
    areaJuridica: string;
    timestamp: string; // ISO string para serialização tRPC
  };
}> {
  let documento: string;

  switch (params.estrategia) {
    case "chain_of_thought":
      documento = await gerarComChainOfThought(params);
      break;
    case "knowledge_retrieval":
      documento = await gerarComKnowledgeRetrieval(params);
      break;
    case "direct":
    default:
      documento = await gerarComDirect(params);
      break;
  }

  return {
    documento,
    estrategiaUsada: params.estrategia,
    metadados: {
      tipoDocumento: params.tipoDocumento,
      areaJuridica: params.areaJuridica,
      timestamp: new Date().toISOString(), // Converter para string ISO para serialização tRPC
    },
  };
}

/**
 * Descrições das estratégias para exibir ao usuário
 */
export const DESCRICOES_ESTRATEGIAS = {
  direct: {
    nome: "Resposta Direta",
    descricao: "Geração rápida e direta do documento. Ideal para casos simples ou quando você já tem todas as informações necessárias.",
    icone: "⚡",
  },
  chain_of_thought: {
    nome: "Raciocínio Passo a Passo",
    descricao: "A IA primeiro analisa o caso, identifica pontos-chave e argumentos, depois constrói o documento de forma estruturada. Ideal para casos complexos que exigem análise detalhada.",
    icone: "🧠",
  },
  knowledge_retrieval: {
    nome: "Recuperação de Conhecimento",
    descricao: "A IA primeiro recupera e sintetiza legislação, jurisprudência e doutrinas relevantes, depois aplica esse conhecimento na elaboração do documento. Ideal quando você precisa de fundamentação jurídica sólida.",
    icone: "📚",
  },
};
