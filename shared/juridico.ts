/**
 * Áreas jurídicas suportadas pelo PromptJur
 */
export const AREAS_JURIDICAS = [
  "Civil",
  "Penal",
  "Trabalhista",
  "Tributário",
  "Administrativo",
  "Constitucional",
  "Empresarial",
  "Consumidor",
  "Família",
  "Previdenciário",
  "Ambiental",
  "Internacional",
  "Processo Civil",
  "Direito Médico",
  "Direito Digital",
  "Direito Internacional"
] as const;

export type AreaJuridica = typeof AREAS_JURIDICAS[number];

/**
 * Tipos de documento jurídico suportados pelo gerador de prompts.
 * Fonte única de verdade — usada tanto pelo Zod no backend
 * quanto pelos selects do frontend.
 */
export const TIPOS_DOCUMENTO = [
  { value: "peticao", label: "Petição Inicial" },
  { value: "contestacao", label: "Contestação" },
  { value: "recurso", label: "Recurso" },
  { value: "agravo", label: "Agravo" },
  { value: "apelacao", label: "Apelação" },
  { value: "embargos", label: "Embargos" },
  { value: "mandado_seguranca", label: "Mandado de Segurança" },
  { value: "habeas_corpus", label: "Habeas Corpus" },
  { value: "parecer", label: "Parecer Jurídico" },
  { value: "contrato", label: "Contrato" },
  { value: "notificacao", label: "Notificação Extrajudicial" },
  { value: "procuracao", label: "Procuração" },
  { value: "memorando", label: "Memorando" },
  { value: "defesa", label: "Defesa" },
  { value: "outro", label: "Outro" },
] as const;

export const TIPO_DOCUMENTO_VALUES = TIPOS_DOCUMENTO.map(t => t.value);
export type TipoDocumento = typeof TIPOS_DOCUMENTO[number]["value"];

/**
 * Palavras-chave por área jurídica para identificação automática
 */
export const PALAVRAS_CHAVE_AREAS: Record<string, string[]> = {
  "Civil": ["contrato", "obrigação", "responsabilidade civil", "dano", "indenização", "código civil", "posse", "propriedade"],
  "Penal": ["crime", "pena", "prisão", "código penal", "réu", "acusado", "sentença penal", "defesa criminal"],
  "Trabalhista": ["empregado", "empregador", "CLT", "rescisão", "FGTS", "férias", "salário", "justa causa"],
  "Tributário": ["imposto", "tributo", "ICMS", "ISS", "IR", "contribuição", "fiscal", "receita federal"],
  "Administrativo": ["servidor público", "licitação", "contrato administrativo", "poder público", "ato administrativo"],
  "Constitucional": ["constituição", "direito fundamental", "STF", "inconstitucionalidade", "mandado de segurança"],
  "Empresarial": ["sociedade", "empresa", "falência", "recuperação judicial", "CNPJ", "contrato social"],
  "Consumidor": ["CDC", "consumidor", "fornecedor", "produto", "serviço", "vício", "defeito"],
  "Família": ["divórcio", "guarda", "alimentos", "pensão", "união estável", "adoção", "filiação"],
  "Previdenciário": ["INSS", "aposentadoria", "benefício", "auxílio", "previdência", "contribuição previdenciária"],
  "Ambiental": ["meio ambiente", "licença ambiental", "dano ambiental", "IBAMA", "poluição", "preservação"],
  "Internacional": ["tratado", "convenção", "direito internacional", "extradição", "arbitragem internacional"],
  "Processo Civil": ["CPC", "petição inicial", "contestação", "sentença", "recurso", "apelação", "agravo", "execução", "prova", "audiência", "citação", "intimação", "prazo processual", "tutela de urgência"],
  "Direito Médico": ["erro médico", "prontuário", "CRM", "responsabilidade médica", "hospital", "cirurgia", "diagnóstico", "tratamento", "conselho de medicina", "ética médica"],
  "Direito Digital": ["LGPD", "dados pessoais", "privacidade", "Marco Civil da Internet", "crimes cibernéticos", "proteção de dados", "internet", "e-commerce", "assinatura digital", "blockchain"],
  "Direito Internacional": ["tratado internacional", "convenção internacional", "soberania", "organização internacional", "ONU", "corte internacional", "direito humanitário", "refugiados", "comércio internacional"]
};

