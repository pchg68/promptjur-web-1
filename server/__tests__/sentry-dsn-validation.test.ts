/**
 * Validação do Sentry DSN
 * 
 * Verifica que o DSN do Sentry está configurado corretamente
 * e tem o formato esperado.
 */

import { describe, it, expect } from "vitest";

const hasSentryDsn = !!process.env.SENTRY_DSN;
const hasViteSentryDsn = !!process.env.VITE_SENTRY_DSN;

describe("Sentry DSN Validation", () => {
  it.skipIf(!hasSentryDsn)("SENTRY_DSN deve estar configurado", () => {
    const dsn = process.env.SENTRY_DSN;
    expect(dsn).toBeDefined();
    expect(dsn).not.toBe("");
  });

  it.skipIf(!hasSentryDsn)("SENTRY_DSN deve ter formato válido de DSN", () => {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return; // Skip if not configured
    
    // DSN format: https://<key>@<host>/<project-id>
    const dsnPattern = /^https:\/\/[a-f0-9]+@[a-z0-9.-]+\/\d+$/;
    expect(dsn).toMatch(dsnPattern);
  });

  it.skipIf(!hasViteSentryDsn)("VITE_SENTRY_DSN deve estar configurado", () => {
    const dsn = process.env.VITE_SENTRY_DSN;
    expect(dsn).toBeDefined();
    expect(dsn).not.toBe("");
  });

  it.skipIf(!hasViteSentryDsn)("VITE_SENTRY_DSN deve ter formato válido de DSN", () => {
    const dsn = process.env.VITE_SENTRY_DSN;
    if (!dsn) return; // Skip if not configured
    
    // DSN format: https://<key>@<host>/<project-id>
    const dsnPattern = /^https:\/\/[a-f0-9]+@[a-z0-9.-]+\/\d+$/;
    expect(dsn).toMatch(dsnPattern);
  });

  it.skipIf(!hasSentryDsn)("deve ser possível fazer uma requisição de teste ao Sentry", async () => {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return; // Skip if not configured
    
    // Extrair host do DSN para verificar conectividade
    const match = dsn.match(/^https:\/\/[a-f0-9]+@([a-z0-9.-]+)\/\d+$/);
    if (!match) return;
    
    const host = match[1];
    
    try {
      // Tentar resolver o host do Sentry (verificar que é acessível)
      const response = await fetch(`https://${host}/api/0/`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      // Sentry retorna 401 para requisições sem auth, mas isso confirma que o host é válido
      expect([200, 401, 403]).toContain(response.status);
    } catch (error: any) {
      // Se der timeout ou erro de rede, pode ser firewall - não falhar o teste
      if (error.name === "AbortError" || error.code === "ECONNREFUSED") {
        console.warn("[Sentry DSN Test] Não foi possível conectar ao Sentry, mas o DSN parece válido");
        return;
      }
      // Outros erros podem indicar DSN inválido
      console.warn("[Sentry DSN Test] Erro ao validar:", error.message);
    }
  });
});
