import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { notificationsRouter, notificationPreferencesRouter, pushSubscriptionsRouter } from "./routers-notifications";
import { modelosPersonalizadosRouter } from "./routers-modelos-personalizados";
import { adminRouter } from "./admin";
import { tutoriais, type Tutorial } from "@shared/tutoriais";

// Import modular routers
import { promptsRouter } from "./routers/prompts";
import { templatesRouter } from "./routers/templates";
import { tagsRouter } from "./routers/tags";
import { modelosRouter } from "./routers/modelos";
import { analyticsRouter, historicoRouter, versoesRouter, configuracoesRouter } from "./routers/analytics";
import { perfisRouter, formatacaoTemplatesRouter, sugestaoRouter } from "./routers/perfis";
import { documentosRouter, legislacaoRouter, knowledgeRetrievalRouter } from "./routers/documentos";
import { stripeRouter } from "./routers/stripe";
import { voiceRouter } from "./routers/voice";
import { providerHealthRouter } from "./routers/provider-health";
import { pesquisaJurisprudencialRouter } from "./routers/pesquisa-jurisprudencial";
import { contatoRouter } from "./routers/contato";
import { documentVersionsRouter } from "./routers/document-versions";
import { integracoesRouter } from "./routers/integracoes";
import { assistenteRouter } from "./routers/assistente";
import { promptsSalvosRouter } from "./routers/prompts-salvos";
import { chatRouter } from "./routers/chat";
import { crmRouter } from "./routers/crm";
import { monitoramentoRouter } from "./routers/monitoramento";
import { custosLlmRouter } from "./routers/custos-llm";
import { accountRouter } from "./routers/account";
import { referralRouter } from "./routers/referral";
import { adminPrecosRouter } from "./routers/admin-precos";
import { blogRouter } from "./routers/blog";

export const appRouter = router({
  // Core system routers
  system: systemRouter,
  notifications: notificationsRouter,
  notificationPreferences: notificationPreferencesRouter,
  pushSubscriptions: pushSubscriptionsRouter,
  modelosPersonalizados: modelosPersonalizadosRouter,
  admin: adminRouter,

  // Tutoriais (inline - small router)
  tutoriais: router({
    listar: publicProcedure
      .input(z.object({
        busca: z.string().optional(),
        categoria: z.string().optional(),
        nivel: z.enum(['iniciante', 'intermediario', 'profissional']).optional(),
      }).optional())
      .query(({ input }) => {
        let resultado = tutoriais;
        if (input?.busca) {
          const buscaLower = input.busca.toLowerCase();
          resultado = resultado.filter((t: Tutorial) =>
            t.titulo.toLowerCase().includes(buscaLower) ||
            t.conteudo.toLowerCase().includes(buscaLower) ||
            t.tags.some(tag => tag.toLowerCase().includes(buscaLower))
          );
        }
        if (input?.categoria) resultado = resultado.filter((t: Tutorial) => t.categoria === input.categoria);
        if (input?.nivel) resultado = resultado.filter((t: Tutorial) => t.nivel === input.nivel);
        return resultado;
      }),

    porId: publicProcedure
      .input(z.string())
      .query(({ input }) => {
        const tutorial = tutoriais.find((t: Tutorial) => t.id === input);
        if (!tutorial) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tutorial não encontrado' });
        return tutorial;
      }),

    marcarConcluido: protectedProcedure
      .input(z.string())
      .mutation(async ({ ctx, input }) => { await db.marcarTutorialConcluido(ctx.user.id, input); return { success: true }; }),

    obterProgresso: protectedProcedure.query(async ({ ctx }) => {
      const progresso = await db.obterProgressoTutoriais(ctx.user.id);
      const tutoriaisConcluidosIds = progresso.map(p => p.tutorialId);
      return {
        tutoriaisConcluidosIds, totalConcluidos: progresso.length,
        totalTutoriais: tutoriais.length,
        percentualConcluido: Math.round((progresso.length / tutoriais.length) * 100)
      };
    }),

    registrarFeedback: protectedProcedure
      .input(z.object({ tutorialId: z.string(), util: z.boolean() }))
      .mutation(async ({ ctx, input }) => { await db.registrarFeedbackTutorial(ctx.user.id, input.tutorialId, input.util); return { success: true }; }),

    obterFeedback: protectedProcedure.query(async ({ ctx }) => {
      const feedbacks = await db.obterFeedbackUsuario(ctx.user.id);
      return feedbacks.map(f => ({ tutorialId: f.tutorialId, util: f.util }));
    }),

    estatisticasFeedback: publicProcedure.query(async () => {
      const stats = await db.obterEstatisticasFeedback();
      return stats.map(s => ({
        tutorialId: s.tutorialId, totalUtil: Number(s.totalUtil) || 0,
        totalNaoUtil: Number(s.totalNaoUtil) || 0, total: Number(s.total) || 0,
      }));
    }),
  }),

  // Cabeçalho (inline - small router)
  cabecalho: router({
    get: protectedProcedure.query(async ({ ctx }) => db.getCabecalhoTemplate(ctx.user.id)),
    salvar: protectedProcedure
      .input(z.object({
        nomeEscritorio: z.string().optional(), oab: z.string().optional(),
        endereco: z.string().optional(), telefone: z.string().optional(),
        email: z.string().email().optional(), website: z.string().url().optional(),
        habilitado: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => db.salvarCabecalhoTemplate(ctx.user.id, input)),
  }),

  // Auth (inline - small router)
  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      return {
        ...opts.ctx.user,
        createdAt: opts.ctx.user.createdAt.toISOString(),
        updatedAt: opts.ctx.user.updatedAt.toISOString(),
        lastSignedIn: opts.ctx.user.lastSignedIn.toISOString(),
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Feature routers (modular)
  prompts: promptsRouter,
  historico: historicoRouter,
  templates: templatesRouter,
  tags: tagsRouter,
  analytics: analyticsRouter,
  versoes: versoesRouter,
  configuracoes: configuracoesRouter,
  modelos: modelosRouter,
  legislacao: legislacaoRouter,
  perfis: perfisRouter,
  formatacaoTemplates: formatacaoTemplatesRouter,
  sugestao: sugestaoRouter,
  documentos: documentosRouter,
  knowledgeRetrieval: knowledgeRetrievalRouter,
  stripe: stripeRouter,
  voice: voiceRouter,
  providerHealth: providerHealthRouter,
  pesquisaJurisprudencial: pesquisaJurisprudencialRouter,
  contato: contatoRouter,
  documentVersions: documentVersionsRouter,
  integracoes: integracoesRouter,
  assistente: assistenteRouter,
  promptsSalvos: promptsSalvosRouter,
  chat: chatRouter,
  crm: crmRouter,
  monitoramento: monitoramentoRouter,
  custosLlm: custosLlmRouter,
  account: accountRouter,
  referral: referralRouter,
  adminPrecos: adminPrecosRouter,
  blog: blogRouter,
});

export type AppRouter = typeof appRouter;