/**
 * Templates base por área jurídica
 */
export const TEMPLATES_BASE: Record<string, string> = {
  "Civil": `Elabore [TIPO_PECA] fundamentada nos artigos [ARTIGOS] do Código Civil (Lei 10.406/2002), incluindo:
1) Qualificação completa das partes
2) Narrativa dos fatos com cronologia detalhada
3) Fundamentação jurídica robusta
4) Pedidos específicos e valorados
5) Requerimentos processuais pertinentes
Utilize linguagem técnica e formal, com citações de jurisprudência do STJ quando aplicável.`,

  "Penal": `Elabore [TIPO_PECA] com base nos artigos [ARTIGOS] do Código Penal (Decreto-Lei 2.848/1940) e Código de Processo Penal (Decreto-Lei 3.689/1941), contemplando:
1) Qualificação do réu/acusado
2) Descrição detalhada dos fatos
3) Tipificação penal adequada
4) Fundamentação jurídica com jurisprudência
5) Pedidos e requerimentos
Observe os princípios constitucionais da presunção de inocência e ampla defesa.`,

  "Trabalhista": `Elabore [TIPO_PECA] fundamentada na CLT (Decreto-Lei 5.452/1943) e artigos [ARTIGOS], abordando:
1) Qualificação das partes (reclamante e reclamada)
2) Relação de emprego e suas características
3) Direitos trabalhistas violados
4) Cálculos e valores devidos
5) Pedidos específicos
Cite jurisprudência do TST e súmulas aplicáveis ao caso.`,

  "Tributário": `Elabore [TIPO_PECA] com fundamento no CTN (Lei 5.172/1966) e artigos [ARTIGOS], incluindo:
1) Qualificação do contribuinte
2) Descrição do fato gerador
3) Análise da legislação tributária aplicável
4) Fundamentação jurídica
5) Pedidos e requerimentos
Considere jurisprudência do STJ e STF sobre a matéria tributária.`,

  "Administrativo": `Elabore [TIPO_PECA] fundamentada na Lei 9.784/1999 (Processo Administrativo Federal), Lei 14.133/2021 (Licitações) e artigos [ARTIGOS], abordando:
1) Qualificação das partes (administrado e órgão público)
2) Descrição do ato administrativo questionado
3) Princípios da legalidade, impessoalidade, moralidade, publicidade e eficiência (art. 37 CF/88)
4) Fundamentação jurídica com doutrina e jurisprudência do STJ/STF
5) Pedidos específicos (anulação, revisão, indenização)
Considere os limites da discricionariedade administrativa e o controle judicial dos atos administrativos.`,

  "Empresarial": `Elabore [TIPO_PECA] com base na Lei 6.404/1976 (S/A), Lei 11.101/2005 (Recuperação Judicial e Falências), Código Civil (arts. 966 a 1.195) e artigos [ARTIGOS], contemplando:
1) Qualificação completa das partes (sociedade, sócios, administradores)
2) Histórico societário e contratual relevante
3) Análise da relação jurídica empresarial
4) Fundamentação com legislação societária e jurisprudência do STJ
5) Pedidos específicos com valoração comercial
Atenção à função social da empresa, preservação da atividade econômica e princípios da boa-fé objetiva.`,

  "Consumidor": `Elabore [TIPO_PECA] fundamentada no CDC (Lei 8.078/1990) e artigos [ARTIGOS], incluindo:
1) Qualificação das partes (consumidor e fornecedor — arts. 2º e 3º CDC)
2) Caracterização da relação de consumo
3) Vício/defeito do produto ou serviço (arts. 12, 14, 18, 20 CDC)
4) Responsabilidade objetiva do fornecedor
5) Pedidos: restituição, substituição, indenização por danos materiais e morais
6) Inversão do ônus da prova (art. 6º, VIII CDC)
Cite súmulas do STJ aplicáveis e jurisprudência consumerista consolidada.`,

  "Família": `Elabore [TIPO_PECA] fundamentada no Código Civil (Livro IV — arts. 1.511 a 1.783-A), Lei 11.340/2006 (Maria da Penha), ECA (Lei 8.069/1990) quando aplicável, e artigos [ARTIGOS], abordando:
1) Qualificação das partes (incluindo crianças/adolescentes quando houver)
2) Histórico familiar relevante (união, separação, filhos)
3) Pedidos específicos (divórcio, guarda, alimentos, visitas, partilha)
4) Princípio do melhor interesse da criança (quando aplicável)
5) Necessidade x possibilidade (binômio dos alimentos)
Observe o sigilo legal (segredo de justiça nos termos do art. 189, II CPC) e cite jurisprudência do STJ sobre direito de família.`,

  "Processo Civil": `Elabore [TIPO_PECA] em estrita observância ao CPC (Lei 13.105/2015) e artigos [ARTIGOS], contemplando:
1) Endereçamento ao juízo competente (arts. 42 a 66 CPC)
2) Qualificação completa das partes (art. 319, II CPC)
3) Fatos e fundamentos jurídicos do pedido (art. 319, III CPC)
4) Pedido com suas especificações (art. 319, IV CPC)
5) Valor da causa (art. 319, V CPC) e provas pretendidas (art. 319, VI CPC)
6) Requerimentos processuais (citação, intimação, tutelas, gratuidade)
Atenção aos prazos processuais (art. 219 CPC — dias úteis), princípios do contraditório e ampla defesa, e estabilidade da demanda.`
};

