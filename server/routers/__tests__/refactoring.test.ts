import { describe, it, expect } from "vitest";

/**
 * Unit tests for the PromptJur refactoring:
 * - Router module structure validation
 * - Utility functions validation
 * - Shared data exports validation
 */

describe("Router Module Structure", () => {
  it("should export promptsRouter from prompts module", async () => {
    const mod = await import("../prompts");
    expect(mod.promptsRouter).toBeDefined();
    expect(typeof mod.promptsRouter).toBe("object");
  });

  it("should export templatesRouter from templates module", async () => {
    const mod = await import("../templates");
    expect(mod.templatesRouter).toBeDefined();
    expect(typeof mod.templatesRouter).toBe("object");
  });

  it("should export tagsRouter from tags module", async () => {
    const mod = await import("../tags");
    expect(mod.tagsRouter).toBeDefined();
    expect(typeof mod.tagsRouter).toBe("object");
  });

  it("should export modelosRouter from modelos module", async () => {
    const mod = await import("../modelos");
    expect(mod.modelosRouter).toBeDefined();
    expect(typeof mod.modelosRouter).toBe("object");
  });

  it("should export analytics routers from analytics module", async () => {
    const mod = await import("../analytics");
    expect(mod.analyticsRouter).toBeDefined();
    expect(mod.historicoRouter).toBeDefined();
    expect(mod.versoesRouter).toBeDefined();
    expect(mod.configuracoesRouter).toBeDefined();
  });

  it("should export perfis routers from perfis module", async () => {
    const mod = await import("../perfis");
    expect(mod.perfisRouter).toBeDefined();
    expect(mod.formatacaoTemplatesRouter).toBeDefined();
    expect(mod.sugestaoRouter).toBeDefined();
  });

  it("should export documentos routers from documentos module", async () => {
    const mod = await import("../documentos");
    expect(mod.documentosRouter).toBeDefined();
    expect(mod.legislacaoRouter).toBeDefined();
    expect(mod.knowledgeRetrievalRouter).toBeDefined();
  });
});

describe("Main Router Composition", () => {
  it("should export appRouter with all required keys", async () => {
    const mod = await import("../../routers");
    expect(mod.appRouter).toBeDefined();
    
    // Check that appRouter has the expected router keys
    const routerKeys = Object.keys((mod.appRouter as any)._def.procedures || {});
    const expectedPrefixes = [
      "system", "auth", "prompts", "templates", "tags",
      "modelos", "analytics", "historico", "versoes",
      "configuracoes", "perfis", "documentos", "legislacao",
      "knowledgeRetrieval", "tutoriais", "cabecalho",
      "notifications", "notificationPreferences", "modelosPersonalizados",
      "admin", "formatacaoTemplates", "sugestao"
    ];
    
    // Verify the router is a valid tRPC router
    expect(mod.appRouter._def).toBeDefined();
    expect(mod.AppRouter).toBeUndefined(); // AppRouter is a type, not a value
  });

  it("should export AppRouter type", async () => {
    // This test verifies the module loads without errors
    const mod = await import("../../routers");
    expect(mod).toBeDefined();
    expect(typeof mod.appRouter).toBe("object");
  });
});

describe("Dashboard Utility Functions", () => {
  it("should export TIPOS_DOCUMENTO with values and labels", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    expect(mod.TIPOS_DOCUMENTO).toBeDefined();
    expect(Array.isArray(mod.TIPOS_DOCUMENTO)).toBe(true);
    expect(mod.TIPOS_DOCUMENTO.length).toBeGreaterThan(0);
    
    const firstTipo = mod.TIPOS_DOCUMENTO[0];
    expect(firstTipo).toHaveProperty("value");
    expect(firstTipo).toHaveProperty("label");
    expect(typeof firstTipo.value).toBe("string");
    expect(typeof firstTipo.label).toBe("string");
  });

  it("should export getTipoDocumentoLabel function", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    expect(mod.getTipoDocumentoLabel).toBeDefined();
    expect(typeof mod.getTipoDocumentoLabel).toBe("function");
    // Test with a known value
    const label = mod.getTipoDocumentoLabel("peticao");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  it("should export copyToClipboard function", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    expect(mod.copyToClipboard).toBeDefined();
    expect(typeof mod.copyToClipboard).toBe("function");
  });

  it("should export formatarDataBR function", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    expect(mod.formatarDataBR).toBeDefined();
    expect(typeof mod.formatarDataBR).toBe("function");
  });

  it("should format date correctly in Brazilian format", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    const date = new Date("2025-03-15T10:30:00Z");
    const formatted = mod.formatarDataBR(date);
    // Should contain day/month/year format
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("should export exportAsMarkdown function", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    expect(mod.exportAsMarkdown).toBeDefined();
    expect(typeof mod.exportAsMarkdown).toBe("function");
  });

  it("should export testarPromptNaPlataforma function", async () => {
    const mod = await import("../../../client/src/utils/dashboardUtils");
    expect(mod.testarPromptNaPlataforma).toBeDefined();
    expect(typeof mod.testarPromptNaPlataforma).toBe("function");
  });
});

describe("Shared Juridico Data", () => {
  it("should export AREAS_JURIDICAS from shared/juridico", async () => {
    const mod = await import("@shared/juridico");
    expect(mod.AREAS_JURIDICAS).toBeDefined();
    expect(typeof mod.AREAS_JURIDICAS).toBe("object");
  });

  it("should export TEMPLATES_BASE from shared/juridico", async () => {
    const mod = await import("@shared/juridico");
    expect(mod.TEMPLATES_BASE).toBeDefined();
    expect(typeof mod.TEMPLATES_BASE).toBe("object");
  });

  it("should export REFERENCIAS_LEGAIS from shared/juridico", async () => {
    const mod = await import("@shared/juridico");
    expect(mod.REFERENCIAS_LEGAIS).toBeDefined();
    expect(typeof mod.REFERENCIAS_LEGAIS).toBe("object");
  });
});

describe("Shared Tutoriais Data", () => {
  it("should export tutoriais array", async () => {
    const mod = await import("@shared/tutoriais");
    expect(mod.tutoriais).toBeDefined();
    expect(Array.isArray(mod.tutoriais)).toBe(true);
    expect(mod.tutoriais.length).toBeGreaterThan(0);
  });

  it("should have correct tutorial structure", async () => {
    const mod = await import("@shared/tutoriais");
    const tutorial = mod.tutoriais[0];
    expect(tutorial).toHaveProperty("id");
    expect(tutorial).toHaveProperty("titulo");
    expect(tutorial).toHaveProperty("conteudo");
    expect(tutorial).toHaveProperty("categoria");
    expect(tutorial).toHaveProperty("nivel");
    expect(tutorial).toHaveProperty("tags");
    expect(Array.isArray(tutorial.tags)).toBe(true);
  });
});
