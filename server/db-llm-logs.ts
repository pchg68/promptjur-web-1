/**
 * Helpers de banco de dados para logs de monitoramento LLM.
 * Registra cada chamada ao unified-llm.ts para análise de erros e fallbacks.
 */
import { desc, eq, gte, sql, and, count } from "drizzle-orm";
import { getDb } from "./db";
import { llmLogs, InsertLlmLog, LlmLog } from "../drizzle/schema";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatusLlm = "sucesso" | "erro" | "timeout" | "fallback_sucesso" | "fallback_erro";

export interface RegistrarLlmLogInput {
  userId?: number;
  providerSolicitado: string;
  modeloSolicitado: string;
  providerEfetivo: string;
  modeloEfetivo: string;
  houveFallback: boolean;
  status: StatusLlm;
  latenciaMs?: number;
  tokensEntrada?: number;
  tokensSaida?: number;
  contexto?: string;
  erroMensagem?: string;
  erroTipo?: string;
  numeroTentativa?: number;
}

export interface MetricasLlm {
  totalChamadas: number;
  totalSucesso: number;
  totalErros: number;
  totalFallbacks: number;
  taxaSucesso: number;
  taxaFallback: number;
  latenciaMediaMs: number;
  totalTokens: number;
  porProvider: Array<{
    provider: string;
    chamadas: number;
    erros: number;
    fallbacks: number;
    latenciaMedia: number;
  }>;
  errosPorTipo: Array<{
    tipo: string;
    count: number;
  }>;
  tendencia24h: Array<{
    hora: string;
    chamadas: number;
    erros: number;
    fallbacks: number;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Registra um evento de chamada LLM no banco.
 * Falhas silenciosas para não impactar o fluxo principal.
 */
export async function registrarLlmLog(input: RegistrarLlmLogInput): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const registro: InsertLlmLog = {
      userId: input.userId ?? null,
      providerSolicitado: input.providerSolicitado,
      modeloSolicitado: input.modeloSolicitado,
      providerEfetivo: input.providerEfetivo,
      modeloEfetivo: input.modeloEfetivo,
      houveFallback: input.houveFallback,
      status: input.status,
      latenciaMs: input.latenciaMs ?? null,
      tokensEntrada: input.tokensEntrada ?? null,
      tokensSaida: input.tokensSaida ?? null,
      contexto: input.contexto ?? null,
      erroMensagem: input.erroMensagem ?? null,
      erroTipo: input.erroTipo ?? null,
      numeroTentativa: input.numeroTentativa ?? 1,
    };

    await db.insert(llmLogs).values(registro);
  } catch (err) {
    // Log silencioso — não deve interromper o fluxo principal
    console.warn("[LlmLog] Falha ao registrar log:", err);
  }
}

/**
 * Lista os logs mais recentes com paginação.
 */