/**
 * Few-shot examples — exemplos curtos por tipo de documento usados no
 * metaprompt do gerador de prompts (`promptsRouter.gerar`). Cada exemplo
 * mostra ao LLM o estilo, profundidade e estrutura esperados.
 *
 * Mantemos os exemplos enxutos (4-8 linhas) por dois motivos:
 *  1. Caber no system prompt sem inflar tokens
 *  2. Demonstrar formato sem prescrever conteúdo
 */
export const EXEMPLOS_FEW_SHOT: Record<string, string> = {
  "peticao": `EXEMPLO de prompt-petição bem estruturado:
"Atue como advogado civilista experiente. Elabore petição inicial de ação de cobrança fundamentada no art. 319 CPC, com: (1) endereçamento ao juízo cível competente; (2) qualificação completa das partes; (3) narrativa cronológica dos fatos; (4) fundamentação jurídica citando arts. 389 e 397 CC; (5) pedido principal de condenação ao pagamento de R$ X com juros e correção; (6) requerimentos processuais (citação, provas). Use linguagem técnica formal."`,

  "contestacao": `EXEMPLO de prompt-contestação bem estruturado:
"Atue como advogado de defesa. Elabore contestação fundamentada no art. 335 CPC com: (1) preliminares processuais cabíveis (incompetência, ilegitimidade, prescrição); (2) impugnação específica dos fatos (art. 341 CPC); (3) defesa de mérito direta e indireta; (4) prejudiciais; (5) pedido de improcedência total dos pedidos; (6) protesto por todos os meios de prova. Estilo técnico, sem omissão de pontos controvertidos."`,

  "recurso": `EXEMPLO de prompt-recurso bem estruturado:
"Atue como advogado recursalista. Elabore recurso de apelação fundamentado nos arts. 1.009 a 1.014 CPC com: (1) preliminares (tempestividade, preparo, legitimidade); (2) síntese da decisão recorrida; (3) razões recursais detalhadas (errores in judicando e in procedendo); (4) demonstração do prequestionamento; (5) pedido de reforma/anulação; (6) jurisprudência do STJ/STF aplicável. Argumentação clara, não-prolixa."`,

  "parecer": `EXEMPLO de prompt-parecer bem estruturado:
"Atue como parecerista jurídico. Elabore parecer técnico contendo: (1) consulta formulada; (2) síntese fática; (3) análise jurídica fundamentada com legislação, doutrina e jurisprudência; (4) discussão de teses divergentes quando houver; (5) conclusão objetiva respondendo cada quesito; (6) recomendações práticas. Tom impessoal, técnico, sem advocacia de tese."`,

  "contrato": `EXEMPLO de prompt-contrato bem estruturado:
"Atue como contratualista. Elabore minuta de contrato com: (1) qualificação das partes; (2) considerandos (recitals); (3) objeto e escopo; (4) obrigações de cada parte; (5) preço/contraprestação e forma de pagamento; (6) prazo e vigência; (7) cláusulas de rescisão, multa, foro; (8) disposições finais. Linguagem clara, sem ambiguidades, prevendo riscos contratuais."`,
};

