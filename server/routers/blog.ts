import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { blogPosts, blogLinksExternos } from "../../drizzle/schema";
import { eq, desc, and, like, sql, asc } from "drizzle-orm";

const categoriaEnum = z.enum([
  'engenharia-de-prompts',
  'ia-juridica',
  'dicas-praticas',
  'legislacao-e-regulamentacao',
  'casos-de-uso',
  'ferramentas',
]);

const artigoInputBase = z.object({
  slug: z.string().min(3).max(200),
  titulo: z.string().min(5).max(300),
  resumo: z.string().min(10),
  conteudo: z.string().min(50),
  categoria: categoriaEnum,
  tags: z.array(z.string()).default([]),
  imagemUrl: z.string().url().optional().or(z.literal('')),
  publicado: z.boolean().default(false),
  destaque: z.boolean().default(false),
  tempoLeituraMin: z.number().min(1).max(60).default(5),
});

export const blogRouter = router({
  // ── Público: lista artigos publicados ───────────────────────────────────────
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
      if (input.categoria) conditions.push(eq(blogPosts.categoria, input.categoria as any));
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

  // ── Público: artigo por slug ─────────────────────────────────────────────────
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

      db.update(blogPosts)
        .set({ visualizacoes: sql`${blogPosts.visualizacoes} + 1` })
        .where(eq(blogPosts.id, post.id))
        .catch(() => {});

      return post;
    }),

  // ── Público: destaques ───────────────────────────────────────────────────────
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

  // ── Público: links externos ──────────────────────────────────────────────────
  linksExternos: publicProcedure
    .input(z.object({ categoria: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(blogLinksExternos.ativo, true)];
      if (input.categoria) conditions.push(eq(blogLinksExternos.categoria, input.categoria));

      return db
        .select()
        .from(blogLinksExternos)
        .where(and(...conditions))
        .orderBy(blogLinksExternos.ordem);
    }),

  // ── Admin: listar TODOS os artigos (incluindo rascunhos) ─────────────────────
  adminListar: protectedProcedure
    .input(z.object({
      busca: z.string().optional(),
      categoria: z.string().optional(),
      publicado: z.boolean().optional(),
      limite: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conditions: any[] = [];
      if (input.categoria) conditions.push(eq(blogPosts.categoria, input.categoria as any));
      if (input.publicado !== undefined) conditions.push(eq(blogPosts.publicado, input.publicado));
      if (input.busca) {
        conditions.push(
          sql`(${blogPosts.titulo} LIKE ${`%${input.busca}%`} OR ${blogPosts.slug} LIKE ${`%${input.busca}%`})`
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const posts = await db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          titulo: blogPosts.titulo,
          resumo: blogPosts.resumo,
          categoria: blogPosts.categoria,
          publicado: blogPosts.publicado,
          destaque: blogPosts.destaque,
          visualizacoes: blogPosts.visualizacoes,
          tempoLeituraMin: blogPosts.tempoLeituraMin,
          autorNome: blogPosts.autorNome,
          tags: blogPosts.tags,
          createdAt: blogPosts.createdAt,
          updatedAt: blogPosts.updatedAt,
        })
        .from(blogPosts)
        .where(whereClause)
        .orderBy(desc(blogPosts.createdAt))
        .limit(input.limite)
        .offset(input.offset);

      const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(blogPosts)
        .where(whereClause);

      return { posts, total };
    }),

  // ── Admin: buscar artigo por ID (para edição) ────────────────────────────────
  adminPorId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, input.id))
        .limit(1);

      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Artigo não encontrado" });
      return post;
    }),

  // ── Admin: criar artigo ──────────────────────────────────────────────────────
  criar: protectedProcedure
    .input(artigoInputBase)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const imagemUrl = input.imagemUrl && input.imagemUrl.trim() !== '' ? input.imagemUrl : undefined;

      await db.insert(blogPosts).values({
        ...input,
        imagemUrl,
        autorNome: ctx.user.name || 'Equipe PromptJur',
      });
      return { success: true };
    }),

  // ── Admin: atualizar artigo completo ─────────────────────────────────────────
  atualizar: protectedProcedure
    .input(z.object({ id: z.number() }).merge(artigoInputBase.partial()))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, imagemUrl: rawImagem, ...data } = input;
      const imagemUrl = rawImagem && rawImagem.trim() !== '' ? rawImagem : undefined;

      await db.update(blogPosts)
        .set({ ...data, imagemUrl })
        .where(eq(blogPosts.id, id));
      return { success: true };
    }),

  // ── Admin: excluir artigo ────────────────────────────────────────────────────
  excluir: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  // ── Admin: toggle publicado ──────────────────────────────────────────────────
  togglePublicado: protectedProcedure
    .input(z.object({ id: z.number(), publicado: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(blogPosts)
        .set({ publicado: input.publicado })
        .where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  // ── Admin: toggle destaque ───────────────────────────────────────────────────
  toggleDestaque: protectedProcedure
    .input(z.object({ id: z.number(), destaque: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(blogPosts)
        .set({ destaque: input.destaque })
        .where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  // ── Admin: listar todos os links externos ────────────────────────────────────
  adminListarLinks: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select()
      .from(blogLinksExternos)
      .orderBy(asc(blogLinksExternos.ordem));
  }),

  // ── Admin: adicionar link externo ────────────────────────────────────────────
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

  // ── Admin: excluir link externo ──────────────────────────────────────────────
  excluirLink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(blogLinksExternos).where(eq(blogLinksExternos.id, input.id));
      return { success: true };
    }),
});
