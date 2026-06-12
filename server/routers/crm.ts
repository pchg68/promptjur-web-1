import { z } from "zod";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  crmLeads,
  crmContratos,
  crmMembros,
  crmAtividades,
  users,
} from "../../drizzle/schema";

// Middleware: verifica se o usuário tem acesso ao CRM (admin ou membro autorizado)
const crmProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role === "admin") return next({ ctx });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const membro = await db
    .select()
    .from(crmMembros)
    .where(eq(crmMembros.userId, ctx.user.id))
    .limit(1);
  if (membro.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso ao CRM não autorizado." });
  }
  return next({ ctx });
});

// Middleware: apenas admin CRM ou admin do sistema
const crmAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role === "admin") return next({ ctx });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const membro = await db
    .select()
    .from(crmMembros)
    .where(and(eq(crmMembros.userId, ctx.user.id), eq(crmMembros.nivel, "admin")))
    .limit(1);
  if (membro.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Permissão insuficiente no CRM." });
  }
  return next({ ctx });
});

export const crmRouter = router({
  // Verificar acesso do usuário atual ao CRM
  meuAcesso: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "admin") return { acesso: true, nivel: "admin" as const };
    const db = await getDb();
    if (!db) return { acesso: false, nivel: null };
    const membro = await db
      .select()
      .from(crmMembros)
      .where(eq(crmMembros.userId, ctx.user.id))
      .limit(1);
    if (membro.length === 0) return { acesso: false, nivel: null };
    return { acesso: true, nivel: membro[0].nivel };
  }),

  // ============================================================
  // LEADS
  // ============================================================
  listarLeads: crmProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(crmLeads).orderBy(desc(crmLeads.createdAt));
  }),

  criarLead: crmProcedure
    .input(
      z.object({
        nome: z.string().min(2),
        email: z.string().email(),
        telefone: z.string().optional(),
        empresa: z.string().optional(),
        etapa: z.enum(["lead", "contato", "demonstracao", "proposta", "fechado_ganho", "fechado_perdido"]).default("lead"),
        valorMensal: z.number().min(0).default(0),
        origem: z.enum(["indicacao", "organico", "redes_sociais", "email_marketing", "evento", "outro"]).default("outro"),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(crmLeads).values({
        ...input,
        responsavelId: ctx.user.id,
      });
      return { sucesso: true };
    }),

  atualizarLead: crmProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(2).optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        empresa: z.string().optional(),
        etapa: z.enum(["lead", "contato", "demonstracao", "proposta", "fechado_ganho", "fechado_perdido"]).optional(),
        valorMensal: z.number().min(0).optional(),
        origem: z.enum(["indicacao", "organico", "redes_sociais", "email_marketing", "evento", "outro"]).optional(),
        notas: z.string().optional(),
        motivoPerda: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, etapa, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (etapa) {
        updateData.etapa = etapa;
        if (etapa === "fechado_ganho" || etapa === "fechado_perdido") {
          updateData.fechadoEm = new Date();
        }
        await db.insert(crmAtividades).values({
          entidadeTipo: "lead",
          entidadeId: id,
          tipo: "mudanca_etapa",
          descricao: `Etapa alterada para: ${etapa.replace(/_/g, " ")}`,
          usuarioId: ctx.user.id,
        });
      }
      await db.update(crmLeads).set(updateData).where(eq(crmLeads.id, id));
      return { sucesso: true };
    }),

  excluirLead: crmAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(crmLeads).where(eq(crmLeads.id, input.id));
      return { sucesso: true };
    }),

  // ============================================================
  // CONTRATOS
  // ============================================================
  listarContratos: crmProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(crmContratos).orderBy(desc(crmContratos.createdAt));
  }),

  criarContrato: crmProcedure
    .input(
      z.object({
        nomeCliente: z.string().min(2),
        emailCliente: z.string().email(),
        empresa: z.string().optional(),
        plano: z.enum(["basico", "profissional", "enterprise"]).default("basico"),
        valorMensal: z.number().min(0),
        status: z.enum(["ativo", "cancelado", "suspenso", "trial"]).default("ativo"),
        leadId: z.number().optional(),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(crmContratos).values({
        ...input,
        responsavelId: ctx.user.id,
      });
      return { sucesso: true };
    }),

  atualizarContrato: crmProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["ativo", "cancelado", "suspenso", "trial"]).optional(),
        valorMensal: z.number().min(0).optional(),
        plano: z.enum(["basico", "profissional", "enterprise"]).optional(),
        notas: z.string().optional(),
        motivoCancelamento: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, status, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (status) {
        updateData.status = status;
        if (status === "cancelado") updateData.canceladoEm = new Date();
      }
      await db.update(crmContratos).set(updateData).where(eq(crmContratos.id, id));
      return { sucesso: true };
    }),

  // ============================================================
  // MÉTRICAS: MRR, Churn, LTV
  // ============================================================
  metricas: crmProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const contratosAtivos = await db
      .select()
      .from(crmContratos)
      .where(eq(crmContratos.status, "ativo"));
    const mrr = contratosAtivos.reduce((sum: any, c: any) => sum + (c.valorMensal ?? 0), 0) / 100;

    const totalContratos = await db.select({ count: sql<number>`count(*)` }).from(crmContratos);
    const total = Number(totalContratos[0]?.count ?? 0);

    const umMesAtras = new Date();
    umMesAtras.setMonth(umMesAtras.getMonth() - 1);
    const canceladosMes = await db
      .select({ count: sql<number>`count(*)` })
      .from(crmContratos)
      .where(and(eq(crmContratos.status, "cancelado"), gte(crmContratos.canceladoEm!, umMesAtras)));
    const churnCount = Number(canceladosMes[0]?.count ?? 0);
    const churnRate = total > 0 ? parseFloat(((churnCount / total) * 100).toFixed(1)) : 0;

    const mrrMedio = contratosAtivos.length > 0 ? mrr / contratosAtivos.length : 0;
    const ltv = parseFloat((mrrMedio * 12).toFixed(2));

    const leadsPorEtapa = await db
      .select({ etapa: crmLeads.etapa, count: sql<number>`count(*)` })
      .from(crmLeads)
      .groupBy(crmLeads.etapa);

    const leadsPorOrigem = await db
      .select({ origem: crmLeads.origem, count: sql<number>`count(*)` })
      .from(crmLeads)
      .groupBy(crmLeads.origem);

    const totalLeadsQ = await db.select({ count: sql<number>`count(*)` }).from(crmLeads);
    const leadsGanhos = await db
      .select({ count: sql<number>`count(*)` })
      .from(crmLeads)
      .where(eq(crmLeads.etapa, "fechado_ganho"));
    const totalL = Number(totalLeadsQ[0]?.count ?? 0);
    const ganhos = Number(leadsGanhos[0]?.count ?? 0);
    const taxaConversao = totalL > 0 ? parseFloat(((ganhos / totalL) * 100).toFixed(1)) : 0;

    return {
      mrr,
      churnRate,
      ltv,
      taxaConversao,
      totalContratosAtivos: contratosAtivos.length,
      totalLeads: totalL,
      leadsPorEtapa: leadsPorEtapa.map((l: any) => ({ etapa: l.etapa, count: Number(l.count) })),
      leadsPorOrigem: leadsPorOrigem.map((l: any) => ({ origem: l.origem, count: Number(l.count) })),
    };
  }),

  // ============================================================
  // ATIVIDADES
  // ============================================================
  listarAtividades: crmProcedure
    .input(z.object({ entidadeTipo: z.enum(["lead", "contrato"]), entidadeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(crmAtividades)
        .where(and(eq(crmAtividades.entidadeTipo, input.entidadeTipo), eq(crmAtividades.entidadeId, input.entidadeId)))
        .orderBy(desc(crmAtividades.createdAt));
    }),

  registrarAtividade: crmProcedure
    .input(
      z.object({
        entidadeTipo: z.enum(["lead", "contrato"]),
        entidadeId: z.number(),
        tipo: z.enum(["nota", "ligacao", "email", "reuniao", "proposta_enviada", "mudanca_etapa"]),
        descricao: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(crmAtividades).values({ ...input, usuarioId: ctx.user.id });
      return { sucesso: true };
    }),

  // ============================================================
  // MEMBROS CRM
  // ============================================================
  listarMembros: crmAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const membros = await db.select().from(crmMembros).orderBy(desc(crmMembros.createdAt));
    const result = await Promise.all(
      membros.map(async (m: any) => {
        const db2 = await getDb();
        if (!db2) return { ...m, usuario: null };
        const user = await db2.select().from(users).where(eq(users.id, m.userId)).limit(1);
        return { ...m, usuario: user[0] ?? null };
      })
    );
    return result;
  }),

  adicionarMembro: crmAdminProcedure
    .input(z.object({ userId: z.number(), nivel: z.enum(["visualizador", "editor", "admin"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(crmMembros).values({ ...input, autorizadoPorId: ctx.user.id });
      return { sucesso: true };
    }),

  removerMembro: crmAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(crmMembros).where(eq(crmMembros.id, input.id));
      return { sucesso: true };
    }),

  listarUsuariosSistema: crmAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .orderBy(users.name);
  }),
});
