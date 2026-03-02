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
  type TribunalCode,
  type ProcessoDataJud,
  type ResultadoBuscaDataJud,
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
  filtroTemporal: { inicio: string; fim: string } = { inicio: "2022-01-01", fim: new Date().toISOString().split("T")[0] }
): Promise<{ processos: ProcessoDataJud[]; total: number }> {
  const tribunalAlias = TRIBUNAIS[tribunal];
  if (!tribunalAlias) {
    logger.warn(`[PesquisaJurisprudencial] Tribunal não encontrado: ${tribunal}`);
    return { processos: [], total: 0 };
  }

  const url = `${DATAJUD_BASE_URL}/${tribunalAlias}/_search`;

  const body = {
    size: limite,
    sort: [{ "@timestamp": "desc" }],
    query: {
      bool: {
        filter: [
          { range: { "@timestamp": { gte: filtroTemporal.inicio, lte: filtroTemporal.fim } } },
        ],
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
  let totalGeral = 0;

  for (const resultado of resultados) {
    if (resultado.status === "fulfilled") {
      processos.push(...resultado.value.processos);
      totalGeral += resultado.value.total;
    }
  }

  return { processos, totalGeral };
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
    STJ: `https://processo.stj.jus.br/processo/pesquisa/?tipoPesquisa=tipoPesquisaNumeroRegistro&termo=${numero}`,
    STF: `https://portal.stf.jus.br/processos/detalhe.asp?incidente=${numero}`,
    TJSP: `https://esaj.tjsp.jus.br/cpopg/show.do?processo.numero=${numero}`,
    TJRJ: `https://www3.tjrj.jus.br/consultaprocessual/#/consultapublica#702`,
    TJPR: `https://portal.tjpr.jus.br/jurisprudencia/publico/pesquisa.do?actionType=pesquisar`,
    TJRS: `https://www.tjrs.jus.br/novo/busca/?return=proc&client=wp_index`,
    TJMG: `https://www5.tjmg.jus.br/jurisprudencia/`,
    TJSC: `https://busca.tjsc.jus.br/jurisprudencia/`,
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
}): Promise<ResultadoPesquisaCompleta> {
  const startTime = Date.now();
  const {
    promptTexto,
    areaJuridica,
    tipoDocumento,
    tribunais = ["STJ", "TJSP", "TJPR", "TJRJ", "TJRS"],
    limitePorTese = 5,
    filtroTemporal = { inicio: "2022-01-01", fim: new Date().toISOString().split("T")[0] },
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
      filtroTemporal
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