/**
 * Rubrics de qualidade — critérios objetivos por tipo de documento usados
 * tanto pelo metaprompt (para guiar o LLM) quanto potencialmente por uma
 * futura UI de auto-avaliação do prompt gerado.
 */
export const RUBRICAS_QUALIDADE: Record<string, string[]> = {
  "peticao": [
    "Endereçamento correto ao juízo competente",
    "Qualificação completa das partes (art. 319, II CPC)",
    "Narrativa fática cronológica e clara",
    "Fundamentação jurídica com citação de artigos específicos",
    "Pedido certo, determinado e líquido (quando possível)",
    "Valor da causa coerente com o pedido",
    "Requerimentos processuais pertinentes",
  ],
  "contestacao": [
    "Preliminares processuais cabíveis exauridas",
    "Impugnação específica de cada fato (princípio da impugnação especificada)",
    "Defesa de mérito direta + indireta quando aplicável",
    "Prejudiciais de mérito",
    "Pedido claro de improcedência",
    "Protesto por provas",
  ],
  "recurso": [
    "Tempestividade demonstrada",
    "Preparo recolhido (ou pedido de gratuidade)",
    "Síntese objetiva da decisão recorrida",
    "Razões recursais focadas no error",
    "Prequestionamento explícito quando recurso especial/extraordinário",
    "Pedido de reforma ou anulação claramente delimitado",
  ],
  "parecer": [
    "Consulta delimitada com precisão",
    "Síntese fática sem juízo de valor",
    "Fundamentação tripartite (lei, doutrina, jurisprudência)",
    "Discussão honesta de teses divergentes",
    "Conclusão objetiva respondendo cada quesito",
    "Tom impessoal, sem advocacia de tese",
  ],
  "contrato": [
    "Partes corretamente qualificadas",
    "Objeto definido sem ambiguidade",
    "Obrigações simétricas e exigíveis",
    "Cláusulas de rescisão e penalidades",
    "Foro de eleição",
    "Prevenção de riscos contratuais relevantes",
  ],
  "default": [
    "Estrutura completa para o tipo de peça",
    "Fundamentação legal específica (artigos, leis)",
    "Linguagem técnica formal sem prolixidade",
    "Coerência interna entre fatos, fundamentos e pedidos",
  ],
};

/**
 * Helpers para uso no metaprompt do gerador.
 */
export function getExemploFewShot(tipoDocumento: string): string {
  return EXEMPLOS_FEW_SHOT[tipoDocumento] ?? EXEMPLOS_FEW_SHOT["peticao"];
}

export function getRubricaQualidade(tipoDocumento: string): string[] {
  return RUBRICAS_QUALIDADE[tipoDocumento] ?? RUBRICAS_QUALIDADE["default"];
}

