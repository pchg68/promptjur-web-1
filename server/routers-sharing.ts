import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import * as db from "./db";
import { eq, and } from "drizzle-orm";
import { sharedPrompts, type InsertSharedPrompt } from "../drizzle/schema";
import { randomBytes } from "crypto";

/**
 * Gerar ID único para compartilhamento
 */
function generateShareId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Router para compartilhamento público de prompts
 */
export const sharingRouter = router({
  /**
   * Criar link de compartilhamento para um prompt
   */
  createShareLink: protectedProcedure
    .input(
      z.object({
        promptId: z.number(),
        titulo: z.string().min(1),
        descricao: z.string().optional(),
        expiresInDays: z.number().optional(), // Opcional: expira em N dias
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se o prompt pertence ao usuário
      const prompt = await db.getPromptById(input.promptId, ctx.user.id);
      if (!prompt) {
        throw new Error("Prompt não encontrado ou sem permissão");
      }

      // Calcular data de expiração (se fornecida)
      let expiresAt: Date | null = null;
      if (input.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
      }

      // Gerar ID único
      const shareId = generateShareId();

      // Salvar no banco
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const conteudo = prompt.promptOtimizado || prompt.promptOriginal;
      if (!conteudo) {
        throw new Error("Prompt sem conteúdo para compartilhar");
      }
      
      const newShare: InsertSharedPrompt = {
        promptId: input.promptId,
        userId: ctx.user.id,
        shareId,
        titulo: input.titulo,
        descricao: input.descricao,
        conteudo,
        areaJuridica: prompt.areaJuridica || "Geral",
        visualizacoes: 0,
        ativo: true,
        expiresAt,
      };
      
      await database.insert(sharedPrompts).values(newShare);

      return {
        shareId,
        shareUrl: `/shared/${shareId}`,
      };
    }),

  /**
   * Obter prompt compartilhado (público)
   */
  getSharedPrompt: publicProcedure
    .input(z.object({ shareId: z.string() }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const result = await database
        .select()
        .from(sharedPrompts)
        .where(and(eq(sharedPrompts.shareId, input.shareId), eq(sharedPrompts.ativo, true)))
        .limit(1);

      if (result.length === 0) {
        throw new Error("Prompt compartilhado não encontrado ou expirado");
      }

      const shared = result[0];

      // Verificar expiração
      if (shared.expiresAt && new Date(shared.expiresAt) < new Date()) {
        throw new Error("Este link de compartilhamento expirou");
      }

      // Incrementar contador de visualizações
      await database
        .update(sharedPrompts)
        .set({ visualizacoes: shared.visualizacoes + 1 })
        .where(eq(sharedPrompts.id, shared.id));

      return {
        ...shared,
        visualizacoes: shared.visualizacoes + 1,
      };
    }),

  /**
   * Listar prompts compartilhados pelo usuário
   */
  listMyShares: protectedProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const shares = await database
      .select()
      .from(sharedPrompts)
      .where(eq(sharedPrompts.userId, ctx.user.id));

    return shares;
  }),

  /**
   * Revogar (desativar) link de compartilhamento
   */
  revokeShareLink: protectedProcedure
    .input(z.object({ shareId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Verificar se o share pertence ao usuário
      const result = await database
        .select()
        .from(sharedPrompts)
        .where(and(eq(sharedPrompts.shareId, input.shareId), eq(sharedPrompts.userId, ctx.user.id)))
        .limit(1);

      if (result.length === 0) {
        throw new Error("Link de compartilhamento não encontrado");
      }

      // Desativar
      await database
        .update(sharedPrompts)
        .set({ ativo: false })
        .where(eq(sharedPrompts.shareId, input.shareId));

      return { success: true };
    }),

  /**
   * Importar prompt compartilhado para a biblioteca do usuário
   */
  importShared: protectedProcedure
    .input(z.object({ shareId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Buscar prompt compartilhado
      const result = await database
        .select()
        .from(sharedPrompts)
        .where(and(eq(sharedPrompts.shareId, input.shareId), eq(sharedPrompts.ativo, true)))
        .limit(1);

      if (result.length === 0) {
        throw new Error("Prompt compartilhado não encontrado");
      }

      const shared = result[0];

      // Criar novo prompt na biblioteca do usuário
      const promptId = await db.createPrompt({
        userId: ctx.user.id,
        tipo: "geracao",
        areaJuridica: shared.areaJuridica,
        promptOriginal: shared.conteudo,
        promptOtimizado: shared.conteudo,
        qualidade: "excelente",
        metadata: {
          importadoDe: shared.shareId,
          tituloOriginal: shared.titulo,
        },
      });

      return {
        promptId,
        message: "Prompt importado com sucesso para sua biblioteca",
      };
    }),
});
