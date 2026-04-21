import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as notifDb from "./db-notifications";
import { sendPushToUser, savePushSubscription, removePushSubscription, getUserPushSubscriptions } from "./push";
import { sendNotificationEmail } from "./email";
import { getUserById } from "./db";

// ─── Helper: disparar canais secundários após criar notificação ───────────────
async function dispatchNotificationSideEffects(opts: {
  userId: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string | null;
}) {
  try {
    const prefs = await notifDb.getNotificationPreferences(opts.userId);
    if (!prefs) return;

    const tipoHabilitado =
      (opts.tipo === "sucesso" && prefs.tiposSucesso) ||
      (opts.tipo === "alerta" && prefs.tiposAlerta) ||
      (opts.tipo === "erro" && prefs.tiposErro) ||
      (opts.tipo === "info" && prefs.tiposInfo) ||
      (opts.tipo === "sistema" && prefs.tiposSistema);

    if (!tipoHabilitado) return;

    if ((prefs as any).pushEnabled) {
      await sendPushToUser(opts.userId, {
        title: opts.titulo,
        body: opts.mensagem,
        url: opts.link || "/",
        tag: `notif-${opts.tipo}`,
      });
    }

    const emailDigest = (prefs as any).emailDigest ?? "imediato";
    if (prefs.emailEnabled && emailDigest === "imediato") {
      const user = await getUserById(opts.userId);
      if (user?.email) {
        await sendNotificationEmail({
          to: user.email,
          nome: user.name || user.email.split("@")[0],
          titulo: opts.titulo,
          mensagem: opts.mensagem,
          tipo: opts.tipo,
          link: opts.link,
        });
      }
    }
  } catch (err) {
    console.error("[Notifications] Erro ao disparar side effects:", err);
  }
}

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return notifDb.getUserNotifications(ctx.user.id, input?.limit || 50);
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return notifDb.getUnreadCount(ctx.user.id);
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await notifDb.markAsRead(input.notificationId, ctx.user.id);
      if (!success) throw new Error("Notificação não encontrada ou sem permissão");
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await notifDb.markAllAsRead(ctx.user.id);
    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await notifDb.deleteNotification(input.notificationId, ctx.user.id);
      if (!success) throw new Error("Notificação não encontrada ou sem permissão");
      return { success: true };
    }),

  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      tipo: z.enum(["sucesso", "alerta", "erro", "info", "sistema"]),
      titulo: z.string().min(1).max(200),
      mensagem: z.string().min(1),
      link: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && input.userId !== ctx.user.id) {
        throw new Error("Sem permissão para criar notificações para outros usuários");
      }
      const notificationId = await notifDb.createNotification({
        userId: input.userId,
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
        link: input.link || null,
        lida: false,
      });
      dispatchNotificationSideEffects({
        userId: input.userId,
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
        link: input.link || null,
      });
      return { success: true, notificationId };
    }),
});

export const notificationPreferencesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return notifDb.getNotificationPreferences(ctx.user.id);
  }),

  update: protectedProcedure
    .input(z.object({
      emailEnabled: z.boolean().optional(),
      soundEnabled: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      emailDigest: z.enum(["imediato", "diario", "nunca"]).optional(),
      tiposSucesso: z.boolean().optional(),
      tiposAlerta: z.boolean().optional(),
      tiposErro: z.boolean().optional(),
      tiposInfo: z.boolean().optional(),
      tiposSistema: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await notifDb.updateNotificationPreferences(ctx.user.id, input as any);
      if (!success) throw new Error("Erro ao atualizar preferências");
      return { success: true };
    }),
});

export const pushSubscriptionsRouter = router({
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      keys: z.object({ p256dh: z.string(), auth: z.string() }),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await savePushSubscription(
        ctx.user.id,
        { endpoint: input.endpoint, keys: input.keys },
        input.userAgent
      );
      return { success: true, id };
    }),

  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await removePushSubscription(ctx.user.id, input.endpoint);
      return { success: true };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const subs = await getUserPushSubscriptions(ctx.user.id);
    return subs.map(s => ({
      id: s.id,
      endpoint: s.endpoint.substring(0, 60) + "...",
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
    }));
  }),

  test: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await sendPushToUser(ctx.user.id, {
      title: "🔔 PromptJur — Teste de Push",
      body: "As notificações push estão funcionando corretamente!",
      url: "/",
      tag: "test-push",
    });
    return result;
  }),
});
