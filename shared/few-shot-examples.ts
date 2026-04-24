/**
 * Few-Shot Examples Expandidos — Biblioteca de exemplos curados
 * por tipo de documento jurídico, baseada no conceito de "Few-Shot Prompting"
 * do documento "Codificação Assistida por IA".
 *
 * Complementa os EXEMPLOS_FEW_SHOT de shared/juridico.ts com exemplos
 * para TODOS os tipos de documento, incluindo variações por área.
 */

export interface FewShotExample {
  tipoDocumento: string;
  area?: string;
  titulo: string;
  exemplo: string;
  /** Nível de qualidade do exemplo (para referência) */
  qualidade: "exemplar" | "bom";
}

export const FEW_SHOT_EXAMPLES_EXPANDIDOS: FewShotExample[] = [
  // ─── Agravo ────────────────────────────────────────────────────────────
  {
    tipoDocumento: "agravo",
    titulo: "Agravo de Instrumento contra decisão interlocutória",
    qualidade: "exemplar",
    exemplo: `EXEMPLO de prompt-agravo bem estruturado:
"Elabore agravo de instrumento (art. 1.015 CPC) contra decisão interlocutória que indeferiu tutela de urgência. Estruture com: (1) endereçamento ao tribunal competente; (2) demonstração do cabimento (art. 1.015, I, CPC); (3) tempestividade e preparo; (4) síntese da decisão agravada com transcrição do trecho relevante; (5) razões do agravo demonstrando o fumus boni iuris e periculum in mora; (6) pedido de efeito suspensivo/ativo (art. 1.019, I, CPC); (7) pedido de reforma da decisão. Cite jurisprudência do tribunal sobre concessão de tutela de urgência em casos análogos."`,
  },

  // ─── Apelação ──────────────────────────────────────────────────────────
  {
    tipoDocumento: "apelacao",
    titulo: "Apelação contra sentença de improcedência",
    qualidade: "exemplar",
    exemplo: `EXEMPLO de prompt-apelação bem estruturado:
"Elabore recurso de apelação (arts. 1.009-1.014 CPC) contra sentença de improcedência. Estruture com: (1) tempestividade e preparo; (2) síntese da sentença recorrida; (3) preliminar de cerceamento de defesa (se aplicável); (4) razões recursais detalhadas demonstrando error in judicando na valoração das provas e na aplicação do direito; (5) prequestionamento explícito dos dispositivos legais violados; (6) pedido de reforma para julgar procedentes os pedidos iniciais; (7) requerimento de sustentação oral. Fundamente com jurisprudência do STJ e do tribunal local."`,
  },

  // ─── Embargos ──────────────────────────────────────────────────────────
  {
    tipoDocumento: "embargos",
    titulo: "Embargos de Declaração por omissão",
    qualidade: "exemplar",
    exemplo: `EXEMPLO de prompt-embargos bem estruturado:
"Elabore embargos de declaração (art. 1.022 CPC) apontando omissão na decisão embargada. Estruture com: (1) tempestividade (art. 1.023 CPC — 5 dias); (2) cabimento — indicação precisa da omissão (art. 1.022, II, CPC); (3) transcrição do trecho omisso e do pedido/argumento não enfrentado; (4) demonstração da relevância do ponto omitido para o deslinde da causa; (5) pedido de suprimento da omissão com efeitos infringentes (se cabível); (6) prequestionamento para fins de recurso especial/extraordinário (art. 1.025 CPC). Tom objetivo, sem rediscutir o mérito."`,
  },

  // ─── Mandado de Segurança ──────────────────────────────────────────────
  {
    tipoDocumento: "mandado_seguranca",
    titulo: "Mandado de Segurança contra ato de autoridade",
    qualidade: "exemplar",
    exemplo: `EXEMPLO de prompt-mandado de segurança bem estruturado:
"Elabore mandado de segurança (Lei 12.016/2009) contra ato ilegal de autoridade pública. Estruture com: (1) endereçamento ao juízo competente; (2) qualificação do impetrante e identificação da autoridade coatora; (3) demonstração do direito líquido e certo com prova pré-constituída; (4) descrição do ato coator com data e fundamentação; (5) ilegalidade ou abuso de poder do ato (art. 1º, Lei 12.016/2009); (6) pedido liminar demonstrando fumus boni iuris e periculum in mora; (7) pedido de concessão da segurança; (8) requerimento de notificação da autoridade e ciência ao órgão de representação judicial. Prazo decadencial de 120 dias (art. 23)."`,
  },

  // ─── Habeas Corpus ─────────────────────────────────────────────────────
  {
    tipoDocumento: "habeas_corpus",
    titulo: "Habeas Corpus contra prisão ilegal",
    qualidade: "exemplar",
    exemplo: `EXEMPLO de prompt-habeas corpus bem estruturado:
"Elabore habeas corpus (art. 5º, LXVIII, CF e arts. 647-667 CPP) contra constrangimento ilegal à liberdade de locomoção. Estruture com: (1) endereçamento ao tribunal competente; (2) qualificação do paciente e identificação da autoridade coatora; (3) descrição do constrangimento ilegal sofrido; (4) fundamentação jurídica demonstrando a ilegalidade (ausência de justa causa, excesso de prazo, prisão sem fundamentação idônea); (5) pedido liminar para cessação imediata do constrangimento; (6) pedido de concessão da ordem para relaxamento/revogação da prisão ou expedição de alvará de soltura. Cite jurisprudência do STF sobre fundamentação de prisão preventiva."`,
  },

  // ─── Notificação Extrajudicial ─────────────────────────────────────────
  {
    tipoDocumento: "notificacao",
    titulo: "Notificação Extrajudicial de cobrança",
    qualidade: "exemplar",
    exemplo: `EXEMPLO de prompt-notificação bem estruturado:
"Elabore notificação extrajudicial de cobrança. Estruture com: (1) identificação completa do notificante e notificado; (2) descrição da obrigação inadimplida (contrato, data, valor); (3) demonstração da mora (art. 397 CC); (4) prazo para cumprimento voluntário (geralmente 5-15 dias); (5) consequências do não cumprimento (protesto, negativação, ação judicial); (6) forma de pagamento e dados bancários; (7) solicitação de confirmação de recebimento. Tom firme mas respeitoso. Incluir cláusula de que a notificação constitui o devedor em mora para fins do art. 397, parágrafo único, CC."`,
  },

  // ─── Procuração ────────────────────────────────────────────────────────
  {
    tipoDocumento: "procuracao",
    titulo: "Procuração ad judicia et extra",
    qualidade: "exemplar",
    exemplo: `EXEMPLO de prompt-procuração bem estruturado:
"Elabore procuração ad judicia et extra (art. 105 CPC). Estruture com: (1) qualificação completa do outorgante (nome, nacionalidade, estado civil, profissão, CPF, RG, endereço); (2) qualificação do outorgado (advogado — nome, OAB, endereço profissional); (3) poderes da cláusula ad judicia (art. 105 CPC); (4) poderes especiais quando necessários (art. 105, §1º CPC — receber citação, confessar, transigir, desistir, renunciar, receber e dar quitação); (5) especificação do objeto (processo específico ou poderes gerais); (6) cláusula de substabelecimento (com ou sem reserva de poderes); (7) local, data e assinatura."`,
  },

  // ─── Memorando ─────────────────────────────────────────────────────────
  {
    tipoDocumento: "memorando",
    titulo: "Memorando jurídico interno",
    qualidade: "exemplar",
    exemplo: `EXEMPLO de prompt-memorando bem estruturado:
"Elabore memorando jurídico interno para análise de risco. Estruture com: (1) destinatário e remetente; (2) assunto/referência; (3) síntese executiva (1 parágrafo com conclusão principal); (4) análise dos fatos relevantes; (5) questões jurídicas identificadas; (6) análise jurídica fundamentada com legislação e jurisprudência; (7) avaliação de riscos (probabilidade x impacto); (8) recomendações práticas com plano de ação; (9) prazo para providências. Tom direto e objetivo, sem prolixidade. Priorize clareza sobre formalidade."`,
  },

  // ─── Defesa ────────────────────────────────────────────────────────────
  {
    tipoDocumento: "defesa",
    titulo: "Defesa administrativa em processo disciplinar",
    qualidade: "exemplar",
    exemplo: `EXEMPLO de prompt-defesa bem estruturado:
"Elabore defesa administrativa em processo disciplinar. Estruture com: (1) identificação do processo e da autoridade processante; (2) qualificação do defendente; (3) preliminares (nulidades, prescrição, cerceamento de defesa); (4) síntese da acusação; (5) defesa de mérito — impugnação específica de cada fato imputado; (6) provas documentais e testemunhais a produzir; (7) atenuantes e circunstâncias favoráveis; (8) pedido de absolvição ou aplicação de penalidade mais branda; (9) requerimentos (diligências, oitiva de testemunhas). Fundamente na Lei 8.112/1990 e Lei 9.784/1999."`,
  },

  // ─── Contrato (variação) ───────────────────────────────────────────────
  {
    tipoDocumento: "contrato",
    area: "Empresarial",
    titulo: "Contrato de prestação de serviços empresariais",
    qualidade: "bom",
    exemplo: `EXEMPLO de prompt-contrato empresarial:
"Elabore contrato de prestação de serviços entre empresas. Inclua: (1) qualificação completa das partes (CNPJ, representantes legais); (2) considerandos com contexto comercial; (3) objeto detalhado dos serviços com escopo e entregas; (4) preço, forma de pagamento e reajuste; (5) prazo de vigência e renovação; (6) obrigações de cada parte com SLAs; (7) confidencialidade e LGPD; (8) propriedade intelectual; (9) rescisão, multas e penalidades; (10) limitação de responsabilidade; (11) foro de eleição e cláusula arbitral opcional. Linguagem clara, sem ambiguidades."`,
  },
];

/**
 * Retorna exemplos few-shot relevantes para o tipo de documento e área.
 * Prioriza exemplos específicos da área, depois exemplos gerais do tipo.
 */
export function getFewShotExamples(tipoDocumento: string, area?: string): FewShotExample[] {
  const porTipo = FEW_SHOT_EXAMPLES_EXPANDIDOS.filter(e => e.tipoDocumento === tipoDocumento);
  if (area) {
    const porArea = porTipo.filter(e => e.area === area);
    const semArea = porTipo.filter(e => !e.area);
    return [...porArea, ...semArea];
  }
  return porTipo;
}

/**
 * Monta o fragmento de few-shot para inclusão no system prompt.
 * Retorna no máximo 2 exemplos para não inflar tokens.
 */
export function buildFewShotFragment(tipoDocumento: string, area?: string): string {
  const exemplos = getFewShotExamples(tipoDocumento, area);
  if (exemplos.length === 0) return "";
  const selecionados = exemplos.slice(0, 2);
  return selecionados.map(e => e.exemplo).join("\n\n");
}
