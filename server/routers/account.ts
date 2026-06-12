/**
 * account.ts — Router de gerenciamento de conta do usuário
 * 
 * Funcionalidades:
 * - Exclusão de conta (LGPD Art. 18 — direito à eliminação)
 * - Exportação de dados pessoais (portabilidade)
 * - Alertas de consumo por email
 */
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  prompts,
  analises,
  historico,
  configuracoes,
  tags,
  templateTags,
  promptTags,
  promptVersoes,
  usoModelos,
  perfisUso,
  formatacaoTemplates,
  cabecalhoTemplates,
  tutorialProgresso,
  tutorialFeedback,
  notifications,
  notificationPreferences,
  pushSubscriptions,
  chatSessions,
  chatMessages,
  promptsSalvos,
  documentVersions,
  userIntegrations,
  auditLogs,
  llmLogs,
  accessLogs,
  templates,
} from "../../drizzle/schema";
import { sendNotificationEmail } from "../email";
import { getUserQuotaSummary } from "../quota";
import { logger } from "../_core/logger";

export const accountRouter = router({
  /**
   * Solicitar exclusão de conta — LGPD Art. 18, V
   * 
   * Processo:
   * 1. Usuário confirma digitando "EXCLUIR MINHA CONTA"
   * 2. Sistema deleta todos os dados pessoais em cascata
   * 3. Anonimiza registros de auditoria (mantém para compliance)
   * 4. Envia email de confirmação de exclusão
   * 5. Invalida sessão
   */
  excluirConta: protectedProcedure
    .input(z.object({
      confirmacao: z.string(),
      motivo: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validar confirmação
      if (input.confirmacao !== "EXCLUIR MINHA CONTA") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: 'Para confirmar a exclusão, digite exatamente "EXCLUIR MINHA CONTA".',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados indisponível. Tente novamente mais tarde.",
        });
      }

      const userId = ctx.user.id;
      const userEmail = ctx.user.email;
      const userName = ctx.user.name;

      logger.info("[Account] Iniciando exclusão de conta", { userId, email: userEmail });

      try {
        // ── 1. Deletar dados relacionados em ordem (respeitar FKs) ──────────

        // Chat messages (dependem de sessions)
        const sessions = await db.select({ id: chatSessions.id })
          .from(chatSessions)
          .where(eq(chatSessions.userId, userId));
        
        for (const session of sessions) {
          await db.delete(chatMessages).where(eq(chatMessages.sessionId, session.id));
        }
        await db.delete(chatSessions).where(eq(chatSessions.userId, userId));

        // Prompt-related (versões, tags, análises dependem de prompts)
        const userPrompts = await db.select({ id: prompts.id })
          .from(prompts)
          .where(eq(prompts.userId, userId));
        
        for (const prompt of userPrompts) {
          await db.delete(promptVersoes).where(eq(promptVersoes.promptId, prompt.id));
          await db.delete(promptTags).where(eq(promptTags.promptId, prompt.id));
          await db.delete(analises).where(eq(analises.promptId, prompt.id));
        }
        await db.delete(prompts).where(eq(prompts.userId, userId));

        // Tags do usuário (e template_tags associadas)
        const userTags = await db.select({ id: tags.id })
          .from(tags)
          .where(eq(tags.userId, userId));
        
        for (const tag of userTags) {
          await db.delete(templateTags).where(eq(templateTags.tagId, tag.id));
        }
        await db.delete(tags).where(eq(tags.userId, userId));

        // Demais tabelas com userId direto
        await db.delete(promptsSalvos).where(eq(promptsSalvos.userId, userId));
        await db.delete(documentVersions).where(eq(documentVersions.userId, userId));
        await db.delete(historico).where(eq(historico.userId, userId));
        await db.delete(configuracoes).where(eq(configuracoes.userId, userId));
        await db.delete(usoModelos).where(eq(usoModelos.userId, userId));
        await db.delete(perfisUso).where(eq(perfisUso.userId, userId));
        await db.delete(formatacaoTemplates).where(eq(formatacaoTemplates.userId, userId));
        await db.delete(cabecalhoTemplates).where(eq(cabecalhoTemplates.userId, userId));
        await db.delete(tutorialProgresso).where(eq(tutorialProgresso.userId, userId));
        await db.delete(tutorialFeedback).where(eq(tutorialFeedback.userId, userId));
        await db.delete(notifications).where(eq(notifications.userId, userId));
        await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
        await db.delete(userIntegrations).where(eq(userIntegrations.userId, userId));
        await db.delete(llmLogs).where(eq(llmLogs.userId, userId));

        // ── 2. Anonimizar logs de auditoria (manter para compliance) ────────
        await db.update(auditLogs)
          .set({ userId: 0 })
          .where(eq(auditLogs.userId, userId));

        // Anonimizar access logs
        await db.update(accessLogs)
          .set({ nome: "[excluído]", email: null, userAgent: null })
          .where(eq(accessLogs.openId, ctx.user.openId));

        // ── 3. Deletar o usuário ────────────────────────────────────────────
        await db.delete(users).where(eq(users.id, userId));

        // ── 4. Enviar email de confirmação ──────────────────────────────────
        if (userEmail) {
          try {
            await sendNotificationEmail({
              to: userEmail,
              nome: userName ?? "Usuário",
              titulo: "Conta Excluída com Sucesso",
              mensagem: `Sua conta no PromptJur foi excluída conforme solicitado (LGPD Art. 18, V). Todos os seus dados pessoais foram removidos permanentemente. Registros anonimizados de auditoria podem ser mantidos por até 5 anos conforme exigência legal.${input.motivo ? `\n\nMotivo informado: ${input.motivo}` : ""}`,
              tipo: "info",
            });
          } catch (emailErr) {
            logger.warn("[Account] Falha ao enviar email de confirmação de exclusão", { emailErr });
          }
        }

        logger.info("[Account] Conta excluída com sucesso", { userId, email: userEmail });

        return {
          success: true,
          message: "Sua conta e todos os dados pessoais foram excluídos permanentemente.",
        };
      } catch (error) {
        logger.error("[Account] Erro ao excluir conta", { userId, error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao processar exclusão. Tente novamente ou entre em contato com o suporte.",
        });
      }
    }),

  /**
   * Exportar dados pessoais — LGPD Art. 18, V (Portabilidade)
   * Retorna todos os dados do usuário em formato estruturado
   */
  exportarDados: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível.",
      });
    }

    const userId = ctx.user.id;

    const [userData] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userPrompts = await db.select().from(prompts).where(eq(prompts.userId, userId));
    const userHistorico = await db.select().from(historico).where(eq(historico.userId, userId));
    const userConfigs = await db.select().from(configuracoes).where(eq(configuracoes.userId, userId));
    const userSessions = await db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
    const userPromptsSalvos = await db.select().from(promptsSalvos).where(eq(promptsSalvos.userId, userId));
    const userDocVersions = await db.select().from(documentVersions).where(eq(documentVersions.userId, userId));

    return {
      exportadoEm: new Date().toISOString(),
      usuario: {
        nome: userData?.name,
        email: userData?.email,
        plano: userData?.subscriptionPlan,
        criadoEm: userData?.createdAt,
        ultimoLogin: userData?.lastSignedIn,
      },
      prompts: userPrompts.map((p: any) => ({
        tipo: p.tipo,
        areaJuridica: p.areaJuridica,
        promptOriginal: p.promptOriginal,
        promptOtimizado: p.promptOtimizado,
        criadoEm: p.createdAt,
      })),
      promptsSalvos: userPromptsSalvos.map((ps: any) => ({
        titulo: ps.titulo,
        conteudo: ps.conteudo,
        areaJuridica: ps.areaJuridica,
        criadoEm: ps.createdAt,
      })),
      historico: userHistorico.map((h: any) => ({
        acao: h.acao,
        sucesso: h.sucesso,
        criadoEm: h.createdAt,
      })),
      documentos: userDocVersions.map((d: any) => ({
        titulo: d.titulo,
        tipoDocumento: d.tipoDocumento,
        areaJuridica: d.areaJuridica,
        criadoEm: d.createdAt,
      })),
      sessoes: userSessions.length,
      configuracoes: userConfigs.length > 0 ? userConfigs[0] : null,
    };
  }),

  /**
   * Verificar consumo e disparar alertas se necessário
   * Chamado após cada operação para checar thresholds (70%, 90%, 100%)
   */
  verificarAlertaConsumo: protectedProcedure.query(async ({ ctx }) => {
    const summary = await getUserQuotaSummary(ctx.user.id);
    if (!summary || summary.isUnlimited) return { alertaEnviado: false };

    const percent = summary.percentUsed;
    
    // Definir thresholds de alerta
    const thresholds = [
      { nivel: 70, tipo: "aviso" as const },
      { nivel: 90, tipo: "urgente" as const },
      { nivel: 100, tipo: "bloqueio" as const },
    ];

    // Encontrar o threshold atingido mais alto
    const thresholdAtingido = thresholds
      .filter(t => percent >= t.nivel)
      .sort((a, b) => b.nivel - a.nivel)[0];

    if (!thresholdAtingido) return { alertaEnviado: false, percentUsed: percent };

    return {
      alertaEnviado: false, // O envio real é feito pelo checkAndSendQuotaAlert
      percentUsed: percent,
      thresholdAtingido: thresholdAtingido.nivel,
      tipo: thresholdAtingido.tipo,
      remaining: summary.remaining,
      limit: summary.limit,
    };
  }),
});
