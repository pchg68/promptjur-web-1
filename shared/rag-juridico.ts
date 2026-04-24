/**
 * RAG Jurídico — Tipos, configurações e base de conhecimento
 * 
 * Retrieval-Augmented Generation aplicado ao Direito brasileiro.
 * Enriquece o contexto de geração com legislação, súmulas e jurisprudência
 * buscadas semanticamente antes de chamar a LLM.
 */

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface FonteRAG {
  id: string;
  tipo: "legislacao" | "sumula" | "jurisprudencia" | "doutrina";
  titulo: string;
  conteudo: string;
  /** Fonte oficial (ex: "STF", "STJ", "Planalto") */
  origem: string;
  /** URL para a fonte oficial */
  url?: string;
  /** Relevância calculada (0-100) */
  relevancia: number;
  /** Área jurídica principal */
  area?: string;
}

export interface ResultadoRAG {
  fontes: FonteRAG[];
  contextoEnriquecido: string;
  totalFontes: number;
  tempoMs: number;
  /** Resumo das fontes encontradas para o usuário */
  resumo: string;
}

export interface ConfiguracaoRAG {
  /** Máximo de fontes a buscar */
  maxFontes: number;
  /** Relevância mínima (0-100) para incluir uma fonte */
  relevanciaMinimaFonte: number;
  /** Buscar legislação (artigos, leis, códigos) */
  buscarLegislacao: boolean;
  /** Buscar súmulas (STF, STJ, TST) */
  buscarSumulas: boolean;
  /** Buscar jurisprudência (DataJud) */
  buscarJurisprudencia: boolean;
  /** Tribunais para busca de jurisprudência */
  tribunais: string[];
}

export const RAG_CONFIG_PADRAO: ConfiguracaoRAG = {
  maxFontes: 10,
  relevanciaMinimaFonte: 40,
  buscarLegislacao: true,
  buscarSumulas: true,
  buscarJurisprudencia: true,
  tribunais: ["STF", "STJ", "TJSP", "TJRJ", "TJRS"],
};

// ─── Base de Conhecimento Estática — Súmulas ─────────────────────────────────

export interface Sumula {
  id: string;
  tribunal: string;
  numero: number;
  enunciado: string;
  areas: string[];
  /** Palavras-chave para busca semântica */
  termos: string[];
  url?: string;
  vinculante?: boolean;
}

/**
 * Base curada de súmulas mais relevantes do STF e STJ.
 * Usada para busca semântica local (sem API externa).
 */
