import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          teses: [
            {
              titulo: "Indenização por Danos Morais",
              descricao: "Tese sobre indenização por danos morais em relação contratual",
              termosChave: ["dano moral", "indenização", "contrato"],
              artigosRelacionados: ["art. 186 CC", "art. 927 CC"],
              queryElasticsearch: "(\"dano moral\" OR indeniza*) AND contrat*",
            },
            {
              titulo: "Rescisão Contratual",
              descricao: "Tese sobre rescisão de contrato por inadimplemento",
              termosChave: ["rescisão", "contrato", "inadimplemento"],
              artigosRelacionados: ["art. 475 CC"],
              queryElasticsearch: "(rescis* OR resolu*) AND inadimplemento",
            },
          ],
        }),
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

// Mock fetch for DataJud API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Pesquisa Jurisprudencial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("extrairTesesDoPrompt", () => {
    it("deve extrair teses do prompt via LLM", async () => {
      const { extrairTesesDoPrompt } = await import("../pesquisa-jurisprudencial");

      const teses = await extrairTesesDoPrompt(
        "O autor busca indenização por danos morais decorrentes da rescisão contratual indevida pelo réu.",
        "Civil",
        "peticao"
      );

      expect(teses).toHaveLength(2);
      expect(teses[0].titulo).toBe("Indenização por Danos Morais");
      expect(teses[0].termosChave).toContain("dano moral");
      expect(teses[0].artigosRelacionados).toContain("art. 186 CC");
      expect(teses[1].titulo).toBe("Rescisão Contratual");
    });

    it("deve gerar IDs únicos para cada tese", async () => {
      const { extrairTesesDoPrompt } = await import("../pesquisa-jurisprudencial");

      const teses = await extrairTesesDoPrompt(
        "Texto jurídico de teste com múltiplas teses para análise.",
        "Civil",
        "peticao"
      );

      const ids = teses.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("pesquisarJurisprudencia", () => {
    it("deve executar pesquisa completa e retornar resultados estruturados", async () => {
      // Mock DataJud API responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          took: 50,
          timed_out: false,
          hits: {
            total: { value: 3, relation: "eq" },
            max_score: 5.0,
            hits: [
              {
                _index: "api_publica_stj",
                _id: "1",
                _score: 5.0,
                _source: {
                  numeroProcesso: "10001234520228260001",
                  classe: { codigo: 1, nome: "Recurso Especial" },
                  sistema: { codigo: 1, nome: "PJe" },
                  formato: { codigo: 1, nome: "Eletrônico" },
                  tribunal: "STJ",
                  dataAjuizamento: "2023-06-15T00:00:00.000Z",
                  dataHoraUltimaAtualizacao: "2024-11-20T10:00:00.000Z",
                  grau: "2",
                  nivelSigilo: 0,
                  orgaoJulgador: { codigo: 1, nome: "3ª Turma" },
                  assuntos: [
                    { codigo: 100, nome: "Dano Moral" },
                    { codigo: 101, nome: "Indenização" },
                  ],
                  movimentos: [
                    { codigo: 1, nome: "Julgamento", dataHora: "2024-11-20T10:00:00.000Z" },
                  ],
                },
              },
            ],
          },
        }),
      });

      const { pesquisarJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultado = await pesquisarJurisprudencia({
        promptTexto: "O autor busca indenização por danos morais decorrentes da rescisão contratual indevida.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
        tribunais: ["STJ"],
        limitePorTese: 3,
      });

      expect(resultado).toBeDefined();
      expect(resultado.teses).toHaveLength(2);
      expect(resultado.resultados).toHaveLength(2);
      expect(resultado.metadados).toBeDefined();
      expect(resultado.metadados.tribunaisConsultados).toContain("STJ");
      expect(resultado.metadados.tempoExecucao).toBeGreaterThan(0);
    });

    it("deve lidar com erros da API DataJud graciosamente", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const { pesquisarJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultado = await pesquisarJurisprudencia({
        promptTexto: "Texto de teste para pesquisa jurisprudencial com erro na API.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
        tribunais: ["STJ"],
      });

      // Deve retornar resultado vazio, não lançar erro
      expect(resultado).toBeDefined();
      expect(resultado.teses).toHaveLength(2);
      expect(resultado.resultados.every(r => r.processos.length === 0)).toBe(true);
    });

    it("deve lidar com timeout da API DataJud", async () => {
      mockFetch.mockImplementation(() => new Promise((_, reject) => {
        const error = new Error("AbortError");
        error.name = "AbortError";
        reject(error);
      }));

      const { pesquisarJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultado = await pesquisarJurisprudencia({
        promptTexto: "Texto de teste para pesquisa jurisprudencial com timeout.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
        tribunais: ["STJ"],
      });

      expect(resultado).toBeDefined();
      expect(resultado.metadados.totalProcessos).toBe(0);
    });
  });

  describe("validação de processos", () => {
    it("deve validar processo com dados completos e recentes", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          took: 10,
          timed_out: false,
          hits: {
            total: { value: 1, relation: "eq" },
            max_score: 5.0,
            hits: [{
              _index: "api_publica_stj",
              _id: "1",
              _score: 5.0,
              _source: {
                numeroProcesso: "10001234520238260001",
                classe: { codigo: 1, nome: "Recurso Especial" },
                sistema: { codigo: 1, nome: "PJe" },
                formato: { codigo: 1, nome: "Eletrônico" },
                tribunal: "STJ",
                dataAjuizamento: "2024-01-15T00:00:00.000Z",
                dataHoraUltimaAtualizacao: "2025-01-10T10:00:00.000Z",
                grau: "2",
                nivelSigilo: 0,
                orgaoJulgador: { codigo: 1, nome: "4ª Turma" },
                assuntos: [
                  { codigo: 100, nome: "Dano Moral" },
                  { codigo: 101, nome: "Indenização por Dano Moral" },
                ],
                movimentos: [
                  { codigo: 1, nome: "Provimento", dataHora: "2025-01-10T10:00:00.000Z" },
                ],
              },
            }],
          },
        }),
      });

      const { pesquisarJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultado = await pesquisarJurisprudencia({
        promptTexto: "Indenização por dano moral em contrato de prestação de serviços.",
        areaJuridica: "Civil",
        tipoDocumento: "peticao",
        tribunais: ["STJ"],
        limitePorTese: 1,
      });

      const primeiroResultado = resultado.resultados[0];
      if (primeiroResultado.processos.length > 0) {
        const processo = primeiroResultado.processos[0];
        expect(processo.validacao.temFonteOficial).toBe(true);
        expect(processo.validacao.temIdentificacaoCompleta).toBe(true);
        expect(processo.validacao.temDataRecente).toBe(true);
        expect(processo.validacao.scoreValidacao).toBeGreaterThan(50);
      }
    });
  });

  describe("formatação de citação", () => {
    it("deve formatar citação inline corretamente", async () => {
      const { formatarParaIncorporacao } = await import("../pesquisa-jurisprudencial");

      const processo = {
        numeroProcesso: "10001234520238260001",
        tribunal: "STJ",
        tribunalBusca: "STJ",
        classe: "Recurso Especial",
        assuntos: ["Dano Moral"],
        orgaoJulgador: "3ª Turma",
        grau: "2",
        dataAjuizamento: "2023-06-15T00:00:00.000Z",
        dataUltimaAtualizacao: "2024-11-20T10:00:00.000Z",
        scoreRelevancia: 85,
        linkOficial: "https://processo.stj.jus.br/processo/pesquisa/?tipoPesquisa=tipoPesquisaNumeroRegistro&termo=10001234520238260001",
        validacao: {
          temFonteOficial: true,
          temIdentificacaoCompleta: true,
          temDataRecente: true,
          temAderenciaFatica: true,
          scoreValidacao: 85,
          alertas: [],
        },
      };

      const citacao = formatarParaIncorporacao(processo);
      expect(citacao).toContain("STJ");
      expect(citacao).toContain("Recurso Especial");
      expect(citacao).toContain("10001234520238260001");
      expect(citacao).toContain("3ª Turma");
    });

    it("deve gerar bloco de citação completo", async () => {
      const { gerarBlocoCitacao } = await import("../pesquisa-jurisprudencial");

      const processo = {
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
        linkOficial: "https://processo.stj.jus.br/",
        validacao: {
          temFonteOficial: true,
          temIdentificacaoCompleta: true,
          temDataRecente: true,
          temAderenciaFatica: true,
          scoreValidacao: 85,
          alertas: [],
        },
      };

      const tese = {
        id: "tese-1",
        titulo: "Dano Moral Contratual",
        descricao: "Tese sobre dano moral",
        termosChave: ["dano moral"],
        artigosRelacionados: ["art. 186 CC"],
        queryElasticsearch: "\"dano moral\"",
      };

      const bloco = gerarBlocoCitacao(processo, tese);
      expect(bloco).toContain("Dano Moral Contratual");
      expect(bloco).toContain("10001234520238260001");
      expect(bloco).toContain("DataJud/CNJ");
      expect(bloco).toContain("Score 85/100");
    });
  });

  describe("metadados da pesquisa", () => {
    it("deve incluir metadados completos no resultado", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          took: 10,
          timed_out: false,
          hits: { total: { value: 0, relation: "eq" }, max_score: 0, hits: [] },
        }),
      });

      const { pesquisarJurisprudencia } = await import("../pesquisa-jurisprudencial");

      const resultado = await pesquisarJurisprudencia({
        promptTexto: "Texto de teste para verificar metadados da pesquisa jurisprudencial.",
        areaJuridica: "Trabalhista",
        tipoDocumento: "recurso",
        tribunais: ["STJ", "TJSP"],
      });

      expect(resultado.metadados).toBeDefined();
      expect(resultado.metadados.dataConsulta).toBeDefined();
      expect(resultado.metadados.tribunaisConsultados).toEqual(["STJ", "TJSP"]);
      expect(resultado.metadados.filtroTemporal).toBeDefined();
      expect(resultado.metadados.filtroTemporal.inicio).toBe("2022-01-01");
    });
  });
});
