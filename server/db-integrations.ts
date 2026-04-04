/**
 * Queries para a tabela user_integrations
 * Gerencia API Keys e tokens OAuth dos usuários
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { userIntegrations, type InsertUserIntegration, type UserIntegration } from "../drizzle/schema";

/**
 * Busca todas as integrações ativas de um usuário
 */
export async function getUserIntegrations(userId: number): Promise<UserIntegration[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userIntegrations)
    .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.isActive, true)));
}

/**
 * Busca uma integração específica de um usuário por provedor
 */
export async function getUserIntegration(
  userId: number,
  provider: string
): Promise<UserIntegration | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(userIntegrations)
    .where(
      and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.provider, provider),
        eq(userIntegrations.isActive, true)
      )
    )
    .limit(1);
  return result[0];
}

/**
 * Salva ou atualiza uma integração (upsert por userId + provider)
 */
export async function upsertUserIntegration(
  userId: number,
  provider: string,
  data: Partial<Omit<InsertUserIntegration, "userId" | "provider">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");

  // Verificar se já existe
  const existing = await db
    .select({ id: userIntegrations.id })
    .from(userIntegrations)
    .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, provider)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userIntegrations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, provider)));
  } else {
    await db.insert(userIntegrations).values({
      userId,
      provider,
      isActive: true,
      ...data,
    });
  }
}

/**
 * Remove (desativa) uma integração
 */
export async function removeUserIntegration(userId: number, provider: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");
  await db
    .update(userIntegrations)
    .set({ isActive: false, apiKey: null, accessToken: null, refreshToken: null, updatedAt: new Date() })
    .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, provider)));
}

/**
 * Retorna apenas a API key de um provedor para uso interno no servidor
 */
export async function getProviderApiKey(userId: number, provider: string): Promise<string | null> {
  const integration = await getUserIntegration(userId, provider);
  return integration?.apiKey ?? null;
}

/**
 * Retorna tokens OAuth de um provedor para uso interno no servidor
 */
export async function getProviderOAuthTokens(
  userId: number,
  provider: string
): Promise<{ accessToken: string; refreshToken: string | null; tokenExpiry: Date | null } | null> {
  const integration = await getUserIntegration(userId, provider);
  if (!integration?.accessToken) return null;
  return {
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken ?? null,
    tokenExpiry: integration.tokenExpiry ?? null,
  };
}
