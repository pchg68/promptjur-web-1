/**
 * Admin Sub-Router: Log de Acessos & Arquivamento de Cards
 * - Listar access logs
 * - Estatísticas de access logs
 * - Exportar access logs CSV
 * - Listar/Arquivar/Desarquivar cards do painel admin
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../../_core/trpc";
import { adminProcedure } from "./shared";
import * as db from "../../db";

export const adminAcessosRouter = router({
  listarAccessLogs: adminProcedure
    .input(
      z.object({
        email: z.string().optional(),
        nome: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        apenasNegados: z.boolean().optional(),
        apenasPrimeiros: z.boolean().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(200).default(50),
      })
    )
    .query(async ({ input }) => {
      const { listarAccessLogs } = await import("../../db-access-logs");
      return listarAccessLogs({
        ...input,
        dataInicio: input.dataInicio ? new Date(input.dataInicio) : undefined,
        dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
      });
    }),

  statsAccessLogs: adminProcedure.query(async () => {
    const { statsAccessLogs } = await import("../../db-access-logs");
    return statsAccessLogs();
  }),

  exportarAccessLogsCsv: adminProcedure
    .input(
      z.object({
        email: z.string().optional(),
        nome: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        apenasNegados: z.boolean().optional(),
        apenasPrimeiros: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { exportarAccessLogsCsv } = await import("../../db-access-logs");
      const csv = await exportarAccessLogsCsv({
        ...input,
        dataInicio: input.dataInicio ? new Date(input.dataInicio) : undefined,
        dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
      });
      return { csv };
    }),

  // ── Arquivamento de Cards do Painel Admin ──
  listarCardsArquivados: adminProcedure.query(async () => {
    const dbConn = await db.getDb();
    if (!dbConn) return [];
    const { adminCardsArquivados } = await import("../../../drizzle/schema");
    const rows = await dbConn.select().from(adminCardsArquivados).orderBy(adminCardsArquivados.archivedAt);
    return rows.map(r => ({
      ...r,
      archivedAt: r.archivedAt instanceof Date ? r.archivedAt.toISOString() : String(r.archivedAt),
    }));
  }),

  arquivarCard: adminProcedure
    .input(z.object({
      cardId: z.string().min(1).max(64),
      cardTitulo: z.string().min(1).max(128),
      motivo: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { adminCardsArquivados } = await import("../../../drizzle/schema");
      await dbConn.insert(adminCardsArquivados).values({
        cardId: input.cardId,
        cardTitulo: input.cardTitulo,
        motivo: input.motivo ?? null,
        archivedBy: ctx.user.openId,
      }).onDuplicateKeyUpdate({
        set: { motivo: input.motivo ?? null, archivedBy: ctx.user.openId, archivedAt: new Date() },
      });
      return { success: true };
    }),

  desarquivarCard: adminProcedure
    .input(z.object({ cardId: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { adminCardsArquivados } = await import("../../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await dbConn.delete(adminCardsArquivados).where(eq(adminCardsArquivados.cardId, input.cardId));
      return { success: true };
    }),
});
