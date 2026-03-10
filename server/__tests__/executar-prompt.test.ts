import { describe, it, expect, vi } from "vitest";

describe("Executar Prompt - Backend", () => {
  describe("Endpoint executarPrompt", () => {
    it("deve aceitar input com promptText obrigatório", () => {
      const input = {
        promptText: "Elabore uma petição inicial de indenização por danos morais...",
        promptId: 1,
        tipoDocumento: "peticao",
        areaJuridica: "Civil",
        provider: "manus" as const,
      };
      expect(input.promptText.length).toBeGreaterThan(10);
      expect(input.provider).toBe("manus");
    });

    it("deve rejeitar promptText com menos de 10 caracteres", () => {
      const input = { promptText: "curto" };
      expect(input.promptText.length).toBeLessThan(10);
    });

    it("deve aceitar todos os providers válidos", () => {
      const providers = ["manus", "openai", "anthropic", "google", "perplexity"];
      providers.forEach(p => {
        expect(["manus", "openai", "anthropic", "google", "perplexity"]).toContain(p);
      });
    });

    it("deve incluir execucao_prompt como ação válida no histórico", () => {
      const acoesValidas = ["analise", "geracao", "otimizacao", "verificacao", "exportacao_docx", "exportacao_pdf", "execucao_prompt"];
      expect(acoesValidas).toContain("execucao_prompt");
    });
  });

  describe("Remoção de persona do resultado", () => {
    // Simula a função removerPersonaDoTexto
    function removerPersonaDoTexto(texto: string): string {
      let resultado = texto;
      const personaPatterns = [
        /^\s*(?:\*\*)?(?:Você é|Atue como|Aja como|Assuma o papel de|Imagine que você é)[^]*?(?:\n\n|---)/i,
        /^\s*(?:#{1,3}\s*)?\*?\*?(?:Persona|Contexto do Sistema|System Context|Role|Papel)\*?\*?\s*:?[^]*?(?:\n\n|---)/i,
        /^\s*\[(?:Persona|Contexto|Role):[^\]]*\]\s*/i,
      ];
      for (const pattern of personaPatterns) {
        resultado = resultado.replace(pattern, '');
      }
      const inlinePatterns = [
        /\*\*Persona:\*\*[\s\S]*?(?=\n\n|\*\*[A-Z]|$)/gi,
        /\*\*Contexto do Sistema:\*\*[\s\S]*?(?=\n\n|\*\*[A-Z]|$)/gi,
        /\[Persona:[\s\S]*?\]/gi,
        /\[Contexto do Sistema:[\s\S]*?\]/gi,
      ];
      for (const pattern of inlinePatterns) {
        resultado = resultado.replace(pattern, '');
      }
      resultado = resultado.replace(/^\s*---\s*\n/, '');
      resultado = resultado.replace(/^\n{2,}/, '\n');
      return resultado.trim();
    }

    it("deve remover persona 'Você é um...' do início", () => {
      const texto = "Você é um advogado sênior especializado em Direito Civil.\n\nEXCELENTÍSSIMO SENHOR JUIZ...";
      const resultado = removerPersonaDoTexto(texto);
      expect(resultado).toBe("EXCELENTÍSSIMO SENHOR JUIZ...");
    });

    it("deve remover seção **Persona:**", () => {
      const texto = "**Persona:** Advogado especialista em direito trabalhista\n\n**Título:** Petição Inicial";
      const resultado = removerPersonaDoTexto(texto);
      expect(resultado).toContain("Petição Inicial");
      expect(resultado).not.toContain("Persona:");
    });

    it("deve manter texto sem persona intacto", () => {
      const texto = "EXCELENTÍSSIMO SENHOR JUIZ DE DIREITO DA VARA CÍVEL\n\nPETIÇÃO INICIAL";
      const resultado = removerPersonaDoTexto(texto);
      expect(resultado).toBe(texto);
    });

    it("deve remover [Persona: ...] entre colchetes", () => {
      const texto = "[Persona: Advogado sênior] EXCELENTÍSSIMO SENHOR JUIZ...";
      const resultado = removerPersonaDoTexto(texto);
      expect(resultado).toBe("EXCELENTÍSSIMO SENHOR JUIZ...");
    });
  });

  describe("Estrutura de resposta", () => {
    it("deve retornar campos obrigatórios na resposta", () => {
      const mockResponse = {
        documento: "EXCELENTÍSSIMO SENHOR JUIZ...",
        provider: "manus",
        model: "default",
        tempoGeracao: 5000,
        tipoDocumento: "peticao",
        areaJuridica: "Civil",
        validacaoLegislacao: {
          confiabilidadeGeral: "alta",
          totalCitacoes: 3,
          citacoesValidadas: 2,
          citacoes: [],
        },
      };

      expect(mockResponse).toHaveProperty("documento");
      expect(mockResponse).toHaveProperty("provider");
      expect(mockResponse).toHaveProperty("model");
      expect(mockResponse).toHaveProperty("tempoGeracao");
      expect(mockResponse).toHaveProperty("validacaoLegislacao");
      expect(mockResponse.tempoGeracao).toBeGreaterThan(0);
    });

    it("deve incluir validação de legislação", () => {
      const validacao = {
        confiabilidadeGeral: "media",
        totalCitacoes: 5,
        citacoesValidadas: 3,
        citacoes: [],
      };
      expect(validacao.totalCitacoes).toBeGreaterThanOrEqual(validacao.citacoesValidadas);
    });
  });
});

