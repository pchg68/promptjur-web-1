import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as notifDb from "./db-notifications";

export const notificationsRouter = router({
  // Listar notificações do usuário
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50)
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit || 50;
      return notifDb.getUserNotifications(ctx.user.id, limit);
    }),

  // Obter contador de não lidas
  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return notifDb.getUnreadCount(ctx.user.id);
    }),

  // Marcar como lida
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await notifDb.markAsRead(input.notificationId, ctx.user.id);
      if (!success) {
        throw new Error("Notificação não encontrada ou sem permissão");
      }
      return { success: true };
    }),

  // Marcar todas como lidas
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await notifDb.markAllAsRead(ctx.user.id);
      return { success: true };
    }),

  // Deletar notificação
  delete: protectedProcedure
    .input(z.object({
      notificationId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await notifDb.deleteNotification(input.notificationId, ctx.user.id);
      if (!success) {
        throw new Error("Notificação não encontrada ou sem permissão");
      }
      return { success: true };
    }),

  // Criar notificação (apenas para sistema/admin)
  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      tipo: z.enum(["sucesso", "alerta", "erro", "info", "sistema"]),
      titulo: z.string().min(1).max(200),
      mensagem: z.string().min(1),
      link: z.string().max(500).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Apenas admin pode criar notificações para outros usuários
      if (ctx.user.role !== "admin" && input.userId !== ctx.user.id) {
        throw new Error("Sem permissão para criar notificações para outros usuários");
      }

      const notificationId = await notifDb.createNotification({
        userId: input.userId,
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
        link: input.link || null,
        lida: false
      });

      return { success: true, notificationId };
    }),
});

export const notificationPreferencesRouter = router({
  // Obter preferências
  get: protectedProcedure
    .query(async ({ ctx }) => {
      return notifDb.getNotificationPreferences(ctx.user.id);
    }),

  // Atualizar preferências
  update: protectedProcedure
    .input(z.object({
      emailEnabled: z.boolean().optional(),
      soundEnabled: z.boolean().optional(),
      tiposSucesso: z.boolean().optional(),
      tiposAlerta: z.boolean().optional(),
      tiposErro: z.boolean().optional(),
      tiposInfo: z.boolean().optional(),
      tiposSistema: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await notifDb.updateNotificationPreferences(ctx.user.id, input);
      if (!success) {
        throw new Error("Erro ao atualizar preferências");
      }
      return { success: true };
    }),
});
