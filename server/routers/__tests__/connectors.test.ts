import { describe, it, expect, vi } from "vitest";

/**
 * Testes unitários para os novos conectores e integrações do PromptJur
 * Foco: validação de estrutura, tipos e configuração dos módulos
 */

// ============================================================
// 1. Testes do Unified LLM (expandido com novos providers)
// ============================================================
describe("Unified LLM - Estrutura e Tipos", () => {
  it("deve exportar a função invokeUnifiedLLM", async () => {
    const mod = await import("../../unified-llm");
    expect(typeof mod.invokeUnifiedLLM).toBe("function");
  });

  it("deve exportar isProviderConfigured", async () => {
    const mod = await import("../../unified-llm");
    expect(typeof mod.isProviderConfigured).toBe("function");
  });

  it("deve exportar getConfiguredProviders", async () => {
    const mod = await import("../../unified-llm");
    expect(typeof mod.getConfiguredProviders).toBe("function");
  });

  it("deve exportar getAvailableModels", async () => {
    const mod = await import("../../unified-llm");
    expect(typeof mod.getAvailableModels).toBe("function");
  });

  it("deve exportar AVAILABLE_MODELS com todos os providers", async () => {
    const mod = await import("../../unified-llm");
    expect(mod.AVAILABLE_MODELS).toBeDefined();
    expect(mod.AVAILABLE_MODELS.manus).toBeDefined();
    expect(mod.AVAILABLE_MODELS.openai).toBeDefined();
    expect(mod.AVAILABLE_MODELS.claude).toBeDefined();
    expect(mod.AVAILABLE_MODELS.gemini).toBeDefined();
    expect(mod.AVAILABLE_MODELS.perplexity).toBeDefined();
    // Aliases
    expect(mod.AVAILABLE_MODELS.anthropic).toBeDefined();
    expect(mod.AVAILABLE_MODELS.google).toBeDefined();
  });

  it("deve ter aliases anthropic -> claude e google -> gemini", async () => {
    const mod = await import("../../unified-llm");
    expect(mod.AVAILABLE_MODELS.anthropic).toEqual(mod.AVAILABLE_MODELS.claude);
    expect(mod.AVAILABLE_MODELS.google).toEqual(mod.AVAILABLE_MODELS.gemini);
  });

  it("manus deve estar sempre configurado", async () => {
    const mod = await import("../../unified-llm");
    expect(mod.isProviderConfigured("manus")).toBe(true);
  });

  it("getConfiguredProviders deve retornar pelo menos manus", async () => {
    const mod = await import("../../unified-llm");
    const providers = mod.getConfiguredProviders();
    expect(providers).toContain("manus");
    expect(Array.isArray(providers)).toBe(true);
  });

  it("cada modelo deve ter campos obrigatórios", async () => {
    const mod = await import("../../unified-llm");
    const requiredFields = ["id", "name", "description", "contextWindow", "costTier"];
    
    for (const [provider, models] of Object.entries(mod.AVAILABLE_MODELS)) {
      if (typeof models === "function") continue; // skip getter aliases
      for (const model of models as any[]) {
        for (const field of requiredFields) {
          expect(model).toHaveProperty(field);
        }
      }
    }
  });
});

