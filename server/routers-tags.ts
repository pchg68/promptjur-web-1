import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { eq, and } from "drizzle-orm";
import { tags, promptTags } from "../drizzle/schema";
import { getDb } from "./db";

export const tagsRouter = router({
  // Criar nova tag personalizada
  create: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(1).max(50),
        cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3b82f6"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const [newTag] = await database.insert(tags).values({
        userId: ctx.user.id,
        nome: input.nome,
        cor: input.cor,
      });

      return {
        success: true,
        tagId: (newTag as any).insertId,
      };
    }),

  // Listar tags do usuário
  listUserTags: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const userTags = await database
      .select()
      .from(tags)
      .where(eq(tags.userId, ctx.user.id))
      .orderBy(tags.nome);

    return userTags;
  }),

  // Atualizar tag (nome e/ou cor)
  update: protectedProcedure
    .input(
      z.object({
        tagId: z.number(),
        nome: z.string().min(1).max(50).optional(),
        cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const updateData: any = {};
      if (input.nome !== undefined) updateData.nome = input.nome;
      if (input.cor !== undefined) updateData.cor = input.cor;

      if (Object.keys(updateData).length === 0) {
        throw new Error("Nenhum campo para atualizar");
      }

      await database
        .update(tags)
        .set(updateData)
        .where(and(eq(tags.id, input.tagId), eq(tags.userId, ctx.user.id)));

      return { success: true };
    }),

  // Deletar tag
  delete: protectedProcedure
    .input(z.object({ tagId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Remover associações com prompts primeiro
      await database
        .delete(promptTags)
        .where(eq(promptTags.tagId, input.tagId));

      // Remover a tag
      await database
        .delete(tags)
        .where(and(eq(tags.id, input.tagId), eq(tags.userId, ctx.user.id)));

      return { success: true };
    }),

  // Adicionar tag a um prompt
  addToPrompt: protectedProcedure
    .input(
      z.object({
        promptId: z.number(),
        tagId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Verificar se a tag pertence ao usuário
      const tag = await database
        .select()
        .from(tags)
        .where(and(eq(tags.id, input.tagId), eq(tags.userId, ctx.user.id)))
        .limit(1);

      if (tag.length === 0) {
        throw new Error("Tag não encontrada");
      }

      // Verificar se associação já existe
      const existing = await database
        .select()
        .from(promptTags)
        .where(
          and(
            eq(promptTags.promptId, input.promptId),
            eq(promptTags.tagId, input.tagId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { success: true, message: "Tag já associada" };
      }

      // Criar associação
      await database.insert(promptTags).values({
        promptId: input.promptId,
        tagId: input.tagId,
      });

      return { success: true };
    }),

  // Remover tag de um prompt
  removeFromPrompt: protectedProcedure
    .input(
      z.object({
        promptId: z.number(),
        tagId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .delete(promptTags)
        .where(
          and(
            eq(promptTags.promptId, input.promptId),
            eq(promptTags.tagId, input.tagId)
          )
        );

      return { success: true };
    }),

  // Listar tags de um prompt específico
  getPromptTags: protectedProcedure
    .input(z.object({ promptId: z.number() }))
    .query(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const promptTagsList = await database
        .select({
          id: tags.id,
          nome: tags.nome,
          cor: tags.cor,
        })
        .from(promptTags)
        .innerJoin(tags, eq(promptTags.tagId, tags.id))
        .where(
          and(
            eq(promptTags.promptId, input.promptId),
            eq(tags.userId, ctx.user.id)
          )
        );

      return promptTagsList;
    }),
});
