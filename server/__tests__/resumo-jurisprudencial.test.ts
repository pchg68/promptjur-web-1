import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: `## Fundamentação Jurisprudencial

A tese de indenização por danos morais encontra amparo em precedentes identificados no DataJud/CNJ. Conforme o processo 10001234520238260001 (STJ, 3ª Turma, Recurso Especial, j. 15/06/2023), a matéria relativa a dano moral em relações contratuais tem sido objeto de análise recorrente naquele Tribunal Superior.

No mesmo sentido, o processo 20005678920248260002 (TJSP, 5ª Câmara de Direito Privado, Apelação Cível, j. 10/03/2024) reforça o entendimento de que a rescisão contratual indevida pode ensejar reparação por danos morais.

**Nota:** Os precedentes acima foram identificados via consulta à base DataJud/CNJ. Recomenda-se a verificação do inteiro teor nos links oficiais antes da utilização em peça processual.`,
      },
    }],
  }),
}));

// Mock the logger
vi.mock("../_core/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Resumo Automático de Jurisprudência", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResultados = [
    {
      tese: {
        id: "tese-1",
        titulo: "Indenização por Danos Morais",
        descricao: "Tese sobre indenização por danos morais em relação contratual",
        termosChave: ["dano moral", "indenização", "contrato"],
        artigosRelacionados: ["art. 186 CC", "art. 927 CC"],
        queryElasticsearch: "(\"dano moral\" OR indeniza*) AND contrat*",
      },
      processos: [
        {
          numeroProcesso: "10001234520238260001",
          tribunal: "STJ",
          tribunalBusca: "STJ",
          classe: "Recurso Especial",
          assuntos: ["Dano Moral", "Indenização"],
          orgaoJulgador: "3ª Turma",
          grau: "2",
          dataAjuizamento: "2023-06-15T00:00:00.000Z",
          dataUltimaAtualizacao: "2024-11-20T10:00:00.000Z",
          scoreRelevancia: 85,
          linkOficial: "https://processo.stj.jus.br/processo/pesquisa/?termo=10001234520238260001",
          validacao: {
            temFonteOficial: true,
            temIdentificacaoCompleta: true,
            temDataRecente: true,
            temAderenciaFatica: true,
            scoreValidacao: 85,
            alertas: [],
          },
        },
      ],
      totalEncontrado: 1,
    },
    {
      tese: {
        id: "tese-2",
        titulo: "Rescisão Contratual",
        descricao: "Tese sobre rescisão de contrato por inadimplemento",
        termosChave: ["rescisão", "contrato", "inadimplemento"],
        artigosRelacionados: ["art. 475 CC"],
        queryElasticsearch: "(rescis* OR resolu*) AND inadimplemento",
      },
      processos: [
        {
          numeroProcesso: "20005678920248260002",
          tribunal: "TJSP",
          tribunalBusca: "TJSP",
          classe: "Apelação Cível",
          assuntos: ["Rescisão Contratual", "Inadimplemento"],
          orgaoJulgador: "5ª Câmara de Direito Privado",
          grau: "2",
          dataAjuizamento: "2024-03-10T00:00:00.000Z",
          dataUltimaAtualizacao: "2025-01-15T10:00:00.000Z",
          scoreRelevancia: 72,
          linkOficial: "https://esaj.tjsp.jus.br/cpopg/show.do?processo.numero=20005678920248260002",
          validacao: {
            temFonteOficial: true,
            temIdentificacaoCompleta: true,
            temDataRecente: true,
            temAderenciaFatica: true,
            scoreValidacao: 72,
            alertas: [],
          },
        },
      ],
      totalEncontrado: 1,
    },
  ];

  describe("gerarResumoJurisprudencia", () => {
    it("deve gerar resumo com processos válidos", async () => {
      const { gerarResumoJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultado = await gerarResumoJurisprudencia({
        resultados: mockResultados,
        contextoDocumento: "O autor busca indenização por danos morais decorrentes da rescisão contratual indevida.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
        tom: "formal",
      });

      expect(resultado).toBeDefined();
      expect(resultado.resumo).toBeTruthy();
      expect(resultado.resumo.length).toBeGreaterThan(50);
      expect(resultado.processosUtilizados).toHaveLength(2);
      expect(resultado.processosUtilizados).toContain("10001234520238260001");
      expect(resultado.processosUtilizados).toContain("20005678920248260002");
      expect(resultado.tesesAbordadas).toHaveLength(2);
      expect(resultado.tempoGeracao).toBeGreaterThan(0);
      expect(resultado.tom).toBe("formal");
    });

    it("deve retornar mensagem quando não há processos válidos", async () => {
      const { gerarResumoJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultadosSemProcessos = [
        {
          tese: mockResultados[0].tese,
          processos: [],
          totalEncontrado: 0,
        },
      ];

      const resultado = await gerarResumoJurisprudencia({
        resultados: resultadosSemProcessos,
        contextoDocumento: "Texto de teste sem processos válidos.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
      });

      expect(resultado.resumo).toContain("Não foram encontrados processos");
      expect(resultado.processosUtilizados).toHaveLength(0);
      expect(resultado.tesesAbordadas).toHaveLength(0);
    });

    it("deve filtrar processos com score abaixo de 40", async () => {
      const { gerarResumoJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultadosComScoreBaixo = [
        {
          ...mockResultados[0],
          processos: [
            {
              ...mockResultados[0].processos[0],
              validacao: {
                ...mockResultados[0].processos[0].validacao,
                scoreValidacao: 30, // Abaixo do mínimo
              },
            },
          ],
        },
      ];

      const resultado = await gerarResumoJurisprudencia({
        resultados: resultadosComScoreBaixo,
        contextoDocumento: "Texto de teste com processos de score baixo.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
      });

      expect(resultado.resumo).toContain("Não foram encontrados processos");
      expect(resultado.processosUtilizados).toHaveLength(0);
    });

    it("deve aceitar diferentes tons de resumo", async () => {
      const { gerarResumoJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const tons: Array<"formal" | "tecnico" | "persuasivo"> = ["formal", "tecnico", "persuasivo"];

      for (const tom of tons) {
        const resultado = await gerarResumoJurisprudencia({
          resultados: mockResultados,
          contextoDocumento: "Texto de teste para diferentes tons.",
          areaJuridica: "Civil",
          tipoDocumento: "peticao",
          tom,
        });

        expect(resultado.tom).toBe(tom);
        expect(resultado.resumo).toBeTruthy();
      }
    });

    it("deve usar tom formal como padrão quando não especificado", async () => {
      const { gerarResumoJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultado = await gerarResumoJurisprudencia({
        resultados: mockResultados,
        contextoDocumento: "Texto de teste sem tom especificado.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
        // tom não especificado
      });

      expect(resultado.tom).toBe("formal");
    });

    it("deve incluir teses abordadas sem duplicatas", async () => {
      const { gerarResumoJurisprudencia } = await import("../pesquisa-jurisprudencial");

      // Adicionar processos duplicados na mesma tese
      const resultadosDuplicados = [
        {
          ...mockResultados[0],
          processos: [
            mockResultados[0].processos[0],
            {
              ...mockResultados[0].processos[0],
              numeroProcesso: "30009876543210001",
            },
          ],
        },
      ];

      const resultado = await gerarResumoJurisprudencia({
        resultados: resultadosDuplicados,
        contextoDocumento: "Texto de teste com processos na mesma tese.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
      });

      // Deve ter apenas 1 tese abordada (sem duplicata)
      expect(resultado.tesesAbordadas).toHaveLength(1);
      expect(resultado.tesesAbordadas[0]).toBe("Indenização por Danos Morais");
      // Mas 2 processos utilizados
      expect(resultado.processosUtilizados).toHaveLength(2);
    });

    it("deve medir o tempo de geração corretamente", async () => {
      const { gerarResumoJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultado = await gerarResumoJurisprudencia({
        resultados: mockResultados,
        contextoDocumento: "Texto de teste para medir tempo.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
      });

      expect(resultado.tempoGeracao).toBeGreaterThanOrEqual(0);
      expect(typeof resultado.tempoGeracao).toBe("number");
    });
  });
});
