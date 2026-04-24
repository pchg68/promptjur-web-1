/**
 * Refinamento Iterativo — Botões de refinamento pós-geração
 * baseado no conceito de "Iterative Refinement" do documento
 * "Codificação Assistida por IA".
 *
 * Permite ao usuário refinar o prompt gerado com instruções
 * específicas sem precisar regerar do zero.
 */

export interface TipoRefinamento {
  id: string;
  label: string;
  descricao: string;
  icone: string;
  /** Instrução que será enviada ao LLM para refinar o prompt */
  instrucaoLLM: string;
  /** Categoria visual */
  categoria: "tom" | "conteudo" | "estrutura" | "tecnico";
}

export const TIPOS_REFINAMENTO: TipoRefinamento[] = [
  // ─── Tom ───────────────────────────────────────────────────────────────
  {
    id: "mais_formal",
    label: "Mais Formal",
    descricao: "Aumentar a formalidade e o rigor técnico da linguagem",
    icone: "👔",
    categoria: "tom",
    instrucaoLLM: `Refine o prompt abaixo para torná-lo MAIS FORMAL e TÉCNICO. Substitua expressões coloquiais por termos jurídicos precisos. Use voz passiva quando adequado. Mantenha o tom impessoal e a linguagem forense. Preserve todo o conteúdo substantivo — apenas ajuste o registro linguístico.`,
  },
  {
    id: "mais_acessivel",
    label: "Mais Acessível",
    descricao: "Simplificar a linguagem mantendo o rigor jurídico",
    icone: "💬",
    categoria: "tom",
    instrucaoLLM: `Refine o prompt abaixo para torná-lo MAIS ACESSÍVEL sem perder o rigor jurídico. Substitua jargões desnecessários por termos mais claros. Quebre frases longas. Adicione explicações breves entre parênteses para termos técnicos essenciais. Preserve toda a fundamentação legal.`,
  },
  {
    id: "mais_persuasivo",
    label: "Mais Persuasivo",
    descricao: "Fortalecer a argumentação e o poder de convencimento",
    icone: "🎯",
    categoria: "tom",
    instrucaoLLM: `Refine o prompt abaixo para torná-lo MAIS PERSUASIVO. Fortaleça os argumentos com técnicas retóricas jurídicas. Adicione ênfases nos pontos fortes. Antecipe e refute possíveis contra-argumentos. Use construções que guiem o leitor à conclusão desejada. Mantenha o tom profissional.`,
  },

  // ─── Conteúdo ──────────────────────────────────────────────────────────
  {
    id: "adicionar_jurisprudencia",
    label: "Mais Jurisprudência",
    descricao: "Solicitar inclusão de jurisprudência relevante",
    icone: "⚖️",
    categoria: "conteudo",
    instrucaoLLM: `Refine o prompt abaixo adicionando instruções para que a IA-alvo inclua JURISPRUDÊNCIA RELEVANTE. Solicite citação de: (1) súmulas vinculantes e do STJ/STF aplicáveis; (2) teses fixadas em repercussão geral ou recursos repetitivos; (3) precedentes recentes do tribunal competente. Mantenha todo o conteúdo existente.`,
  },
  {
    id: "adicionar_doutrina",
    label: "Mais Doutrina",
    descricao: "Solicitar inclusão de referências doutrinárias",
    icone: "📚",
    categoria: "conteudo",
    instrucaoLLM: `Refine o prompt abaixo adicionando instruções para que a IA-alvo inclua REFERÊNCIAS DOUTRINÁRIAS. Solicite citação de autores consagrados na área jurídica pertinente, com indicação de obra e posicionamento. Priorize doutrina majoritária. Mantenha todo o conteúdo existente.`,
  },
  {
    id: "expandir_fundamentacao",
    label: "Expandir Fundamentação",
    descricao: "Aprofundar a fundamentação jurídica",
    icone: "📖",
    categoria: "conteudo",
    instrucaoLLM: `Refine o prompt abaixo EXPANDINDO A FUNDAMENTAÇÃO JURÍDICA. Adicione: (1) mais dispositivos legais aplicáveis; (2) princípios jurídicos relevantes; (3) análise mais detalhada da subsunção dos fatos à norma. Mantenha a estrutura existente e adicione profundidade.`,
  },

  // ─── Estrutura ─────────────────────────────────────────────────────────
  {
    id: "melhorar_estrutura",
    label: "Melhorar Estrutura",
    descricao: "Reorganizar e melhorar a estrutura do prompt",
    icone: "🏗️",
    categoria: "estrutura",
    instrucaoLLM: `Refine o prompt abaixo MELHORANDO SUA ESTRUTURA. Reorganize em seções claras com títulos. Garanta progressão lógica: contexto → fatos → fundamentação → pedidos. Elimine redundâncias. Adicione marcadores e numeração onde apropriado. Preserve todo o conteúdo substantivo.`,
  },
  {
    id: "resumir",
    label: "Resumir / Condensar",
    descricao: "Tornar o prompt mais conciso sem perder informação essencial",
    icone: "✂️",
    categoria: "estrutura",
    instrucaoLLM: `Refine o prompt abaixo tornando-o MAIS CONCISO. Elimine repetições, redundâncias e informações não essenciais. Mantenha apenas o que é juridicamente relevante. Preserve toda a fundamentação legal e os pedidos. Objetivo: reduzir em ~30% sem perda de qualidade.`,
  },

  // ─── Técnico ───────────────────────────────────────────────────────────
  {
    id: "verificar_prazos",
    label: "Verificar Prazos",
    descricao: "Adicionar instruções sobre prazos processuais",
    icone: "⏰",
    categoria: "tecnico",
    instrucaoLLM: `Refine o prompt abaixo adicionando instruções sobre PRAZOS PROCESSUAIS. Solicite que a IA-alvo: (1) verifique e mencione os prazos aplicáveis ao tipo de peça; (2) considere a contagem em dias úteis (art. 219 CPC); (3) alerte sobre prazos peremptórios; (4) indique se há urgência que justifique tutela provisória.`,
  },
  {
    id: "adicionar_pedidos_subsidiarios",
    label: "Pedidos Subsidiários",
    descricao: "Adicionar instruções para pedidos alternativos/subsidiários",
    icone: "🔄",
    categoria: "tecnico",
    instrucaoLLM: `Refine o prompt abaixo adicionando instruções para que a IA-alvo inclua PEDIDOS SUBSIDIÁRIOS E ALTERNATIVOS. Solicite: (1) pedido principal mantido; (2) pedido subsidiário para hipótese de improcedência parcial; (3) pedido alternativo quando cabível (art. 326 CPC); (4) pedido de honorários e custas em qualquer hipótese.`,
  },
];

/**
 * Retorna refinamentos agrupados por categoria.
 */
export function getRefinamentosPorCategoria(): Record<string, TipoRefinamento[]> {
  const grupos: Record<string, TipoRefinamento[]> = {};
  for (const r of TIPOS_REFINAMENTO) {
    if (!grupos[r.categoria]) grupos[r.categoria] = [];
    grupos[r.categoria].push(r);
  }
  return grupos;
}

/**
 * Retorna um refinamento pelo ID.
 */
export function getRefinamentoById(id: string): TipoRefinamento | undefined {
  return TIPOS_REFINAMENTO.find(r => r.id === id);
}

/**
 * Labels das categorias para exibição na UI.
 */
export const CATEGORIAS_REFINAMENTO: Record<string, { label: string; icone: string }> = {
  tom: { label: "Tom e Estilo", icone: "🎨" },
  conteudo: { label: "Conteúdo Jurídico", icone: "📋" },
  estrutura: { label: "Estrutura", icone: "🏗️" },
  tecnico: { label: "Técnico-Processual", icone: "⚙️" },
};
