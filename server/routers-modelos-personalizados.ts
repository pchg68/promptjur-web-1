import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { templates, templateTags } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Router para gerenciamento de modelos personalizados de documentos
 * Permite usuários criarem, editarem e gerenciarem seus próprios templates
 */
export const modelosPersonalizadosRouter = router({
  /**
   * Criar novo modelo personalizado
   */
  criar: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
        descricao: z.string().optional(),
        template: z.string().min(10, "Template deve ter no mínimo 10 caracteres"),
        areaJuridica: z.string(),
        tipoDocumento: z.string(),
        variaveis: z.array(z.string()).optional(),
        exemplos: z.array(z.string()).optional(),
        isPublico: z.boolean().default(false),
        tags: z.array(z.number()).optional(), // IDs das tags
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Inserir template
      const [novoTemplate] = await db.insert(templates).values({
        userId,
        nome: input.nome,
        descricao: input.descricao,
        template: input.template,
        areaJuridica: input.areaJuridica,
        variaveis: input.variaveis || [],
        exemplos: input.exemplos || [],
        isPublico: input.isPublico,
        isAtivo: true,
      });

      const templateId = novoTemplate.insertId;

      // Associar tags se fornecidas
      if (input.tags && input.tags.length > 0) {
        await Promise.all(
          input.tags.map((tagId) =>
            db.insert(templateTags).values({
              templateId: Number(templateId),
              tagId,
            })
          )
        );
      }

      return {
        id: templateId,
        nome: input.nome,
        mensagem: "Modelo personalizado criado com sucesso!",
      };
    }),

  /**
   * Listar modelos personalizados do usuário
   */
  listar: protectedProcedure
    .input(
      z.object({
        apenasAtivos: z.boolean().optional().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const condicoes = [eq(templates.userId, userId)];
      if (input.apenasAtivos) {
        condicoes.push(eq(templates.isAtivo, true));
      }

      const meusModelos = await db
        .select()
        .from(templates)
        .where(and(...condicoes))
        .orderBy(desc(templates.updatedAt));

      return meusModelos;
    }),

  /**
   * Obter modelo específico por ID
   */
  obterPorId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [modelo] = await db
        .select()
        .from(templates)
        .where(and(eq(templates.id, input.id), eq(templates.userId, userId)));

      if (!modelo) {
        throw new Error("Modelo não encontrado ou você não tem permissão para acessá-lo");
      }

      return modelo;
    }),

  /**
   * Atualizar modelo existente
   */
  atualizar: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(3).optional(),
        descricao: z.string().optional(),
        template: z.string().min(10).optional(),
        areaJuridica: z.string().optional(),
        variaveis: z.array(z.string()).optional(),
        exemplos: z.array(z.string()).optional(),
        isPublico: z.boolean().optional(),
        isAtivo: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...dadosAtualizacao } = input;

      // Verificar se o modelo pertence ao usuário
      const [modeloExistente] = await db
        .select()
        .from(templates)
        .where(and(eq(templates.id, id), eq(templates.userId, userId)));

      if (!modeloExistente) {
        throw new Error("Modelo não encontrado ou você não tem permissão para editá-lo");
      }

      // Atualizar modelo
      await db
        .update(templates)
        .set(dadosAtualizacao)
        .where(eq(templates.id, id));

      return {
        id,
        mensagem: "Modelo atualizado com sucesso!",
      };
    }),

  /**
   * Duplicar modelo existente
   */
  duplicar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar modelo original
      const [modeloOriginal] = await db
        .select()
        .from(templates)
        .where(and(eq(templates.id, input.id), eq(templates.userId, userId)));

      if (!modeloOriginal) {
        throw new Error("Modelo não encontrado ou você não tem permissão para duplicá-lo");
      }

      // Criar cópia
      const [novoModelo] = await db.insert(templates).values({
        userId,
        nome: `${modeloOriginal.nome} (Cópia)`,
        descricao: modeloOriginal.descricao,
        template: modeloOriginal.template,
        areaJuridica: modeloOriginal.areaJuridica,
        variaveis: modeloOriginal.variaveis,
        exemplos: modeloOriginal.exemplos,
        isPublico: false, // Cópias sempre começam como privadas
        isAtivo: true,
      });

      return {
        id: novoModelo.insertId,
        nome: `${modeloOriginal.nome} (Cópia)`,
        mensagem: "Modelo duplicado com sucesso!",
      };
    }),

  /**
   * Deletar modelo (soft delete)
   */
  deletar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se o modelo pertence ao usuário
      const [modeloExistente] = await db
        .select()
        .from(templates)
        .where(and(eq(templates.id, input.id), eq(templates.userId, userId)));

      if (!modeloExistente) {
        throw new Error("Modelo não encontrado ou você não tem permissão para deletá-lo");
      }

      // Soft delete: marcar como inativo
      await db
        .update(templates)
        .set({ isAtivo: false })
        .where(eq(templates.id, input.id));

      return {
        id: input.id,
        mensagem: "Modelo deletado com sucesso!",
      };
    }),

  /**
   * Deletar permanentemente
   */
  deletarPermanente: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se o modelo pertence ao usuário
      const [modeloExistente] = await db
        .select()
        .from(templates)
        .where(and(eq(templates.id, input.id), eq(templates.userId, userId)));

      if (!modeloExistente) {
        throw new Error("Modelo não encontrado ou você não tem permissão para deletá-lo");
      }

      // Deletar tags associadas
      await db.delete(templateTags).where(eq(templateTags.templateId, input.id));

      // Deletar modelo
      await db.delete(templates).where(eq(templates.id, input.id));

      return {
        id: input.id,
        mensagem: "Modelo deletado permanentemente!",
      };
    }),
});
