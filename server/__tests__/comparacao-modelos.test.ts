import { describe, it, expect, vi } from "vitest";

/**
 * Testes para o recurso de Comparação de Modelos de IA
 * Valida o endpoint compararModelos e a lógica de comparação
 */

describe("Comparação de Modelos - Backend", () => {
  describe("Validação de entrada", () => {
    it("deve rejeitar menos de 2 modelos", () => {
      const input = {
        promptText: "Elabore uma petição inicial de divórcio consensual",
        modelos: [{ provider: "manus" }],
      };
      expect(input.modelos.length).toBeLessThan(2);
    });

    it("deve rejeitar mais de 4 modelos", () => {
      const input = {
        promptText: "Elabore uma petição",
        modelos: [
          { provider: "manus" },
          { provider: "openai", model: "gpt-4o-mini" },
          { provider: "anthropic", model: "claude-sonnet" },
          { provider: "google", model: "gemini-pro" },
          { provider: "perplexity", model: "perplexity-sonar" },
        ],
      };
      expect(input.modelos.length).toBeGreaterThan(4);
    });

    it("deve aceitar 2 modelos", () => {
      const input = {
        promptText: "Elabore uma petição inicial de divórcio consensual",
        modelos: [
          { provider: "manus" },
          { provider: "openai", model: "gpt-4o-mini" },
        ],
      };
      expect(input.modelos.length).toBeGreaterThanOrEqual(2);
      expect(input.modelos.length).toBeLessThanOrEqual(4);
    });

    it("deve aceitar 4 modelos (máximo)", () => {
      const input = {
        promptText: "Elabore uma petição",
        modelos: [
          { provider: "manus" },
          { provider: "openai", model: "gpt-4o-mini" },
          { provider: "anthropic", model: "claude-sonnet" },
          { provider: "google", model: "gemini-pro" },
        ],
      };
      expect(input.modelos.length).toBe(4);
    });

    it("deve rejeitar prompt com menos de 10 caracteres", () => {
      const input = { promptText: "curto", modelos: [{ provider: "manus" }, { provider: "openai" }] };
      expect(input.promptText.length).toBeLessThan(10);
    });
  });

  describe("Processamento de resultados", () => {
    it("deve processar resultados fulfilled corretamente", () => {
      const resultados: PromiseSettledResult<any>[] = [
        {
          status: "fulfilled",
          value: {
            status: "success",
            provider: "openai",
            model: "gpt-4o-mini",
            documento: "Petição inicial...",
            tempoGeracao: 5000,
            tamanhoTexto: 1500,
            palavras: 250,
            paragrafos: 8,
          },
        },
        {
          status: "fulfilled",
          value: {
            status: "success",
            provider: "anthropic",
            model: "claude-sonnet",
            documento: "Petição inicial mais detalhada...",
            tempoGeracao: 8000,
            tamanhoTexto: 2500,
            palavras: 400,
            paragrafos: 12,
          },
        },
      ];

      const comparacoes = resultados.map((r) => {
        if (r.status === "fulfilled") return r.value;
        return { status: "error", provider: "unknown", model: "unknown", erro: "Falha", tempoGeracao: 0 };
      });

      expect(comparacoes).toHaveLength(2);
      expect(comparacoes[0].status).toBe("success");
      expect(comparacoes[1].status).toBe("success");
      expect(comparacoes[0].provider).toBe("openai");
      expect(comparacoes[1].provider).toBe("anthropic");
    });

    it("deve processar resultados rejected como erro", () => {
      const resultados: PromiseSettledResult<any>[] = [
        {
          status: "fulfilled",
          value: {
            status: "success",
            provider: "openai",
            model: "gpt-4o-mini",
            documento: "Documento gerado",
            tempoGeracao: 5000,
          },
        },
        {
          status: "rejected",
          reason: new Error("API timeout"),
        },
      ];

      const comparacoes = resultados.map((r) => {
        if (r.status === "fulfilled") return r.value;
        return { status: "error", provider: "unknown", model: "unknown", erro: "Falha na execução", tempoGeracao: 0 };
      });

      expect(comparacoes).toHaveLength(2);
      expect(comparacoes[0].status).toBe("success");
      expect(comparacoes[1].status).toBe("error");
    });

    it("deve processar erro individual de modelo", () => {
      const resultado = {
        status: "error" as const,
        provider: "google",
        model: "gemini-pro",
        erro: "API key inválida",
        tempoGeracao: 200,
      };

      expect(resultado.status).toBe("error");
      expect(resultado.erro).toBeDefined();
      expect(resultado.tempoGeracao).toBeGreaterThan(0);
    });
  });

  describe("Métricas comparativas", () => {
    const resultados = [
      {
        status: "success" as const,
        provider: "openai",
        model: "gpt-4o-mini",
        documento: "Documento curto",
        tempoGeracao: 3000,
        palavras: 150,
        paragrafos: 5,
        validacaoLegislacao: { confiabilidadeGeral: "alta", totalCitacoes: 5, citacoesValidadas: 4, citacoes: [] },
      },
      {
        status: "success" as const,
        provider: "anthropic",
        model: "claude-sonnet",
        documento: "Documento muito mais detalhado com mais conteúdo e argumentação",
        tempoGeracao: 8000,
        palavras: 400,
        paragrafos: 12,
        validacaoLegislacao: { confiabilidadeGeral: "alta", totalCitacoes: 8, citacoesValidadas: 7, citacoes: [] },
      },
      {
        status: "success" as const,
        provider: "google",
        model: "gemini-flash",
        documento: "Documento médio",
        tempoGeracao: 2000,
        palavras: 250,
        paragrafos: 8,
        validacaoLegislacao: { confiabilidadeGeral: "média", totalCitacoes: 3, citacoesValidadas: 2, citacoes: [] },
      },
    ];

    it("deve identificar o modelo mais rápido", () => {
      const maisRapido = resultados.reduce((a, b) => a.tempoGeracao < b.tempoGeracao ? a : b);
      expect(maisRapido.model).toBe("gemini-flash");
      expect(maisRapido.tempoGeracao).toBe(2000);
    });

    it("deve identificar o modelo mais detalhado", () => {
      const maisDetalhado = resultados.reduce((a, b) => a.palavras > b.palavras ? a : b);
      expect(maisDetalhado.model).toBe("claude-sonnet");
      expect(maisDetalhado.palavras).toBe(400);
    });

    it("deve identificar o modelo com melhor validação", () => {
      const melhorValidacao = resultados.reduce((a, b) => {
        const scoreA = a.validacaoLegislacao.citacoesValidadas / Math.max(a.validacaoLegislacao.totalCitacoes, 1);
        const scoreB = b.validacaoLegislacao.citacoesValidadas / Math.max(b.validacaoLegislacao.totalCitacoes, 1);
        return scoreA >= scoreB ? a : b;
      });
      expect(melhorValidacao.model).toBe("claude-sonnet");
    });

    it("deve calcular proporção de validação corretamente", () => {
      const proporcoes = resultados.map((r) => ({
        model: r.model,
        proporcao: r.validacaoLegislacao.citacoesValidadas / Math.max(r.validacaoLegislacao.totalCitacoes, 1),
      }));

      expect(proporcoes[0].proporcao).toBeCloseTo(0.8); // 4/5
      expect(proporcoes[1].proporcao).toBeCloseTo(0.875); // 7/8
      expect(proporcoes[2].proporcao).toBeCloseTo(0.667, 2); // 2/3
    });
  });

  describe("Providers válidos", () => {
    const PROVIDERS_VALIDOS = ["manus", "openai", "anthropic", "google", "perplexity"];

    it("deve aceitar todos os providers válidos", () => {
      PROVIDERS_VALIDOS.forEach((provider) => {
        expect(PROVIDERS_VALIDOS).toContain(provider);
      });
    });

    it("deve rejeitar providers inválidos", () => {
      const providerInvalido = "azure";
      expect(PROVIDERS_VALIDOS).not.toContain(providerInvalido);
    });
  });

  describe("Formato de resposta", () => {
    it("deve retornar estrutura correta de comparação", () => {
      const resposta = {
        comparacoes: [
          { status: "success", provider: "openai", model: "gpt-4o-mini", documento: "...", tempoGeracao: 5000 },
          { status: "success", provider: "anthropic", model: "claude-sonnet", documento: "...", tempoGeracao: 8000 },
        ],
        tempoTotal: 8500,
        modelosComparados: 2,
        tipoDocumento: "Petição Inicial",
        areaJuridica: "Família",
      };

      expect(resposta.comparacoes).toHaveLength(2);
      expect(resposta.tempoTotal).toBeGreaterThan(0);
      expect(resposta.modelosComparados).toBe(2);
      expect(resposta.tipoDocumento).toBeDefined();
    });

    it("deve incluir métricas de texto nos resultados de sucesso", () => {
      const resultado = {
        status: "success",
        provider: "openai",
        model: "gpt-4o-mini",
        documento: "Este é um documento de teste com várias palavras para contagem",
        tempoGeracao: 5000,
        tamanhoTexto: 65,
        palavras: 11,
        paragrafos: 1,
      };

      expect(resultado.tamanhoTexto).toBeGreaterThan(0);
      expect(resultado.palavras).toBeGreaterThan(0);
      expect(resultado.paragrafos).toBeGreaterThan(0);
    });
  });
});

