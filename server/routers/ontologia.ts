/**
 * ontologia.ts — Router tRPC para a Ontologia Jurídica (JurisOS / PromptJur)
 *
 * Leitura: montagem de contexto (filtra status PUBLICADO — axioma A6).
 * Escrita: CRUD do grafo sob RBAC (role === "admin" no schema deste projeto).
 *
 * Axiomas implementados:
 *   A1 — precedente só entra no contexto se verificadoEm != null
 *   A2 — pertinência = existência da aresta TesePrecedente
 *   A3 — cabimento = existência da aresta TesePeca
 *   A5 — ordenação: vinculante → peso (top-N por tese)
 *   A6 — usuário comum só vê nós PUBLICADO
 *
 * Adaptação do ontologia.router.ts canônico para Drizzle/MySQL
 * (o projeto usa Drizzle ORM, não Prisma).
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, inArray, isNotNull, desc, asc } from "drizzle-orm";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
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

// ─── RBAC ─────────────────────────────────────────────────────────────────────
// O schema deste projeto usa role: "user" | "admin" (mysqlEnum).
// O router canônico usa developer/administrator — mapeamos para "admin".

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Requer perfil administrador." });
  }
  return next({ ctx });
});

function podeVerRascunho(ctx: { user?: { role?: string } | null }): boolean {
  return ctx.user?.role === "admin";
}

const StatusEnum = z.enum(["RASCUNHO", "REVISAO", "PUBLICADO"]);

// ─── Router ───────────────────────────────────────────────────────────────────

export const ontologiaRouter = router({
  // ── LEITURA ─────────────────────────────────────────────────────────────────

  /** Lista todas as áreas (sem filtro de status — áreas não têm status) */
  listarAreas: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(areasDireito).orderBy(areasDireito.nome);
  }),

  /**
   * Lista tipos de peça. Usuário comum só vê PUBLICADO (axioma A6).
   * Admin vê todos os status quando incluirRascunho=true.
   */
  listTiposPeca: publicProcedure
    .input(z.object({ areaId: z.number().optional(), incluirRascunho: z.boolean().default(false) }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const mostrarTodos = podeVerRascunho(ctx) && (input?.incluirRascunho ?? false);
      return db
        .select({ id: tiposPeca.id, nome: tiposPeca.nome, sigla: tiposPeca.sigla, areaId: tiposPeca.areaId, status: tiposPeca.status })
        .from(tiposPeca)
        .where(
          and(
            mostrarTodos ? undefined : eq(tiposPeca.status, "PUBLICADO"),
            input?.areaId ? eq(tiposPeca.areaId, input.areaId) : undefined
          )
        )
        .orderBy(asc(tiposPeca.nome));
    }),

  /**
   * Montagem de contexto: entrega institutos/teses/precedentes pertinentes
   * ao tipo de peça, sempre filtrando PUBLICADO (axioma A6).
   * Só precedentes com verificadoEm != null entram (axioma A1).
   * Ordenação: vinculante → peso (axioma A5).
   */
  montarContexto: publicProcedure
    .input(z.object({ tipoPecaId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Tipo de peça com requisitos
      const [peca] = await db
        .select()
        .from(tiposPeca)
        .where(and(eq(tiposPeca.id, input.tipoPecaId), eq(tiposPeca.status, "PUBLICADO")));

      if (!peca) throw new TRPCError({ code: "NOT_FOUND", message: "Tipo de peça não encontrado ou não publicado." });

      const reqs = await db
        .select({ req: requisitosLegais, disp: dispositivos })
        .from(requisitosLegais)
        .leftJoin(dispositivos, eq(dispositivos.id, requisitosLegais.dispositivoId))
        .where(and(eq(requisitosLegais.tipoPecaId, input.tipoPecaId), eq(requisitosLegais.obrigatorio, true)))
        .orderBy(asc(requisitosLegais.ordem));

      // Teses PUBLICADAS vinculadas a este tipo de peça
      const arestas = await db
        .select({ teseId: tesesPeca.teseId })
        .from(tesesPeca)
        .where(eq(tesesPeca.tipoPecaId, input.tipoPecaId));

      const teseIds = arestas.map((a: { teseId: number }) => a.teseId);

      let tesesTodas: Array<{
        tese: typeof teses.$inferSelect;
        fundamentos: Array<typeof dispositivos.$inferSelect>;
        precedentesValidados: Array<{ precedente: typeof precedentes.$inferSelect; peso: number }>;
      }> = [];

      if (teseIds.length > 0) {
        const teseRows = await db
          .select()
          .from(teses)
          .where(and(inArray(teses.id, teseIds), eq(teses.status, "PUBLICADO")));

        for (const tese of teseRows) {
          // Fundamentos normativos
          const fundamentos = await db
            .select({ disp: dispositivos })
            .from(tesesDispositivo)
            .innerJoin(dispositivos, eq(dispositivos.id, tesesDispositivo.dispositivoId))
            .where(eq(tesesDispositivo.teseId, tese.id));

          // Precedentes validados — A1: verificadoEm != null; A5: vinculante→peso; top-3
          const precRows = await db
            .select({ prec: precedentes, peso: tesesPrecedente.peso })
            .from(tesesPrecedente)
            .innerJoin(precedentes, eq(precedentes.id, tesesPrecedente.precedenteId))
            .where(
              and(
                eq(tesesPrecedente.teseId, tese.id),
                eq(precedentes.status, "PUBLICADO"),
                isNotNull(precedentes.verificadoEm)
              )
            )
            .orderBy(desc(precedentes.vinculante), desc(tesesPrecedente.peso))
            .limit(3);

          tesesTodas.push({
            tese,
            fundamentos: fundamentos.map((f: { disp: typeof dispositivos.$inferSelect }) => f.disp),
            precedentesValidados: precRows.map((r: { prec: typeof precedentes.$inferSelect; peso: number }) => ({
              precedente: r.prec,
              peso: r.peso,
            })),
          });
        }
      }

      return { peca, requisitos: reqs, teses: tesesTodas };
    }),

  /**
   * Verificação de pertinência (axiomas A1–A3). Usada pelo loop ancorado.
   * Retorna { aprovado, problemas[] } onde cada problema tem código, detalhe e severidade.
   */
  verificarCitacao: protectedProcedure
    .input(z.object({ tipoPecaId: z.number(), teseId: z.number(), precedenteId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const problemas: { codigo: string; detalhe: string; severidade: "BLOQUEIO" | "ALERTA" }[] = [];

      // A1: precedente deve ter verificadoEm e urlOficial
      const [prec] = await db
        .select()
        .from(precedentes)
        .where(eq(precedentes.id, input.precedenteId));

      if (!prec || !prec.verificadoEm || !prec.urlOficial) {
        problemas.push({
          codigo: "FONTE_NAO_VALIDADA",
          detalhe: "Precedente sem validação oficial (verificadoEm ou urlOficial ausente).",
          severidade: "BLOQUEIO",
        });
      }

      // A2: aresta TesePrecedente deve existir
      const [aresta] = await db
        .select()
        .from(tesesPrecedente)
        .where(
          and(
            eq(tesesPrecedente.teseId, input.teseId),
            eq(tesesPrecedente.precedenteId, input.precedenteId)
          )
        );

      if (!aresta) {
        problemas.push({
          codigo: "PRECEDENTE_IMPERTINENTE",
          detalhe: "Precedente não vinculado à tese na ontologia.",
          severidade: "BLOQUEIO",
        });
      }

      // A3: aresta TesePeca deve existir (cabimento)
      const [cabe] = await db
        .select()
        .from(tesesPeca)
        .where(
          and(
            eq(tesesPeca.teseId, input.teseId),
            eq(tesesPeca.tipoPecaId, input.tipoPecaId)
          )
        );

      if (!cabe) {
        problemas.push({
          codigo: "TESE_INCABIVEL",
          detalhe: "Tese não admitida para este tipo de peça.",
          severidade: "ALERTA",
        });
      }

      return {
        aprovado: problemas.every((p) => p.severidade !== "BLOQUEIO"),
        problemas,
      };
    }),

  // ── ESCRITA (RBAC admin) ─────────────────────────────────────────────────────

  /** Cria uma nova tese — nasce em RASCUNHO (axioma A6) */
  createTese: adminProcedure
    .input(
      z.object({
        enunciado: z.string().min(8),
        favoravelA: z.enum(["AUTOR", "REU", "AMBOS"]).default("AMBOS"),
        institutoId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(teses).values({ ...input, status: "RASCUNHO" });
      return { id: (result as { insertId: number }).insertId };
    }),

  /**
   * Vincula precedente à tese — cria a aresta de PERTINÊNCIA (axioma A2).
   * Upsert: se já existe, atualiza o peso.
   */
  linkTesePrecedente: adminProcedure
    .input(
      z.object({
        teseId: z.number(),
        precedenteId: z.number(),
        peso: z.number().int().min(1).max(5).default(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar se a aresta já existe
      const [existing] = await db
        .select()
        .from(tesesPrecedente)
        .where(
          and(
            eq(tesesPrecedente.teseId, input.teseId),
            eq(tesesPrecedente.precedenteId, input.precedenteId)
          )
        );

      if (existing) {
        await db
          .update(tesesPrecedente)
          .set({ peso: input.peso })
          .where(
            and(
              eq(tesesPrecedente.teseId, input.teseId),
              eq(tesesPrecedente.precedenteId, input.precedenteId)
            )
          );
        return { action: "updated" };
      }

      await db.insert(tesesPrecedente).values(input);
      return { action: "created" };
    }),

  /**
   * Marca um precedente como validado contra fonte oficial.
   * Libera o axioma A1 para este precedente.
   */
  validarPrecedente: adminProcedure
    .input(z.object({ precedenteId: z.number(), urlOficial: z.string().url() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(precedentes)
        .set({ urlOficial: input.urlOficial, verificadoEm: new Date() })
        .where(eq(precedentes.id, input.precedenteId));
      return { success: true };
    }),

  /**
   * Transição de status (RASCUNHO → REVISAO → PUBLICADO).
   * Genérico por entidade.
   */
  setStatus: adminProcedure
    .input(
      z.object({
        entidade: z.enum(["tipoPeca", "instituto", "tese", "precedente"]),
        id: z.number(),
        status: StatusEnum,
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const tableMap = {
        tipoPeca: tiposPeca,
        instituto: institutos,
        tese: teses,
        precedente: precedentes,
      } as const;

      const table = tableMap[input.entidade];
      await db
        .update(table)
        .set({ status: input.status } as never)
        .where(eq((table as typeof teses).id, input.id));

      return { success: true };
    }),

  /** Admin: lista todos os nós de qualquer status */
  adminListarTodos: adminProcedure
    .input(
      z.object({
        entidade: z.enum(["areas", "tiposPeca", "institutos", "teses", "precedentes"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      switch (input.entidade) {
        case "areas": return db.select().from(areasDireito).orderBy(areasDireito.nome);
        case "tiposPeca": return db.select().from(tiposPeca).orderBy(tiposPeca.nome);
        case "institutos": return db.select().from(institutos).orderBy(institutos.nome);
        case "teses": return db.select().from(teses).orderBy(teses.id);
        case "precedentes":
          return db.select().from(precedentes).orderBy(precedentes.tribunal, precedentes.identificador);
        default:
          throw new TRPCError({ code: "BAD_REQUEST" });
      }
    }),

  /**
   * Busca tese completa com fundamentos e precedentes sustentadores.
   * Consumidor 2: verificador do loop ancorado.
   */
  buscarTeseCompleta: publicProcedure
    .input(z.object({ teseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [tese] = await db.select().from(teses).where(eq(teses.id, input.teseId));
      if (!tese) throw new TRPCError({ code: "NOT_FOUND" });

      const fundamentos = await db
        .select({ dispositivo: dispositivos })
        .from(tesesDispositivo)
        .innerJoin(dispositivos, eq(dispositivos.id, tesesDispositivo.dispositivoId))
        .where(eq(tesesDispositivo.teseId, input.teseId));

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
});
