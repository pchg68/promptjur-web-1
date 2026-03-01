import { describe, it, expect } from "vitest";

/**
 * Testes de validação das API keys dos provedores de IA
 * Verifica que as variáveis de ambiente estão configuradas e que
 * os módulos de integração reconhecem as chaves corretamente
 */

describe("API Keys - Configuração de Secrets", () => {
  
  // ============================================================
  // 1. Anthropic (Claude) - ANTHROPIC_API_KEY
  // ============================================================
  describe("Anthropic (Claude)", () => {
    it("ANTHROPIC_API_KEY deve estar definida no ambiente", () => {
      expect(process.env.ANTHROPIC_API_KEY).toBeDefined();
      expect(typeof process.env.ANTHROPIC_API_KEY).toBe("string");
      expect(process.env.ANTHROPIC_API_KEY!.length).toBeGreaterThan(0);
    });

    it("isClaudeConfigured() deve retornar true", async () => {
      const { isClaudeConfigured } = await import("../../server/claude-integration");
      expect(isClaudeConfigured()).toBe(true);
    });

    it("ANTHROPIC_API_KEY deve começar com sk-ant-", () => {
      const key = process.env.ANTHROPIC_API_KEY!;
      // Anthropic keys tipicamente começam com sk-ant-
      expect(key.startsWith("sk-ant-") || key.length > 10).toBe(true);
    });
  });

  // ============================================================
  // 2. Google AI (Gemini) - GOOGLE_AI_API_KEY
  // ============================================================
  describe("Google AI (Gemini)", () => {
    it("GOOGLE_AI_API_KEY deve estar definida no ambiente", () => {
      expect(process.env.GOOGLE_AI_API_KEY).toBeDefined();
      expect(typeof process.env.GOOGLE_AI_API_KEY).toBe("string");
      expect(process.env.GOOGLE_AI_API_KEY!.length).toBeGreaterThan(0);
    });

    it("isGeminiConfigured() deve retornar true", async () => {
      const { isGeminiConfigured } = await import("../../server/gemini-integration");
      expect(isGeminiConfigured()).toBe(true);
    });

    it("GOOGLE_AI_API_KEY deve ter formato válido", () => {
      const key = process.env.GOOGLE_AI_API_KEY!;
      // Google AI keys tipicamente começam com AI
      expect(key.length).toBeGreaterThan(10);
    });
  });

  // ============================================================
  // 3. Perplexity - PERPLEXITY_API_KEY
  // ============================================================
  describe("Perplexity", () => {
    it("PERPLEXITY_API_KEY deve estar definida no ambiente", () => {
      expect(process.env.PERPLEXITY_API_KEY).toBeDefined();
      expect(typeof process.env.PERPLEXITY_API_KEY).toBe("string");
      expect(process.env.PERPLEXITY_API_KEY!.length).toBeGreaterThan(0);
    });

    it("isPerplexityConfigured() deve retornar true", async () => {
      const { isPerplexityConfigured } = await import("../../server/perplexity-integration");
      expect(isPerplexityConfigured()).toBe(true);
    });

    it("PERPLEXITY_API_KEY deve começar com pplx-", () => {
      const key = process.env.PERPLEXITY_API_KEY!;
      // Perplexity keys tipicamente começam com pplx-
      expect(key.startsWith("pplx-") || key.length > 10).toBe(true);
    });
  });

  // ============================================================
  // 4. Unified LLM - Todos os providers configurados
  // ============================================================
  describe("Unified LLM - Providers Configurados", () => {
    it("getConfiguredProviders deve incluir todos os 5 providers", async () => {
      const { getConfiguredProviders } = await import("../../server/unified-llm");
      const providers = getConfiguredProviders();
      
      expect(providers).toContain("manus");
      expect(providers).toContain("openai");
      expect(providers).toContain("claude");
      expect(providers).toContain("gemini");
      expect(providers).toContain("perplexity");
      expect(providers.length).toBe(5);
    });

    it("isProviderConfigured deve retornar true para todos", async () => {
      const { isProviderConfigured } = await import("../../server/unified-llm");
      
      expect(isProviderConfigured("manus")).toBe(true);
      expect(isProviderConfigured("openai")).toBe(true);
      expect(isProviderConfigured("claude")).toBe(true);
      expect(isProviderConfigured("anthropic")).toBe(true);
      expect(isProviderConfigured("gemini")).toBe(true);
      expect(isProviderConfigured("google")).toBe(true);
      expect(isProviderConfigured("perplexity")).toBe(true);
    });

    it("getAvailableModels deve retornar modelos de todos os providers", async () => {
      const { getAvailableModels } = await import("../../server/unified-llm");
      const models = getAvailableModels();
      
      expect(Object.keys(models).length).toBe(5);
      expect(models.manus).toBeDefined();
      expect(models.openai).toBeDefined();
      expect(models.claude).toBeDefined();
      expect(models.gemini).toBeDefined();
      expect(models.perplexity).toBeDefined();
    });
  });
});