export async function listarLlmLogs(options: {
  limit?: number;
  offset?: number;
  provider?: string;
  status?: StatusLlm;
  apenasErros?: boolean;
  apenasFallbacks?: boolean;
  horasAtras?: number;
}): Promise<LlmLog[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (options.provider) {
    conditions.push(eq(llmLogs.providerSolicitado, options.provider));
  }
  if (options.status) {
    conditions.push(eq(llmLogs.status, options.status));
  }
  if (options.apenasErros) {
    conditions.push(
      sql`${llmLogs.status} IN ('erro', 'timeout', 'fallback_erro')`
    );
  }
  if (options.apenasFallbacks) {
    conditions.push(eq(llmLogs.houveFallback, true));
  }
  if (options.horasAtras) {
    const desde = new Date(Date.now() - options.horasAtras * 60 * 60 * 1000);
    conditions.push(gte(llmLogs.createdAt, desde));
  }

  const query = db
    .select()
    .from(llmLogs)
    .orderBy(desc(llmLogs.createdAt))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

/**
 * Calcula métricas agregadas de uso do LLM.
 */
export async function calcularMetricasLlm(horasAtras = 24): Promise<MetricasLlm> {
  const db = await getDb();
  if (!db) {
    return {
      totalChamadas: 0, totalSucesso: 0, totalErros: 0, totalFallbacks: 0,
      taxaSucesso: 0, taxaFallback: 0, latenciaMediaMs: 0, totalTokens: 0,
      porProvider: [], errosPorTipo: [], tendencia24h: [],
    };
  }

  const desde = new Date(Date.now() - horasAtras * 60 * 60 * 1000);

  // Totais gerais
  const [totais] = await db
    .select({
      total: count(),
      sucesso: sql<number>`SUM(CASE WHEN ${llmLogs.status} IN ('sucesso', 'fallback_sucesso') THEN 1 ELSE 0 END)`,
      erros: sql<number>`SUM(CASE WHEN ${llmLogs.status} IN ('erro', 'timeout', 'fallback_erro') THEN 1 ELSE 0 END)`,
      fallbacks: sql<number>`SUM(CASE WHEN ${llmLogs.houveFallback} = 1 THEN 1 ELSE 0 END)`,
      latenciaMedia: sql<number>`AVG(${llmLogs.latenciaMs})`,
      totalTokens: sql<number>`SUM(COALESCE(${llmLogs.tokensEntrada}, 0) + COALESCE(${llmLogs.tokensSaida}, 0))`,
    })
    .from(llmLogs)
    .where(gte(llmLogs.createdAt, desde));

  const totalChamadas = Number(totais?.total ?? 0);
  const totalSucesso = Number(totais?.sucesso ?? 0);
  const totalErros = Number(totais?.erros ?? 0);
  const totalFallbacks = Number(totais?.fallbacks ?? 0);
  const latenciaMediaMs = Math.round(Number(totais?.latenciaMedia ?? 0));
  const totalTokens = Number(totais?.totalTokens ?? 0);

  // Por provider
  const porProviderRaw = await db
    .select({
      provider: llmLogs.providerSolicitado,
      chamadas: count(),
      erros: sql<number>`SUM(CASE WHEN ${llmLogs.status} IN ('erro', 'timeout', 'fallback_erro') THEN 1 ELSE 0 END)`,
      fallbacks: sql<number>`SUM(CASE WHEN ${llmLogs.houveFallback} = 1 THEN 1 ELSE 0 END)`,
      latenciaMedia: sql<number>`AVG(${llmLogs.latenciaMs})`,
    })
    .from(llmLogs)
    .where(gte(llmLogs.createdAt, desde))
    .groupBy(llmLogs.providerSolicitado)
    .orderBy(desc(count()));

  const porProvider = porProviderRaw.map((r: { provider: string; chamadas: number; erros: number; fallbacks: number; latenciaMedia: number }) => ({
    provider: r.provider,
    chamadas: Number(r.chamadas),
    erros: Number(r.erros),
    fallbacks: Number(r.fallbacks),
    latenciaMedia: Math.round(Number(r.latenciaMedia ?? 0)),
  }));

  // Erros por tipo
  const errosPorTipoRaw = await db
    .select({
      tipo: llmLogs.erroTipo,
      qtd: count(),
    })
    .from(llmLogs)
    .where(
      and(
        gte(llmLogs.createdAt, desde),
        sql`${llmLogs.erroTipo} IS NOT NULL`
      )
    )
    .groupBy(llmLogs.erroTipo)
    .orderBy(desc(count()))
    .limit(10);

  const errosPorTipo = errosPorTipoRaw.map((r: { tipo: string | null; qtd: number }) => ({
    tipo: r.tipo ?? "desconhecido",
    count: Number(r.qtd),
  }));

  // Tendência por hora (últimas 24h)
  const tendencia24hRaw = await db
    .select({
      hora: sql<string>`DATE_FORMAT(${llmLogs.createdAt}, '%Y-%m-%d %H:00')`,
      chamadas: count(),
      erros: sql<number>`SUM(CASE WHEN ${llmLogs.status} IN ('erro', 'timeout', 'fallback_erro') THEN 1 ELSE 0 END)`,
      fallbacks: sql<number>`SUM(CASE WHEN ${llmLogs.houveFallback} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(llmLogs)
    .where(gte(llmLogs.createdAt, desde))
    .groupBy(sql`DATE_FORMAT(${llmLogs.createdAt}, '%Y-%m-%d %H:00')`)
    .orderBy(sql`DATE_FORMAT(${llmLogs.createdAt}, '%Y-%m-%d %H:00')`);

  const tendencia24h = tendencia24hRaw.map((r: { hora: string; chamadas: number; erros: number; fallbacks: number }) => ({
    hora: r.hora,
    chamadas: Number(r.chamadas),
    erros: Number(r.erros),
    fallbacks: Number(r.fallbacks),
  }));

  return {
    totalChamadas,
    totalSucesso,
    totalErros,
    totalFallbacks,
    taxaSucesso: totalChamadas > 0 ? Math.round((totalSucesso / totalChamadas) * 100) : 0,
    taxaFallback: totalChamadas > 0 ? Math.round((totalFallbacks / totalChamadas) * 100) : 0,
    latenciaMediaMs,
    totalTokens,
    porProvider,
    errosPorTipo,
    tendencia24h,
  };
}
