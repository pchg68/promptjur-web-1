/**
 * RAG Engine — Motor de Retrieval-Augmented Generation Jurídico
 * 
 * Combina:
 * 1. Busca semântica local (súmulas + legislação base)
 * 2. Busca em API DataJud (jurisprudência real)
 * 3. LLM para ranqueamento e síntese de relevância
 */

import { logger } from "./_core/logger";
import {
  type FonteRAG,
  type ResultadoRAG,
  type ConfiguracaoRAG,
  RAG_CONFIG_PADRAO,
  buscarSumulasRelevantes,
  buscarLegislacaoRelevante,
  formatarFontesParaContexto,
} from "@shared/rag-juridico";

// ─── Busca de Jurisprudência via DataJud ─────────────────────────────────────

async function buscarJurisprudenciaDataJud(
  contexto: string,
  area: string,
  tipoDocumento: string,
  tribunais: string[],
  limite: number,
): Promise<FonteRAG[]> {
  try {
    const { buscarPrecedentesSimilares, formatarProcessoParaTexto } = await import("./knowledge-retrieval-datajud");

    const precedentes = await buscarPrecedentesSimilares(
      contexto, area, tipoDocumento,
      tribunais as any,
      limite,
    );

    return precedentes.map((p, idx) => ({
      id: `jurisp_${idx}`,
      tipo: "jurisprudencia" as const,
      titulo: `${p.classe?.nome || "Processo"} - ${p.numeroProcesso}`,
      conteudo: formatarProcessoParaTexto(p).substring(0, 500),
      origem: p.tribunal || "DataJud",
      relevancia: Math.round((p.score_relevancia || 0.5) * 100),
      area,
    }));
  } catch (error) {
    logger.warn("[RAG] Erro ao buscar jurisprudência no DataJud", { error });
    return [];
  }
}

// ─── Busca Local de Súmulas ──────────────────────────────────────────────────

function buscarSumulasLocais(contexto: string, area: string, limite: number): FonteRAG[] {
  const sumulas = buscarSumulasRelevantes(contexto, area, limite);

  return sumulas.map((s, idx) => ({
    id: `sumula_${s.id}`,
    tipo: "sumula" as const,
    titulo: `${s.vinculante ? "Súmula Vinculante" : "Súmula"} ${s.numero} do ${s.tribunal}`,
    conteudo: s.enunciado,
    origem: s.tribunal,
    url: s.url,
    relevancia: 90 - idx * 10, // Decrescente por ranking
    area,
  }));
}

// ─── Busca Local de Legislação ───────────────────────────────────────────────

function buscarLegislacaoLocal(contexto: string, area: string, limite: number): FonteRAG[] {
  const resultados = buscarLegislacaoRelevante(contexto, area, limite);

  return resultados.map((r, idx) => ({
    id: `leg_${r.legislacao.id}_art${r.artigo.numero}`,
    tipo: "legislacao" as const,
    titulo: `Art. ${r.artigo.numero} do ${r.legislacao.codigo} (${r.legislacao.nome})`,
    conteudo: r.artigo.texto,
    origem: "Planalto",
    url: r.legislacao.url,
    relevancia: 85 - idx * 10,
    area,
  }));
}

// ─── Motor Principal do RAG ──────────────────────────────────────────────────

/**
 * Executa a busca RAG completa: local + DataJud.
 * Retorna fontes ranqueadas e contexto enriquecido.
 */
export async function executarRAG(
  contexto: string,
  area: string,
  tipoDocumento: string,
  config: Partial<ConfiguracaoRAG> = {},
): Promise<ResultadoRAG> {
  const startTime = Date.now();
  const cfg = { ...RAG_CONFIG_PADRAO, ...config };

  logger.info("[RAG] Iniciando busca semântica", { area, tipoDocumento, config: cfg });

  const todasFontes: FonteRAG[] = [];

  // 1. Busca local de legislação
  if (cfg.buscarLegislacao) {
    const legislacao = buscarLegislacaoLocal(contexto, area, 5);
    todasFontes.push(...legislacao);
    logger.info("[RAG] Legislação local encontrada", { total: legislacao.length });
  }

  // 2. Busca local de súmulas
  if (cfg.buscarSumulas) {
    const sumulas = buscarSumulasLocais(contexto, area, 5);
    todasFontes.push(...sumulas);
    logger.info("[RAG] Súmulas locais encontradas", { total: sumulas.length });
  }

  // 3. Busca de jurisprudência no DataJud
  if (cfg.buscarJurisprudencia) {
    const jurisprudencia = await buscarJurisprudenciaDataJud(
      contexto, area, tipoDocumento,
      cfg.tribunais, 5,
    );
    todasFontes.push(...jurisprudencia);
    logger.info("[RAG] Jurisprudência DataJud encontrada", { total: jurisprudencia.length });
  }

  // 4. Filtrar por relevância mínima e limitar
  const fontesRelevantes = todasFontes
    .filter(f => f.relevancia >= cfg.relevanciaMinimaFonte)
    .sort((a, b) => b.relevancia - a.relevancia)
    .slice(0, cfg.maxFontes);

  // 5. Montar contexto enriquecido
  const contextoEnriquecido = formatarFontesParaContexto(fontesRelevantes);

  // 6. Gerar resumo
  const resumo = gerarResumoFontes(fontesRelevantes);

  const tempoMs = Date.now() - startTime;
  logger.info("[RAG] Busca concluída", { totalFontes: fontesRelevantes.length, tempoMs });

  return {
    fontes: fontesRelevantes,
    contextoEnriquecido,
    totalFontes: fontesRelevantes.length,
    tempoMs,
    resumo,
  };
}

function gerarResumoFontes(fontes: FonteRAG[]): string {
  if (fontes.length === 0) {
    return "Nenhuma fonte relevante encontrada na base de conhecimento.";
  }

  const legislacao = fontes.filter(f => f.tipo === "legislacao").length;
  const sumulas = fontes.filter(f => f.tipo === "sumula").length;
  const jurisprudencia = fontes.filter(f => f.tipo === "jurisprudencia").length;

  const partes: string[] = [];
  if (legislacao > 0) partes.push(`${legislacao} artigo(s) de legislação`);
  if (sumulas > 0) partes.push(`${sumulas} súmula(s)`);
  if (jurisprudencia > 0) partes.push(`${jurisprudencia} precedente(s) jurisprudencial(is)`);

  return `Encontrado(s) ${fontes.length} fonte(s) relevante(s): ${partes.join(", ")}. As fontes foram incorporadas automaticamente ao contexto de geração.`;
}
