/**
 * Briefing Jurídico Estruturado — Wizard guiado para coleta de informações
 * baseado no conceito de "SPEC.md" do documento "Codificação Assistida por IA".
 *
 * Define os campos do briefing, templates por área e a lógica de montagem
 * do contexto enriquecido para o LLM.
 */

export interface CampoBriefing {
  id: string;
  label: string;
  placeholder: string;
  tipo: "text" | "textarea" | "select" | "date" | "multiselect";
  obrigatorio: boolean;
  /** Dica contextual para o usuário */
  dica?: string;
  /** Opções para campos select/multiselect */
  opcoes?: string[];
}

/**
 * Campos do briefing jurídico estruturado.
 * Cada campo é uma informação que o advogado deve fornecer para
 * maximizar a qualidade do prompt gerado.
 */
export const CAMPOS_BRIEFING: CampoBriefing[] = [
  {
    id: "parteAtiva",
    label: "Parte Ativa (Autor/Requerente)",
    placeholder: "Nome completo, CPF/CNPJ, qualificação...",
    tipo: "textarea",
    obrigatorio: true,
    dica: "Qualifique completamente: nome, nacionalidade, estado civil, profissão, CPF/CNPJ, RG, endereço.",
  },
  {
    id: "partePassiva",
    label: "Parte Passiva (Réu/Requerido)",
    placeholder: "Nome completo, CPF/CNPJ, qualificação...",
    tipo: "textarea",
    obrigatorio: true,
    dica: "Se houver múltiplos réus, qualifique cada um separadamente.",
  },
  {
    id: "fatosRelevantes",
    label: "Fatos Relevantes",
    placeholder: "Descreva os fatos em ordem cronológica...",
    tipo: "textarea",
    obrigatorio: true,
    dica: "Inclua datas, valores, locais e documentos que comprovam cada fato. Seja cronológico.",
  },
  {
    id: "questoesJuridicas",
    label: "Questões Jurídicas",
    placeholder: "Quais são as questões de direito envolvidas?",
    tipo: "textarea",
    obrigatorio: false,
    dica: "Ex: Responsabilidade civil objetiva? Prescrição? Inversão do ônus da prova?",
  },
  {
    id: "pretensao",
    label: "Pretensão / Pedidos",
    placeholder: "O que se pretende obter com a peça jurídica?",
    tipo: "textarea",
    obrigatorio: true,
    dica: "Liste cada pedido separadamente. Inclua valores quando possível.",
  },
  {
    id: "tribunal",
    label: "Tribunal / Juízo Competente",
    placeholder: "Ex: Vara Cível de São Paulo, TJ-SP, STJ...",
    tipo: "text",
    obrigatorio: false,
    dica: "Indique a comarca, vara e tribunal. Isso ajuda na adequação da linguagem e jurisprudência.",
  },
  {
    id: "prazo",
    label: "Prazo Processual",
    placeholder: "Ex: 15 dias úteis a partir de 01/01/2026",
    tipo: "text",
    obrigatorio: false,
    dica: "Se houver prazo correndo, informe a data final para priorização.",
  },
  {
    id: "documentosDisponiveis",
    label: "Documentos Disponíveis",
    placeholder: "Liste os documentos que possui como prova...",
    tipo: "textarea",
    obrigatorio: false,
    dica: "Ex: contrato, notas fiscais, e-mails, fotos, laudos, certidões. Você também pode anexar documentos no campo acima.",
  },
  {
    id: "legislacaoAplicavel",
    label: "Legislação que deseja aplicar",
    placeholder: "Ex: Art. 186 CC, Art. 5º CF, Lei 8.078/90...",
    tipo: "textarea",
    obrigatorio: false,
    dica: "Se já sabe quais artigos ou leis quer usar, liste-os aqui.",
  },
  {
    id: "jurisprudenciaConhecida",
    label: "Jurisprudência Conhecida",
    placeholder: "Súmulas, teses ou decisões que conhece...",
    tipo: "textarea",
    obrigatorio: false,
    dica: "Ex: Súmula 297 STJ, Tema 1000 STF. Isso enriquece a fundamentação.",
  },
  {
    id: "observacoes",
    label: "Observações Adicionais",
    placeholder: "Qualquer informação relevante não coberta acima...",
    tipo: "textarea",
    obrigatorio: false,
    dica: "Estratégia processual, urgência, particularidades do caso, etc.",
  },
];

export interface BriefingData {
  [key: string]: string;
}

/**
 * Monta o contexto enriquecido a partir dos dados do briefing.
 * Transforma os campos preenchidos em um texto estruturado
 * que será injetado no contexto da geração.
 */
export function montarContextoBriefing(dados: BriefingData): string {
  const partes: string[] = [];

  if (dados.parteAtiva?.trim()) {
    partes.push(`PARTE ATIVA (AUTOR/REQUERENTE):\n${dados.parteAtiva.trim()}`);
  }
  if (dados.partePassiva?.trim()) {
    partes.push(`PARTE PASSIVA (RÉU/REQUERIDO):\n${dados.partePassiva.trim()}`);
  }
  if (dados.fatosRelevantes?.trim()) {
    partes.push(`FATOS RELEVANTES (em ordem cronológica):\n${dados.fatosRelevantes.trim()}`);
  }
  if (dados.questoesJuridicas?.trim()) {
    partes.push(`QUESTÕES JURÍDICAS:\n${dados.questoesJuridicas.trim()}`);
  }
  if (dados.pretensao?.trim()) {
    partes.push(`PRETENSÃO / PEDIDOS:\n${dados.pretensao.trim()}`);
  }
  if (dados.tribunal?.trim()) {
    partes.push(`TRIBUNAL / JUÍZO COMPETENTE: ${dados.tribunal.trim()}`);
  }
  if (dados.prazo?.trim()) {
    partes.push(`PRAZO PROCESSUAL: ${dados.prazo.trim()}`);
  }
  if (dados.documentosDisponiveis?.trim()) {
    partes.push(`DOCUMENTOS DISPONÍVEIS:\n${dados.documentosDisponiveis.trim()}`);
  }
  if (dados.legislacaoAplicavel?.trim()) {
    partes.push(`LEGISLAÇÃO APLICÁVEL:\n${dados.legislacaoAplicavel.trim()}`);
  }
  if (dados.jurisprudenciaConhecida?.trim()) {
    partes.push(`JURISPRUDÊNCIA CONHECIDA:\n${dados.jurisprudenciaConhecida.trim()}`);
  }
  if (dados.observacoes?.trim()) {
    partes.push(`OBSERVAÇÕES ADICIONAIS:\n${dados.observacoes.trim()}`);
  }

  return partes.join("\n\n");
}

/**
 * Calcula a completude do briefing (0-100%).
 * Campos obrigatórios pesam mais que opcionais.
 */
export function calcularCompletudeBriefing(dados: BriefingData): {
  percentual: number;
  camposPreenchidos: number;
  camposTotal: number;
  camposFaltantes: string[];
} {
  let pontos = 0;
  let maxPontos = 0;
  const camposFaltantes: string[] = [];
  let preenchidos = 0;

  for (const campo of CAMPOS_BRIEFING) {
    const peso = campo.obrigatorio ? 3 : 1;
    maxPontos += peso;
    if (dados[campo.id]?.trim()) {
      pontos += peso;
      preenchidos++;
    } else if (campo.obrigatorio) {
      camposFaltantes.push(campo.label);
    }
  }

  return {
    percentual: Math.round((pontos / maxPontos) * 100),
    camposPreenchidos: preenchidos,
    camposTotal: CAMPOS_BRIEFING.length,
    camposFaltantes,
  };
}
