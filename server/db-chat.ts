import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  chatSessions,
  chatMessages,
  InsertChatSession,
  InsertChatMessage,
} from "../drizzle/schema";

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function criarSessao(data: InsertChatSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(chatSessions).values(data);
  return result.insertId as number;
}

export async function listarSessoes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt))
    .limit(50);
}

export async function buscarSessao(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function atualizarSessao(
  sessionId: number,
  userId: number,
  data: Partial<InsertChatSession>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(chatSessions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
}

export async function deletarSessao(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Deleta mensagens primeiro
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  await db
    .delete(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function salvarMensagem(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(chatMessages).values(data);
  return result.insertId as number;
}

export async function listarMensagens(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);
}
