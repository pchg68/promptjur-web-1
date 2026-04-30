/**
 * abuse-detection.ts — Detecção de abuso e rate limiting
 *
 * Implementa:
 * 1. Rate limiting por IP e por usuário
 * 2. Detecção de múltiplas contas (fingerprint)
 * 3. Bloqueio temporário após excesso de requisições
 * 4. Logging de tentativas suspeitas
 */

import { TRPCError } from "@trpc/server";
import { logger } from "./_core/logger";

// ─── Configurações ──────────────────────────────────────────────────────────────
const RATE_LIMITS = {
  /** Máximo de operações de IA por minuto por usuário */
  aiOpsPerMinute: 10,
  /** Máximo de tentativas de login por IP em 15 min */
  loginAttemptsPerWindow: 10,
  /** Máximo de requisições API por minuto por IP */
  apiRequestsPerMinute: 120,
  /** Janela de tempo para rate limiting (ms) */
  windowMs: 60_000,
  /** Janela de tempo para login (ms) */
  loginWindowMs: 15 * 60_000,
  /** Tempo de bloqueio após exceder limite (ms) */
  blockDurationMs: 5 * 60_000,
};

// ─── Stores em memória (reset no restart) ────────────────────────────────────────
interface RateEntry {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockedUntil?: number;
}

const userRateLimits = new Map<string, RateEntry>();
const ipRateLimits = new Map<string, RateEntry>();
const loginAttempts = new Map<string, RateEntry>();

// Limpar entries antigas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userRateLimits) {
    if (now - entry.firstRequest > RATE_LIMITS.windowMs * 2) {
      userRateLimits.delete(key);
    }
  }
  for (const [key, entry] of ipRateLimits) {
    if (now - entry.firstRequest > RATE_LIMITS.windowMs * 2) {
      ipRateLimits.delete(key);
    }
  }
  for (const [key, entry] of loginAttempts) {
    if (now - entry.firstRequest > RATE_LIMITS.loginWindowMs * 2) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60_000);

// ─── Funções de Rate Limiting ─────────────────────────────────────────────────────

function checkRateLimit(
  store: Map<string, RateEntry>,
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now();
  const entry = store.get(key);

  // Verificar se está bloqueado
  if (entry?.blocked && entry.blockedUntil) {
    if (now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.blockedUntil - now,
      };
    }
    // Bloqueio expirou, resetar
    store.delete(key);
  }

  if (!entry || now - entry.firstRequest > windowMs) {
    // Nova janela
    store.set(key, { count: 1, firstRequest: now, blocked: false });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count++;

  if (entry.count > limit) {
    // Excedeu limite — bloquear
    entry.blocked = true;
    entry.blockedUntil = now + RATE_LIMITS.blockDurationMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: RATE_LIMITS.blockDurationMs,
    };
  }

  return { allowed: true, remaining: limit - entry.count };
}

/**
 * Verifica rate limit para operações de IA (por userId)
 * Deve ser chamado antes de cada operação de geração/otimização/refinamento
 */
export function checkAiRateLimit(userId: number): void {
  const key = `user:${userId}`;
  const result = checkRateLimit(
    userRateLimits,
    key,
    RATE_LIMITS.aiOpsPerMinute,
    RATE_LIMITS.windowMs,
  );

  if (!result.allowed) {
    logger.warn("[AbuseDetection] Rate limit excedido para operações de IA", {
      userId,
      retryAfterMs: result.retryAfterMs,
    });
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Muitas requisições em pouco tempo. Aguarde ${Math.ceil((result.retryAfterMs || 60000) / 1000)} segundos antes de tentar novamente.`,
    });
  }
}

/**
 * Verifica rate limit para requisições API (por IP)
 */
export function checkApiRateLimit(ip: string): void {
  const key = `ip:${ip}`;
  const result = checkRateLimit(
    ipRateLimits,
    key,
    RATE_LIMITS.apiRequestsPerMinute,
    RATE_LIMITS.windowMs,
  );

  if (!result.allowed) {
    logger.warn("[AbuseDetection] Rate limit de API excedido por IP", {
      ip,
      retryAfterMs: result.retryAfterMs,
    });
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Muitas requisições. Tente novamente em alguns minutos.",
    });
  }
}

/**
 * Verifica tentativas de login (por IP)
 */
export function checkLoginRateLimit(ip: string): void {
  const key = `login:${ip}`;
  const result = checkRateLimit(
    loginAttempts,
    key,
    RATE_LIMITS.loginAttemptsPerWindow,
    RATE_LIMITS.loginWindowMs,
  );

  if (!result.allowed) {
    logger.warn("[AbuseDetection] Muitas tentativas de login por IP", {
      ip,
      retryAfterMs: result.retryAfterMs,
    });
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Muitas tentativas de login. Aguarde 15 minutos antes de tentar novamente.",
    });
  }
}

// ─── Detecção de Fingerprint (múltiplas contas) ──────────────────────────────────

interface FingerprintEntry {
  userIds: Set<number>;
  lastSeen: number;
}

const fingerprintStore = new Map<string, FingerprintEntry>();

/**
 * Registra fingerprint do dispositivo para detecção de múltiplas contas.
 * Retorna true se detectou comportamento suspeito (mesmo dispositivo, múltiplas contas).
 */
export function trackDeviceFingerprint(
  userId: number,
  ip: string,
  userAgent: string,
): { suspicious: boolean; accountCount: number } {
  // Gerar fingerprint simples baseado em IP + User-Agent
  const fingerprint = `${ip}::${userAgent}`;
  const now = Date.now();

  const entry = fingerprintStore.get(fingerprint);

  if (!entry) {
    fingerprintStore.set(fingerprint, {
      userIds: new Set([userId]),
      lastSeen: now,
    });
    return { suspicious: false, accountCount: 1 };
  }

  entry.userIds.add(userId);
  entry.lastSeen = now;

  // Suspeito se mais de 3 contas diferentes do mesmo dispositivo
  const suspicious = entry.userIds.size > 3;

  if (suspicious) {
    logger.warn("[AbuseDetection] Múltiplas contas detectadas no mesmo dispositivo", {
      fingerprint: fingerprint.slice(0, 50),
      accountCount: entry.userIds.size,
      userIds: Array.from(entry.userIds),
    });
  }

  return { suspicious, accountCount: entry.userIds.size };
}

// Limpar fingerprints antigos a cada hora
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60_000; // 24 horas
  for (const [key, entry] of fingerprintStore) {
    if (now - entry.lastSeen > maxAge) {
      fingerprintStore.delete(key);
    }
  }
}, 60 * 60_000);

/**
 * Retorna estatísticas de rate limiting (para admin tools)
 */
export function getAbuseStats() {
  return {
    activeUserLimits: userRateLimits.size,
    activeIpLimits: ipRateLimits.size,
    activeLoginLimits: loginAttempts.size,
    trackedFingerprints: fingerprintStore.size,
    blockedUsers: Array.from(userRateLimits.entries())
      .filter(([, e]) => e.blocked)
      .map(([k]) => k),
    blockedIps: Array.from(ipRateLimits.entries())
      .filter(([, e]) => e.blocked)
      .map(([k]) => k),
  };
}
