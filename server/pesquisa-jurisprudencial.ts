/**
 * Módulo de Pesquisa Jurisprudencial Inteligente
 * 
 * Fluxo:
 * 1. Recebe o prompt/documento elaborado pelo usuário
 * 2. Usa LLM para extrair teses jurídicas e termos-chave
 * 3. Monta queries Elasticsearch para DataJud (CNJ)
 * 4. Busca em múltiplos tribunais em paralelo
 * 5. Valida resultados com checklist anti-jurisprudência falsa
 * 6. Retorna resultados organizados por tese para incorporação opcional
 * 
 * Fontes: CNJ DataJud (API pública), STJ SCON (URL parametrizada)
 * Referência: https://datajud-wiki.cnj.jus.br/api-publica/
 */

import { invokeLLM } from "./_core/llm";
import { logger } from "./_core/logger";
import {
  TRIBUNAIS,
  TRIBUNAIS_METADATA,
  type TribunalCode,
  type ProcessoDataJud,
  type ResultadoBuscaDataJud,
  type GrauJurisdicao,
} from "./knowledge-retrieval-datajud";

const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY || "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";
const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

// ============================================================================
// TIPOS
// ============================================================================

export interface TeseExtraida {
  id: string;
  titulo: string;
  descricao: string;
  termosChave: string[];
  artigosRelacionados: string[];
  queryElasticsearch: string;
}

export interface ResultadoJurisprudencial {
  tese: TeseExtraida;
  processos: ProcessoEnriquecido[];
  totalEncontrado: number;
}

export interface ProcessoEnriquecido {
  numeroProcesso: string;
  tribunal: string;
  tribunalBusca: string;
  classe: string;
  assuntos: string[];
  orgaoJulgador: string;
  grau: string;
  dataAjuizamento: string;
  dataUltimaAtualizacao: string;
  movimentoRecente?: string;
  dataMovimentoRecente?: string;
  scoreRelevancia: number;
  linkOficial: string;
  validacao: ValidacaoProcesso;
}

export interface ValidacaoProcesso {
  temFonteOficial: boolean;
  temIdentificacaoCompleta: boolean;
  temDataRecente: boolean;
  temAderenciaFatica: boolean;
  scoreValidacao: number; // 0-100
  alertas: string[];
}

export interface ResultadoPesquisaCompleta {
  teses: TeseExtraida[];
  resultados: ResultadoJurisprudencial[];
  metadados: {
    totalProcessos: number;
    tribunaisConsultados: string[];
    tempoExecucao: number;
    dataConsulta: string;
    filtroTemporal: { inicio: string; fim: string };
  };
}

// ============================================================================
// 1. EXTRAÇÃO DE TESES VIA LLM
// ============================================================================