export const SUMULAS_BASE: Sumula[] = [
  // ── STF — Súmulas Vinculantes ──
  {
    id: "sv_11", tribunal: "STF", numero: 11, vinculante: true,
    enunciado: "Só é lícito o uso de algemas em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, por parte do preso ou de terceiros, justificada a excepcionalidade por escrito, sob pena de responsabilidade disciplinar, civil e penal do agente ou da autoridade e de nulidade da prisão ou do ato processual a que se refere, sem prejuízo da responsabilidade civil do Estado.",
    areas: ["Penal", "Constitucional"], termos: ["algemas", "prisão", "preso", "nulidade", "resistência"],
    url: "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1220",
  },
  {
    id: "sv_14", tribunal: "STF", numero: 14, vinculante: true,
    enunciado: "É direito do defensor, no interesse do representado, ter acesso amplo aos elementos de prova que, já documentados em procedimento investigatório realizado por órgão com competência de polícia judiciária, digam respeito ao exercício do direito de defesa.",
    areas: ["Penal", "Constitucional"], termos: ["defensor", "acesso", "prova", "investigatório", "defesa"],
    url: "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1223",
  },
  {
    id: "sv_25", tribunal: "STF", numero: 25, vinculante: true,
    enunciado: "É ilícita a prisão civil de depositário infiel, qualquer que seja a modalidade do depósito.",
    areas: ["Civil", "Constitucional"], termos: ["prisão civil", "depositário infiel", "depósito"],
    url: "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1268",
  },
  {
    id: "sv_26", tribunal: "STF", numero: 26, vinculante: true,
    enunciado: "Para efeito de progressão de regime no cumprimento de pena por crime hediondo, ou equiparado, o juízo da execução observará a inconstitucionalidade do art. 2º da Lei nº 8.072, de 25 de julho de 1990, sem prejuízo de avaliar se o condenado preenche, ou não, os requisitos objetivos e subjetivos do benefício, podendo determinar, para tal fim, de modo fundamentado, a realização de exame criminológico.",
    areas: ["Penal"], termos: ["progressão", "regime", "crime hediondo", "execução penal", "exame criminológico"],
    url: "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1269",
  },
  {
    id: "sv_37", tribunal: "STF", numero: 37, vinculante: true,
    enunciado: "Não cabe ao Poder Judiciário, que não tem função legislativa, aumentar vencimentos de servidores públicos sob o fundamento de isonomia.",
    areas: ["Administrativo", "Constitucional"], termos: ["vencimentos", "servidores públicos", "isonomia", "poder judiciário"],
    url: "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1280",
  },
  {
    id: "sv_56", tribunal: "STF", numero: 56, vinculante: true,
    enunciado: "A falta de estabelecimento penal adequado não autoriza a manutenção do condenado em regime prisional mais gravoso, devendo-se observar, nessa hipótese, os parâmetros fixados no RE 641.320/RS.",
    areas: ["Penal"], termos: ["regime prisional", "estabelecimento penal", "condenado", "regime mais gravoso"],
    url: "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1355",
  },

  // ── STJ — Súmulas ──
  {
    id: "stj_7", tribunal: "STJ", numero: 7,
    enunciado: "A pretensão de simples reexame de prova não enseja recurso especial.",
    areas: ["Processo Civil"], termos: ["recurso especial", "reexame de prova", "STJ"],
    url: "https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=7&b=SUMU",
  },
  {
    id: "stj_54", tribunal: "STJ", numero: 54,
    enunciado: "Os juros moratórios não incidem durante o período de carência previsto em concordata.",
    areas: ["Empresarial", "Civil"], termos: ["juros moratórios", "concordata", "carência"],
    url: "https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=54&b=SUMU",
  },
  {
    id: "stj_227", tribunal: "STJ", numero: 227,
    enunciado: "A pessoa jurídica não pode sofrer dano moral. (SUPERADA pela jurisprudência posterior do próprio STJ)",
    areas: ["Civil", "Empresarial"], termos: ["dano moral", "pessoa jurídica"],
    url: "https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=227&b=SUMU",
  },
  {
    id: "stj_297", tribunal: "STJ", numero: 297,
    enunciado: "O Código de Defesa do Consumidor é aplicável às instituições financeiras.",
    areas: ["Consumidor", "Empresarial"], termos: ["CDC", "consumidor", "instituições financeiras", "banco"],
    url: "https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=297&b=SUMU",
  },
  {
    id: "stj_385", tribunal: "STJ", numero: 385,
    enunciado: "Da decisão que inadmitir o recurso especial, cabe agravo ao STJ.",
    areas: ["Processo Civil"], termos: ["agravo", "recurso especial", "inadmissão", "STJ"],
    url: "https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=385&b=SUMU",
  },
  {
    id: "stj_479", tribunal: "STJ", numero: 479,
    enunciado: "As instituições financeiras respondem objetivamente pelos danos gerados por fortuito interno relativo a fraudes e delitos praticados por terceiros no âmbito de operações bancárias.",
    areas: ["Consumidor", "Civil"], termos: ["instituições financeiras", "responsabilidade objetiva", "fraude", "operações bancárias"],
    url: "https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=479&b=SUMU",
  },
  {
    id: "stj_529", tribunal: "STJ", numero: 529,
    enunciado: "No seguro de responsabilidade civil facultativo, não cabe o ajuizamento de ação pelo terceiro prejudicado direta e exclusivamente em face da seguradora do apontado causador do dano.",
    areas: ["Civil", "Consumidor"], termos: ["seguro", "responsabilidade civil", "seguradora", "terceiro prejudicado"],
    url: "https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=529&b=SUMU",
  },
  {
    id: "stj_596", tribunal: "STJ", numero: 596,
    enunciado: "A obrigação alimentar dos avós tem natureza complementar e subsidiária, somente se configurando no caso de impossibilidade total ou parcial de seu cumprimento pelos pais.",
    areas: ["Família"], termos: ["alimentos", "avós", "obrigação alimentar", "subsidiária", "complementar"],
    url: "https://scon.stj.jus.br/SCON/sumulas/doc.jsp?livre=596&b=SUMU",
  },

  // ── TST — Súmulas ──
  {
    id: "tst_331", tribunal: "TST", numero: 331,
    enunciado: "A contratação de trabalhadores por empresa interposta é ilegal, formando-se o vínculo diretamente com o tomador dos serviços, salvo no caso de trabalho temporário (Lei nº 6.019, de 03.01.1974).",
    areas: ["Trabalhista"], termos: ["terceirização", "vínculo empregatício", "empresa interposta", "tomador de serviços"],
    url: "https://www3.tst.jus.br/jurisprudencia/Sumulas_com_indice/Sumulas_Ind_301_350.html#SUM-331",
  },
  {
    id: "tst_443", tribunal: "TST", numero: 443,
    enunciado: "Presume-se discriminatória a despedida de empregado portador do vírus HIV ou de outra doença grave que suscite estigma ou preconceito. Inválido o ato, o empregado tem direito à reintegração no emprego.",
    areas: ["Trabalhista"], termos: ["dispensa discriminatória", "HIV", "doença grave", "reintegração"],
    url: "https://www3.tst.jus.br/jurisprudencia/Sumulas_com_indice/Sumulas_Ind_401_450.html#SUM-443",
  },
  {
    id: "tst_461", tribunal: "TST", numero: 461,
    enunciado: "Sendo idêntica a função, a todo trabalho de igual valor prestado ao mesmo empregador, na mesma localidade, corresponderá igual salário, sem distinção de sexo, nacionalidade ou idade.",
    areas: ["Trabalhista"], termos: ["equiparação salarial", "igual salário", "mesma função", "discriminação"],
    url: "https://www3.tst.jus.br/jurisprudencia/Sumulas_com_indice/Sumulas_Ind_451_500.html#SUM-461",
  },
];

