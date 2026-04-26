/**
 * Router de Monitoramento LLM — acesso restrito a administradores.
 * Expõe métricas agregadas, logs recentes e tendências de uso.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  calcularMetricasLlm,
  listarLlmLogs,
  type StatusLlm,
} from "../db-llm-logs";

/** Middleware que garante acesso apenas para admins */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito a administradores.",
    });
  }
  return next({ ctx });
});

export const monitoramentoRouter = router({
  /**
   * Métricas agregadas de uso do LLM (últimas N horas)
   */
  metricas: adminProcedure
    .input(
      z.object({
        horasAtras: z.number().min(1).max(720).default(24),
      }).optional()
    )
    .query(async ({ input }) => {
      const horas = input?.horasAtras ?? 24;
      return calcularMetricasLlm(horas);
    }),

  /**
   * Lista logs recentes com filtros opcionais
   */
  logs: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
        provider: z.string().optional(),
        status: z.enum(["sucesso", "erro", "timeout", "fallback_sucesso", "fallback_erro"]).optional(),
        apenasErros: z.boolean().optional(),
        apenasFallbacks: z.boolean().optional(),
        horasAtras: z.number().min(1).max(720).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const logs = await listarLlmLogs({
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
        provider: input?.provider,
        status: input?.status as StatusLlm | undefined,
        apenasErros: input?.apenasErros,
        apenasFallbacks: input?.apenasFallbacks,
        horasAtras: input?.horasAtras,
      });

      return logs.map(log => ({
        id: log.id,
        userId: log.userId,
        providerSolicitado: log.providerSolicitado,
        modeloSolicitado: log.modeloSolicitado,
        providerEfetivo: log.providerEfetivo,
        modeloEfetivo: log.modeloEfetivo,
        houveFallback: log.houveFallback,
        status: log.status,
        latenciaMs: log.latenciaMs,
        tokensEntrada: log.tokensEntrada,
        tokensSaida: log.tokensSaida,
        contexto: log.contexto,
        erroMensagem: log.erroMensagem,
        erroTipo: log.erroTipo,
        numeroTentativa: log.numeroTentativa,
        createdAt: log.createdAt.toISOString(),
      }));
    }),

  /**
   * Resumo rápido para o dashboard de admin (últimas 1h e 24h)
   */
  resumo: adminProcedure.query(async () => {
    const [ultima1h, ultimas24h, ultimas7d] = await Promise.all([
      calcularMetricasLlm(1),
      calcularMetricasLlm(24),
      calcularMetricasLlm(168),
    ]);

    return {
      ultima1h: {
        totalChamadas: ultima1h.totalChamadas,
        totalErros: ultima1h.totalErros,
        totalFallbacks: ultima1h.totalFallbacks,
        taxaSucesso: ultima1h.taxaSucesso,
        latenciaMediaMs: ultima1h.latenciaMediaMs,
      },
      ultimas24h: {
        totalChamadas: ultimas24h.totalChamadas,
        totalErros: ultimas24h.totalErros,
        totalFallbacks: ultimas24h.totalFallbacks,
        taxaSucesso: ultimas24h.taxaSucesso,
        latenciaMediaMs: ultimas24h.latenciaMediaMs,
        totalTokens: ultimas24h.totalTokens,
        porProvider: ultimas24h.porProvider,
        errosPorTipo: ultimas24h.errosPorTipo,
        tendencia24h: ultimas24h.tendencia24h,
      },
      ultimas7d: {
        totalChamadas: ultimas7d.totalChamadas,
        totalErros: ultimas7d.totalErros,
        totalFallbacks: ultimas7d.totalFallbacks,
        taxaSucesso: ultimas7d.taxaSucesso,
        totalTokens: ultimas7d.totalTokens,
      },
    };
  }),
});