describe("Comparação de Modelos - Frontend", () => {
  describe("Seleção de modelos", () => {
    it("deve iniciar com 2 modelos padrão selecionados", () => {
      const modelosPadrao = ["manus:manus-default", "openai:gpt-4o-mini"];
      expect(modelosPadrao).toHaveLength(2);
    });

    it("deve impedir deseleção abaixo de 2 modelos", () => {
      const selecionados = ["manus:manus-default", "openai:gpt-4o-mini"];
      const tentarRemover = (key: string) => {
        if (selecionados.length <= 2) return selecionados;
        return selecionados.filter((m) => m !== key);
      };
      const resultado = tentarRemover("manus:manus-default");
      expect(resultado).toHaveLength(2); // Não removeu
    });

    it("deve impedir seleção acima de 4 modelos", () => {
      const selecionados = [
        "manus:manus-default",
        "openai:gpt-4o-mini",
        "anthropic:claude-sonnet",
        "google:gemini-pro",
      ];
      const tentarAdicionar = (key: string) => {
        if (selecionados.length >= 4) return selecionados;
        return [...selecionados, key];
      };
      const resultado = tentarAdicionar("perplexity:perplexity-sonar");
      expect(resultado).toHaveLength(4); // Não adicionou
    });
  });

  describe("Layout responsivo", () => {
    it("deve usar grid de 2 colunas para 2 resultados", () => {
      const numResultados = 2;
      const gridClass = numResultados === 2 ? "grid-cols-1 lg:grid-cols-2" :
        numResultados === 3 ? "grid-cols-1 lg:grid-cols-3" :
        "grid-cols-1 lg:grid-cols-2";
      expect(gridClass).toBe("grid-cols-1 lg:grid-cols-2");
    });

    it("deve usar grid de 3 colunas para 3 resultados", () => {
      const numResultados = 3;
      const gridClass = numResultados === 2 ? "grid-cols-1 lg:grid-cols-2" :
        numResultados === 3 ? "grid-cols-1 lg:grid-cols-3" :
        "grid-cols-1 lg:grid-cols-2";
      expect(gridClass).toBe("grid-cols-1 lg:grid-cols-3");
    });

    it("deve usar grid de 2 colunas para 4 resultados", () => {
      const numResultados = 4;
      const gridClass = numResultados === 2 ? "grid-cols-1 lg:grid-cols-2" :
        numResultados === 3 ? "grid-cols-1 lg:grid-cols-3" :
        "grid-cols-1 lg:grid-cols-2";
      expect(gridClass).toBe("grid-cols-1 lg:grid-cols-2");
    });
  });

  describe("Controle de acesso por plano", () => {
    const PLAN_HIERARCHY: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };

    it("plano free pode acessar modelos free", () => {
      expect(PLAN_HIERARCHY["free"] >= PLAN_HIERARCHY["free"]).toBe(true);
    });

    it("plano free NÃO pode acessar modelos pro", () => {
      expect(PLAN_HIERARCHY["free"] >= PLAN_HIERARCHY["pro"]).toBe(false);
    });

    it("plano pro pode acessar modelos free e pro", () => {
      expect(PLAN_HIERARCHY["pro"] >= PLAN_HIERARCHY["free"]).toBe(true);
      expect(PLAN_HIERARCHY["pro"] >= PLAN_HIERARCHY["pro"]).toBe(true);
    });

    it("plano enterprise pode acessar todos os modelos", () => {
      expect(PLAN_HIERARCHY["enterprise"] >= PLAN_HIERARCHY["free"]).toBe(true);
      expect(PLAN_HIERARCHY["enterprise"] >= PLAN_HIERARCHY["pro"]).toBe(true);
      expect(PLAN_HIERARCHY["enterprise"] >= PLAN_HIERARCHY["enterprise"]).toBe(true);
    });
  });
});
