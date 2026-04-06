/**
 * Testes para o módulo de sugestões automáticas de prompts jurídicos.
 * Verifica a geração de system prompts e user prompts por estratégia.
 */
import { describe, it, expect } from "vitest";
import {
  gerarSystemPromptSugestao,
  gerarUserPromptSugestao,
  ESTRATEGIAS_INFO,
  TOTAL_ETAPAS,
  type EstrategiaPrompt,
  type ContextoWizard,
} from "../sugestoes-prompts";

describe("sugestoes-prompts", () => {
  // ─── ESTRATEGIAS_INFO ──────────────────────────────────────────────────────

  describe("ESTRATEGIAS_INFO", () => {
    it("deve ter as 3 estratégias definidas", () => {
      expect(ESTRATEGIAS_INFO).toHaveProperty("direta");
      expect(ESTRATEGIAS_INFO).toHaveProperty("raciocinio");
      expect(ESTRATEGIAS_INFO).toHaveProperty("recuperacao");
    });

    it("cada estratégia deve ter os campos obrigatórios", () => {
      const estrategias: EstrategiaPrompt[] = ["direta", "raciocinio", "recuperacao"];
      for (const e of estrategias) {
        const info = ESTRATEGIAS_INFO[e];
        expect(info.estrategia).toBe(e);
        expect(info.titulo).toBeTruthy();
        expect(info.descricao).toBeTruthy();
        expect(info.icone).toBeTruthy();
        expect(info.cor).toBeTruthy();
      }
    });
  });

  // ─── TOTAL_ETAPAS ──────────────────────────────────────────────────────────

  it("TOTAL_ETAPAS deve ser 6", () => {
    expect(TOTAL_ETAPAS).toBe(6);
  });

  // ─── gerarSystemPromptSugestao ─────────────────────────────────────────────

  describe("gerarSystemPromptSugestao", () => {
    it("deve retornar string não vazia para estratégia direta", () => {
      const prompt = gerarSystemPromptSugestao("direta");
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(100);
    });

    it("deve retornar string não vazia para estratégia raciocinio", () => {
      const prompt = gerarSystemPromptSugestao("raciocinio");
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(100);
    });

    it("deve retornar string não vazia para estratégia recuperacao", () => {
      const prompt = gerarSystemPromptSugestao("recuperacao");
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(100);
    });

    it("cada estratégia deve gerar um prompt diferente", () => {
      const direta = gerarSystemPromptSugestao("direta");
      const raciocinio = gerarSystemPromptSugestao("raciocinio");
      const recuperacao = gerarSystemPromptSugestao("recuperacao");
      expect(direta).not.toBe(raciocinio);
      expect(direta).not.toBe(recuperacao);
      expect(raciocinio).not.toBe(recuperacao);
    });

    it("prompt direta deve mencionar objetividade", () => {
      const prompt = gerarSystemPromptSugestao("direta");
      expect(prompt.toLowerCase()).toMatch(/diret|objetiv|concis/);
    });

    it("prompt raciocinio deve mencionar cadeia de pensamento", () => {
      const prompt = gerarSystemPromptSugestao("raciocinio");
      expect(prompt.toLowerCase()).toMatch(/racioc|passo|chain|cot/);
    });

    it("prompt recuperacao deve mencionar fontes ou jurisprudência", () => {
      const prompt = gerarSystemPromptSugestao("recuperacao");
      expect(prompt.toLowerCase()).toMatch(/fonte|jurisprud|stf|stj|legisla/);
    });

    it("todos os prompts devem incluir a restrição de não inventar jurisprudência", () => {
      const estrategias: EstrategiaPrompt[] = ["direta", "raciocinio", "recuperacao"];
      for (const e of estrategias) {
        const prompt = gerarSystemPromptSugestao(e);
        expect(prompt.toLowerCase()).toMatch(/invent|fabri|nunca/);
      }
    });
  });

  // ─── gerarUserPromptSugestao ───────────────────────────────────────────────

  describe("gerarUserPromptSugestao", () => {
    const contextoCompleto: ContextoWizard = {
      areaJuridica: "Direito Civil",
      tipoDocumento: "Petição Inicial",
      contextoAcumulado: {
        etapa_2_resposta: "Autor: João Silva. Réu: Empresa XYZ.",
        etapa_3_resposta: "Indenização por danos morais e materiais.",
        etapa_4_resposta: "Contrato assinado, notas fiscais.",
        etapa_5_resposta: "Formal, técnico.",
      },
      promptGerado: "Elabore uma petição inicial...",
    };

    it("deve incluir a área jurídica no prompt", () => {
      const prompt = gerarUserPromptSugestao(contextoCompleto);
      expect(prompt).toContain("Direito Civil");
    });

    it("deve incluir o tipo de documento no prompt", () => {
      const prompt = gerarUserPromptSugestao(contextoCompleto);
      expect(prompt).toContain("Petição Inicial");
    });

    it("deve incluir o contexto acumulado das etapas", () => {
      const prompt = gerarUserPromptSugestao(contextoCompleto);
      expect(prompt).toContain("João Silva");
      expect(prompt).toContain("danos morais");
    });

    it("deve incluir o prompt base gerado pelo wizard", () => {
      const prompt = gerarUserPromptSugestao(contextoCompleto);
      expect(prompt).toContain("petição inicial");
    });

    it("deve funcionar com contexto mínimo (apenas área jurídica)", () => {
      const contextoMinimo: ContextoWizard = {
        areaJuridica: "Direito Penal",
      };
      const prompt = gerarUserPromptSugestao(contextoMinimo);
      expect(prompt).toContain("Direito Penal");
      expect(typeof prompt).toBe("string");
    });

    it("deve funcionar com contexto vazio", () => {
      const contextoVazio: ContextoWizard = {};
      const prompt = gerarUserPromptSugestao(contextoVazio);
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(10);
    });

    it("deve incluir instrução de geração de prompt", () => {
      const prompt = gerarUserPromptSugestao(contextoCompleto);
      expect(prompt.toLowerCase()).toMatch(/gere|elabore|crie|prompt/);
    });
  });
});
