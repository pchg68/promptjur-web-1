import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getCachedData } from "../admin";

export const analyticsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getCachedData(`analytics:${ctx.user.id}`, () => db.getAnalytics(ctx.user.id));
  }),
  usageByDate: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(30).default(7) }).optional())
    .query(async ({ input, ctx }) => db.getUsageByDate(ctx.user.id, input?.days || 7))
});

export const historicoRouter = router({
  listar: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ input, ctx }) => db.getUserHistorico(ctx.user.id, input.limit)),

  prompts: protectedProcedure
    .input(z.object({
      tipo: z.enum(["analise", "geracao", "otimizacao"]).optional(),
      area: z.string().optional(), favoritos: z.boolean().optional(),
      limit: z.number().optional().default(50)
    }))
    .query(async ({ input, ctx }) => db.getUserPrompts(ctx.user.id, input.limit)),
});

export const versoesRouter = router({
  salvar: protectedProcedure
    .input(z.object({
      promptId: z.number(), versao: z.number(), conteudo: z.string(),
      tipo: z.enum(["original", "otimizado", "manual"]), observacoes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const versaoId = await db.salvarVersaoPrompt(input);
      return { success: true, versaoId };
    }),

  listar: protectedProcedure
    .input(z.object({ promptId: z.number() }))
    .query(async ({ input }) => db.getVersoesPrompt(input.promptId))
});

export const configuracoesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    let config = await db.getUserConfiguracao(ctx.user.id);
    if (!config) {
      await db.upsertConfiguracao({ userId: ctx.user.id, nivelDetalhePreferido: 5, incluirReferenciasDefault: true });
      config = await db.getUserConfiguracao(ctx.user.id);
    }
    return config;
  }),

  update: protectedProcedure
    .input(z.object({
      areaPreferida: z.string().optional(), nivelDetalhePreferido: z.number().min(1).max(10).optional(),
      incluirReferenciasDefault: z.boolean().optional(), personaDefault: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      await db.upsertConfiguracao({ userId: ctx.user.id, ...input });
      return { success: true };
    })
});