export async function extrairTesesDoPrompt(
  promptTexto: string,
  areaJuridica: string,
  tipoDocumento: string
): Promise<TeseExtraida[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um assistente jurídico especializado em pesquisa jurisprudencial brasileira.
Sua tarefa é analisar o texto jurídico fornecido e extrair as TESES JURÍDICAS que precisam de fundamentação jurisprudencial.

Para cada tese, forneça:
- Um título curto e descritivo
- Uma descrição da tese em 1-2 frases
- Termos-chave para busca (palavras e expressões jurídicas relevantes)
- Artigos de lei relacionados (ex: "art. 475 CC", "art. 300 CPC")
- Uma query de busca textual otimizada para Elasticsearch (usando operadores AND, OR, aspas para expressões exatas, e wildcards com *)

REGRAS IMPORTANTES:
- Extraia entre 2 e 7 teses, priorizando as mais relevantes
- Os termos-chave devem ser específicos do direito brasileiro
- As queries devem ser tolerantes (usar OR entre sinônimos) mas precisas
- Inclua variações de termos jurídicos (ex: "rescisão" OR "resolução")
- Priorize teses que realmente precisam de jurisprudência para fundamentação

Responda EXCLUSIVAMENTE em JSON válido com o seguinte formato:
{
  "teses": [
    {
      "titulo": "string",
      "descricao": "string",
      "termosChave": ["string"],
      "artigosRelacionados": ["string"],
      "queryElasticsearch": "string"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Área Jurídica: ${areaJuridica}
Tipo de Documento: ${tipoDocumento}

Texto para análise:
${promptTexto.substring(0, 4000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "teses_juridicas",
          strict: true,
          schema: {
            type: "object",
            properties: {
              teses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    descricao: { type: "string" },
                    termosChave: { type: "array", items: { type: "string" } },
                    artigosRelacionados: { type: "array", items: { type: "string" } },
                    queryElasticsearch: { type: "string" },
                  },
                  required: ["titulo", "descricao", "termosChave", "artigosRelacionados", "queryElasticsearch"],
                  additionalProperties: false,
                },
              },
            },
            required: ["teses"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("LLM não retornou conteúdo");
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

    const parsed = JSON.parse(content);
    return parsed.teses.map((t: any, idx: number) => ({
      id: `tese-${idx + 1}`,
      titulo: t.titulo,
      descricao: t.descricao,
      termosChave: t.termosChave,
      artigosRelacionados: t.artigosRelacionados,
      queryElasticsearch: t.queryElasticsearch,
    }));
  } catch (error) {
    logger.error("[PesquisaJurisprudencial] Erro ao extrair teses", { error });
    // Fallback: extrair teses básicas do texto
    return extrairTesesFallback(promptTexto, areaJuridica);
  }
}

/**
 * Fallback para extração de teses sem LLM
 */
function extrairTesesFallback(texto: string, area: string): TeseExtraida[] {
  const teses: TeseExtraida[] = [];
  const textoLower = texto.toLowerCase();

  const padroes = [
    { regex: /indeniza[çc][ãa]o|dano\s*moral|dano\s*material/i, titulo: "Indenização por Danos", query: "(indeniza* OR \"dano moral\" OR \"dano material\")" },
    { regex: /rescis[ãa]o|resolu[çc][ãa]o|inadimplemento/i, titulo: "Rescisão/Resolução Contratual", query: "(rescis* OR resolu* OR inadimplemento)" },
    { regex: /tutela\s*(de\s*)?urg[eê]ncia|liminar|antecipa/i, titulo: "Tutela de Urgência", query: "(\"tutela de urgência\" OR liminar OR \"antecipação de tutela\")" },
    { regex: /lucros?\s*cessantes?|perda\s*de\s*ganho/i, titulo: "Lucros Cessantes", query: "(\"lucros cessantes\" OR \"perda de ganho\" OR \"perda de faturamento\")" },
    { regex: /posse|esbulho|reintegra[çc][ãa]o/i, titulo: "Posse e Esbulho", query: "(posse OR esbulh* OR reintegra* OR \"posse injusta\")" },
    { regex: /comodato|cess[ãa]o\s*gratuita/i, titulo: "Comodato", query: "(comodato OR \"cessão gratuita\" OR \"contrato verbal\")" },
    { regex: /multa|tr[âa]nsito|detran|cnh/i, titulo: "Multas de Trânsito", query: "(\"multa de trânsito\" OR DETRAN OR CNH OR pontuação)" },
    { regex: /alimentos|pens[ãa]o/i, titulo: "Alimentos/Pensão", query: "(alimentos OR pensão OR \"obrigação alimentar\")" },
    { regex: /trabalh|rescis[ãa]o\s*trabalhista|clt/i, titulo: "Direito do Trabalho", query: "(\"direito do trabalho\" OR CLT OR \"rescisão trabalhista\")" },
    { regex: /consumidor|cdc|fornecedor/i, titulo: "Direito do Consumidor", query: "(consumidor OR CDC OR \"Código de Defesa do Consumidor\")" },
  ];

  for (const padrao of padroes) {
    if (padrao.regex.test(textoLower)) {
      teses.push({
        id: `tese-fallback-${teses.length + 1}`,
        titulo: padrao.titulo,
        descricao: `Pesquisa jurisprudencial sobre ${padrao.titulo.toLowerCase()} na área de ${area}`,
        termosChave: padrao.titulo.split(/\s+/),
        artigosRelacionados: [],
        queryElasticsearch: padrao.query,
      });
    }
  }

  if (teses.length === 0) {
    teses.push({
      id: "tese-fallback-geral",
      titulo: `Jurisprudência em ${area}`,
      descricao: `Pesquisa geral de jurisprudência na área de ${area}`,
      termosChave: area.split(/\s+/),
      artigosRelacionados: [],
      queryElasticsearch: `(${area.split(/\s+/).join(" AND ")})`,
    });
  }

  return teses;
}

// ============================================================================
// 2. BUSCA NO DATAJUD
// ============================================================================

/**
 * Buscar processos no DataJud usando query Elasticsearch
 */
async function buscarNoDataJud(
  query: string,
  tribunal: TribunalCode,
  limite: number = 10,
  filtroTemporal: { inicio: string; fim: string } = { inicio: "2022-01-01", fim: new Date().toISOString().split("T")[0] },
  grau: GrauJurisdicao = "todos"
): Promise<{ processos: ProcessoDataJud[]; total: number }> {
  const tribunalAlias = TRIBUNAIS[tribunal];
  if (!tribunalAlias) {
    logger.warn(`[PesquisaJurisprudencial] Tribunal não encontrado: ${tribunal}`);
    return { processos: [], total: 0 };
  }

  const url = `${DATAJUD_BASE_URL}/${tribunalAlias}/_search`;

  // Montar filtros
  const filters: any[] = [
    { range: { "@timestamp": { gte: filtroTemporal.inicio, lte: filtroTemporal.fim } } },
  ];

  // Filtro de grau de jurisdição
  if (grau !== "todos") {
    filters.push({ match: { grau: grau } });
  }

  const body = {
    size: limite,
    sort: [{ "@timestamp": "desc" }],
    query: {
      bool: {
        filter: filters,
        must: [
          { query_string: { query } },
        ],
      },
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${DATAJUD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn(`[DataJud] Erro HTTP ${response.status} para ${tribunal}`);
      return { processos: [], total: 0 };
    }

    const data: ResultadoBuscaDataJud = await response.json();
    return {
      processos: data.hits.hits.map((hit) => hit._source),
      total: data.hits.total.value,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      logger.warn(`[DataJud] Timeout ao buscar em ${tribunal}`);
    } else {
      logger.error(`[DataJud] Erro ao buscar em ${tribunal}`, { error });
    }
    return { processos: [], total: 0 };
  }
}

/**
 * Buscar em múltiplos tribunais em paralelo
 */
async function buscarEmMultiplosTribunais(
  query: string,
  tribunais: TribunalCode[],
  limitePorTribunal: number = 5,
  filtroTemporal?: { inicio: string; fim: string },
  grau: GrauJurisdicao = "todos"
): Promise<{ processos: Array<ProcessoDataJud & { tribunalBusca: string }>; totalGeral: number }> {
  // Limitar concorrência para não sobrecarregar a API do DataJud
  const BATCH_SIZE = 8;
  const allProcessos: Array<ProcessoDataJud & { tribunalBusca: string }> = [];
  let totalGeral = 0;

  for (let i = 0; i < tribunais.length; i += BATCH_SIZE) {
    const batch = tribunais.slice(i, i + BATCH_SIZE);
    const promessas = batch.map(async (tribunal) => {
      const resultado = await buscarNoDataJud(query, tribunal, limitePorTribunal, filtroTemporal, grau);
      return {
        processos: resultado.processos.map((p) => ({ ...p, tribunalBusca: tribunal })),
        total: resultado.total,
      };
    });

    const resultados = await Promise.allSettled(promessas);
    for (const resultado of resultados) {
      if (resultado.status === "fulfilled") {
        allProcessos.push(...resultado.value.processos);
        totalGeral += resultado.value.total;
      }
    }
  }

  return { processos: allProcessos, totalGeral };
}

// Legacy wrapper kept for compatibility
async function _buscarEmMultiplosTribunaisLegacy(
  query: string,
  tribunais: TribunalCode[],
  limitePorTribunal: number = 5,
  filtroTemporal?: { inicio: string; fim: string }
): Promise<{ processos: Array<ProcessoDataJud & { tribunalBusca: string }>; totalGeral: number }> {
  const promessas = tribunais.map(async (tribunal) => {
    const resultado = await buscarNoDataJud(query, tribunal, limitePorTribunal, filtroTemporal);
    return {
      processos: resultado.processos.map((p) => ({ ...p, tribunalBusca: tribunal })),
      total: resultado.total,
    };
  });

  const resultados = await Promise.allSettled(promessas);
  const processos: Array<ProcessoDataJud & { tribunalBusca: string }> = [];
  let totalGeralLegacy = 0;

  for (const resultado of resultados) {
    if (resultado.status === "fulfilled") {
      processos.push(...resultado.value.processos);
      totalGeralLegacy += resultado.value.total;
    }
  }

  return { processos, totalGeral: totalGeralLegacy };
}

// ============================================================================
// 3. VALIDAÇÃO ANTI-JURISPRUDÊNCIA FALSA
// ============================================================================

function validarProcesso(
  processo: ProcessoDataJud & { tribunalBusca: string },
  tese: TeseExtraida,
  contextoOriginal: string
): ValidacaoProcesso {
  const alertas: string[] = [];
  let score = 0;

  // 1. Fonte oficial (veio do DataJud = fonte oficial)
  const temFonteOficial = true;
  score += 25;

  // 2. Identificação completa
  const temIdentificacaoCompleta =
    !!processo.numeroProcesso &&
    !!processo.tribunal &&
    !!processo.orgaoJulgador?.nome &&
    !!processo.dataAjuizamento;
  if (temIdentificacaoCompleta) {
    score += 25;
  } else {
    alertas.push("Identificação incompleta: faltam dados do processo");
  }

  // 3. Atualidade (2022-2026)
  const dataRef = processo.dataHoraUltimaAtualizacao || processo.dataAjuizamento;
  const dataProcesso = new Date(dataRef);
  const anoProcesso = dataProcesso.getFullYear();
  const temDataRecente = anoProcesso >= 2022;
  if (temDataRecente) {
    score += 25;
    if (anoProcesso >= 2024) score += 5; // Bônus por ser muito recente
  } else {
    alertas.push(`Processo de ${anoProcesso} — considere buscar jurisprudência mais recente`);
  }

  // 4. Aderência fática (verifica se assuntos/classe têm relação com a tese)
  const assuntosTexto = processo.assuntos.map((a) => a.nome.toLowerCase()).join(" ");
  const classeTexto = processo.classe?.nome?.toLowerCase() || "";
  const termosLower = tese.termosChave.map((t) => t.toLowerCase());

  let aderencia = 0;
  for (const termo of termosLower) {
    if (assuntosTexto.includes(termo) || classeTexto.includes(termo)) {
      aderencia++;
    }
  }
  const temAderenciaFatica = aderencia > 0;
  if (temAderenciaFatica) {
    score += 20 + Math.min(aderencia * 2, 10);
  } else {
    alertas.push("Baixa aderência fática — verifique se o processo é relevante para a tese");
  }

  return {
    temFonteOficial,
    temIdentificacaoCompleta,
    temDataRecente,
    temAderenciaFatica,
    scoreValidacao: Math.min(score, 100),
    alertas,
  };
}

// ============================================================================
// 4. ENRIQUECIMENTO DOS RESULTADOS
// ============================================================================

function enriquecerProcesso(
  processo: ProcessoDataJud & { tribunalBusca: string },
  tese: TeseExtraida,
  contextoOriginal: string
): ProcessoEnriquecido {
  const validacao = validarProcesso(processo, tese, contextoOriginal);

  // Movimento mais recente
  const movimentos = processo.movimentos || [];
  const movimentoRecente = movimentos.length > 0
    ? movimentos.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())[0]
    : undefined;

  // Link oficial do processo
  const linkOficial = gerarLinkOficial(processo);

  return {
    numeroProcesso: processo.numeroProcesso,
    tribunal: processo.tribunal,
    tribunalBusca: processo.tribunalBusca,
    classe: processo.classe?.nome || "Não informado",
    assuntos: processo.assuntos?.map((a) => a.nome) || [],
    orgaoJulgador: processo.orgaoJulgador?.nome || "Não informado",
    grau: processo.grau || "Não informado",
    dataAjuizamento: processo.dataAjuizamento,
    dataUltimaAtualizacao: processo.dataHoraUltimaAtualizacao || processo.dataAjuizamento,
    movimentoRecente: movimentoRecente?.nome,
    dataMovimentoRecente: movimentoRecente?.dataHora,
    scoreRelevancia: validacao.scoreValidacao,
    linkOficial,
    validacao,
  };
}

/**
 * Gerar link oficial do tribunal para o processo
 */
function gerarLinkOficial(processo: ProcessoDataJud & { tribunalBusca?: string }): string {
  const numero = processo.numeroProcesso;
  const tribunal = processo.tribunalBusca || processo.tribunal;

  // Links oficiais por tribunal
  const links: Record<string, string> = {
    // Tribunais Superiores
    STF: `https://portal.stf.jus.br/processos/detalhe.asp?incidente=${numero}`,
    STJ: `https://processo.stj.jus.br/processo/pesquisa/?tipoPesquisa=tipoPesquisaNumeroRegistro&termo=${numero}`,
    TST: `https://consultaprocessual.tst.jus.br/consultaProcessual/consultaTstNumUnica.do?consulta=Consultar&conscsjt=&numeroTst=&digitoTst=&anoTst=&orgaoTst=&tribunalTst=&varaTst=&consulta=Consultar`,
    TSE: `https://www.tse.jus.br/servicos-judiciais/processos`,
    STM: `https://www.stm.jus.br/servicos-stm/processos`,
    
    // TRFs
    TRF1: `https://processual.trf1.jus.br/consultaProcessual/processo.php?proc=${numero}`,
    TRF2: `https://eproc.trf2.jus.br/eproc/externo_controlador.php?acao=processo_seleciona_publica`,
    TRF3: `https://pje1g.trf3.jus.br/pje/ConsultaPublica/listView.seam`,
    TRF4: `https://www2.trf4.jus.br/trf4/controlador.php?acao=consulta_processual_resultado_pesquisa&txtValor=${numero}`,
    TRF5: `https://pje.trf5.jus.br/pje/ConsultaPublica/listView.seam`,
    TRF6: `https://pje.trf6.jus.br/pje/ConsultaPublica/listView.seam`,
    
    // TJs Estaduais
    TJAC: `https://esaj.tjac.jus.br/cpopg/open.do`,
    TJAL: `https://www2.tjal.jus.br/cpopg/open.do`,
    TJAM: `https://consultasaj.tjam.jus.br/cpopg/open.do`,
    TJAP: `https://tucujuris.tjap.jus.br/`,
    TJBA: `https://esaj.tjba.jus.br/cpopg/open.do`,
    TJCE: `https://esaj.tjce.jus.br/cpopg/open.do`,
    TJDF: `https://pje.tjdft.jus.br/consultapublica/ConsultaPublica/listView.seam`,
    TJES: `https://sistemas.tjes.jus.br/pje/ConsultaPublica/listView.seam`,
    TJGO: `https://pje.tjgo.jus.br/ConsultaPublica/listView.seam`,
    TJMA: `https://pje.tjma.jus.br/pje/ConsultaPublica/listView.seam`,
    TJMG: `https://www5.tjmg.jus.br/jurisprudencia/`,
    TJMS: `https://esaj.tjms.jus.br/cpopg/open.do`,
    TJMT: `https://pje.tjmt.jus.br/pje/ConsultaPublica/listView.seam`,
    TJPA: `https://consultas.tjpa.jus.br/consultaprocessual/`,
    TJPB: `https://pje.tjpb.jus.br/pje/ConsultaPublica/listView.seam`,
    TJPE: `https://pje.tjpe.jus.br/1g/ConsultaPublica/listView.seam`,
    TJPI: `https://pje.tjpi.jus.br/1g/ConsultaPublica/listView.seam`,
    TJPR: `https://portal.tjpr.jus.br/jurisprudencia/publico/pesquisa.do?actionType=pesquisar`,
    TJRJ: `https://www3.tjrj.jus.br/consultaprocessual/`,
    TJRN: `https://pje.tjrn.jus.br/consultapublica/ConsultaPublica/listView.seam`,
    TJRO: `https://pje.tjro.jus.br/1g/ConsultaPublica/listView.seam`,
    TJRR: `https://pje.tjrr.jus.br/pje/ConsultaPublica/listView.seam`,
    TJRS: `https://www.tjrs.jus.br/novo/busca/?return=proc&client=wp_index`,
    TJSC: `https://busca.tjsc.jus.br/jurisprudencia/`,
    TJSE: `https://pje.tjse.jus.br/pje/ConsultaPublica/listView.seam`,
    TJSP: `https://esaj.tjsp.jus.br/cpopg/show.do?processo.numero=${numero}`,
    TJTO: `https://pje.tjto.jus.br/1g/ConsultaPublica/listView.seam`,
    
    // TRTs (Justiça do Trabalho)
    TRT1: `https://pje.trt1.jus.br/consultaprocessual/`,
    TRT2: `https://pje.trt2.jus.br/consultaprocessual/`,
    TRT3: `https://pje.trt3.jus.br/consultaprocessual/`,
    TRT4: `https://pje.trt4.jus.br/consultaprocessual/`,
    TRT5: `https://pje.trt5.jus.br/consultaprocessual/`,
    TRT6: `https://pje.trt6.jus.br/consultaprocessual/`,
    TRT7: `https://pje.trt7.jus.br/consultaprocessual/`,
    TRT8: `https://pje.trt8.jus.br/consultaprocessual/`,
    TRT9: `https://pje.trt9.jus.br/consultaprocessual/`,
    TRT10: `https://pje.trt10.jus.br/consultaprocessual/`,
    TRT11: `https://pje.trt11.jus.br/consultaprocessual/`,
    TRT12: `https://pje.trt12.jus.br/consultaprocessual/`,
    TRT13: `https://pje.trt13.jus.br/consultaprocessual/`,
    TRT14: `https://pje.trt14.jus.br/consultaprocessual/`,
    TRT15: `https://pje.trt15.jus.br/consultaprocessual/`,
    TRT16: `https://pje.trt16.jus.br/consultaprocessual/`,
    TRT17: `https://pje.trt17.jus.br/consultaprocessual/`,
    TRT18: `https://pje.trt18.jus.br/consultaprocessual/`,
    TRT19: `https://pje.trt19.jus.br/consultaprocessual/`,
    TRT20: `https://pje.trt20.jus.br/consultaprocessual/`,
    TRT21: `https://pje.trt21.jus.br/consultaprocessual/`,
    TRT22: `https://pje.trt22.jus.br/consultaprocessual/`,
    TRT23: `https://pje.trt23.jus.br/consultaprocessual/`,
    TRT24: `https://pje.trt24.jus.br/consultaprocessual/`,
  };

  return links[tribunal] || `https://api-publica.datajud.cnj.jus.br`;
}

// ============================================================================
// 5. ORQUESTRADOR PRINCIPAL
// ============================================================================

export async function pesquisarJurisprudencia(params: {
  promptTexto: string;
  areaJuridica: string;
  tipoDocumento: string;
  tribunais?: TribunalCode[];
  limitePorTese?: number;
  filtroTemporal?: { inicio: string; fim: string };
  grau?: GrauJurisdicao;
}): Promise<ResultadoPesquisaCompleta> {
  const startTime = Date.now();
  const {
    promptTexto,
    areaJuridica,
    tipoDocumento,
    tribunais = ["STF", "STJ", "TJSP", "TJPR", "TJRJ", "TJRS"],
    limitePorTese = 5,
    filtroTemporal = { inicio: "2022-01-01", fim: new Date().toISOString().split("T")[0] },
    grau = "todos",
  } = params;

  logger.info("[PesquisaJurisprudencial] Iniciando pesquisa", {
    area: areaJuridica,
    tipo: tipoDocumento,
    tribunais,
  });

  // Passo 1: Extrair teses do prompt
  const teses = await extrairTesesDoPrompt(promptTexto, areaJuridica, tipoDocumento);
  logger.info(`[PesquisaJurisprudencial] ${teses.length} teses extraídas`);

  // Passo 2: Buscar jurisprudência para cada tese
  const resultados: ResultadoJurisprudencial[] = [];
  let totalProcessos = 0;

  for (const tese of teses) {
    const { processos, totalGeral } = await buscarEmMultiplosTribunais(
      tese.queryElasticsearch,
      tribunais as TribunalCode[],
      limitePorTese,
      filtroTemporal,
      grau
    );

    // Passo 3: Enriquecer e validar cada processo
    const processosEnriquecidos = processos
      .map((p) => enriquecerProcesso(p, tese, promptTexto))
      .sort((a, b) => b.scoreRelevancia - a.scoreRelevancia)
      .slice(0, limitePorTese * tribunais.length); // Limitar resultados

    resultados.push({
      tese,
      processos: processosEnriquecidos,
      totalEncontrado: totalGeral,
    });

    totalProcessos += processosEnriquecidos.length;
  }

  const tempoExecucao = Date.now() - startTime;
  logger.info(`[PesquisaJurisprudencial] Pesquisa concluída em ${tempoExecucao}ms, ${totalProcessos} processos encontrados`);

  return {
    teses,
    resultados,
    metadados: {
      totalProcessos,
      tribunaisConsultados: tribunais,
      tempoExecucao,
      dataConsulta: new Date().toISOString(),
      filtroTemporal,
    },
  };
}

/**
 * Formatar processo para incorporação no documento jurídico
 * Segue o padrão ABNT/jurídico de citação
 */
export function formatarParaIncorporacao(processo: ProcessoEnriquecido): string {
  const data = new Date(processo.dataAjuizamento).toLocaleDateString("pt-BR");
  const assuntos = processo.assuntos.slice(0, 3).join(", ");

  return `(${processo.tribunal}, ${processo.classe} nº ${processo.numeroProcesso}, ${processo.orgaoJulgador}, j. ${data})`;
}

// ============================================================================
// 6. RESUMO AUTOMÁTICO DE JURISPRUDÊNCIA VIA IA
// ============================================================================

export type TomResumo = "formal" | "tecnico" | "persuasivo";

export interface ResumoJurisprudenciaParams {
  resultados: ResultadoJurisprudencial[];
  contextoDocumento: string;
  areaJuridica: string;
  tipoDocumento: string;
  tom?: TomResumo;
}

export interface ResumoJurisprudenciaResult {
  resumo: string;
  processosUtilizados: string[];
  tesesAbordadas: string[];
  tempoGeracao: number;
  tom: TomResumo;
}

/**
 * Gera um resumo automático de fundamentação jurídica a partir dos processos
 * encontrados na pesquisa jurisprudencial.
 * 
 * REGRA CRÍTICA: O resumo NUNCA inventa jurisprudência. Ele utiliza EXCLUSIVAMENTE
 * os processos reais retornados pelo DataJud/CNJ, formatando-os em parágrafos
 * de fundamentação prontos para inserção no documento.
 */
export async function gerarResumoJurisprudencia(
  params: ResumoJurisprudenciaParams
): Promise<ResumoJurisprudenciaResult> {
  const startTime = Date.now();
  const { resultados, contextoDocumento, areaJuridica, tipoDocumento, tom = "formal" } = params;

  // Filtrar apenas processos com score >= 40 (mínimo de confiabilidade)
  const resultadosComProcessos = resultados.filter(r => r.processos.length > 0);
  const processosValidos: { processo: ProcessoEnriquecido; tese: TeseExtraida }[] = [];

  for (const resultado of resultadosComProcessos) {
    for (const processo of resultado.processos) {
      if (processo.validacao.scoreValidacao >= 40) {
        processosValidos.push({ processo, tese: resultado.tese });
      }
    }
  }

  if (processosValidos.length === 0) {
    return {
      resumo: "Não foram encontrados processos com score de validação suficiente para gerar um resumo de fundamentação. Considere ampliar os filtros de pesquisa (mais tribunais ou período mais amplo).",
      processosUtilizados: [],
      tesesAbordadas: [],
      tempoGeracao: Date.now() - startTime,
      tom,
    };
  }

  // Montar contexto estruturado dos processos para o LLM
  const processosContexto = processosValidos.map(({ processo, tese }) => {
    const data = new Date(processo.dataAjuizamento).toLocaleDateString("pt-BR");
    return `- Tese: "${tese.titulo}"
  Processo: ${processo.numeroProcesso}
  Tribunal: ${processo.tribunal} — ${processo.orgaoJulgador}
  Classe: ${processo.classe}
  Assuntos: ${processo.assuntos.join(", ")}
  Data: ${data}
  Grau: ${processo.grau}
  Score de validação: ${processo.validacao.scoreValidacao}/100
  Link: ${processo.linkOficial}`;
  }).join("\n\n");

  const tesesAbordadas = Array.from(new Set(processosValidos.map(p => p.tese.titulo)));

  // Definir instruções de tom
  const instrucoesTom: Record<TomResumo, string> = {
    formal: "Use linguagem formal e objetiva, adequada para petições e peças processuais. Utilize vocabulário jurídico preciso e construções frasais típicas do meio forense.",
    tecnico: "Use linguagem técnica e analítica, adequada para pareceres e memorandos internos. Foque na análise dos precedentes e sua aplicabilidade ao caso concreto.",
    persuasivo: "Use linguagem persuasiva e argumentativa, adequada para sustentações orais e recursos. Enfatize a força dos precedentes e sua convergência com a tese defendida.",
  };

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um jurista brasileiro especializado em redação de fundamentação jurisprudencial.

Sua tarefa é gerar um RESUMO DE FUNDAMENTAÇÃO JURÍDICA pronto para inserção em documento jurídico, baseado EXCLUSIVAMENTE nos processos reais fornecidos abaixo.

REGRAS ABSOLUTAS:
1. NUNCA invente, fabrique ou presuma jurisprudência que não esteja na lista fornecida
2. NUNCA cite números de processo, datas, tribunais ou órgãos julgadores que não constem nos dados fornecidos
3. NUNCA adicione ementas, trechos de acórdãos ou citações textuais — você NÃO tem acesso ao inteiro teor
4. Cite APENAS os dados objetivos: número do processo, tribunal, órgão julgador, classe, assuntos e data
5. Use expressões como "conforme precedente identificado no DataJud/CNJ" para deixar clara a fonte
6. Ao final, inclua uma nota de que o advogado deve verificar o inteiro teor dos acórdãos nos links oficiais

FORMATO:
- Gere parágrafos de fundamentação em Markdown
- Organize por tese jurídica quando houver mais de uma
- Use citações no formato: (TRIBUNAL, Classe nº NÚMERO, Órgão Julgador, j. DATA)
- Inclua ao final: "**Nota:** Os precedentes acima foram identificados via consulta à base DataJud/CNJ. Recomenda-se a verificação do inteiro teor nos links oficiais antes da utilização em peça processual."

TOM: ${instrucoesTom[tom]}

ÁREA JURÍDICA: ${areaJuridica}
TIPO DE DOCUMENTO: ${tipoDocumento}`,
        },
        {
          role: "user",
          content: `CONTEXTO DO DOCUMENTO:
${contextoDocumento.substring(0, 2000)}

PROCESSOS ENCONTRADOS (DataJud/CNJ):
${processosContexto}

Gere um resumo de fundamentação jurisprudencial pronto para inserção no documento, citando os processos acima de forma organizada e profissional.`,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    const resumo = typeof content === "string" ? content : "Não foi possível gerar o resumo. Tente novamente.";

    logger.info(`[ResumoJurisprudencia] Resumo gerado com ${processosValidos.length} processos em ${Date.now() - startTime}ms`);

    return {
      resumo,
      processosUtilizados: processosValidos.map(p => p.processo.numeroProcesso),
      tesesAbordadas,
      tempoGeracao: Date.now() - startTime,
      tom,
    };
  } catch (error) {
    logger.error("[ResumoJurisprudencia] Erro ao gerar resumo", { error });
    throw new Error(`Erro ao gerar resumo de jurisprudência: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

/**
 * Gerar bloco de citação completo para incorporação
 */
export function gerarBlocoCitacao(processo: ProcessoEnriquecido, tese: TeseExtraida): string {
  const data = new Date(processo.dataAjuizamento).toLocaleDateString("pt-BR");

  return `**${tese.titulo}**

> Processo: ${processo.numeroProcesso}
> Tribunal: ${processo.tribunal} — ${processo.orgaoJulgador}
> Classe: ${processo.classe}
> Assuntos: ${processo.assuntos.join(", ")}
> Data: ${data} | Grau: ${processo.grau}
> Link: ${processo.linkOficial}

_Validação: Score ${processo.validacao.scoreValidacao}/100 — Fonte oficial DataJud/CNJ_
${processo.validacao.alertas.length > 0 ? `\n⚠️ ${processo.validacao.alertas.join(" | ")}` : ""}`;
}