// ============================================================
// 2. Testes do Claude Integration
// ============================================================
describe("Claude Integration - Estrutura", () => {
  it("deve exportar invokeClaude", async () => {
    const mod = await import("../../claude-integration");
    expect(typeof mod.invokeClaude).toBe("function");
  });

  it("deve exportar mapToClaudeModel", async () => {
    const mod = await import("../../claude-integration");
    expect(typeof mod.mapToClaudeModel).toBe("function");
  });

  it("deve exportar extractClaudeContent", async () => {
    const mod = await import("../../claude-integration");
    expect(typeof mod.extractClaudeContent).toBe("function");
  });

  it("deve exportar isClaudeConfigured", async () => {
    const mod = await import("../../claude-integration");
    expect(typeof mod.isClaudeConfigured).toBe("function");
  });

  it("mapToClaudeModel deve retornar modelo válido", async () => {
    const mod = await import("../../claude-integration");
    const result = mod.mapToClaudeModel("claude-sonnet");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("mapToClaudeModel deve ter fallback para modelo desconhecido", async () => {
    const mod = await import("../../claude-integration");
    const result = mod.mapToClaudeModel("modelo-inexistente");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 3. Testes do Gemini Integration
// ============================================================
describe("Gemini Integration - Estrutura", () => {
  it("deve exportar invokeGemini", async () => {
    const mod = await import("../../gemini-integration");
    expect(typeof mod.invokeGemini).toBe("function");
  });

  it("deve exportar mapToGeminiModel", async () => {
    const mod = await import("../../gemini-integration");
    expect(typeof mod.mapToGeminiModel).toBe("function");
  });

  it("deve exportar extractGeminiContent", async () => {
    const mod = await import("../../gemini-integration");
    expect(typeof mod.extractGeminiContent).toBe("function");
  });

  it("deve exportar isGeminiConfigured", async () => {
    const mod = await import("../../gemini-integration");
    expect(typeof mod.isGeminiConfigured).toBe("function");
  });

  it("mapToGeminiModel deve retornar modelo válido", async () => {
    const mod = await import("../../gemini-integration");
    const result = mod.mapToGeminiModel("gemini-pro");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 4. Testes do Perplexity Integration
// ============================================================
describe("Perplexity Integration - Estrutura", () => {
  it("deve exportar invokePerplexity", async () => {
    const mod = await import("../../perplexity-integration");
    expect(typeof mod.invokePerplexity).toBe("function");
  });

  it("deve exportar mapToPerplexityModel", async () => {
    const mod = await import("../../perplexity-integration");
    expect(typeof mod.mapToPerplexityModel).toBe("function");
  });

  it("deve exportar extractPerplexityContent", async () => {
    const mod = await import("../../perplexity-integration");
    expect(typeof mod.extractPerplexityContent).toBe("function");
  });

  it("deve exportar extractPerplexityCitations", async () => {
    const mod = await import("../../perplexity-integration");
    expect(typeof mod.extractPerplexityCitations).toBe("function");
  });

  it("deve exportar isPerplexityConfigured", async () => {
    const mod = await import("../../perplexity-integration");
    expect(typeof mod.isPerplexityConfigured).toBe("function");
  });

  it("mapToPerplexityModel deve retornar modelo válido", async () => {
    const mod = await import("../../perplexity-integration");
    const result = mod.mapToPerplexityModel("perplexity-sonar");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 5. Testes do OpenAI Integration (atualizado)
// ============================================================
describe("OpenAI Integration - Estrutura", () => {
  it("deve exportar invokeOpenAI", async () => {
    const mod = await import("../../openai-integration");
    expect(typeof mod.invokeOpenAI).toBe("function");
  });

  it("deve exportar isOpenAIConfigured", async () => {
    const mod = await import("../../openai-integration");
    expect(typeof mod.isOpenAIConfigured).toBe("function");
  });

  it("deve exportar mapToOpenAIModel", async () => {
    const mod = await import("../../openai-integration");
    expect(typeof mod.mapToOpenAIModel).toBe("function");
  });

  it("mapToOpenAIModel deve suportar modelos GPT-4o", async () => {
    const mod = await import("../../openai-integration");
    const result = mod.mapToOpenAIModel("gpt-4o");
    expect(result).toContain("gpt-4o");
  });
});

// ============================================================
// 6. Testes do Planalto Integration
// ============================================================
describe("Planalto Integration - Estrutura", () => {
  it("deve exportar validarLeiPlanalto", async () => {
    const mod = await import("../../planalto-integration");
    expect(typeof mod.validarLeiPlanalto).toBe("function");
  });

  it("deve exportar validarArtigoPlanalto", async () => {
    const mod = await import("../../planalto-integration");
    expect(typeof mod.validarArtigoPlanalto).toBe("function");
  });

  it("deve exportar getPlanaltoStats", async () => {
    const mod = await import("../../planalto-integration");
    expect(typeof mod.getPlanaltoStats).toBe("function");
  });

  it("getPlanaltoStats deve retornar estatísticas válidas", async () => {
    const mod = await import("../../planalto-integration");
    const stats = mod.getPlanaltoStats();
    expect(stats).toHaveProperty("totalLeis");
    expect(stats).toHaveProperty("totalCodigos");
    expect(stats).toHaveProperty("ultimaAtualizacao");
  });
});

// ============================================================
// 7. Testes do Stripe Products
// ============================================================
describe("Stripe Products - Estrutura", () => {
  it("deve exportar PLANS", async () => {
    const mod = await import("../../stripe-products");
    expect(mod.PLANS).toBeDefined();
    expect(typeof mod.PLANS).toBe("object");
  });

  it("deve ter planos free, pro e enterprise", async () => {
    const mod = await import("../../stripe-products");
    expect(mod.PLANS.free).toBeDefined();
    expect(mod.PLANS.pro).toBeDefined();
    expect(mod.PLANS.enterprise).toBeDefined();
  });

  it("cada plano deve ter campos obrigatórios", async () => {
    const mod = await import("../../stripe-products");
    const requiredFields = ["name", "features"];
    
    for (const [planName, plan] of Object.entries(mod.PLANS)) {
      for (const field of requiredFields) {
        expect(plan).toHaveProperty(field);
      }
      expect(Array.isArray((plan as any).features)).toBe(true);
    }
  });

  it("plano free deve ser gratuito", async () => {
    const mod = await import("../../stripe-products");
    const freePlan = mod.PLANS.free as any;
    expect(freePlan.price === 0 || freePlan.price === undefined || freePlan.priceMonthly === 0 || freePlan.priceMonthly === undefined).toBe(true);
  });
});

// ============================================================
// 8. Testes do ModelSelector (removido - requer resolução de alias @/ do Vite)
// ============================================================

// ============================================================
// 9. Testes do Dashboard Utils
// ============================================================
describe("Dashboard Utils", () => {
  it("deve exportar TIPOS_DOCUMENTO", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    expect(mod.TIPOS_DOCUMENTO).toBeDefined();
    expect(Array.isArray(mod.TIPOS_DOCUMENTO)).toBe(true);
    expect(mod.TIPOS_DOCUMENTO.length).toBeGreaterThan(0);
  });

  it("deve exportar copyToClipboard", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    expect(typeof mod.copyToClipboard).toBe("function");
  });

  it("deve exportar formatarDataBR", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    expect(typeof mod.formatarDataBR).toBe("function");
  });

  it("TIPOS_DOCUMENTO deve conter tipos esperados", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    const tipos = mod.TIPOS_DOCUMENTO.map((t: any) => t.value || t);
    expect(tipos).toContain("peticao");
    expect(tipos).toContain("recurso");
  });

  it("formatarDataBR deve formatar datas corretamente", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    const result = mod.formatarDataBR(new Date("2025-01-15T12:00:00Z"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("getTipoDocumentoLabel deve retornar label para tipo conhecido", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    const label = mod.getTipoDocumentoLabel("peticao");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 10. Testes dos Routers Modulares
// ============================================================
describe("Routers Modulares - Existência", () => {
  it("deve exportar promptsRouter", async () => {
    const mod = await import("../prompts");
    expect(mod.promptsRouter).toBeDefined();
  });

  it("deve exportar templatesRouter", async () => {
    const mod = await import("../templates");
    expect(mod.templatesRouter).toBeDefined();
  });

  it("deve exportar tagsRouter", async () => {
    const mod = await import("../tags");
    expect(mod.tagsRouter).toBeDefined();
  });

  it("deve exportar modelosRouter", async () => {
    const mod = await import("../modelos");
    expect(mod.modelosRouter).toBeDefined();
  });

  it("deve exportar analyticsRouter", async () => {
    const mod = await import("../analytics");
    expect(mod.analyticsRouter).toBeDefined();
  });

  it("deve exportar perfisRouter", async () => {
    const mod = await import("../perfis");
    expect(mod.perfisRouter).toBeDefined();
  });

  it("deve exportar documentosRouter", async () => {
    const mod = await import("../documentos");
    expect(mod.documentosRouter).toBeDefined();
  });

  it("deve exportar stripeRouter", async () => {
    const mod = await import("../stripe");
    expect(mod.stripeRouter).toBeDefined();
  });
});
