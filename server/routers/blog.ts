import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { blogPosts, blogLinksExternos } from "../../drizzle/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";

export const blogRouter = router({
  // Lista artigos publicados com filtro opcional por categoria
  listar: publicProcedure
    .input(z.object({
      categoria: z.string().optional(),
      busca: z.string().optional(),
      limite: z.number().min(1).max(50).default(12),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const conditions = [eq(blogPosts.publicado, true)];

      if (input.categoria) {
        conditions.push(eq(blogPosts.categoria, input.categoria as any));
      }
      if (input.busca) {
        conditions.push(
          sql`(${blogPosts.titulo} LIKE ${`%${input.busca}%`} OR ${blogPosts.resumo} LIKE ${`%${input.busca}%`})`
        );
      }

      const posts = await db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          titulo: blogPosts.titulo,
          resumo: blogPosts.resumo,
          categoria: blogPosts.categoria,
          tags: blogPosts.tags,
          autorNome: blogPosts.autorNome,
          imagemUrl: blogPosts.imagemUrl,
          destaque: blogPosts.destaque,
          visualizacoes: blogPosts.visualizacoes,
          tempoLeituraMin: blogPosts.tempoLeituraMin,
          createdAt: blogPosts.createdAt,
        })
        .from(blogPosts)
        .where(and(...conditions))
        .orderBy(desc(blogPosts.destaque), desc(blogPosts.createdAt))
        .limit(input.limite)
        .offset(input.offset);

      const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(blogPosts)
        .where(and(...conditions));

      return { posts, total };
    }),

  // Busca artigo por slug e incrementa visualizações
  porSlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const [post] = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.publicado, true)))
        .limit(1);

      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Artigo não encontrado" });

      // Incrementa visualizações de forma assíncrona (não bloqueia a resposta)
      db.update(blogPosts)
        .set({ visualizacoes: sql`${blogPosts.visualizacoes} + 1` })
        .where(eq(blogPosts.id, post.id))
        .catch(() => {});

      return post;
    }),

  // Lista artigos em destaque
  destaques: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        titulo: blogPosts.titulo,
        resumo: blogPosts.resumo,
        categoria: blogPosts.categoria,
        tempoLeituraMin: blogPosts.tempoLeituraMin,
        createdAt: blogPosts.createdAt,
      })
      .from(blogPosts)
      .where(and(eq(blogPosts.publicado, true), eq(blogPosts.destaque, true)))
      .orderBy(desc(blogPosts.createdAt))
      .limit(3);
  }),

  // Lista links externos ativos
  linksExternos: publicProcedure
    .input(z.object({ categoria: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(blogLinksExternos.ativo, true)];
      if (input.categoria) {
        conditions.push(eq(blogLinksExternos.categoria, input.categoria));
      }

      return db
        .select()
        .from(blogLinksExternos)
        .where(and(...conditions))
        .orderBy(blogLinksExternos.ordem);
    }),

  // Admin: criar artigo
  criar: protectedProcedure
    .input(z.object({
      slug: z.string().min(3).max(200),
      titulo: z.string().min(5).max(300),
      resumo: z.string().min(10),
      conteudo: z.string().min(50),
      categoria: z.enum(['engenharia-de-prompts', 'ia-juridica', 'dicas-praticas', 'legislacao-e-regulamentacao', 'casos-de-uso', 'ferramentas']),
      tags: z.array(z.string()).default([]),
      imagemUrl: z.string().url().optional(),
      publicado: z.boolean().default(false),
      destaque: z.boolean().default(false),
      tempoLeituraMin: z.number().min(1).max(60).default(5),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(blogPosts).values({
        ...input,
        autorNome: ctx.user.name || 'Equipe PromptJur',
      });
      return { success: true };
    }),

  // Admin: atualizar artigo
  atualizar: protectedProcedure
    .input(z.object({
      id: z.number(),
      publicado: z.boolean().optional(),
      destaque: z.boolean().optional(),
      titulo: z.string().optional(),
      resumo: z.string().optional(),
      conteudo: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, ...data } = input;
      await db.update(blogPosts).set(data).where(eq(blogPosts.id, id));
      return { success: true };
    }),

  // Admin: adicionar link externo
  adicionarLink: protectedProcedure
    .input(z.object({
      titulo: z.string().min(3).max(300),
      descricao: z.string().optional(),
      url: z.string().url(),
      tipo: z.enum(['artigo', 'video', 'ferramenta', 'instagram', 'facebook', 'linkedin', 'youtube', 'outro']),
      categoria: z.string().optional(),
      ordem: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(blogLinksExternos).values(input);
      return { success: true };
    }),
});
