/**
 * Testes para Prompt Caching (Anthropic) e Alertas Sentry
 * 
 * Verifica:
 * 1. claude-integration.ts: formato correto do system prompt com cache_control
 * 2. claude-integration.ts: cálculo de economia do cache
 * 3. unified-llm.ts: integração com Sentry nos pontos de erro
 * 4. stripeWebhook.ts: captureException nos handlers de erro
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Prompt Caching — Anthropic Claude", () => {
  const claudeContent = fs.readFileSync(
    path.resolve(__dirname, "../claude-integration.ts"),
    "utf-8"
  );

  it("deve exportar função invokeClaude com suporte a enableCaching", () => {
    expect(claudeContent).toContain("enableCaching");
    expect(claudeContent).toContain("export async function invokeClaude");
  });

  it("deve converter system prompt para array com cache_control quando caching habilitado", () => {
    expect(claudeContent).toContain('cache_control: { type: "ephemeral" }');
    expect(claudeContent).toContain("type: \"text\"");
    expect(claudeContent).toContain("text: options.system");
  });

  it("deve manter formato simples quando caching desabilitado", () => {
    expect(claudeContent).toContain("requestBody.system = options.system");
  });

  it("deve logar cache hits e writes para monitoramento de custos", () => {
    expect(claudeContent).toContain("cache_creation_input_tokens");
    expect(claudeContent).toContain("cache_read_input_tokens");
    expect(claudeContent).toContain("[Claude:Cache] WRITE");
    expect(claudeContent).toContain("[Claude:Cache] HIT");
  });

  it("deve exportar função calculateCacheSavings para monitoramento", () => {
    expect(claudeContent).toContain("export function calculateCacheSavings");
    expect(claudeContent).toContain("savingsPercent");
    expect(claudeContent).toContain("estimatedSavingsUSD");
  });

  it("deve ter enableCaching como true por padrão", () => {
    expect(claudeContent).toContain("options.enableCaching !== false");
  });

  it("deve usar anthropic-version 2023-06-01", () => {
    expect(claudeContent).toContain('"anthropic-version": "2023-06-01"');
  });
});

describe("Alertas Sentry — Pontos Críticos de Produção", () => {
  const webhookContent = fs.readFileSync(
    path.resolve(__dirname, "../_core/stripeWebhook.ts"),
    "utf-8"
  );
  const unifiedLlmContent = fs.readFileSync(
    path.resolve(__dirname, "../unified-llm.ts"),
    "utf-8"
  );

  describe("Stripe Webhook — Sentry Integration", () => {
    it("deve importar captureException e captureMessage do Sentry", () => {
      expect(webhookContent).toContain('import { captureException, captureMessage, addBreadcrumb } from "./sentry"');
    });

    it("deve capturar exceção na falha de verificação de assinatura", () => {
      expect(webhookContent).toContain('captureException(error, { context: "stripe_webhook_signature_verification" })');
    });

    it("deve capturar exceção na falha de atualização de assinatura", () => {
      expect(webhookContent).toContain('context: "webhook_update_subscription"');
    });

    it("deve capturar exceção na falha de atualização por ID", () => {
      expect(webhookContent).toContain('context: "webhook_update_subscription_by_id"');
    });

    it("deve capturar exceção na falha de adição de créditos bônus", () => {
      expect(webhookContent).toContain('context: "webhook_add_bonus_credits"');
    });

    it("deve enviar alerta quando processamento do webhook falha", () => {
      expect(webhookContent).toContain('[ALERTA] Webhook Stripe falhou');
      expect(webhookContent).toContain('context: "stripe_webhook_processing"');
    });
  });

  describe("Unified LLM — Sentry Integration", () => {
    it("deve importar captureException e captureMessage do Sentry", () => {
      expect(unifiedLlmContent).toContain('import { captureException, captureMessage, addBreadcrumb } from "./_core/sentry"');
    });

    it("deve adicionar breadcrumb quando provider falha", () => {
      expect(unifiedLlmContent).toContain('addBreadcrumb("llm"');
      expect(unifiedLlmContent).toContain("Erro no provider");
    });

    it("deve capturar exceção quando fallback total falha", () => {
      expect(unifiedLlmContent).toContain('context: "llm_fallback_total_failure"');
    });

    it("deve enviar alerta de falha total (provider + fallback)", () => {
      expect(unifiedLlmContent).toContain("[ALERTA] LLM falha total");
    });

    it("deve capturar exceção quando Manus provider falha diretamente", () => {
      expect(unifiedLlmContent).toContain('context: "llm_manus_provider_failure"');
    });
  });
});

describe("Sentry Server Config — Configuração Base", () => {
  const sentryContent = fs.readFileSync(
    path.resolve(__dirname, "../_core/sentry.ts"),
    "utf-8"
  );

  it("deve inicializar com @sentry/node", () => {
    expect(sentryContent).toContain('import * as Sentry from "@sentry/node"');
  });

  it("deve ter integração com Express e HTTP", () => {
    expect(sentryContent).toContain("Sentry.httpIntegration()");
    expect(sentryContent).toContain("Sentry.expressIntegration()");
  });

  it("deve filtrar dados sensíveis antes de enviar", () => {
    expect(sentryContent).toContain("delete event.request.cookies");
    expect(sentryContent).toContain('delete event.request.headers["authorization"]');
    expect(sentryContent).toContain('delete event.request.headers["cookie"]');
  });

  it("deve ignorar health checks e assets estáticos", () => {
    expect(sentryContent).toContain("/health");
    expect(sentryContent).toContain("/favicon");
    expect(sentryContent).toContain("/assets/");
  });

  it("deve ter handler de erros tRPC com contexto de usuário", () => {
    expect(sentryContent).toContain("export function handleTRPCError");
    expect(sentryContent).toContain("trpc.path");
    expect(sentryContent).toContain("trpc.type");
    expect(sentryContent).toContain("trpc.code");
  });

  it("deve não capturar erros UNAUTHORIZED e NOT_FOUND (são esperados)", () => {
    expect(sentryContent).toContain('"UNAUTHORIZED"');
    expect(sentryContent).toContain('"FORBIDDEN"');
    expect(sentryContent).toContain('"NOT_FOUND"');
  });

  it("deve ter taxa de amostragem reduzida em produção (0.2)", () => {
    expect(sentryContent).toContain("0.2");
  });
});

describe("Prompt Caching — calculateCacheSavings", () => {
  // Importar a função real para testar
  it("deve calcular economia corretamente", async () => {
    const { calculateCacheSavings } = await import("../claude-integration");

    const usage = {
      input_tokens: 100,
      output_tokens: 500,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 2000,
    };

    const result = calculateCacheSavings(usage);

    expect(result.totalInputTokens).toBe(2100); // 100 + 0 + 2000
    expect(result.cachedTokens).toBe(2000);
    expect(result.savingsPercent).toBeGreaterThan(0);
    expect(result.estimatedSavingsUSD).toBeGreaterThan(0);
  });

  it("deve retornar 0% quando não há cache", async () => {
    const { calculateCacheSavings } = await import("../claude-integration");

    const usage = {
      input_tokens: 1000,
      output_tokens: 500,
    };

    const result = calculateCacheSavings(usage);

    expect(result.cachedTokens).toBe(0);
    expect(result.savingsPercent).toBe(0);
    expect(result.estimatedSavingsUSD).toBe(0);
  });
});
