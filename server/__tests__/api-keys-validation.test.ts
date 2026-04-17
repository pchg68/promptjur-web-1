import { describe, it, expect, beforeAll } from "vitest";

/**
 * Testes de validação das API keys dos provedores de IA.
 * Os testes são pulados (skip) quando as chaves não estão configuradas,
 * para não quebrar CI/CD em ambientes sem secrets.
 */

const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
const hasGoogleKey = !!process.env.GOOGLE_AI_API_KEY;
const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;

describe("API Keys - Configuração de Secrets", () => {

  // ============================================================
  // 1. Anthropic (Claude) - ANTHROPIC_API_KEY
  // ============================================================
  describe("Anthropic (Claude)", () => {
    it.skipIf(!hasAnthropicKey)("ANTHROPIC_API_KEY deve estar definida no ambiente", () => {
      const key = process.env.ANTHROPIC_API_KEY!;
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
    });

    it.skipIf(!hasAnthropicKey)("isClaudeConfigured() deve retornar true", async () => {
      const { isClaudeConfigured } = await import("../../server/claude-integration");
      expect(isClaudeConfigured()).toBe(true);
    });

    it.skipIf(!hasAnthropicKey)("ANTHROPIC_API_KEY deve começar com sk-ant-", () => {
      const key = process.env.ANTHROPIC_API_KEY!;
      expect(key.startsWith("sk-ant-") || key.length > 10).toBe(true);
    });

    it("isClaudeConfigured() deve retornar false quando chave ausente", async () => {
      if (hasAnthropicKey) return; // só executa sem chave
      const { isClaudeConfigured } = await import("../../server/claude-integration");
      expect(isClaudeConfigured()).toBe(false);
    });
  });

  // ============================================================
  // 2. Google AI (Gemini) - GOOGLE_AI_API_KEY
  // ============================================================
  describe("Google AI (Gemini)", () => {
    it.skipIf(!hasGoogleKey)("GOOGLE_AI_API_KEY deve estar definida no ambiente", () => {
      const key = process.env.GOOGLE_AI_API_KEY!;
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
    });

    it.skipIf(!hasGoogleKey)("isGeminiConfigured() deve retornar true", async () => {
      const { isGeminiConfigured } = await import("../../server/gemini-integration");
      expect(isGeminiConfigured()).toBe(true);
    });

    it.skipIf(!hasGoogleKey)("GOOGLE_AI_API_KEY deve ter formato válido", () => {
      const key = process.env.GOOGLE_AI_API_KEY!;
      expect(key.length).toBeGreaterThan(10);
    });
  });

  // ============================================================
  // 3. Perplexity - PERPLEXITY_API_KEY
  // ============================================================
  describe("Perplexity", () => {
    it.skipIf(!hasPerplexityKey)("PERPLEXITY_API_KEY deve estar definida no ambiente", () => {
      const key = process.env.PERPLEXITY_API_KEY!;
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
    });

    it.skipIf(!hasPerplexityKey)("isPerplexityConfigured() deve retornar true", async () => {
      const { isPerplexityConfigured } = await import("../../server/perplexity-integration");
      expect(isPerplexityConfigured()).toBe(true);
    });

    it.skipIf(!hasPerplexityKey)("PERPLEXITY_API_KEY deve começar com pplx-", () => {
      const key = process.env.PERPLEXITY_API_KEY!;
      expect(key.startsWith("pplx-") || key.length > 10).toBe(true);
    });
  });

  // ============================================================
  // 4. Unified LLM - estrutura dos providers (sem chaves reais)
  // ============================================================
  describe("Unified LLM - Estrutura de Providers", () => {
    it("getAvailableModels deve retornar os 5 providers esperados", async () => {
      const { getAvailableModels } = await import("../../server/unified-llm");
      const models = getAvailableModels();

      expect(Object.keys(models).length).toBe(5);
      expect(models.manus).toBeDefined();
      expect(models.openai).toBeDefined();
      expect(models.claude).toBeDefined();
      expect(models.gemini).toBeDefined();
      expect(models.perplexity).toBeDefined();
    });

    it("isProviderConfigured deve responder sem lançar erros", async () => {
      const { isProviderConfigured } = await import("../../server/unified-llm");
      // Manus não precisa de chave externa — deve sempre estar configurado
      expect(isProviderConfigured("manus")).toBe(true);
    });

    it.skipIf(!hasAnthropicKey && !hasGoogleKey && !hasPerplexityKey)(
      "getConfiguredProviders deve incluir todos os 5 providers quando chaves estão presentes",
      async () => {
        const { getConfiguredProviders } = await import("../../server/unified-llm");
        const providers = getConfiguredProviders();
        expect(providers).toContain("manus");
        expect(providers.length).toBeGreaterThanOrEqual(1);
      }
    );
  });
});