// ─── Base de Conhecimento Estática — Legislação Fundamental ──────────────────

export interface LegislacaoBase {
  id: string;
  codigo: string;
  nome: string;
  /** Artigos mais citados com seus textos */
  artigosChave: { numero: number; texto: string; termos: string[] }[];
  areas: string[];
  url: string;
}

export const LEGISLACAO_BASE: LegislacaoBase[] = [
  {
    id: "cf88", codigo: "CF", nome: "Constituição Federal de 1988",
    url: "http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    areas: ["Constitucional", "Administrativo", "Penal", "Civil", "Trabalhista"],
    artigosChave: [
      { numero: 1, texto: "A República Federativa do Brasil, formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal, constitui-se em Estado Democrático de Direito e tem como fundamentos: I - a soberania; II - a cidadania; III - a dignidade da pessoa humana; IV - os valores sociais do trabalho e da livre iniciativa; V - o pluralismo político.", termos: ["soberania", "cidadania", "dignidade", "Estado Democrático"] },
      { numero: 5, texto: "Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade.", termos: ["igualdade", "liberdade", "direitos fundamentais", "vida", "propriedade", "segurança"] },
      { numero: 37, texto: "A administração pública direta e indireta de qualquer dos Poderes da União, dos Estados, do Distrito Federal e dos Municípios obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência.", termos: ["administração pública", "legalidade", "impessoalidade", "moralidade", "publicidade", "eficiência"] },
      { numero: 170, texto: "A ordem econômica, fundada na valorização do trabalho humano e na livre iniciativa, tem por fim assegurar a todos existência digna, conforme os ditames da justiça social.", termos: ["ordem econômica", "livre iniciativa", "justiça social", "trabalho"] },
    ],
  },
  {
    id: "cc2002", codigo: "CC", nome: "Código Civil (Lei 10.406/2002)",
    url: "http://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
    areas: ["Civil", "Família", "Empresarial"],
    artigosChave: [
      { numero: 186, texto: "Aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, ainda que exclusivamente moral, comete ato ilícito.", termos: ["ato ilícito", "dano", "negligência", "imprudência", "dano moral"] },
      { numero: 927, texto: "Aquele que, por ato ilícito (arts. 186 e 187), causar dano a outrem, fica obrigado a repará-lo.", termos: ["responsabilidade civil", "reparação", "dano", "indenização"] },
      { numero: 421, texto: "A liberdade contratual será exercida nos limites da função social do contrato.", termos: ["contrato", "função social", "liberdade contratual"] },
      { numero: 1228, texto: "O proprietário tem a faculdade de usar, gozar e dispor da coisa, e o direito de reavê-la do poder de quem quer que injustamente a possua ou detenha.", termos: ["propriedade", "posse", "uso", "gozo", "disposição"] },
    ],
  },
  {
    id: "cpc2015", codigo: "CPC", nome: "Código de Processo Civil (Lei 13.105/2015)",
    url: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm",
    areas: ["Processo Civil", "Civil"],
    artigosChave: [
      { numero: 300, texto: "A tutela de urgência será concedida quando houver elementos que evidenciem a probabilidade do direito e o perigo de dano ou o risco ao resultado útil do processo.", termos: ["tutela de urgência", "liminar", "probabilidade do direito", "perigo de dano"] },
      { numero: 319, texto: "A petição inicial indicará: I - o juízo a que é dirigida; II - os nomes, os prenomes, o estado civil, a existência de união estável, a profissão, o número de inscrição no CPF ou no CNPJ, o endereço eletrônico, o domicílio e a residência do autor e do réu.", termos: ["petição inicial", "requisitos", "autor", "réu"] },
      { numero: 485, texto: "O juiz não resolverá o mérito quando: I - indeferir a petição inicial; II - o processo ficar parado durante mais de 1 ano por negligência das partes.", termos: ["extinção sem mérito", "indeferimento", "abandono", "negligência"] },
      { numero: 1015, texto: "Cabe agravo de instrumento contra as decisões interlocutórias que versarem sobre: I - tutelas provisórias.", termos: ["agravo de instrumento", "decisão interlocutória", "tutela provisória"] },
    ],
  },
  {
    id: "cp1940", codigo: "CP", nome: "Código Penal (Decreto-Lei 2.848/1940)",
    url: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
    areas: ["Penal"],
    artigosChave: [
      { numero: 121, texto: "Matar alguém: Pena - reclusão, de seis a vinte anos.", termos: ["homicídio", "matar", "reclusão"] },
      { numero: 155, texto: "Subtrair, para si ou para outrem, coisa alheia móvel: Pena - reclusão, de um a quatro anos, e multa.", termos: ["furto", "subtrair", "coisa alheia"] },
      { numero: 171, texto: "Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, induzindo ou mantendo alguém em erro, mediante artifício, ardil, ou qualquer outro meio fraudulento.", termos: ["estelionato", "fraude", "vantagem ilícita", "artifício"] },
      { numero: 312, texto: "Apropriar-se o funcionário público de dinheiro, valor ou qualquer outro bem móvel, público ou particular, de que tem a posse em razão do cargo, ou desviá-lo, em proveito próprio ou alheio.", termos: ["peculato", "funcionário público", "apropriação", "desvio"] },
    ],
  },
  {
    id: "clt1943", codigo: "CLT", nome: "Consolidação das Leis do Trabalho (Decreto-Lei 5.452/1943)",
    url: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm",
    areas: ["Trabalhista"],
    artigosChave: [
      { numero: 2, texto: "Considera-se empregador a empresa, individual ou coletiva, que, assumindo os riscos da atividade econômica, admite, assalaria e dirige a prestação pessoal de serviço.", termos: ["empregador", "empresa", "atividade econômica"] },
      { numero: 3, texto: "Considera-se empregado toda pessoa física que prestar serviços de natureza não eventual a empregador, sob a dependência deste e mediante salário.", termos: ["empregado", "vínculo empregatício", "subordinação", "salário"] },
      { numero: 477, texto: "É assegurado a todo empregado, não existindo prazo estipulado para a terminação do respectivo contrato, e quando não haja ele dado motivo para cessação das relações de trabalho, o direito de haver do empregador uma indenização.", termos: ["rescisão", "indenização", "demissão", "verbas rescisórias"] },
      { numero: 818, texto: "O ônus da prova incumbe: I - ao reclamante, quanto ao fato constitutivo de seu direito; II - ao reclamado, quanto à existência de fato impeditivo, modificativo ou extintivo do direito do reclamante.", termos: ["ônus da prova", "reclamante", "reclamado", "prova"] },
    ],
  },
  {
    id: "cdc1990", codigo: "CDC", nome: "Código de Defesa do Consumidor (Lei 8.078/1990)",
    url: "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
    areas: ["Consumidor"],
    artigosChave: [
      { numero: 6, texto: "São direitos básicos do consumidor: I - a proteção da vida, saúde e segurança; II - a educação e divulgação sobre o consumo adequado dos produtos e serviços; III - a informação adequada e clara sobre os diferentes produtos e serviços.", termos: ["direitos do consumidor", "proteção", "informação", "saúde"] },
      { numero: 12, texto: "O fabricante, o produtor, o construtor, nacional ou estrangeiro, e o importador respondem, independentemente da existência de culpa, pela reparação dos danos causados aos consumidores por defeitos decorrentes de projeto, fabricação, construção, montagem, fórmulas, manipulação, apresentação ou acondicionamento de seus produtos.", termos: ["responsabilidade objetiva", "fabricante", "defeito do produto", "dano ao consumidor"] },
      { numero: 14, texto: "O fornecedor de serviços responde, independentemente da existência de culpa, pela reparação dos danos causados aos consumidores por defeitos relativos à prestação dos serviços.", termos: ["defeito do serviço", "fornecedor", "responsabilidade", "prestação de serviços"] },
      { numero: 42, texto: "Na cobrança de débitos, o consumidor inadimplente não será exposto a ridículo, nem será submetido a qualquer tipo de constrangimento ou ameaça.", termos: ["cobrança", "constrangimento", "inadimplente", "débito"] },
    ],
  },
];

