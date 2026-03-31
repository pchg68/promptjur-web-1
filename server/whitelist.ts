/**
 * Sistema de Whitelist de Acesso
 * Controla quais e-mails têm permissão de acesso durante a fase de testes
 * Integrado com feature flag `whitelist_ativa` para ligar/desligar
 */
import { eq } from "drizzle-orm";
import { accessWhitelist } from "../drizzle/schema";
import { getDb } from "./db";
import { isFeatureEnabled } from "./feature-flags";

// Cache simples para evitar queries repetidas
const whitelistCache = new Map<string, boolean>();
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 1000; // 30 segundos

function invalidateCache() {
  whitelistCache.clear();
  cacheTimestamp = 0;
}

/**
 * Verifica se um e-mail está na whitelist e se o acesso não expirou.
 * Retorna true se a whitelist estiver desativada (acesso liberado para todos).
 */
export async function isEmailAllowed(email: string | null | undefined): Promise<boolean> {
  // Se não há e-mail, bloquear
  if (!email) return false;

  // Verificar se a feature whitelist está ativa
  const whitelistAtiva = await isFeatureEnabled("whitelist_ativa");

  // Se whitelist desativada, permitir todos
  if (!whitelistAtiva) return true;

  // Verificar cache
  const now = Date.now();
  const cacheKey = email.toLowerCase();
  if (now - cacheTimestamp < CACHE_TTL && whitelistCache.has(cacheKey)) {
    return whitelistCache.get(cacheKey)!;
  }

  const db = await getDb();
  if (!db) return false;

  const resultado = await db
    .select()
    .from(accessWhitelist)
    .where(eq(accessWhitelist.email, cacheKey))
    .limit(1);

  const entrada = resultado[0];
  let permitido = false;

  if (entrada && entrada.ativo) {
    // Verificar expiração: null = sem expiração (acesso permanente)
    if (!entrada.expiresAt || entrada.expiresAt > new Date()) {
      permitido = true;
    }
  }

  // Atualizar cache
  whitelistCache.set(cacheKey, permitido);
  cacheTimestamp = now;

  return permitido;
}

/**
 * Adiciona e-mail à whitelist com data de expiração opcional
 */
export async function addToWhitelist(
  email: string,
  nome?: string,
  adicionadoPor?: string,
  expiresAt?: Date | null
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  await db
    .insert(accessWhitelist)
    .values({
      email: email.toLowerCase().trim(),
      nome: nome ?? null,
      adicionadoPor: adicionadoPor ?? null,
      ativo: true,
      expiresAt: expiresAt ?? null,
    })
    .onDuplicateKeyUpdate({
      set: {
        ativo: true,
        nome: nome ?? null,
        expiresAt: expiresAt ?? null,
        atualizadoEm: new Date(),
      },
    });

  invalidateCache();
}

/**
 * Remove (desativa) e-mail da whitelist
 */
export async function removeFromWhitelist(email: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  await db
    .update(accessWhitelist)
    .set({ ativo: false, atualizadoEm: new Date() })
    .where(eq(accessWhitelist.email, email.toLowerCase().trim()));

  invalidateCache();
}

/**
 * Lista todos os e-mails na whitelist
 */
export async function listWhitelist() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(accessWhitelist)
    .orderBy(accessWhitelist.criadoEm);
}

/**
 * Inicializa a whitelist com o e-mail do owner
 */
export async function initOwnerWhitelist(ownerEmail: string): Promise<void> {
  if (!ownerEmail) return;
  await addToWhitelist(ownerEmail, "Owner (admin)", "sistema", null);
}
