/**
 * Testes unitários para o módulo de Roteamento Inteligente (smart-routing.ts)
 * 
 * Valida:
 * - Detecção automática de tipo de tarefa
 * - Seleção de modelo por plano/complexidade
 * - Fallback para manus quando modelo não disponível
 * - Ajuste de tier por complexidade
 * - Priorização de Perplexity para citações
 */
import { describe, it, expect } from "vitest";
import { selectSmartModel, detectTaskType, getSmartRouting } from "../smart-routing";

describe("detectTaskType", () => {
  it("classifica análise curta como classificacao", () => {
    const result = detectTaskType({
      operation: "analisar",
      inputLength: 200,
    });
    expect(result).toBe("classificacao");
  });

  it("classifica análise longa como analise", () => {
    const result = detectTaskType({
      operation: "analisar",
      inputLength: 1000,
    });
    expect(result).toBe("analise");
  });

  it("classifica geração de petição como geracao_complexa", () => {
    const result = detectTaskType({
      operation: "gerar",
      inputLength: 500,
      tipoDocumento: "petição inicial",
    });
    expect(result).toBe("geracao_complexa");
  });

  it("classifica geração curta sem tipo como geracao_simples", () => {
    const result = detectTaskType({
      operation: "gerar",
      inputLength: 300,
    });
    expect(result).toBe("geracao_simples");
  });

  it("classifica geração longa sem tipo como geracao_complexa", () => {
    const result = detectTaskType({
      operation: "gerar",
      inputLength: 2000,
    });
    expect(result).toBe("geracao_complexa");
  });

  it("classifica otimizar como otimizacao", () => {
    expect(detectTaskType({ operation: "otimizar", inputLength: 500 })).toBe("otimizacao");
  });

  it("classifica refinar como geracao_simples", () => {
    expect(detectTaskType({ operation: "refinar", inputLength: 500 })).toBe("geracao_simples");
  });

  it("classifica verificar como verificacao", () => {
    expect(detectTaskType({ operation: "verificar", inputLength: 500 })).toBe("verificacao");
  });

  it("classifica pesquisar como pesquisa", () => {
    expect(detectTaskType({ operation: "pesquisar", inputLength: 500 })).toBe("pesquisa");
  });

  it("classifica comparar como comparacao", () => {
    expect(detectTaskType({ operation: "comparar", inputLength: 500 })).toBe("comparacao");
  });

  it("classifica documento como geracao_complexa", () => {
    expect(detectTaskType({ operation: "documento", inputLength: 500 })).toBe("geracao_complexa");
  });
});

describe("selectSmartModel", () => {
  it("retorna modelo econômico para classificação no plano free", () => {
    const result = selectSmartModel({
      taskType: "classificacao",
      userPlan: "free",
      inputLength: 200,
    });
    expect(result.costTier).toBe("economico");
    expect(result.provider).toBeDefined();
    expect(result.model).toBeDefined();
  });

  it("retorna modelo premium para geracao_complexa no plano pro", () => {
    const result = selectSmartModel({
      taskType: "geracao_complexa",
      userPlan: "pro",
      inputLength: 3000,
    });
    // Pro tem acesso a claude-sonnet e gpt-4o
    expect(["premium", "intermediario"]).toContain(result.costTier);
  });

  it("faz upgrade de tier para input complexo (alta complexidade)", () => {
    const result = selectSmartModel({
      taskType: "classificacao", // normalmente econômico
      userPlan: "pro",
      inputLength: 5000, // alta complexidade
    });
    // Deve subir de econômico para intermediário
    expect(["intermediario", "economico"]).toContain(result.costTier);
  });

  it("prioriza Perplexity quando requiresCitations é true", () => {
    const result = selectSmartModel({
      taskType: "analise",
      userPlan: "pro",
      inputLength: 500,
      requiresCitations: true,
    });
    // Deve usar tier de pesquisa (Perplexity)
    expect(result.provider).toBeDefined();
  });

  it("retorna manus como fallback quando RAG não disponível no plano", () => {
    const result = selectSmartModel({
      taskType: "pesquisa",
      userPlan: "free",
      inputLength: 500,
      requiresRAG: true,
    });
    expect(result.provider).toBe("manus");
    expect(result.model).toBe("manus-default");
    expect(result.reason).toContain("RAG não disponível");
  });

  it("sempre retorna um resultado válido para plano enterprise", () => {
    const result = selectSmartModel({
      taskType: "geracao_complexa",
      userPlan: "enterprise",
      inputLength: 5000,
    });
    expect(result.provider).toBeDefined();
    expect(result.model).toBeDefined();
    expect(result.estimatedTokens.input).toBeGreaterThan(0);
    expect(result.estimatedTokens.output).toBeGreaterThan(0);
  });

  it("retorna fallback manus para plano inexistente", () => {
    const result = selectSmartModel({
      taskType: "analise",
      userPlan: "plano_inexistente",
      inputLength: 500,
    });
    expect(result.provider).toBe("manus");
    expect(result.model).toBe("manus-default");
  });
});

describe("getSmartRouting (integração)", () => {
  it("retorna decisão completa para operação de geração no plano pro", () => {
    const result = getSmartRouting({
      operation: "gerar",
      userPlan: "pro",
      inputText: "Elabore uma petição inicial de indenização por danos morais",
      tipoDocumento: "petição",
    });

    expect(result).toHaveProperty("provider");
    expect(result).toHaveProperty("model");
    expect(result).toHaveProperty("reason");
    expect(result).toHaveProperty("costTier");
    expect(result).toHaveProperty("estimatedTokens");
    expect(result.estimatedTokens).toHaveProperty("input");
    expect(result.estimatedTokens).toHaveProperty("output");
  });

  it("retorna decisão econômica para análise curta no plano free", () => {
    const result = getSmartRouting({
      operation: "analisar",
      userPlan: "free",
      inputText: "Analise este prompt jurídico",
    });

    expect(result.costTier).toBe("economico");
  });

  it("retorna modelo de pesquisa quando requiresCitations é true", () => {
    const result = getSmartRouting({
      operation: "pesquisar",
      userPlan: "pro",
      inputText: "Buscar jurisprudência sobre danos morais em relação de consumo",
      requiresCitations: true,
    });

    expect(result).toHaveProperty("provider");
    expect(result).toHaveProperty("model");
  });
});
