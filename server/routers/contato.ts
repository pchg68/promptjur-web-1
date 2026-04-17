/**
 * Router de contato — PromptJur
 * Gerencia o formulário de contato público e a listagem de mensagens para admins
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { contactMessages } from "../../drizzle/schema";
import { eq, desc, count } from "drizzle-orm";
import { sendContactConfirmationEmail, sendContactAdminNotification } from "../email";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";

// Validação do formulário de contato
const contatoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(255),
  email: z.string().email("E-mail inválido").max(320),
  assunto: z.enum(["duvida", "feedback", "suporte", "parceria", "outro"]),
  mensagem: z
    .string()
    .min(10, "Mensagem deve ter pelo menos 10 caracteres")
    .max(5000, "Mensagem não pode ultrapassar 5000 caracteres"),
});

// Procedure exclusiva para admins
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

export const contatoRouter = router({
  /**
   * Envia uma mensagem de contato (público — sem autenticação)
   * Rate limiting implícito: salva IP para controle futuro
   */
  enviar: publicProcedure
    .input(contatoSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Serviço temporariamente indisponível. Tente novamente em instantes.",
        });
      }

      // Captura IP para auditoria (sem bloqueio por ora)
      const ipAddress =
        (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
        ctx.req.socket?.remoteAddress ??
        null;

      // Persiste a mensagem no banco
      await db.insert(contactMessages).values({
        nome: input.nome,
        email: input.email,
        assunto: input.assunto,
        mensagem: input.mensagem,
        ipAddress,
      });

      // Envia confirmação ao visitante (fire-and-forget)
      sendContactConfirmationEmail({
        nome: input.nome,
        email: input.email,
        assunto: input.assunto,
        mensagem: input.mensagem,
      }).catch((err) =>
        console.error("[Contato] Erro ao enviar confirmação ao visitante:", err)
      );

      // Notifica o admin via e-mail (se configurado) e via sistema de notificações
      // Extrai o e-mail do remetente configurado para notificar o admin
      const adminEmail =
        ENV.adminEmail ||
        process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] ||
        process.env.EMAIL_FROM ||
        "";

      if (adminEmail) {
        sendContactAdminNotification({
          nome: input.nome,
          email: input.email,
          assunto: input.assunto,
          mensagem: input.mensagem,
          adminEmail,
        }).catch((err) =>
          console.error("[Contato] Erro ao notificar admin por e-mail:", err)
        );
      }

      // Notificação in-app para o admin
      notifyOwner({
        title: `📬 Novo contato: ${input.nome}`,
        content: `Assunto: ${input.assunto}\nDe: ${input.email}\n\n${input.mensagem.slice(0, 200)}${input.mensagem.length > 200 ? "..." : ""}`,
      }).catch(() => {});

      return { success: true };
    }),

  /**
   * Lista mensagens de contato — apenas admins
   */
  listar: adminProcedure
    .input(
      z.object({
        pagina: z.number().int().min(1).default(1),
        porPagina: z.number().int().min(1).max(100).default(20),
        apenasNaoLidas: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { mensagens: [], total: 0, pagina: input.pagina, totalPaginas: 0 };

      const offset = (input.pagina - 1) * input.porPagina;

      const whereClause = input.apenasNaoLidas ? eq(contactMessages.lido, false) : undefined;

      const [mensagens, [{ total }]] = await Promise.all([
        db
          .select()
          .from(contactMessages)
          .where(whereClause)
          .orderBy(desc(contactMessages.criadoEm))
          .limit(input.porPagina)
          .offset(offset),
        db.select({ total: count() }).from(contactMessages).where(whereClause),
      ]);

      return {
        mensagens,
        total: Number(total),
        pagina: input.pagina,
        totalPaginas: Math.ceil(Number(total) / input.porPagina),
      };
    }),

  /**
   * Marca uma mensagem como lida — apenas admins
   */
  marcarLida: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(contactMessages)
        .set({ lido: true })
        .where(eq(contactMessages.id, input.id));
      return { success: true };
    }),

  /**
   * Registra resposta do admin a uma mensagem — apenas admins
   */
  responder: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        resposta: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(contactMessages)
        .set({
          respostaAdmin: input.resposta,
          respondidoEm: new Date(),
          lido: true,
        })
        .where(eq(contactMessages.id, input.id));
      return { success: true };
    }),

  /**
   * Remove uma mensagem de contato — apenas admins
   */
  remover: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(contactMessages).where(eq(contactMessages.id, input.id));
      return { success: true };
    }),

  /**
   * Contagem de mensagens não lidas — apenas admins
   */
  contarNaoLidas: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0 };
    const [{ total }] = await db
      .select({ total: count() })
      .from(contactMessages)
      .where(eq(contactMessages.lido, false));
    return { total: Number(total) };
  }),
});
