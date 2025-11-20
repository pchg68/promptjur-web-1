/**
 * Biblioteca de Modelos Profissionais Pré-Prontos
 * 
 * Cada modelo contém informações pré-configuradas para facilitar
 * a geração de prompts jurídicos profissionais de alta qualidade.
 */

export type TipoDocumento = "peticao" | "parecer" | "contrato" | "recurso" | "defesa" | "memorando" | "outro";

export interface ModeloProfissional {
  id: string;
  nome: string;
  descricao: string;
  tipoDocumento: TipoDocumento;
  areaJuridica: string;
  contextoJuridico: string;
  objetivoEspecifico: string;
  partesEnvolvidas?: string;
  legislacaoRelevante?: string;
  detalhesAdicionais?: string;
  isPremium: boolean; // Para monetização futura
  tags: string[];
}

export const MODELOS_PROFISSIONAIS: ModeloProfissional[] = [
  // ========== PETIÇÕES (8 modelos) ==========
  {
    id: "pet-001",
    nome: "Petição Inicial - Ação de Cobrança",
    descricao: "Modelo para ação de cobrança de valores com pedido de tutela de urgência",
    tipoDocumento: "peticao",
    areaJuridica: "Civil",
    contextoJuridico: "Cliente possui título executivo extrajudicial (contrato, nota promissória ou acordo) não cumprido pelo devedor. Há risco de dilapidação patrimonial.",
    objetivoEspecifico: "Redigir petição inicial de ação de cobrança com pedido de tutela de urgência para bloqueio de bens, incluindo fundamentação completa baseada no CC e CPC",
    legislacaoRelevante: "Art. 300 do CPC (tutela de urgência), Art. 389 e 475 do CC (inadimplemento)",
    isPremium: false,
    tags: ["cobrança", "tutela urgência", "cível"]
  },
  {
    id: "pet-002",
    nome: "Petição Inicial - Ação de Indenização por Danos Morais",
    descricao: "Modelo para ação indenizatória por danos morais com fundamentação robusta",
    tipoDocumento: "peticao",
    areaJuridica: "Civil",
    contextoJuridico: "Cliente sofreu dano moral comprovado (inscrição indevida em órgãos de proteção ao crédito, ofensa à honra, violação de direitos da personalidade). Há provas documentais e/ou testemunhais.",
    objetivoEspecifico: "Redigir petição inicial de ação de indenização por danos morais com fundamentação em responsabilidade civil, nexo causal e quantum indenizatório",
    legislacaoRelevante: "Art. 186, 187 e 927 do CC, Art. 5º, V e X da CF/88",
    isPremium: false,
    tags: ["indenização", "danos morais", "responsabilidade civil"]
  },
  {
    id: "pet-003",
    nome: "Petição Inicial - Ação Trabalhista (Rescisão Indireta)",
    descricao: "Modelo para rescisão indireta do contrato de trabalho por falta grave do empregador",
    tipoDocumento: "peticao",
    areaJuridica: "Trabalhista",
    contextoJuridico: "Empregado sofreu falta grave do empregador (atraso reiterado de salários, assédio moral, condições insalubres não regularizadas, descumprimento de obrigações contratuais). Deseja rescisão indireta com direito a todas as verbas rescisórias.",
    objetivoEspecifico: "Redigir reclamação trabalhista para rescisão indireta com pedido de verbas rescisórias, FGTS, multa de 40%, aviso prévio, férias e 13º proporcionais",
    legislacaoRelevante: "Art. 483 da CLT, Súmula 13 do TST",
    isPremium: true,
    tags: ["trabalhista", "rescisão indireta", "verbas rescisórias"]
  },
  {
    id: "pet-004",
    nome: "Petição Inicial - Ação de Usucapião Extraordinária",
    descricao: "Modelo para ação de usucapião de imóvel com posse mansa e pacífica",
    tipoDocumento: "peticao",
    areaJuridica: "Civil",
    contextoJuridico: "Cliente possui posse mansa, pacífica e ininterrupta de imóvel por mais de 15 anos, com animus domini (intenção de dono). Não há oposição de terceiros. Deseja regularizar a propriedade.",
    objetivoEspecifico: "Redigir petição inicial de ação de usucapião extraordinária com fundamentação em posse qualificada, requisitos temporais e pedido de registro imobiliário",
    legislacaoRelevante: "Art. 1.238 do CC, Art. 216-A do CPC",
    isPremium: true,
    tags: ["usucapião", "imóvel", "propriedade"]
  },
  {
    id: "pet-005",
    nome: "Petição Inicial - Ação de Divórcio Consensual",
    descricao: "Modelo para divórcio consensual com partilha de bens e guarda de filhos",
    tipoDocumento: "peticao",
    areaJuridica: "Família e Sucessões",
    contextoJuridico: "Casal deseja divórcio consensual. Já acordaram sobre partilha de bens, guarda compartilhada dos filhos menores, pensão alimentícia e visitas. Não há litígio.",
    objetivoEspecifico: "Redigir petição inicial de divórcio consensual com cláusulas de partilha, guarda compartilhada, pensão alimentícia e regulamentação de visitas",
    legislacaoRelevante: "Art. 1.571 e seguintes do CC, Art. 733 do CPC",
    isPremium: false,
    tags: ["divórcio", "família", "consensual"]
  },
  {
    id: "pet-006",
    nome: "Petição Inicial - Ação de Despejo por Falta de Pagamento",
    descricao: "Modelo para ação de despejo de inquilino inadimplente",
    tipoDocumento: "peticao",
    areaJuridica: "Civil",
    contextoJuridico: "Locador possui contrato de locação vigente. Inquilino está inadimplente há mais de 3 meses. Notificação extrajudicial foi enviada sem sucesso. Deseja retomada do imóvel e cobrança dos aluguéis em atraso.",
    objetivoEspecifico: "Redigir petição inicial de ação de despejo por falta de pagamento cumulada com cobrança de aluguéis, com pedido de liminar para desocupação",
    legislacaoRelevante: "Art. 9º, III da Lei 8.245/91 (Lei do Inquilinato)",
    isPremium: true,
    tags: ["despejo", "locação", "inadimplência"]
  },
  {
    id: "pet-007",
    nome: "Petição Inicial - Mandado de Segurança",
    descricao: "Modelo para mandado de segurança contra ato de autoridade pública",
    tipoDocumento: "peticao",
    areaJuridica: "Administrativo",
    contextoJuridico: "Cliente sofreu ato ilegal ou abusivo de autoridade pública (negativa de direito líquido e certo, cobrança indevida de tributo, ato administrativo ilegal). Há urgência na correção do ato.",
    objetivoEspecifico: "Redigir petição inicial de mandado de segurança com demonstração de direito líquido e certo, ilegalidade do ato coator e pedido liminar",
    legislacaoRelevante: "Lei 12.016/2009 (Lei do Mandado de Segurança), Art. 5º, LXIX da CF/88",
    isPremium: true,
    tags: ["mandado de segurança", "administrativo", "direito líquido"]
  },
  {
    id: "pet-008",
    nome: "Petição Inicial - Ação Revisional de Contrato Bancário",
    descricao: "Modelo para revisão de cláusulas abusivas em contratos bancários",
    tipoDocumento: "peticao",
    areaJuridica: "Consumidor",
    contextoJuridico: "Cliente possui contrato bancário (financiamento, empréstimo, cartão de crédito) com cláusulas abusivas (juros excessivos, capitalização ilegal, tarifas indevidas, seguro não contratado). Deseja revisão judicial das cláusulas.",
    objetivoEspecifico: "Redigir petição inicial de ação revisional de contrato bancário com pedido de limitação de juros, exclusão de tarifas abusivas e restituição de valores pagos indevidamente",
    legislacaoRelevante: "CDC (Lei 8.078/90), Súmula 297 do STJ, Súmula 381 do STJ",
    isPremium: false,
    tags: ["revisional", "bancário", "consumidor"]
  },

  // ========== PARECERES (5 modelos) ==========
  {
    id: "par-001",
    nome: "Parecer Jurídico - Viabilidade de Ação Judicial",
    descricao: "Análise técnica sobre chances de êxito em ação judicial",
    tipoDocumento: "parecer",
    areaJuridica: "Civil",
    contextoJuridico: "Cliente consulta sobre viabilidade de ingressar com ação judicial. Necessita análise técnica das chances de êxito, riscos processuais, custos estimados e estratégia recomendada.",
    objetivoEspecifico: "Elaborar parecer jurídico técnico analisando viabilidade da ação, fundamentação legal, jurisprudência aplicável, riscos e recomendações estratégicas",
    isPremium: true,
    tags: ["parecer", "viabilidade", "estratégia"]
  },
  {
    id: "par-002",
    nome: "Parecer Jurídico - Análise de Contrato Empresarial",
    descricao: "Revisão técnica de contrato empresarial com identificação de riscos",
    tipoDocumento: "parecer",
    areaJuridica: "Empresarial",
    contextoJuridico: "Empresa recebeu minuta de contrato comercial (parceria, fornecimento, prestação de serviços). Necessita análise jurídica das cláusulas, identificação de riscos e sugestões de alterações.",
    objetivoEspecifico: "Elaborar parecer jurídico analisando cláusulas contratuais, identificando riscos jurídicos, cláusulas abusivas ou desfavoráveis, e sugerindo alterações",
    legislacaoRelevante: "CC/02 (Livro de Direito das Obrigações), CDC quando aplicável",
    isPremium: true,
    tags: ["parecer", "contrato", "empresarial"]
  },
  {
    id: "par-003",
    nome: "Parecer Jurídico - Questão Tributária",
    descricao: "Análise de questão tributária com fundamentação em legislação e jurisprudência",
    tipoDocumento: "parecer",
    areaJuridica: "Tributário",
    contextoJuridico: "Cliente (pessoa física ou jurídica) possui dúvida sobre incidência tributária, possibilidade de recuperação de créditos, ou contestação de auto de infração. Necessita parecer técnico fundamentado.",
    objetivoEspecifico: "Elaborar parecer jurídico tributário analisando a questão sob a ótica da legislação vigente, jurisprudência dos tribunais superiores e doutrina especializada",
    legislacaoRelevante: "CTN, CF/88 (Sistema Tributário Nacional), legislação específica do tributo",
    isPremium: true,
    tags: ["parecer", "tributário", "fiscal"]
  },
  {
    id: "par-004",
    nome: "Parecer Jurídico - Responsabilidade Civil Empresarial",
    descricao: "Análise de responsabilidade civil em caso empresarial complexo",
    tipoDocumento: "parecer",
    areaJuridica: "Civil",
    contextoJuridico: "Empresa está envolvida em situação que pode gerar responsabilidade civil (acidente com produto, dano ambiental, acidente de trabalho). Necessita parecer sobre extensão da responsabilidade e medidas preventivas.",
    objetivoEspecifico: "Elaborar parecer jurídico analisando responsabilidade civil objetiva e subjetiva, nexo causal, excludentes de responsabilidade e recomendações de mitigação de riscos",
    legislacaoRelevante: "Art. 186, 187, 927 e 931 do CC, CDC, legislação ambiental e trabalhista quando aplicável",
    isPremium: false,
    tags: ["parecer", "responsabilidade civil", "empresarial"]
  },
  {
    id: "par-005",
    nome: "Parecer Jurídico - Compliance e LGPD",
    descricao: "Análise de conformidade com LGPD e recomendações de adequação",
    tipoDocumento: "parecer",
    areaJuridica: "Digital e Proteção de Dados",
    contextoJuridico: "Empresa coleta, armazena e processa dados pessoais de clientes/usuários. Necessita parecer sobre conformidade com LGPD, identificação de gaps e plano de adequação.",
    objetivoEspecifico: "Elaborar parecer jurídico analisando práticas de tratamento de dados pessoais, identificando não conformidades com LGPD e recomendando medidas de adequação",
    legislacaoRelevante: "Lei 13.709/2018 (LGPD), Regulamentações da ANPD",
    isPremium: true,
    tags: ["parecer", "lgpd", "compliance"]
  },

  // ========== CONTRATOS (4 modelos) ==========
  {
    id: "con-001",
    nome: "Contrato de Compra e Venda de Imóvel",
    descricao: "Modelo de contrato para compra e venda de imóvel com cláusulas essenciais",
    tipoDocumento: "contrato",
    areaJuridica: "Civil",
    contextoJuridico: "Partes desejam formalizar compra e venda de imóvel. Necessitam de contrato com cláusulas de qualificação das partes, descrição do imóvel, preço, forma de pagamento, prazos e responsabilidades.",
    objetivoEspecifico: "Redigir contrato de compra e venda de imóvel com cláusulas de objeto, preço, pagamento, tradição, responsabilidades por débitos, foro e demais cláusulas essenciais",
    legislacaoRelevante: "Art. 481 e seguintes do CC (Compra e Venda)",
    isPremium: false,
    tags: ["contrato", "imóvel", "compra e venda"]
  },
  {
    id: "con-002",
    nome: "Contrato de Prestação de Serviços",
    descricao: "Modelo de contrato para prestação de serviços profissionais",
    tipoDocumento: "contrato",
    areaJuridica: "Civil",
    contextoJuridico: "Contratante necessita formalizar prestação de serviços profissionais (consultoria, assessoria, serviços técnicos). Necessita de contrato com escopo, prazos, remuneração e responsabilidades.",
    objetivoEspecifico: "Redigir contrato de prestação de serviços com cláusulas de objeto, escopo, prazo, remuneração, obrigações das partes, confidencialidade e rescisão",
    legislacaoRelevante: "Art. 593 e seguintes do CC (Prestação de Serviços)",
    isPremium: false,
    tags: ["contrato", "prestação serviços", "profissional"]
  },
  {
    id: "con-003",
    nome: "Contrato de Locação Residencial",
    descricao: "Modelo de contrato de locação de imóvel residencial conforme Lei do Inquilinato",
    tipoDocumento: "contrato",
    areaJuridica: "Civil",
    contextoJuridico: "Locador e locatário desejam formalizar locação de imóvel residencial. Necessitam de contrato com cláusulas de prazo, aluguel, reajuste, garantias, obrigações e rescisão.",
    objetivoEspecifico: "Redigir contrato de locação residencial com cláusulas de prazo determinado/indeterminado, aluguel, reajuste, garantias (fiança, caução, seguro), obrigações das partes e rescisão",
    legislacaoRelevante: "Lei 8.245/91 (Lei do Inquilinato)",
    isPremium: true,
    tags: ["contrato", "locação", "imóvel"]
  },
  {
    id: "con-004",
    nome: "Contrato de Sociedade Limitada",
    descricao: "Modelo de contrato social para constituição de sociedade limitada",
    tipoDocumento: "contrato",
    areaJuridica: "Empresarial",
    contextoJuridico: "Sócios desejam constituir sociedade limitada. Necessitam de contrato social com qualificação dos sócios, objeto social, capital social, administração, distribuição de lucros e demais cláusulas essenciais.",
    objetivoEspecifico: "Redigir contrato social de sociedade limitada com cláusulas de qualificação, objeto, capital, quotas, administração, deliberações, distribuição de lucros e dissolução",
    legislacaoRelevante: "Art. 1.052 e seguintes do CC (Sociedade Limitada), Lei 6.404/76 subsidiariamente",
    isPremium: true,
    tags: ["contrato", "sociedade", "empresarial"]
  },

  // ========== RECURSOS (3 modelos) ==========
  {
    id: "rec-001",
    nome: "Recurso de Apelação Cível",
    descricao: "Modelo de apelação contra sentença de primeiro grau em ação cível",
    tipoDocumento: "recurso",
    areaJuridica: "Civil",
    contextoJuridico: "Cliente foi vencido em sentença de primeiro grau em ação cível. Deseja recorrer ao Tribunal de Justiça alegando erro de julgamento, violação de lei ou nulidade processual.",
    objetivoEspecifico: "Redigir recurso de apelação cível com razões recursais fundamentadas, demonstração de erro de julgamento, violação de lei ou nulidade, e pedido de reforma da sentença",
    legislacaoRelevante: "Art. 1.009 e seguintes do CPC (Apelação)",
    isPremium: true,
    tags: ["recurso", "apelação", "cível"]
  },
  {
    id: "rec-002",
    nome: "Agravo de Instrumento",
    descricao: "Modelo de agravo de instrumento contra decisão interlocutória",
    tipoDocumento: "recurso",
    areaJuridica: "Processo Civil",
    contextoJuridico: "Cliente foi prejudicado por decisão interlocutória (tutela de urgência negada, prova indeferida, decisão sobre competência). Necessita de agravo de instrumento urgente ao tribunal.",
    objetivoEspecifico: "Redigir agravo de instrumento com demonstração de urgência, fundamentação do erro da decisão agravada, e pedido de efeito suspensivo e reforma",
    legislacaoRelevante: "Art. 1.015 e seguintes do CPC (Agravo de Instrumento)",
    isPremium: true,
    tags: ["recurso", "agravo", "urgência"]
  },
  {
    id: "rec-003",
    nome: "Recurso Especial (REsp)",
    descricao: "Modelo de recurso especial ao STJ por violação de lei federal",
    tipoDocumento: "recurso",
    areaJuridica: "Processo Civil",
    contextoJuridico: "Cliente teve acórdão desfavorável no Tribunal de Justiça que violou lei federal, divergiu de jurisprudência do STJ ou negou vigência a tratado internacional. Deseja recurso especial ao STJ.",
    objetivoEspecifico: "Redigir recurso especial ao STJ com demonstração de prequestionamento, violação de lei federal, divergência jurisprudencial ou negativa de vigência a tratado",
    legislacaoRelevante: "Art. 105, III da CF/88, Art. 1.029 e seguintes do CPC",
    isPremium: true,
    tags: ["recurso", "especial", "stj"]
  },

  // ========== DEFESAS (2 modelos) ==========
  {
    id: "def-001",
    nome: "Contestação em Ação de Cobrança",
    descricao: "Modelo de contestação para defesa em ação de cobrança",
    tipoDocumento: "defesa",
    areaJuridica: "Civil",
    contextoJuridico: "Cliente foi citado em ação de cobrança. Alega pagamento, prescrição, inexistência da dívida ou vício no título executivo. Necessita de contestação fundamentada.",
    objetivoEspecifico: "Redigir contestação em ação de cobrança com preliminares (se aplicável), impugnação ao valor da causa, negativa do débito, alegação de pagamento/prescrição e pedido de improcedência",
    legislacaoRelevante: "Art. 335 e seguintes do CPC (Contestação), Art. 205 e 206 do CC (Prescrição)",
    isPremium: false,
    tags: ["defesa", "contestação", "cobrança"]
  },
  {
    id: "def-002",
    nome: "Defesa Prévia em Ação Penal",
    descricao: "Modelo de resposta à acusação em ação penal",
    tipoDocumento: "defesa",
    areaJuridica: "Penal",
    contextoJuridico: "Cliente foi denunciado em ação penal. Necessita apresentar defesa prévia (resposta à acusação) alegando preliminares, excludentes de ilicitude, atipicidade ou negativa de autoria.",
    objetivoEspecifico: "Redigir resposta à acusação em ação penal com preliminares (inépcia, ilegitimidade), tese defensiva (atipicidade, excludente, negativa de autoria), arrolamento de testemunhas e pedido de absolvição sumária",
    legislacaoRelevante: "Art. 396 e 396-A do CPP (Resposta à Acusação)",
    isPremium: true,
    tags: ["defesa", "penal", "acusação"]
  }
];

/**
 * Função auxiliar para filtrar modelos
 */
export function filtrarModelos(
  tipo?: TipoDocumento,
  area?: string,
  busca?: string,
  apenasGratuitos?: boolean
): ModeloProfissional[] {
  let resultado = [...MODELOS_PROFISSIONAIS];

  if (tipo) {
    resultado = resultado.filter(m => m.tipoDocumento === tipo);
  }

  if (area) {
    resultado = resultado.filter(m => m.areaJuridica === area);
  }

  if (busca) {
    const buscaLower = busca.toLowerCase();
    resultado = resultado.filter(m =>
      m.nome.toLowerCase().includes(buscaLower) ||
      m.descricao.toLowerCase().includes(buscaLower) ||
      m.tags.some(tag => tag.toLowerCase().includes(buscaLower))
    );
  }

  if (apenasGratuitos) {
    resultado = resultado.filter(m => !m.isPremium);
  }

  return resultado;
}
