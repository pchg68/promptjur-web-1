import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getCachedData } from "../admin";

export const templatesRouter = router({
  meus: protectedProcedure.query(async ({ ctx }) => {
    return getCachedData(`templates:${ctx.user.id}`, () => db.getTemplatesUsuario(ctx.user.id));
  }),

  sistema: publicProcedure.query(async () => db.getTemplatesSistema()),

  publicos: publicProcedure.query(async () => db.getTemplatesPublicos()),

  salvar: protectedProcedure
    .input(z.object({
      areaJuridica: z.string(), nome: z.string().min(3), descricao: z.string().optional(),
      template: z.string().min(10), isPublico: z.boolean().optional().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.salvarTemplate({ userId: ctx.user.id, ...input, isAtivo: true });
      return { success: true, templateId: result };
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id: z.number(), areaJuridica: z.string().optional(), nome: z.string().min(3).optional(),
      descricao: z.string().optional(), template: z.string().min(10).optional(), isPublico: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const success = await db.atualizarTemplate(id, ctx.user.id, data);
      if (!success) throw new Error("Template não encontrado ou sem permissão");
      return { success: true };
    }),

  togglePublico: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input, ctx }) => { await db.toggleTemplatePublico(input.templateId, ctx.user.id); return { success: true }; }),

  deletar: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const success = await db.deletarTemplate(input.templateId, ctx.user.id);
      if (!success) throw new Error("Template não encontrado ou sem permissão");
      return { success: true };
    })
});