/**
 * Templates iniciais (starter prompts) por área jurídica — usados pelo
 * card "Inspirações" no Dashboard. Cada item descreve um caso típico que
 * o usuário pode escolher como ponto de partida.
 *
 * Mantém-se intencionalmente curto: 3-4 starters por área (apenas as áreas
 * mais demandadas). Áreas sem entrada caem no fallback vazio.
 */
export interface StarterPrompt {
  titulo: string;
  contexto: string;
  objetivo: string;
  tipoDocumento: TipoDocumento;
}

export const STARTER_PROMPTS: Record<string, StarterPrompt[]> = {
  "Civil": [
    {
      titulo: "Ação de cobrança por inadimplemento",
      tipoDocumento: "peticao",
      contexto: "Cliente é credor de dívida líquida, certa e exigível, oriunda de contrato de mútuo não pago no vencimento. O devedor foi notificado extrajudicialmente e permanece inerte.",
      objetivo: "Obter condenação do réu ao pagamento do valor devido com juros, correção monetária e honorários sucumbenciais.",
    },
    {
      titulo: "Ação de indenização por danos morais",
      tipoDocumento: "peticao",
      contexto: "Cliente teve seu nome inscrito indevidamente em cadastro de proteção ao crédito por dívida já quitada, gerando constrangimento e abalo creditício.",
      objetivo: "Obter exclusão do nome dos cadastros de inadimplentes e condenação ao pagamento de danos morais.",
    },
    {
      titulo: "Defesa em ação de despejo",
      tipoDocumento: "contestacao",
      contexto: "Cliente é locatário de imóvel residencial e foi acionado em ação de despejo por falta de pagamento. Há valores em discussão e ação consignatória em curso.",
      objetivo: "Demonstrar a inexistência de mora purgada e suspender o despejo até decisão final.",
    },
  ],
  "Trabalhista": [
    {
      titulo: "Reclamação trabalhista por verbas rescisórias",
      tipoDocumento: "peticao",
      contexto: "Cliente foi dispensado sem justa causa após 5 anos de trabalho. A empresa não pagou aviso prévio, férias proporcionais, 13º proporcional, FGTS e multa de 40%.",
      objetivo: "Obter condenação da reclamada ao pagamento integral das verbas rescisórias devidas com juros e correção.",
    },
    {
      titulo: "Reconhecimento de vínculo empregatício",
      tipoDocumento: "peticao",
      contexto: "Cliente prestou serviços como 'PJ' por 3 anos com habitualidade, subordinação, pessoalidade e onerosidade, em desvio do regime celetista.",
      objetivo: "Reconhecer o vínculo empregatício desde o início da prestação de serviços e condenar ao pagamento das verbas trabalhistas correspondentes.",
    },
  ],
  "Consumidor": [
    {
      titulo: "Vício oculto em produto durável",
      tipoDocumento: "peticao",
      contexto: "Cliente adquiriu eletrodoméstico que apresentou vício oculto após 60 dias de uso. O fornecedor recusou-se a substituir ou consertar dentro do prazo legal.",
      objetivo: "Obter substituição do produto, restituição do valor pago ou abatimento proporcional, à escolha do consumidor (art. 18, §1º CDC).",
    },
    {
      titulo: "Cancelamento abusivo de voo",
      tipoDocumento: "peticao",
      contexto: "Cliente teve voo cancelado pela companhia aérea sem realocação adequada, perdendo compromisso profissional e necessitando comprar passagem em outra empresa.",
      objetivo: "Obter ressarcimento dos gastos extras e indenização por danos morais decorrentes da falha na prestação do serviço.",
    },
  ],
  "Família": [
    {
      titulo: "Divórcio consensual com partilha",
      tipoDocumento: "peticao",
      contexto: "Casal casado sob regime de comunhão parcial de bens decidiu divorciar-se consensualmente. Há um filho menor e bens a partilhar.",
      objetivo: "Decretar o divórcio, homologar a guarda compartilhada com regulamentação de visitas, fixar alimentos e formalizar a partilha.",
    },
    {
      titulo: "Ação de alimentos",
      tipoDocumento: "peticao",
      contexto: "Genitora ajuíza ação em nome do filho menor de 8 anos contra o pai biológico, que não contribui voluntariamente para o sustento.",
      objetivo: "Fixar alimentos provisórios em 30% do salário do alimentante e definitivos em valor compatível com o binômio necessidade x possibilidade.",
    },
  ],
  "Processo Civil": [
    {
      titulo: "Tutela de urgência antecipada",
      tipoDocumento: "peticao",
      contexto: "Há urgência justificada (perigo de dano irreparável) e probabilidade do direito, demandando provimento jurisdicional antes do contraditório.",
      objetivo: "Obter concessão de tutela de urgência inaudita altera parte com base no art. 300 CPC, fundamentando os pressupostos legais.",
    },
    {
      titulo: "Embargos de declaração",
      tipoDocumento: "embargos",
      contexto: "Sentença/acórdão contém omissão sobre pedido subsidiário formulado, ou contradição entre fundamentação e dispositivo.",
      objetivo: "Sanar a omissão/contradição com efeitos modificativos, prequestionando matéria para eventual recurso.",
    },
  ],
};