// ─── Funções de Busca Semântica Local ────────────────────────────────────────

/**
 * Busca súmulas relevantes por termos e área jurídica.
 * Usa matching por termos (TF simples) para ranking local.
 */
export function buscarSumulasRelevantes(
  consulta: string,
  area?: string,
  limite: number = 5,
): Sumula[] {
  const termosConsulta = consulta.toLowerCase().split(/\s+/).filter(t => t.length > 3);

  const scored = SUMULAS_BASE.map(sumula => {
    let score = 0;

    // Match por termos
    for (const termo of termosConsulta) {
      if (sumula.termos.some(t => t.toLowerCase().includes(termo))) score += 10;
      if (sumula.enunciado.toLowerCase().includes(termo)) score += 5;
    }

    // Bonus por área
    if (area && sumula.areas.includes(area)) score += 15;

    // Bonus por súmula vinculante
    if (sumula.vinculante) score += 5;

    return { sumula, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map(s => s.sumula);
}

/**
 * Busca artigos de legislação relevantes por termos e área jurídica.
 */
export function buscarLegislacaoRelevante(
  consulta: string,
  area?: string,
  limite: number = 5,
): { legislacao: LegislacaoBase; artigo: { numero: number; texto: string } }[] {
  const termosConsulta = consulta.toLowerCase().split(/\s+/).filter(t => t.length > 3);

  const resultados: { legislacao: LegislacaoBase; artigo: { numero: number; texto: string }; score: number }[] = [];

  for (const leg of LEGISLACAO_BASE) {
    for (const artigo of leg.artigosChave) {
      let score = 0;

      for (const termo of termosConsulta) {
        if (artigo.termos.some(t => t.toLowerCase().includes(termo))) score += 10;
        if (artigo.texto.toLowerCase().includes(termo)) score += 5;
      }

      if (area && leg.areas.includes(area)) score += 15;

      if (score > 0) {
        resultados.push({ legislacao: leg, artigo, score });
      }
    }
  }

  return resultados
    .sort((a, b) => b.score - a.score)
    .slice(0, limite);
}

/**
 * Formata fontes RAG para inclusão no contexto do prompt.
 */
export function formatarFontesParaContexto(fontes: FonteRAG[]): string {
  if (fontes.length === 0) return "";

  const secoes: string[] = [];

  const legislacao = fontes.filter(f => f.tipo === "legislacao");
  const sumulas = fontes.filter(f => f.tipo === "sumula");
  const jurisprudencia = fontes.filter(f => f.tipo === "jurisprudencia");

  if (legislacao.length > 0) {
    secoes.push("LEGISLAÇÃO RELEVANTE (recuperada automaticamente):");
    legislacao.forEach(f => secoes.push(`- ${f.titulo}: ${f.conteudo}`));
  }

  if (sumulas.length > 0) {
    secoes.push("\nSÚMULAS APLICÁVEIS (recuperadas automaticamente):");
    sumulas.forEach(f => secoes.push(`- ${f.titulo}: ${f.conteudo}`));
  }

  if (jurisprudencia.length > 0) {
    secoes.push("\nJURISPRUDÊNCIA ENCONTRADA (recuperada automaticamente):");
    jurisprudencia.forEach(f => secoes.push(`- ${f.titulo} (${f.origem}): ${f.conteudo}`));
  }

  return secoes.join("\n");
}
