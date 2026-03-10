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

  // Estatísticas completas para o painel de controle
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      return getCachedData(`historico-stats:${ctx.user.id}`, () => db.getHistoricoStats(ctx.user.id));
    }),

  // Histórico unificado com filtros avançados
  unificado: protectedProcedure
    .input(z.object({
      acao: z.string().optional(),
      area: z.string().optional(),
      modelo: z.string().optional(),
      texto: z.string().optional(),
      dataInicio: z.date().optional(),
      dataFim: z.date().optional(),
      sucesso: z.boolean().optional(),
      limite: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return db.getHistoricoUnificado(ctx.user.id, input);
    }),

  // Detalhes completos de um item do histórico
  detalhes: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      return db.getHistoricoDetalhes(input.id, ctx.user.id);
    }),

  // Excluir item do histórico
  excluir: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return db.excluirHistorico(input.id, ctx.user.id);
    }),

  // Atividade por dia para gráfico
  atividadePorDia: protectedProcedure
    .input(z.object({ dias: z.number().min(1).max(90).default(30) }).optional())
    .query(async ({ input, ctx }) => {
      return db.getAtividadePorDia(ctx.user.id, input?.dias || 30);
    }),
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
