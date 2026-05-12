/**
 * Admin Sub-Router: Leads Enterprise & Gestão de Interessados
 * - Listar leads Enterprise
 * - Atualizar status de lead
 * - Listar interessados no lançamento
 * - Marcar notificados
 * - Remover interessado
 * - Reenviar notificação
 * - Notificar todos
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../../_core/trpc";
import { adminProcedure } from "./shared";
import { logAuditoria } from "../../audit";
import { enterpriseLeads, launchInterests } from "../../../drizzle/schema";
import { sendLaunchNotificationEmail } from "../../email";
import { eq, desc, sql } from "drizzle-orm";
import * as db from "../../db";

export const adminLeadsRouter = router({
  // Listar leads Enterprise com filtros
  getLeads: adminProcedure
    .input(z.object({
      status: z.enum(["pendente", "contatado", "convertido", "descartado", "todos"]).optional().default("todos"),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const whereClause = input.status !== "todos"
        ? eq(enterpriseLeads.status, input.status as "pendente" | "contatado" | "convertido" | "descartado")
        : undefined;

      const leads = await dbConn
        .select()
        .from(enterpriseLeads)
        .where(whereClause)
        .orderBy(desc(enterpriseLeads.criadoEm))
        .limit(input.limit)
        .offset(input.offset);

      const pendentesResult = await dbConn
        .select({ count: sql<number>`COUNT(*)` })
        .from(enterpriseLeads)
        .where(eq(enterpriseLeads.status, "pendente"));

      const totalPendentes = Number(pendentesResult[0]?.count ?? 0);

      return {
        leads: leads.map(l => ({
          ...l,
          criadoEm: l.criadoEm.toISOString(),
          atualizadoEm: l.atualizadoEm.toISOString(),
          contatadoEm: l.contatadoEm ? l.contatadoEm.toISOString() : null,
        })),
        totalPendentes,
      };
    }),

  // Listar interessados no lançamento
  getInteressados: adminProcedure
    .input(z.object({
      plano: z.enum(["pro", "enterprise", "qualquer", "todos"]).default("todos"),
      notificado: z.boolean().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const conditions: ReturnType<typeof eq>[] = [];
      if (input.plano !== "todos") conditions.push(eq(launchInterests.planoInteresse, input.plano as "pro" | "enterprise" | "qualquer"));
      if (input.notificado !== undefined) conditions.push(eq(launchInterests.notificado, input.notificado));
      const whereClause = conditions.length === 1 ? conditions[0] : conditions.length > 1 ? sql`${conditions[0]} AND ${conditions[1]}` : undefined;
      const rows = await dbConn
        .select()
        .from(launchInterests)
        .where(whereClause)
        .orderBy(desc(launchInterests.criadoEm))
        .limit(input.limit)
        .offset(input.offset);
      const totalResult = await dbConn.select({ count: sql<number>`COUNT(*)` }).from(launchInterests).where(whereClause);
      const naoNotificadosResult = await dbConn.select({ count: sql<number>`COUNT(*)` }).from(launchInterests).where(eq(launchInterests.notificado, false));
      return {
        interessados: rows.map(r => ({ ...r, criadoEm: r.criadoEm.toISOString(), atualizadoEm: r.atualizadoEm.toISOString() })),
        total: Number(totalResult[0]?.count ?? 0),
        naoNotificados: Number(naoNotificadosResult[0]?.count ?? 0),
      };
    }),

  // Marcar interessados como notificados
  marcarNotificados: adminProcedure
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      for (const id of input.ids) {
        await dbConn.update(launchInterests).set({ notificado: true }).where(eq(launchInterests.id, id));
      }
      await logAuditoria({
        userId: ctx.user.id,
        acao: "marcar_notificados",
        descricao: `${input.ids.length} interessado(s) marcados como notificados`,
        metadata: { ids: input.ids },
        req: ctx.req,
      });
      return { success: true };
    }),

  // Atualizar status de um lead
  updateLeadStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pendente", "contatado", "convertido", "descartado"]),
      notasInternas: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.notasInternas !== undefined) updateData.notasInternas = input.notasInternas;
      if (input.status === "contatado") updateData.contatadoEm = new Date();

      await dbConn
        .update(enterpriseLeads)
        .set(updateData)
        .where(eq(enterpriseLeads.id, input.id));

      await logAuditoria({
        userId: ctx.user.id,
        acao: "update_lead_status",
        descricao: `Lead #${input.id} atualizado para status: ${input.status}`,
        metadata: { leadId: input.id, novoStatus: input.status },
        req: ctx.req,
      });

      return { success: true };
    }),

  // Listar todos os interessados (gestão detalhada)
  listarInteressados: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(500).optional().default(200),
      apenasNaoNotificados: z.boolean().optional().default(false),
    }).optional())
    .query(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const query = dbConn
        .select()
        .from(launchInterests)
        .orderBy(desc(launchInterests.criadoEm))
        .limit(input?.limit ?? 200);

      const rows = await query;

      const filtrados = input?.apenasNaoNotificados
        ? rows.filter(r => !r.notificado)
        : rows;

      return {
        total: rows.length,
        naoNotificados: rows.filter(r => !r.notificado).length,
        items: filtrados.map(r => ({
          id: r.id,
          email: r.email,
          nome: r.nome,
          planoInteresse: r.planoInteresse,
          notificado: r.notificado,
          criadoEm: r.criadoEm.toISOString(),
        })),
      };
    }),

  // Remover um interessado da lista
  removerInteressado: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [row] = await dbConn
        .select()
        .from(launchInterests)
        .where(eq(launchInterests.id, input.id))
        .limit(1);

      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Interessado não encontrado' });

      await dbConn.delete(launchInterests).where(eq(launchInterests.id, input.id));

      await logAuditoria({
        userId: ctx.user.id,
        acao: 'remover_interessado',
        descricao: `Interessado removido: ${row.email}`,
        metadata: { email: row.email },
        req: ctx.req,
      });

      return { success: true };
    }),

  // Reenvia a notificação de lançamento para um interessado específico
  reenviarNotificacaoInteressado: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [row] = await dbConn
        .select()
        .from(launchInterests)
        .where(eq(launchInterests.id, input.id))
        .limit(1);

      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Interessado não encontrado' });

      const result = await sendLaunchNotificationEmail({ email: row.email });

      if (result.success && !result.skipped) {
        await dbConn
          .update(launchInterests)
          .set({ notificado: true })
          .where(eq(launchInterests.id, input.id));
      }

      await logAuditoria({
        userId: ctx.user.id,
        acao: 'reenviar_notificacao_interessado',
        descricao: `Notificação reenviada para: ${row.email} — ${result.success ? (result.skipped ? 'pulado (sem API key)' : 'enviado') : 'falhou'}`,
        metadata: { email: row.email, result },
        req: ctx.req,
      });

      return { success: result.success, skipped: result.skipped ?? false, email: row.email };
    }),

  // Envia notificação em lote para todos os não notificados
  notificarTodosInteressados: adminProcedure.mutation(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const interessados = await dbConn
      .select()
      .from(launchInterests)
      .where(eq(launchInterests.notificado, false));

    if (interessados.length === 0) {
      return { enviados: 0, falhas: 0, pulados: 0, total: 0 };
    }

    let enviados = 0;
    let falhas = 0;
    let pulados = 0;

    for (const interessado of interessados) {
      const result = await sendLaunchNotificationEmail({ email: interessado.email });
      if (result.skipped) {
        pulados++;
      } else if (result.success) {
        enviados++;
        await dbConn
          .update(launchInterests)
          .set({ notificado: true })
          .where(eq(launchInterests.id, interessado.id));
      } else {
        falhas++;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    await logAuditoria({
      userId: ctx.user.id,
      acao: 'notificar_todos_interessados',
      descricao: `Notificação em lote: ${enviados} enviados, ${falhas} falhas, ${pulados} pulados de ${interessados.length}`,
      metadata: { total: interessados.length, enviados, falhas, pulados },
      req: ctx.req,
    });

    return { enviados, falhas, pulados, total: interessados.length };
  }),
});
