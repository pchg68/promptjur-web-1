import { eq, and, desc } from "drizzle-orm";
import { notifications, notificationPreferences, InsertNotification, InsertNotificationPreference } from "../drizzle/schema";
import { getDb } from "./db";

// ===== NOTIFICATION HELPERS =====

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  // Serializar campos Date para ISO strings
  return result.map(notif => ({
    ...notif,
    createdAt: notif.createdAt.toISOString()
  }));
}

export async function getUnreadCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.lida, false)
    ));

  return result.length;
}

export async function markAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  // Verificar se a notificação pertence ao usuário
  const [notification] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1);

  if (!notification || notification.userId !== userId) return false;

  await db
    .update(notifications)
    .set({ lida: true })
    .where(eq(notifications.id, notificationId));

  return true;
}

export async function markAllAsRead(userId: number) {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(notifications)
    .set({ lida: true })
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.lida, false)
    ));

  return true;
}

export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  // Verificar se a notificação pertence ao usuário
  const [notification] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1);

  if (!notification || notification.userId !== userId) return false;

  await db
    .delete(notifications)
    .where(eq(notifications.id, notificationId));

  return true;
}

// ===== NOTIFICATION PREFERENCES HELPERS =====

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [preferences] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  // Criar preferências padrão se não existirem
  if (!preferences) {
    const defaultPrefs: InsertNotificationPreference = {
      userId,
      emailEnabled: true,
      soundEnabled: true,
      tiposSucesso: true,
      tiposAlerta: true,
      tiposErro: true,
      tiposInfo: true,
      tiposSistema: true,
    };

    const result = await db.insert(notificationPreferences).values(defaultPrefs);
    const [newPrefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    return newPrefs;
  }

  return preferences;
}

export async function updateNotificationPreferences(
  userId: number,
  data: Partial<Omit<InsertNotificationPreference, "userId">>
) {
  const db = await getDb();
  if (!db) return false;

  // Verificar se preferências existem
  const existing = await getNotificationPreferences(userId);
  if (!existing) return false;

  await db
    .update(notificationPreferences)
    .set(data)
    .where(eq(notificationPreferences.userId, userId));

  return true;
}