/**
 * Helper: retorna starter prompts da área ou array vazio.
 */
export function getStarterPrompts(area: string): StarterPrompt[] {
  return STARTER_PROMPTS[area] ?? [];
}

/**
 * Referências legais comuns por área
 */
export const REFERENCIAS_LEGAIS: Record<string, string[]> = {
  "Civil": [
    "Lei 10.406/2002 (Código Civil)",
    "Lei 13.105/2015 (Código de Processo Civil)",
    "Lei 8.078/1990 (Código de Defesa do Consumidor)"
  ],
  "Penal": [
    "Decreto-Lei 2.848/1940 (Código Penal)",
    "Decreto-Lei 3.689/1941 (Código de Processo Penal)",
    "Lei 11.343/2006 (Lei de Drogas)",
    "Lei 9.099/1995 (Juizados Especiais)"
  ],
  "Trabalhista": [
    "Decreto-Lei 5.452/1943 (CLT)",
    "Lei 13.467/2017 (Reforma Trabalhista)",
    "Constituição Federal/1988 (arts. 7º a 11)"
  ],
  "Tributário": [
    "Lei 5.172/1966 (Código Tributário Nacional)",
    "Constituição Federal/1988 (arts. 145 a 162)",
    "Lei Complementar 123/2006 (Simples Nacional)"
  ],
  "Administrativo": [
    "Lei 9.784/1999 (Processo Administrativo Federal)",
    "Lei 14.133/2021 (Nova Lei de Licitações)",
    "Lei 8.429/1992 (Improbidade Administrativa)",
    "Constituição Federal/1988 (art. 37)"
  ],
  "Empresarial": [
    "Lei 6.404/1976 (Sociedades por Ações)",
    "Lei 11.101/2005 (Recuperação Judicial e Falências)",
    "Lei 10.406/2002 (Código Civil — arts. 966 a 1.195)",
    "Lei 9.279/1996 (Propriedade Industrial)"
  ],
  "Consumidor": [
    "Lei 8.078/1990 (Código de Defesa do Consumidor)",
    "Decreto 7.962/2013 (Regulamentação do CDC para e-commerce)",
    "Lei 12.965/2014 (Marco Civil da Internet)"
  ],
  "Família": [
    "Lei 10.406/2002 (Código Civil — Livro IV, arts. 1.511 a 1.783-A)",
    "Lei 11.340/2006 (Lei Maria da Penha)",
    "Lei 8.069/1990 (Estatuto da Criança e do Adolescente)",
    "Lei 11.698/2008 (Guarda Compartilhada)"
  ],
  "Processo Civil": [
    "Lei 13.105/2015 (Código de Processo Civil)",
    "Lei 9.099/1995 (Juizados Especiais Cíveis)",
    "Lei 11.419/2006 (Processo Eletrônico)"
  ]
};
