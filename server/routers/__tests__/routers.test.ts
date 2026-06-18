import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const routersDir = resolve(import.meta.dirname, "..");
const serverDir = resolve(import.meta.dirname, "../..");
const clientDir = resolve(import.meta.dirname, "../../../client/src");

describe("Router Modules - File Structure", () => {
  it("should have all router module files", () => {
    const expectedFiles = [
      "prompts.ts",
      "templates.ts",
      "tags.ts",
      "modelos.ts",
      "analytics.ts",
      "perfis.ts",
      "documentos.ts",
    ];
    for (const file of expectedFiles) {
      expect(existsSync(resolve(routersDir, file)), `Missing: ${file}`).toBe(true);
    }
  });

  it("should have the main routers.ts hub file", () => {
    expect(existsSync(resolve(serverDir, "routers.ts"))).toBe(true);
  });

  it("should have all refactored component files", () => {
    const expectedComponents = [
      "DashboardHeader2.tsx",
      "DashboardMetrics.tsx",
      "TabGerar.tsx",
      "PromptActions.tsx",
      "AIDisclaimer.tsx",
      "GenerationStepper.tsx",
      "PostGenerationGuide.tsx",
    ];
    for (const file of expectedComponents) {
      expect(existsSync(resolve(clientDir, "components", file)), `Missing: ${file}`).toBe(true);
    }
  });

  it("should have dashboardUtils utility file", () => {
    expect(existsSync(resolve(clientDir, "utils", "dashboardUtils.ts"))).toBe(true);
  });
});

describe("Router Modules - Content Validation", () => {
  it("prompts router should export all required procedures", () => {
    const content = readFileSync(resolve(routersDir, "prompts.ts"), "utf-8");
    expect(content).toContain("export const promptsRouter");
    const procedures = ["analisar:", "gerar:", "otimizar:", "stats:", "toggleFavorito:", "listarFavoritos:", "exportarDocx:", "exportarPdf:", "loadPrompt:"];
    for (const p of procedures) {
      expect(content).toContain(p);
    }
  });

  it("templates router should export all required procedures", () => {
    const content = readFileSync(resolve(routersDir, "templates.ts"), "utf-8");
    expect(content).toContain("export const templatesRouter");
    for (const p of ["meus:", "salvar:", "atualizar:", "deletar:"]) {
      expect(content).toContain(p);
    }
  });

  it("tags router should export all required procedures", () => {
    const content = readFileSync(resolve(routersDir, "tags.ts"), "utf-8");
    expect(content).toContain("export const tagsRouter");
    for (const p of ["minhas:", "criar:", "deletar:", "atualizar:", "atribuirPrompt:", "atribuirTemplate:"]) {
      expect(content).toContain(p);
    }
  });

  it("modelos router should export all required procedures", () => {
    const content = readFileSync(resolve(routersDir, "modelos.ts"), "utf-8");
    expect(content).toContain("export const modelosRouter");
    for (const p of ["listar:", "maisUsados:", "registrarUso:"]) {
      expect(content).toContain(p);
    }
  });

  it("analytics module should export all routers", () => {
    const content = readFileSync(resolve(routersDir, "analytics.ts"), "utf-8");
    for (const r of ["analyticsRouter", "historicoRouter", "versoesRouter", "configuracoesRouter"]) {
      expect(content).toContain(`export const ${r}`);
    }
  });

  it("perfis module should export all routers", () => {
    const content = readFileSync(resolve(routersDir, "perfis.ts"), "utf-8");
    for (const r of ["perfisRouter", "formatacaoTemplatesRouter", "sugestaoRouter"]) {
      expect(content).toContain(`export const ${r}`);
    }
  });

  it("documentos module should export all routers", () => {
    const content = readFileSync(resolve(routersDir, "documentos.ts"), "utf-8");
    for (const r of ["documentosRouter", "legislacaoRouter", "knowledgeRetrievalRouter"]) {
      expect(content).toContain(`export const ${r}`);
    }
  });

  it("main routers.ts should import and compose all sub-routers", () => {
    const content = readFileSync(resolve(serverDir, "routers.ts"), "utf-8");
    const keys = [
      "prompts:", "templates:", "tags:", "modelos:",
      "analytics:", "historico:", "versoes:", "configuracoes:",
      "perfis:", "formatacaoTemplates:", "sugestao:",
      "documentos:", "legislacao:", "knowledgeRetrieval:",
      "auth:", "system:",
    ];
    for (const key of keys) {
      expect(content).toContain(key);
    }
  });
});

describe("Component Refactoring - Content Validation", () => {
  it("TabGerar should have guided result view and generation mutation", () => {
    const content = readFileSync(resolve(clientDir, "components", "TabGerar.tsx"), "utf-8");
    expect(content).toContain("trpc.prompts.gerar");
    expect(content).toContain("Prompt gerado");
    expect(content).toContain("GenerationStepper");
    expect(content).toContain("PostGenerationGuide");
  });

  it("Dashboard should have analysis and optimization mutations (merged from 2B-2)", () => {
    const dashboardContent = readFileSync(resolve(clientDir, "pages", "Dashboard.tsx"), "utf-8");
    expect(dashboardContent).toContain("trpc.prompts.analisar");
    expect(dashboardContent).toContain("trpc.prompts.otimizar");
    // TabGerar receives callbacks (onAnalisar/onOtimizar) — mutations live in Dashboard
    const tabGerarContent = readFileSync(resolve(clientDir, "components", "TabGerar.tsx"), "utf-8");
    expect(tabGerarContent).toContain("onAnalisar");
    expect(tabGerarContent).toContain("onOtimizar");
  });

  it("AIDisclaimer should warn about source verification", () => {
    const content = readFileSync(resolve(clientDir, "components", "AIDisclaimer.tsx"), "utf-8");
    expect(content).toContain("revise");
  });

  it("PromptActions should have hierarchical action buttons", () => {
    const content = readFileSync(resolve(clientDir, "components", "PromptActions.tsx"), "utf-8");
    expect(content).toContain("Copiar");
    expect(content).toContain("DropdownMenu");
  });

  it("DashboardHeader should have persistent navigation with active indicator", () => {
    const content = readFileSync(resolve(clientDir, "components", "DashboardHeader2.tsx"), "utf-8");
    expect(content).toContain("Tutoriais");
  });

  it("Dashboard.tsx should import refactored generation components", () => {
    const content = readFileSync(resolve(clientDir, "pages", "Dashboard.tsx"), "utf-8");
    expect(content).toContain("TabGerar");
    expect(content).toContain("GenerationStepper");
    expect(content).toContain("PostGenerationGuide");
  });

  it("Dashboard.tsx should not have old Tutoriais tab", () => {
    const content = readFileSync(resolve(clientDir, "pages", "Dashboard.tsx"), "utf-8");
    expect(content).not.toContain("TabTutoriais");
    expect(content).not.toContain("trigger-tutoriais");
  });
});

describe("Home Page - Improvements", () => {
  it("should not have Ver Demonstracao button", () => {
    const content = readFileSync(resolve(clientDir, "pages", "Home.tsx"), "utf-8");
    expect(content).not.toContain("handleDemoClick");
  });
});
