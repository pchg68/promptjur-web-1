/**
 * Checklist de Contexto (pré-geração) e Checklist de Revisão (pós-geração)
 * baseados nos conceitos de "Context Engineering" e "Human-in-the-Loop"
 * do documento "Codificação Assistida por IA".
 */

// ─── Checklist de Contexto (pré-geração) ─────────────────────────────────────

export interface ItemChecklist {
  id: string;
  label: string;
  descricao: string;
  /** Campo do formulário que satisfaz este item */
  campoRelacionado?: string;
  /** Peso para o cálculo de completude (1-3) */
  peso: number;
}

/**
 * Itens do checklist de contexto — o que o advogado deveria fornecer
 * antes de gerar o prompt para maximizar a qualidade.
 */
export const CHECKLIST_CONTEXTO: ItemChecklist[] = [
  {
    id: "tipo_documento",
    label: "Tipo de documento definido",
    descricao: "Selecionar o tipo de peça jurídica a ser gerada",
    campoRelacionado: "tipoDocumento",
    peso: 3,
  },
  {
    id: "contexto_fatos",
    label: "Fatos do caso descritos",
    descricao: "Descrever os fatos relevantes com detalhes suficientes",
    campoRelacionado: "contexto",
    peso: 3,
  },
  {
    id: "objetivo_definido",
    label: "Objetivo claramente definido",
    descricao: "Especificar o que se espera como resultado da peça",
    campoRelacionado: "objetivo",
    peso: 3,
  },
  {
    id: "area_juridica",
    label: "Área jurídica selecionada",
    descricao: "Selecionar a área do direito aplicável ao caso",
    campoRelacionado: "areaJuridica",
    peso: 2,
  },
  {
    id: "partes_identificadas",
    label: "Partes identificadas",
    descricao: "Informar as partes envolvidas no caso",
    campoRelacionado: "parteContraria",
    peso: 2,
  },
  {
    id: "fundamentacao",
    label: "Fundamentação legal indicada",
    descricao: "Indicar artigos de lei ou legislação específica",
    campoRelacionado: "fundamentacao",
    peso: 1,
  },
  {
    id: "tribunal",
    label: "Tribunal/Juízo informado",
    descricao: "Indicar o tribunal ou juízo competente",
    campoRelacionado: "tribunal",
    peso: 1,
  },
  {
    id: "documentos_anexados",
    label: "Documentos anexados",
    descricao: "Anexar documentos relevantes do caso (contratos, decisões, etc.)",
    campoRelacionado: "attachedDocs",
    peso: 1,
  },
];

/**
 * Calcula o status do checklist de contexto com base nos campos preenchidos.
 */
export function calcularChecklistContexto(campos: Record<string, any>): {
  itens: Array<ItemChecklist & { preenchido: boolean }>;
  percentual: number;
  nivel: "incompleto" | "basico" | "bom" | "completo";
} {
  let pontos = 0;
  let maxPontos = 0;

  const itens = CHECKLIST_CONTEXTO.map(item => {
    maxPontos += item.peso;
    let preenchido = false;

    if (item.campoRelacionado) {
      const valor = campos[item.campoRelacionado];
      if (Array.isArray(valor)) {
        preenchido = valor.length > 0;
      } else if (typeof valor === "string") {
        preenchido = valor.trim().length > 0;
      } else {
        preenchido = !!valor;
      }
    }

    if (preenchido) pontos += item.peso;
    return { ...item, preenchido };
  });

  const percentual = Math.round((pontos / maxPontos) * 100);
  const nivel = percentual >= 90 ? "completo" : percentual >= 70 ? "bom" : percentual >= 40 ? "basico" : "incompleto";

  return { itens, percentual, nivel };
}

// ─── Checklist de Revisão (pós-geração) ──────────────────────────────────────

export interface ItemRevisao {
  id: string;
  label: string;
  descricao: string;
  /** Categoria do item */
  categoria: "fundamentacao" | "processual" | "formal" | "etica";
}

/**
 * Itens do checklist de revisão — o que o advogado deve verificar
 * DEPOIS que o prompt/documento foi gerado pela IA.
 */
export const CHECKLIST_REVISAO: ItemRevisao[] = [
  // Fundamentação
  {
    id: "artigos_verificados",
    label: "Artigos de lei verificados",
    descricao: "Conferir se todos os artigos citados existem e estão vigentes",
    categoria: "fundamentacao",
  },
  {
    id: "jurisprudencia_real",
    label: "Jurisprudência é real",
    descricao: "Verificar se as decisões e súmulas citadas realmente existem",
    categoria: "fundamentacao",
  },
  {
    id: "fundamentacao_coerente",
    label: "Fundamentação coerente com pedidos",
    descricao: "Verificar se há conexão lógica entre fundamentação e pedidos",
    categoria: "fundamentacao",
  },

  // Processual
  {
    id: "competencia_correta",
    label: "Competência jurisdicional correta",
    descricao: "Verificar se o juízo/tribunal indicado é competente para a causa",
    categoria: "processual",
  },
  {
    id: "prazos_corretos",
    label: "Prazos processuais corretos",
    descricao: "Conferir se os prazos mencionados estão de acordo com a lei",
    categoria: "processual",
  },
  {
    id: "legitimidade_partes",
    label: "Legitimidade das partes",
    descricao: "Verificar se as partes têm legitimidade ativa e passiva",
    categoria: "processual",
  },
  {
    id: "pedidos_adequados",
    label: "Pedidos certos e determinados",
    descricao: "Verificar se os pedidos são certos, determinados e juridicamente possíveis",
    categoria: "processual",
  },

  // Formal
  {
    id: "qualificacao_partes",
    label: "Qualificação completa das partes",
    descricao: "Verificar se as partes estão devidamente qualificadas (art. 319, II CPC)",
    categoria: "formal",
  },
  {
    id: "valor_causa",
    label: "Valor da causa adequado",
    descricao: "Verificar se o valor da causa foi corretamente atribuído",
    categoria: "formal",
  },
  {
    id: "formatacao_adequada",
    label: "Formatação adequada",
    descricao: "Verificar se o documento segue as normas de formatação do tribunal",
    categoria: "formal",
  },

  // Ética
  {
    id: "dados_sensiveis",
    label: "Dados sensíveis protegidos",
    descricao: "Verificar se dados pessoais sensíveis estão adequadamente tratados",
    categoria: "etica",
  },
  {
    id: "sem_alucinacoes",
    label: "Sem informações fabricadas",
    descricao: "Verificar se não há fatos, decisões ou artigos inventados pela IA",
    categoria: "etica",
  },
];

/**
 * Labels das categorias de revisão.
 */
export const CATEGORIAS_REVISAO: Record<string, { label: string; icone: string }> = {
  fundamentacao: { label: "Fundamentação", icone: "📚" },
  processual: { label: "Processual", icone: "⚖️" },
  formal: { label: "Formal", icone: "📝" },
  etica: { label: "Ética e Verificação", icone: "🛡️" },
};

/**
 * Agrupa itens de revisão por categoria.
 */
export function getRevisaoPorCategoria(): Record<string, ItemRevisao[]> {
  const grupos: Record<string, ItemRevisao[]> = {};
  for (const item of CHECKLIST_REVISAO) {
    if (!grupos[item.categoria]) grupos[item.categoria] = [];
    grupos[item.categoria].push(item);
  }
  return grupos;
}
