/**
 * Serviço de Web Push Notifications
 * Usa VAPID + web-push para enviar notificações ao navegador
 */
import webpush from "web-push";
import { eq, and } from "drizzle-orm";
import { pushSubscriptions, InsertPushSubscription } from "../drizzle/schema";
import { getDb } from "./db";
import { logger } from "./_core/logger";

// Configurar VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@promptjur.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${EMAIL_FROM}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Salvar assinatura push de um usuário
 */
export async function savePushSubscription(
  userId: number,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe para este endpoint
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    await db
      .update(pushSubscriptions)
      .set({
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
        updatedAt: new Date(),
      })
      .where(eq(pushSubscriptions.id, existing[0].id));
    return existing[0].id;
  }

  // Criar novo
  const [result] = await db.insert(pushSubscriptions).values({
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: userAgent || null,
  } as InsertPushSubscription);

  return (result as any).insertId;
}

/**
 * Remover assinatura push
 */
export async function removePushSubscription(
  userId: number,
  endpoint: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );
  return true;
}

/**
 * Listar assinaturas push de um usuário
 */
export async function getUserPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

/**
 * Enviar notificação push para um usuário (todos os dispositivos)
 */
export async function sendPushToUser(
  userId: number,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    logger.warn("[Push] VAPID keys not configured, skipping push");
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await getUserPushSubscriptions(userId);
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  const db = await getDb();
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      failed++;
      logger.error("[Push] Falha ao enviar push", {
        userId,
        endpoint: sub.endpoint.substring(0, 50),
        error: err.message,
      });

      // Se o endpoint expirou (410 Gone), remover do banco
      if (err.statusCode === 410 || err.statusCode === 404) {
        if (db) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
          logger.info("[Push] Assinatura expirada removida", { id: sub.id });
        }
      }
    }
  }

  return { sent, failed };
}