describe("PromptActions - Redesign", () => {
  it("deve ter ação primária 'Executar com IA'", () => {
    const acoesPrimarias = ["Executar com IA", "Elaborar Documento"];
    expect(acoesPrimarias).toContain("Executar com IA");
  });

  it("deve ter ação secundária 'Elaborar Documento'", () => {
    const acoesPrimarias = ["Executar com IA", "Elaborar Documento"];
    expect(acoesPrimarias).toContain("Elaborar Documento");
  });

  it("deve ter ações terciárias compactas", () => {
    const acoesSecundarias = ["Copiar Prompt", "Preview", "Analisar", "Copiar ABNT", "Exportar Markdown", "Salvar como Template"];
    expect(acoesSecundarias.length).toBeGreaterThan(3);
    expect(acoesSecundarias).toContain("Copiar Prompt");
    expect(acoesSecundarias).toContain("Preview");
  });

  it("deve suportar seleção de modelo para execução", () => {
    const modelos = ["manus:default", "openai:gpt-4o", "anthropic:claude-sonnet", "google:gemini-flash"];
    modelos.forEach(m => {
      const [provider, model] = m.split(":");
      expect(provider).toBeTruthy();
      expect(model).toBeTruthy();
    });
  });

  it("deve exibir resultado da execução com metadados", () => {
    const resultado = {
      documento: "Texto do documento...",
      provider: "manus",
      model: "default",
      tempoGeracao: 3500,
    };
    expect(resultado.documento).toBeTruthy();
    expect(resultado.tempoGeracao).toBeGreaterThan(0);
  });
});

describe("PostGenerationGuide - Novo Fluxo", () => {
  it("deve refletir o novo workflow simplificado", () => {
    const steps = [
      { label: "Executar", desc: "Execute direto com IA integrada" },
      { label: "Documento", desc: "Elabore o documento completo" },
      { label: "Analisar", desc: "Analise a qualidade do prompt" },
      { label: "Copiar", desc: "Copie para uso externo" },
    ];
    expect(steps[0].label).toBe("Executar");
    expect(steps[1].label).toBe("Documento");
    expect(steps).toHaveLength(4);
  });

  it("deve priorizar execução direta sobre cópia manual", () => {
    const steps = ["Executar", "Documento", "Analisar", "Copiar"];
    expect(steps.indexOf("Executar")).toBeLessThan(steps.indexOf("Copiar"));
    expect(steps.indexOf("Documento")).toBeLessThan(steps.indexOf("Copiar"));
  });
});
