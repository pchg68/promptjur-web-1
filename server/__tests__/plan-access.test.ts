import { describe, it, expect } from "vitest";
import {
  canAccessModel,
  getRequiredPlan,
  getModelsForPlan,
  getModelAccessInfo,
  getAccessDeniedMessage,
  MODEL_PLAN_REQUIREMENTS,
} from "../plan-access";

describe("Plan Access Control", () => {
  describe("canAccessModel", () => {
    it("plano free deve acessar modelos gratuitos", () => {
      expect(canAccessModel("free", "manus-default")).toBe(true);
      expect(canAccessModel("free", "gpt-4o-mini")).toBe(true);
    });

    it("plano free NÃO deve acessar modelos pro", () => {
      expect(canAccessModel("free", "gpt-4o")).toBe(false);
      expect(canAccessModel("free", "claude-sonnet")).toBe(false);
      expect(canAccessModel("free", "gemini-pro")).toBe(false);
      expect(canAccessModel("free", "perplexity-sonar")).toBe(false);
    });

    it("plano free NÃO deve acessar modelos enterprise", () => {
      expect(canAccessModel("free", "o1")).toBe(false);
      expect(canAccessModel("free", "claude-opus")).toBe(false);
      expect(canAccessModel("free", "sonar-pro")).toBe(false);
    });

    it("plano pro deve acessar modelos gratuitos e pro", () => {
      expect(canAccessModel("pro", "manus-default")).toBe(true);
      expect(canAccessModel("pro", "gpt-4o-mini")).toBe(true);
      expect(canAccessModel("pro", "gpt-4o")).toBe(true);
      expect(canAccessModel("pro", "claude-sonnet")).toBe(true);
      expect(canAccessModel("pro", "gemini-pro")).toBe(true);
    });

    it("plano pro NÃO deve acessar modelos enterprise", () => {
      expect(canAccessModel("pro", "o1")).toBe(false);
      expect(canAccessModel("pro", "claude-opus")).toBe(false);
      expect(canAccessModel("pro", "sonar-pro")).toBe(false);
    });

    it("plano enterprise deve acessar TODOS os modelos", () => {
      for (const modelId of Object.keys(MODEL_PLAN_REQUIREMENTS)) {
        expect(canAccessModel("enterprise", modelId)).toBe(true);
      }
    });

    it("modelo desconhecido deve ser tratado como free", () => {
      expect(canAccessModel("free", "modelo-inexistente")).toBe(true);
    });
  });

  describe("getRequiredPlan", () => {
    it("deve retornar free para modelos gratuitos", () => {
      expect(getRequiredPlan("manus-default")).toBe("free");
      expect(getRequiredPlan("gpt-4o-mini")).toBe("free");
    });

    it("deve retornar pro para modelos profissionais", () => {
      expect(getRequiredPlan("gpt-4o")).toBe("pro");
      expect(getRequiredPlan("claude-sonnet")).toBe("pro");
      expect(getRequiredPlan("gemini-pro")).toBe("pro");
    });

    it("deve retornar enterprise para modelos premium", () => {
      expect(getRequiredPlan("o1")).toBe("enterprise");
      expect(getRequiredPlan("claude-opus")).toBe("enterprise");
      expect(getRequiredPlan("sonar-pro")).toBe("enterprise");
    });
  });

  describe("getModelsForPlan", () => {
    it("plano free deve ter apenas 2 modelos", () => {
      const models = getModelsForPlan("free");
      expect(models).toContain("manus-default");
      expect(models).toContain("gpt-4o-mini");
      expect(models.length).toBe(2);
    });

    it("plano pro deve ter mais modelos que free", () => {
      const freeModels = getModelsForPlan("free");
      const proModels = getModelsForPlan("pro");
      expect(proModels.length).toBeGreaterThan(freeModels.length);
    });

    it("plano enterprise deve ter todos os modelos", () => {
      const enterpriseModels = getModelsForPlan("enterprise");
      expect(enterpriseModels.length).toBe(Object.keys(MODEL_PLAN_REQUIREMENTS).length);
    });
  });

  describe("getModelAccessInfo", () => {
    it("deve retornar informações de acesso para todos os modelos", () => {
      const info = getModelAccessInfo("free");
      expect(info.length).toBe(Object.keys(MODEL_PLAN_REQUIREMENTS).length);
      
      for (const item of info) {
        expect(item).toHaveProperty("modelId");
        expect(item).toHaveProperty("requiredPlan");
        expect(item).toHaveProperty("hasAccess");
        expect(item).toHaveProperty("planLabel");
      }
    });

    it("plano free deve ter acesso limitado", () => {
      const info = getModelAccessInfo("free");
      const accessible = info.filter(i => i.hasAccess);
      const blocked = info.filter(i => !i.hasAccess);
      expect(accessible.length).toBe(2);
      expect(blocked.length).toBeGreaterThan(0);
    });
  });

  describe("getAccessDeniedMessage", () => {
    it("deve gerar mensagem de erro para modelo bloqueado", () => {
      const msg = getAccessDeniedMessage("claude-opus", "free");
      expect(msg).toContain("claude-opus");
      expect(msg).toContain("Escritório");
      expect(msg).toContain("Gratuito");
    });

    it("deve incluir preço do plano necessário", () => {
      const msg = getAccessDeniedMessage("gpt-4o", "free");
      expect(msg).toContain("R$");
    });
  });
});

describe("Voice Router - Structure", () => {
  it("voice router module should export voiceRouter", async () => {
    const mod = await import("../routers/voice");
    expect(mod.voiceRouter).toBeDefined();
  });
});

describe("Provider Health Router - Structure", () => {
  it("provider health router module should export providerHealthRouter", async () => {
    const mod = await import("../routers/provider-health");
    expect(mod.providerHealthRouter).toBeDefined();
  });
});
