import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { atualizarTag, atribuirTagPrompt } from "../db-tags-update";

export const tagsRouter = router({
  minhas: protectedProcedure.query(async ({ ctx }) => db.getTagsUsuario(ctx.user.id)),

  criar: protectedProcedure
    .input(z.object({ nome: z.string().min(1).max(50), cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#3b82f6") }))
    .mutation(async ({ input, ctx }) => {
      const tagId = await db.criarTag({ userId: ctx.user.id, ...input });
      return { success: true, tagId };
    }),

  deletar: protectedProcedure
    .input(z.object({ tagId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const success = await db.deletarTag(input.tagId, ctx.user.id);
      if (!success) throw new Error("Tag não encontrada ou sem permissão");
      return { success: true };
    }),

  atualizar: protectedProcedure
    .input(z.object({ tagId: z.number(), nome: z.string().min(1).max(50).optional(), cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional() }))
    .mutation(async ({ input, ctx }) => {
      const success = await atualizarTag(input.tagId, ctx.user.id, { nome: input.nome, cor: input.cor });
      if (!success) throw new Error("Tag não encontrada ou sem permissão");
      return { success: true };
    }),

  atribuirPrompt: protectedProcedure
    .input(z.object({ promptId: z.number(), tagId: z.number() }))
    .mutation(async ({ input, ctx }) => { await atribuirTagPrompt(input.promptId, input.tagId, ctx.user.id); return { success: true }; }),

  removerPrompt: protectedProcedure
    .input(z.object({ promptId: z.number(), tagId: z.number() }))
    .mutation(async ({ input }) => { await db.removerTagPrompt(input.promptId, input.tagId); return { success: true }; }),

  getPrompt: protectedProcedure
    .input(z.object({ promptId: z.number() }))
    .query(async ({ input }) => db.getTagsPrompt(input.promptId)),

  atribuirTemplate: protectedProcedure
    .input(z.object({ templateId: z.number(), tagId: z.number() }))
    .mutation(async ({ input }) => { await db.atribuirTagTemplate(input.templateId, input.tagId); return { success: true }; }),

  removerTemplate: protectedProcedure
    .input(z.object({ templateId: z.number(), tagId: z.number() }))
    .mutation(async ({ input }) => { await db.removerTagTemplate(input.templateId, input.tagId); return { success: true }; }),

  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => db.getTagsTemplate(input.templateId))
});
