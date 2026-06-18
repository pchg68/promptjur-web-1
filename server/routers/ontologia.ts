/**
 * ontologia.ts — Router tRPC para a Ontologia Jurídica (JurisOS)
 *
 * Expõe os nós do grafo para dois consumidores:
 *   (1) montagem de contexto: busca institutos/teses pertinentes ao tipo de peça
 *   (2) verificador do loop ancorado: valida se precedente sustenta a tese
 *
 * RBAC: publicProcedure retorna apenas nós PUBLICADOS.
 *       adminProcedure retorna todos os status (RASCUNHO, REVISAO, PUBLICADO).
 */

import { z } from "zod";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  areasDireito,
  tiposPeca,
  institutos,
  teses,
  precedentes,
  dispositivos,
  requisitosLegais,
  tesesPeca,
  tesesDispositivo,
  tesesPrecedente,
  institutosDispositivo,
} from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin(ctx: { user?: { role?: string } | null }) {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const ontologiaRouter = router({
  // ── Áreas do Direito ────────────────────────────────────────────────────────

  /** Lista todas as áreas (público — sem filtro de status pois não têm status) */
  listarAreas: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(areasDireito).orderBy(areasDireito.nome);
  }),

  // ── Tipos de Peça ───────────────────────────────────────────────────────────

  /**
   * Lista tipos de peça PUBLICADOS (consumidor 1: seletor de peça na UI).
   * Admin recebe todos os status.
   */
  listarTiposPeca: publicProcedure
    .input(z.object({ areaId: z.number().optional(), incluirRascunho: z.boolean().default(false) }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const isAdmin = ctx.user?.role === "admin";
      const mostrarTodos = isAdmin && input?.incluirRascunho;

      const rows = await db
        .select()
        .from(tiposPeca)
        .where(
          and(
            mostrarTodos ? undefined : eq(tiposPeca.status, "PUBLICADO"),
            input?.areaId ? eq(tiposPeca.areaId, input.areaId) : undefined
          )
        )
        .orderBy(tiposPeca.nome);

      return rows;
    }),

  /**
   * Busca um tipo de peça com seus requisitos legais.
   * Usado pelo gerador de prompts para montar o contexto de cabimento.
   */
  buscarTipoPecaComRequisitos: publicProcedure
    .input(z.object({ tipoPecaId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [peca] = await db
        .select()
        .from(tiposPeca)
        .where(eq(tiposPeca.id, input.tipoPecaId));

      if (!peca) throw new TRPCError({ code: "NOT_FOUND" });

      const requisitos = await db
        .select()
        .from(requisitosLegais)
        .where(eq(requisitosLegais.tipoPecaId, input.tipoPecaId))
        .orderBy(requisitosLegais.ordem);

      return { peca, requisitos };
    }),

  // ── Teses ───────────────────────────────────────────────────────────────────

  /**
   * Busca teses PUBLICADAS pertinentes a um tipo de peça.
   * Consumidor 1: montagem de contexto — entrega ao modelo só as teses relevantes.
   */
  buscarTesesPorTipoPeca: publicProcedure
    .input(z.object({ tipoPecaId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar IDs de teses vinculadas ao tipo de peça
      const arestas = await db
        .select({ teseId: tesesPeca.teseId })
        .from(tesesPeca)
        .where(eq(tesesPeca.tipoPecaId, input.tipoPecaId));

      if (arestas.length === 0) return [];

      const teseIds = arestas.map((a: { teseId: number }) => a.teseId);

      return db
        .select()
        .from(teses)
        .where(and(inArray(teses.id, teseIds), eq(teses.status, "PUBLICADO")));
    }),

  /**
   * Busca tese com seus fundamentos normativos e precedentes sustentadores.
   * Consumidor 2: verificador do loop ancorado.
   */
  buscarTeseCompleta: publicProcedure
    .input(z.object({ teseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [tese] = await db
        .select()
        .from(teses)
        .where(eq(teses.id, input.teseId));

      if (!tese) throw new TRPCError({ code: "NOT_FOUND" });

      // Fundamentos normativos (dispositivos)
      const fundamentos = await db
        .select({ dispositivo: dispositivos })
        .from(tesesDispositivo)
        .innerJoin(dispositivos, eq(dispositivos.id, tesesDispositivo.dispositivoId))
        .where(eq(tesesDispositivo.teseId, input.teseId));

      // Precedentes sustentadores com peso
      const sustentacao = await db
        .select({ precedente: precedentes, peso: tesesPrecedente.peso })
        .from(tesesPrecedente)
        .innerJoin(precedentes, eq(precedentes.id, tesesPrecedente.precedenteId))
        .where(eq(tesesPrecedente.teseId, input.teseId));

      return {
        tese,
        fundamentos: fundamentos.map((f: { dispositivo: typeof dispositivos.$inferSelect }) => f.dispositivo),
        precedentes: sustentacao,
      };
    }),

  // ── Verificador (axioma A2) ─────────────────────────────────────────────────

  /**
   * Verifica se um precedente sustenta uma tese específica.
   * Retorna { pertinente, peso, validado } onde:
   *   - pertinente: aresta TesePrecedente existe
   *   - peso: força da sustentação (1..5)
   *   - validado: precedente tem verificadoEm != null (axioma A1)
   */
  verificarPrecedenteTese: publicProcedure
    .input(z.object({ teseId: z.number(), precedenteId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [aresta] = await db
        .select()
        .from(tesesPrecedente)
        .where(
          and(
            eq(tesesPrecedente.teseId, input.teseId),
            eq(tesesPrecedente.precedenteId, input.precedenteId)
          )
        );

      if (!aresta) return { pertinente: false, peso: 0, validado: false };

      const [prec] = await db
        .select({ verificadoEm: precedentes.verificadoEm })
        .from(precedentes)
        .where(eq(precedentes.id, input.precedenteId));

      return {
        pertinente: true,
        peso: aresta.peso,
        validado: prec?.verificadoEm != null,
      };
    }),

  // ── Admin: CRUD básico ──────────────────────────────────────────────────────

  /** Admin: lista todos os nós de qualquer status */
  adminListarTodos: protectedProcedure
    .input(z.object({ entidade: z.enum(["areas", "tiposPeca", "institutos", "teses", "precedentes"]) }))
    .query(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      switch (input.entidade) {
        case "areas": return db.select().from(areasDireito).orderBy(areasDireito.nome);
        case "tiposPeca": return db.select().from(tiposPeca).orderBy(tiposPeca.nome);
        case "institutos": return db.select().from(institutos).orderBy(institutos.nome);
        case "teses": return db.select().from(teses).orderBy(teses.id);
        case "precedentes": return db.select().from(precedentes).orderBy(precedentes.tribunal, precedentes.identificador);
        default: throw new TRPCError({ code: "BAD_REQUEST" });
      }
    }),

  /** Admin: altera status de um nó (RASCUNHO → REVISAO → PUBLICADO) */
  adminAlterarStatus: protectedProcedure
    .input(
      z.object({
        entidade: z.enum(["tiposPeca", "institutos", "teses", "precedentes"]),
        id: z.number(),
        status: z.enum(["RASCUNHO", "REVISAO", "PUBLICADO"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await requireAdmin(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const tableMap = {
        tiposPeca,
        institutos,
        teses,
        precedentes,
      } as const;

      const table = tableMap[input.entidade];
      await db
        .update(table)
        .set({ status: input.status } as never)
        .where(eq((table as typeof teses).id, input.id));

      return { success: true };
    }),
});
