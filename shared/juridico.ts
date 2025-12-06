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

  "Direito Médico": `Elabore [TIPO_PECA] fundamentada no Código de Ética Médica (Resolução CFM 2.217/2018), Código Civil e artigos [ARTIGOS], contemplando:
1) Qualificação das partes (paciente/autor e profissional/instituição de saúde)
2) Histórico médico detalhado com cronologia do tratamento
3) Descrição do erro médico ou falha no atendimento
4) Nexo causal entre conduta e dano
5) Fundamentação em responsabilidade civil médica
6) Laudo pericial e documentação médica
7) Pedidos de indenização (danos materiais, morais e estéticos)
Cite jurisprudência do STJ sobre responsabilidade médica e hospitalar.`,

  "Direito Digital": `Elabore [TIPO_PECA] com base na LGPD (Lei 13.709/2018), Marco Civil da Internet (Lei 12.965/2014) e artigos [ARTIGOS], incluindo:
1) Qualificação das partes
2) Descrição dos fatos envolvendo violação digital
3) Identificação da violação (dados pessoais, privacidade, crimes cibernéticos)
4) Fundamentação legal específica (LGPD, Marco Civil, Código Penal)
5) Provas digitais e perícia técnica
6) Pedidos (remoção de conteúdo, indenização, medidas cautelares)
Considere princípios de proteção de dados e jurisprudência sobre crimes digitais.`,

  "Direito Internacional": `Elabore [TIPO_PECA] fundamentada em tratados internacionais, convenções e artigos [ARTIGOS], contemplando:
1) Qualificação das partes (Estados, organizações, pessoas físicas/jurídicas)
2) Descrição dos fatos com contexto internacional
3) Identificação da jurisdição aplicável
4) Fundamentação em tratados, convenções e costume internacional
5) Análise de conflito de leis no espaço
6) Pedidos e requerimentos
Cite jurisprudência de cortes internacionais (CIJ, CIDH, tribunais arbitrais) quando aplicável.`
};

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
  "Direito Médico": [
    "Resolução CFM 2.217/2018 (Código de Ética Médica)",
    "Lei 10.406/2002 (Código Civil - Responsabilidade Civil)",
    "Lei 8.078/1990 (Código de Defesa do Consumidor)",
    "Lei 12.842/2013 (Exercício da Medicina)",
    "Lei 13.787/2018 (Prontuário Eletrônico)"
  ],
  "Direito Digital": [
    "Lei 13.709/2018 (LGPD - Lei Geral de Proteção de Dados)",
    "Lei 12.965/2014 (Marco Civil da Internet)",
    "Lei 12.737/2012 (Lei Carolina Dieckmann - Crimes Informáticos)",
    "Lei 14.155/2021 (Crimes Cibernéticos)",
    "Decreto 10.046/2019 (Regulamentação da LGPD)",
    "Lei 14.063/2020 (Assinaturas Eletrônicas)"
  ],
  "Direito Internacional": [
    "Convenção de Viena sobre Direito dos Tratados (1969)",
    "Pacto de San José da Costa Rica (Convenção Americana de Direitos Humanos)",
    "Estatuto de Roma (Tribunal Penal Internacional)",
    "Convenção de Nova Iorque sobre Arbitragem (1958)",
    "Convenção de Genebra (Direito Humanitário)",
    "Constituição Federal/1988 (arts. 4º e 5º, §§ 2º e 3º)"
  ]
};
