import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { eq, and, desc } from "drizzle-orm";
import { promptVersoes } from "../drizzle/schema";

/**
 * Router para versionamento e comparação de prompts
 */
export const versioningRouter = router({
  /**
   * Salvar nova versão de um prompt
   */
  saveVersion: protectedProcedure
    .input(
      z.object({
        promptId: z.number(),
        conteudo: z.string().min(1),
        tipo: z.enum(["original", "otimizado", "manual"]),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se o prompt pertence ao usuário
      const prompt = await db.getPromptById(input.promptId, ctx.user.id);
      if (!prompt) {
        throw new Error("Prompt não encontrado ou sem permissão");
      }

      // Buscar última versão para incrementar
      const versoes = await db.getVersoesPrompt(input.promptId);
      const proximaVersao = versoes.length > 0 ? Math.max(...versoes.map((v) => v.versao)) + 1 : 1;

      // Salvar nova versão
      const versaoId = await db.salvarVersaoPrompt({
        promptId: input.promptId,
        versao: proximaVersao,
        conteudo: input.conteudo,
        tipo: input.tipo,
        observacoes: input.observacoes || null,
      });

      return {
        id: versaoId,
        versao: proximaVersao,
      };
    }),

  /**
   * Listar todas as versões de um prompt
   */
  getVersions: protectedProcedure
    .input(z.object({ promptId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verificar permissão
      const prompt = await db.getPromptById(input.promptId, ctx.user.id);
      if (!prompt) {
        throw new Error("Prompt não encontrado ou sem permissão");
      }

      const versoes = await db.getVersoesPrompt(input.promptId);
      return versoes;
    }),

  /**
   * Restaurar uma versão específica (rollback)
   */
  restoreVersion: protectedProcedure
    .input(
      z.object({
        promptId: z.number(),
        versaoId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const prompt = await db.getPromptById(input.promptId, ctx.user.id);
      if (!prompt) {
        throw new Error("Prompt não encontrado ou sem permissão");
      }

      // Buscar versão específica
      const versoes = await db.getVersoesPrompt(input.promptId);
      const versao = versoes.find((v) => v.id === input.versaoId);

      if (!versao) {
        throw new Error("Versão não encontrada");
      }

      // Atualizar prompt principal com conteúdo da versão
      await db.updatePrompt(input.promptId, {
        promptOtimizado: versao.conteudo,
      });

      // Salvar nova versão indicando rollback
      const proximaVersao = Math.max(...versoes.map((v) => v.versao)) + 1;
      await db.salvarVersaoPrompt({
        promptId: input.promptId,
        versao: proximaVersao,
        conteudo: versao.conteudo,
        tipo: "manual",
        observacoes: `Restaurado da versão ${versao.versao}`,
      });

      return {
        success: true,
        versaoRestaurada: versao.versao,
        novaVersao: proximaVersao,
      };
    }),

  /**
   * Comparar duas versões de um prompt
   */
  compareVersions: protectedProcedure
    .input(
      z.object({
        promptId: z.number(),
        versaoId1: z.number(),
        versaoId2: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verificar permissão
      const prompt = await db.getPromptById(input.promptId, ctx.user.id);
      if (!prompt) {
        throw new Error("Prompt não encontrado ou sem permissão");
      }

      const versoes = await db.getVersoesPrompt(input.promptId);
      const versao1 = versoes.find((v) => v.id === input.versaoId1);
      const versao2 = versoes.find((v) => v.id === input.versaoId2);

      if (!versao1 || !versao2) {
        throw new Error("Uma ou ambas as versões não foram encontradas");
      }

      return {
        versao1,
        versao2,
        // Estatísticas básicas de comparação
        diff: {
          tamanhoV1: versao1.conteudo.length,
          tamanhoV2: versao2.conteudo.length,
          diferencaTamanho: versao2.conteudo.length - versao1.conteudo.length,
        },
      };
    }),

  /**
   * Deletar uma versão específica
   */
  deleteVersion: protectedProcedure
    .input(
      z.object({
        promptId: z.number(),
        versaoId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const prompt = await db.getPromptById(input.promptId, ctx.user.id);
      if (!prompt) {
        throw new Error("Prompt não encontrado ou sem permissão");
      }

      // Não permitir deletar se for a única versão
      const versoes = await db.getVersoesPrompt(input.promptId);
      if (versoes.length <= 1) {
        throw new Error("Não é possível deletar a única versão existente");
      }

      // Deletar versão
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      await database.delete(promptVersoes).where(eq(promptVersoes.id, input.versaoId));

      return { success: true };
    }),
});
