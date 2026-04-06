/**
 * Módulo de geração de sugestões automáticas de prompts jurídicos.
 *
 * Ao final do wizard de 6 etapas, gera 3 variações do prompt por estratégia:
 *  1. Estratégia Direta — prompt objetivo e direto, ideal para tarefas bem definidas
 *  2. Estratégia de Raciocínio — prompt com cadeia de pensamento (CoT), para análises complexas
 *  3. Estratégia de Recuperação de Conhecimento — prompt com instruções para busca e citação de fontes
 */

export type EstrategiaPrompt = "direta" | "raciocinio" | "recuperacao";

export interface SugestaoPrompt {
  estrategia: EstrategiaPrompt;
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;
  prompt: string;
}

export interface ContextoWizard {
  areaJuridica?: string | null;
  tipoDocumento?: string | null;
  contextoAcumulado?: Record<string, string> | null;
  promptGerado?: string | null;
}

/**
 * Gera o system prompt para cada estratégia de geração de sugestões.
 */
export function gerarSystemPromptSugestao(estrategia: EstrategiaPrompt): string {
  const base = `Você é um especialista em engenharia de prompts jurídicos para o Direito brasileiro.
Sua tarefa é criar um prompt profissional e otimizado com base no contexto jurídico fornecido.

REGRAS CRÍTICAS:
- NUNCA invente jurisprudência, doutrina ou legislação
- Use apenas referências ao Direito brasileiro vigente
- O prompt deve ser claro, específico e acionável
- Formate o prompt final entre as tags <prompt> e </prompt>
- O prompt deve ser escrito em português brasileiro
- Inclua instruções para que a IA não invente jurisprudência`;

  const instrucoes: Record<EstrategiaPrompt, string> = {
    direta: `
## Estratégia: Direta e Objetiva

Crie um prompt DIRETO e OBJETIVO que:
- Especifica claramente o tipo de documento e área jurídica
- Define o contexto fático de forma concisa
- Lista os pedidos e fundamentos de forma estruturada
- Inclui instruções de formatação (ABNT, fonte Arial 12, espaçamento 1,5)
- É ideal para profissionais experientes que sabem exatamente o que querem
- Tamanho: 150-250 palavras

O prompt deve começar com: "Elabore [tipo de documento] referente a [área jurídica]..."`,

    raciocinio: `
## Estratégia: Raciocínio em Cadeia (Chain-of-Thought)

Crie um prompt que GUIA O RACIOCÍNIO JURÍDICO passo a passo:
- Instrui a IA a analisar o caso antes de redigir
- Solicita identificação dos fundamentos jurídicos aplicáveis
- Pede análise de precedentes relevantes (sem inventar)
- Solicita estruturação lógica dos argumentos
- Inclui etapas de verificação de consistência
- É ideal para casos complexos ou com múltiplas teses
- Tamanho: 200-350 palavras

O prompt deve começar com: "Antes de elaborar o documento, analise passo a passo..."`,

    recuperacao: `
## Estratégia: Recuperação de Conhecimento (RAG-style)

Crie um prompt que INSTRUI A BUSCA E CITAÇÃO DE FONTES:
- Solicita identificação de legislação aplicável (com artigos específicos)
- Instrui a buscar súmulas e jurisprudência dos tribunais superiores (STF, STJ)
- Pede citação apenas de fontes verificáveis e reais
- Inclui instrução explícita: "Se não tiver certeza sobre uma jurisprudência, não a cite"
- Solicita referências às fontes oficiais (planalto.gov.br, stf.jus.br, stj.jus.br)
- É ideal para peças que exigem fundamentação jurídica robusta
- Tamanho: 200-300 palavras

O prompt deve começar com: "Para elaborar este documento, primeiro identifique e liste..."`,
  };

  return base + instrucoes[estrategia];
}

/**
 * Gera o user prompt com o contexto acumulado do wizard.
 */
export function gerarUserPromptSugestao(contexto: ContextoWizard): string {
  const partes: string[] = [];

  if (contexto.areaJuridica) {
    partes.push(`**Área Jurídica:** ${contexto.areaJuridica}`);
  }
  if (contexto.tipoDocumento) {
    partes.push(`**Tipo de Documento:** ${contexto.tipoDocumento}`);
  }

  if (contexto.contextoAcumulado) {
    const ctx = contexto.contextoAcumulado;

    if (ctx.etapa_2_resposta) {
      partes.push(`**Partes e Contexto Fático:** ${ctx.etapa_2_resposta}`);
    }
    if (ctx.etapa_3_resposta) {
      partes.push(`**Pedidos e Fundamentos:** ${ctx.etapa_3_resposta}`);
    }
    if (ctx.etapa_4_resposta) {
      partes.push(`**Provas e Documentos:** ${ctx.etapa_4_resposta}`);
    }
    if (ctx.etapa_5_resposta) {
      partes.push(`**Estilo e Formalidade:** ${ctx.etapa_5_resposta}`);
    }
  }

  if (contexto.promptGerado) {
    partes.push(`\n**Prompt Base Gerado pelo Wizard:**\n${contexto.promptGerado}`);
  }

  return `Com base nas seguintes informações coletadas durante o wizard jurídico, gere o prompt otimizado:

${partes.join("\n")}

Gere agora o prompt jurídico profissional seguindo a estratégia especificada.`;
}

/**
 * Metadados das estratégias para exibição na UI.
 */
export const ESTRATEGIAS_INFO: Record<EstrategiaPrompt, Omit<SugestaoPrompt, "prompt">> = {
  direta: {
    estrategia: "direta",
    titulo: "Estratégia Direta",
    descricao: "Prompt objetivo e conciso, ideal para profissionais experientes com caso bem definido.",
    icone: "⚡",
    cor: "blue",
    prompt: "",
  },
  raciocinio: {
    estrategia: "raciocinio",
    titulo: "Raciocínio em Cadeia",
    descricao: "Guia a IA pelo raciocínio jurídico passo a passo, ideal para casos complexos.",
    icone: "🧠",
    cor: "purple",
    prompt: "",
  },
  recuperacao: {
    estrategia: "recuperacao",
    titulo: "Recuperação de Fontes",
    descricao: "Instrui a IA a buscar e citar fontes verificáveis (STF, STJ, legislação vigente).",
    icone: "📚",
    cor: "emerald",
    prompt: "",
  },
};

export const TOTAL_ETAPAS = 6;
