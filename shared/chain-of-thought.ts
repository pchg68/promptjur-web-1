/**
 * Chain of Thought Jurídico — Técnica de raciocínio passo a passo
 * baseada no conceito de "Chain of Thought Prompting" do documento
 * "Codificação Assistida por IA".
 *
 * Instrui o LLM a seguir uma cadeia de raciocínio jurídico estruturada:
 * Fatos → Enquadramento Legal → Fundamentação → Argumentação → Pedidos
 */

export interface EtapaRaciocinio {
  numero: number;
  titulo: string;
  descricao: string;
  icone: string;
}

export const ETAPAS_RACIOCINIO: EtapaRaciocinio[] = [
  { numero: 1, titulo: "Identificação dos Fatos", descricao: "Extrair e organizar cronologicamente os fatos juridicamente relevantes", icone: "📋" },
  { numero: 2, titulo: "Enquadramento Jurídico", descricao: "Classificar a situação fática nas categorias jurídicas aplicáveis", icone: "⚖️" },
  { numero: 3, titulo: "Fundamentação Legal", descricao: "Identificar legislação, doutrina e jurisprudência aplicáveis", icone: "📚" },
  { numero: 4, titulo: "Construção Argumentativa", descricao: "Desenvolver a tese jurídica com lógica e coerência", icone: "🧠" },
  { numero: 5, titulo: "Formulação dos Pedidos", descricao: "Elaborar pedidos certos, determinados e fundamentados", icone: "🎯" },
];

/**
 * Fragmento de system prompt que ativa o modo Chain of Thought.
 * Instrui o LLM a seguir raciocínio jurídico passo a passo.
 */
export const COT_SYSTEM_PROMPT_FRAGMENT = `
MODO RACIOCÍNIO JURÍDICO (Chain of Thought):
Antes de redigir o prompt final, siga obrigatoriamente esta cadeia de raciocínio jurídico:

ETAPA 1 — IDENTIFICAÇÃO DOS FATOS RELEVANTES:
- Extraia os fatos juridicamente relevantes do contexto fornecido
- Organize-os em ordem cronológica
- Identifique as partes envolvidas e seus papéis jurídicos
- Destaque datas, valores e documentos mencionados

ETAPA 2 — ENQUADRAMENTO JURÍDICO:
- Classifique a situação fática nas categorias jurídicas aplicáveis
- Identifique a natureza da relação jurídica (contratual, extracontratual, trabalhista, etc.)
- Determine a competência jurisdicional
- Verifique pressupostos processuais e condições da ação

ETAPA 3 — FUNDAMENTAÇÃO LEGAL:
- Identifique os dispositivos legais diretamente aplicáveis (artigos específicos)
- Busque jurisprudência consolidada (súmulas, teses repetitivas, repercussão geral)
- Considere doutrina majoritária quando pertinente
- Verifique se há legislação especial aplicável ao caso

ETAPA 4 — CONSTRUÇÃO ARGUMENTATIVA:
- Desenvolva a tese jurídica principal com lógica dedutiva
- Apresente argumentos subsidiários para fortalecer a posição
- Antecipe contra-argumentos e prepare respostas
- Mantenha coerência entre fatos, fundamentos e conclusões

ETAPA 5 — FORMULAÇÃO DOS PEDIDOS:
- Elabore pedidos certos e determinados
- Inclua pedidos subsidiários quando cabível
- Fundamente cada pedido em dispositivo legal específico
- Quantifique valores quando possível

O prompt final gerado DEVE refletir esse raciocínio estruturado, incorporando cada etapa de forma natural no texto.`;

/**
 * Verifica se o modo CoT está ativado e retorna o fragmento correspondente.
 */
export function buildCoTFragment(ativado: boolean): string {
  return ativado ? COT_SYSTEM_PROMPT_FRAGMENT : "";
}
