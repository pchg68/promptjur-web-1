/**
 * Admin Sub-Router: Whitelist & Manutenção
 * - CRUD whitelist
 * - Export/Import CSV
 * - Reenviar convites
 * - Histórico de convites
 * - Configuração de reenvio automático
 * - Desativar expirados
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../../_core/trpc";
import { adminProcedure } from "./shared";
import { logAuditoria } from "../../audit";
import { accessWhitelist } from "../../../drizzle/schema";
import { addToWhitelist, removeFromWhitelist, listWhitelist } from "../../whitelist";
import { sendWelcomeEmail, sendWelcomeEmailBatch } from "../../email";
import { eq, desc, sql } from "drizzle-orm";
import * as db from "../../db";
import {
  registrarConviteLog,
  buscarHistoricoConvite,
  buscarUltimosConviteLogs,
  buscarConfigReenvioAuto,
  salvarConfigReenvioAuto,
} from "../../db-convite-logs";

export const adminWhitelistRouter = router({
  getWhitelist: adminProcedure
    .query(async () => {
      return listWhitelist();
    }),

  addWhitelist: adminProcedure
    .input(z.object({
      email: z.string().email(),
      nome: z.string().optional(),
      enviarEmail: z.boolean().default(true),
      expiresAt: z.string().datetime().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      await addToWhitelist(input.email, input.nome, ctx.user.email ?? undefined, expiresAt);

      let emailResult: { success: boolean; skipped?: boolean } = { success: false, skipped: true };
      if (input.enviarEmail) {
        emailResult = await sendWelcomeEmail({ email: input.email, nome: input.nome });
      }

      if (emailResult.success && !emailResult.skipped) {
        const dbConn = await db.getDb();
        if (dbConn) {
          await dbConn
            .update(accessWhitelist)
            .set({
              convitesEnviados: sql`${accessWhitelist.convitesEnviados} + 1`,
              ultimoEnvio: new Date(),
            })
            .where(eq(accessWhitelist.email, input.email));
        }
      }

      await logAuditoria({
        userId: ctx.user.id,
        acao: "add_whitelist",
        descricao: `E-mail adicionado à whitelist: ${input.email}${
          emailResult.skipped ? '' : emailResult.success ? ' (e-mail enviado)' : ' (falha no e-mail)'
        }`,
        metadata: { email: input.email, emailEnviado: emailResult.success, emailPulado: emailResult.skipped },
        req: ctx.req,
      });
      return { success: true, emailEnviado: emailResult.success && !emailResult.skipped, emailPulado: emailResult.skipped };
    }),

  removeWhitelist: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      await removeFromWhitelist(input.email);
      await logAuditoria({
        userId: ctx.user.id,
        acao: "remove_whitelist",
        descricao: `E-mail removido da whitelist: ${input.email}`,
        metadata: { email: input.email },
        req: ctx.req,
      });
      return { success: true };
    }),

  exportWhitelistCsv: adminProcedure
    .query(async () => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const rows = await dbConn
        .select()
        .from(accessWhitelist)
        .orderBy(desc(accessWhitelist.criadoEm));

      const header = "email,nome,adicionadoPor,ativo,expiresAt,criadoEm";
      const lines = rows.map(r => [
        `"${r.email}"`,
        `"${r.nome ?? ""}"`,
        `"${r.adicionadoPor ?? ""}"`,
        r.ativo ? "sim" : "não",
        r.expiresAt ? r.expiresAt.toISOString() : "",
        r.criadoEm.toISOString(),
      ].join(","));

      return { csv: [header, ...lines].join("\n"), total: rows.length };
    }),

  importWhitelist: adminProcedure
    .input(z.object({
      emails: z.array(z.string().email()).min(1).max(100),
      enviarEmail: z.boolean().default(true),
      expiresAt: z.string().datetime().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      let adicionados = 0;
      const recipients: Array<{ email: string }> = [];
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

      for (const email of input.emails) {
        await addToWhitelist(email, undefined, ctx.user.email ?? undefined, expiresAt);
        adicionados++;
        if (input.enviarEmail) recipients.push({ email });
      }

      let emailStats = { enviados: 0, falhas: 0, pulados: adicionados };
      if (recipients.length > 0) {
        emailStats = await sendWelcomeEmailBatch(recipients);
      }

      if (emailStats.enviados > 0) {
        const dbConn = await db.getDb();
        if (dbConn) {
          const agora = new Date();
          for (const recipient of recipients) {
            await dbConn
              .update(accessWhitelist)
              .set({
                convitesEnviados: sql`${accessWhitelist.convitesEnviados} + 1`,
                ultimoEnvio: agora,
              })
              .where(eq(accessWhitelist.email, recipient.email));
          }
        }
      }

      await logAuditoria({
        userId: ctx.user.id,
        acao: "import_whitelist",
        descricao: `${adicionados} e-mail(s) importados para a whitelist (${emailStats.enviados} e-mails enviados)`,
        metadata: { total: adicionados, emailsEnviados: emailStats.enviados, emailsFalha: emailStats.falhas },
        req: ctx.req,
      });
      return { success: true, adicionados, emailsEnviados: emailStats.enviados, emailsFalha: emailStats.falhas };
    }),

  // Reenvia o e-mail de convite/boas-vindas para um e-mail específico da whitelist
  reenviarConviteWhitelist: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [entry] = await dbConn
        .select()
        .from(accessWhitelist)
        .where(eq(accessWhitelist.email, input.email))
        .limit(1);

      if (!entry) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `E-mail ${input.email} não encontrado na whitelist` });
      }

      if (!entry.ativo) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `E-mail ${input.email} está inativo na whitelist` });
      }

      const result = await sendWelcomeEmail({ email: entry.email, nome: entry.nome ?? undefined });

      if (result.success && !result.skipped) {
        await dbConn
          .update(accessWhitelist)
          .set({
            convitesEnviados: sql`${accessWhitelist.convitesEnviados} + 1`,
            ultimoEnvio: new Date(),
          })
          .where(eq(accessWhitelist.email, entry.email));
      }

      await logAuditoria({
        userId: ctx.user.id,
        acao: 'reenviar_convite_whitelist',
        descricao: `Convite reenviado para: ${entry.email} — ${
          result.skipped ? 'pulado (sem API key)' : result.success ? 'enviado com sucesso' : 'falhou'
        }`,
        metadata: { email: entry.email, success: result.success, skipped: result.skipped },
        req: ctx.req,
      });

      return {
        success: result.success,
        skipped: result.skipped ?? false,
        email: entry.email,
        nome: entry.nome,
        convitesEnviados: result.success && !result.skipped ? (entry.convitesEnviados + 1) : entry.convitesEnviados,
      };
    }),

  // Reenvia o e-mail de convite para TODOS os e-mails ativos da whitelist
  reenviarTodosWhitelist: adminProcedure.mutation(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const ativos = await dbConn
      .select()
      .from(accessWhitelist)
      .where(eq(accessWhitelist.ativo, true));

    if (ativos.length === 0) {
      return { enviados: 0, falhas: 0, pulados: 0, total: 0 };
    }

    let enviados = 0;
    let falhas = 0;
    let pulados = 0;
    const agora = new Date();

    for (const entry of ativos) {
      try {
        const result = await sendWelcomeEmail({ email: entry.email, nome: entry.nome ?? undefined });

        if (result.skipped) {
          pulados++;
          break; // Se não tem API key, todos serão pulados
        } else if (result.success) {
          enviados++;
          await dbConn
            .update(accessWhitelist)
            .set({
              convitesEnviados: sql`${accessWhitelist.convitesEnviados} + 1`,
              ultimoEnvio: agora,
            })
            .where(eq(accessWhitelist.id, entry.id));
        } else {
          falhas++;
        }
      } catch {
        falhas++;
      }
      await new Promise(r => setTimeout(r, 150));
    }

    if (pulados > 0 && enviados === 0 && falhas === 0) {
      pulados = ativos.length;
    }

    await logAuditoria({
      userId: ctx.user.id,
      acao: 'reenviar_todos_whitelist',
      descricao: `Reenvio em lote: ${enviados} enviados, ${falhas} falhas, ${pulados} pulados de ${ativos.length} ativos`,
      metadata: { total: ativos.length, enviados, falhas, pulados },
      req: ctx.req,
    });

    return { enviados, falhas, pulados, total: ativos.length };
  }),

  // Busca o histórico de envios de convite para um e-mail específico
  historicoConviteEmail: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      return buscarHistoricoConvite(input.email, 30);
    }),

  // Busca os últimos envios de convite (todos os e-mails)
  ultimosConviteLogs: adminProcedure
    .input(z.object({ limite: z.number().min(1).max(200).optional().default(50) }))
    .query(async ({ input }) => {
      return buscarUltimosConviteLogs(input.limite);
    }),

  // Busca a configuração atual de reenvio automático
  getConfigReenvioAuto: adminProcedure.query(async () => {
    const config = await buscarConfigReenvioAuto();
    return config ?? {
      id: 1,
      habilitado: false,
      diaSemana: 1,
      hora: 9,
      apenasNaoAcessaram: true,
      ultimaExecucao: null,
      ultimoResultado: null,
      updatedAt: new Date(),
    };
  }),

  // Salva a configuração de reenvio automático
  salvarConfigReenvioAuto: adminProcedure
    .input(z.object({
      habilitado: z.boolean(),
      diaSemana: z.number().min(0).max(6),
      hora: z.number().min(0).max(23),
      apenasNaoAcessaram: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await salvarConfigReenvioAuto(input);
      await logAuditoria({
        userId: ctx.user.id,
        acao: 'salvar_config_reenvio_auto',
        descricao: `Configuração de reenvio automático atualizada: habilitado=${input.habilitado}, dia=${input.diaSemana}, hora=${input.hora}h`,
        metadata: input,
        req: ctx.req,
      });
      return { sucesso: true };
    }),

  // Desativa manualmente todas as entradas da whitelist com expiresAt vencido
  desativarExpiradosWhitelist: adminProcedure.mutation(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const agora = new Date();

    const expirados = await dbConn
      .select()
      .from(accessWhitelist)
      .where(
        sql`${accessWhitelist.ativo} = 1 AND ${accessWhitelist.expiresAt} IS NOT NULL AND ${accessWhitelist.expiresAt} < ${agora}`
      );

    if (expirados.length === 0) {
      return { desativados: 0, emails: [] };
    }

    for (const entry of expirados) {
      await dbConn
        .update(accessWhitelist)
        .set({ ativo: false })
        .where(eq(accessWhitelist.id, entry.id));
    }

    await logAuditoria({
      userId: ctx.user.id,
      acao: 'desativar_expirados_whitelist',
      descricao: `${expirados.length} entrada(s) expirada(s) desativadas manualmente`,
      metadata: { emails: expirados.map(e => e.email) },
      req: ctx.req,
    });

    return { desativados: expirados.length, emails: expirados.map(e => e.email) };
  }),
});
