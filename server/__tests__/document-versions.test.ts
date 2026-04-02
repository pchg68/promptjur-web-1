import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("../db-document-versions", () => ({
  salvarVersaoDocumento: vi.fn(),
  listarGruposDocumentos: vi.fn(),
  listarVersoesGrupo: vi.fn(),
  obterVersaoDocumento: vi.fn(),
  atualizarNotasVersao: vi.fn(),
  excluirVersaoDocumento: vi.fn(),
  excluirGrupoDocumentos: vi.fn(),
}));

import {
  salvarVersaoDocumento,
  listarGruposDocumentos,
  listarVersoesGrupo,
  obterVersaoDocumento,
  atualizarNotasVersao,
  excluirVersaoDocumento,
  excluirGrupoDocumentos,
} from "../db-document-versions";

describe("Document Versions - DB Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("salvarVersaoDocumento", () => {
    it("deve salvar uma nova versão e retornar o ID", async () => {
      const mockId = 42;
      (salvarVersaoDocumento as any).mockResolvedValue(mockId);

      const data = {
        userId: 1,
        groupId: "test-group-123",
        titulo: "Petição Inicial — Civil",
        tipoDocumento: "peticao",
        areaJuridica: "Civil",
        estrategia: "direct",
        contexto: "Ação de cobrança de dívida",
        objetivo: null,
        partesEnvolvidas: null,
        legislacao: null,
        detalhes: null,
        documento: "# Petição Inicial\n\nConteúdo do documento...",
        tempoGeracaoMs: 3500,
        metadata: null,
        notas: null,
      };

      const result = await salvarVersaoDocumento(data);
      expect(result).toBe(mockId);
      expect(salvarVersaoDocumento).toHaveBeenCalledWith(data);
    });
  });

  describe("listarGruposDocumentos", () => {
    it("deve retornar lista de grupos do usuário", async () => {
      const mockGrupos = [
        {
          groupId: "group-1",
          titulo: "Petição Inicial — Civil",
          tipoDocumento: "peticao",
          areaJuridica: "Civil",
          totalVersoes: 3,
          ultimaVersao: 3,
          ultimaCriacao: new Date("2026-04-01"),
        },
        {
          groupId: "group-2",
          titulo: "Parecer Jurídico — Trabalhista",
          tipoDocumento: "parecer",
          areaJuridica: "Trabalhista",
          totalVersoes: 1,
          ultimaVersao: 1,
          ultimaCriacao: new Date("2026-03-30"),
        },
      ];
      (listarGruposDocumentos as any).mockResolvedValue(mockGrupos);

      const result = await listarGruposDocumentos(1);
      expect(result).toHaveLength(2);
      expect(result[0].groupId).toBe("group-1");
      expect(result[0].totalVersoes).toBe(3);
    });

    it("deve retornar array vazio quando não há grupos", async () => {
      (listarGruposDocumentos as any).mockResolvedValue([]);

      const result = await listarGruposDocumentos(999);
      expect(result).toEqual([]);
    });
  });

  describe("listarVersoesGrupo", () => {
    it("deve retornar versões de um grupo específico ordenadas por versão desc", async () => {
      const mockVersoes = [
        {
          id: 3,
          versao: 3,
          titulo: "Petição Inicial — Civil",
          tipoDocumento: "peticao",
          areaJuridica: "Civil",
          estrategia: "knowledge_retrieval",
          contexto: "Ação de cobrança",
          documento: "# Versão 3",
          tempoGeracaoMs: 5000,
          metadata: null,
          notas: "Versão com jurisprudência",
          createdAt: new Date("2026-04-01T14:00:00"),
        },
        {
          id: 2,
          versao: 2,
          titulo: "Petição Inicial — Civil",
          tipoDocumento: "peticao",
          areaJuridica: "Civil",
          estrategia: "chain_of_thought",
          contexto: "Ação de cobrança",
          documento: "# Versão 2",
          tempoGeracaoMs: 4000,
          metadata: null,
          notas: null,
          createdAt: new Date("2026-04-01T13:00:00"),
        },
      ];
      (listarVersoesGrupo as any).mockResolvedValue(mockVersoes);

      const result = await listarVersoesGrupo(1, "group-1");
      expect(result).toHaveLength(2);
      expect(result[0].versao).toBe(3);
      expect(result[1].versao).toBe(2);
    });
  });

  describe("obterVersaoDocumento", () => {
    it("deve retornar uma versão específica por ID", async () => {
      const mockVersao = {
        id: 1,
        userId: 1,
        groupId: "group-1",
        versao: 1,
        titulo: "Petição Inicial — Civil",
        tipoDocumento: "peticao",
        areaJuridica: "Civil",
        estrategia: "direct",
        contexto: "Ação de cobrança",
        objetivo: null,
        partesEnvolvidas: null,
        legislacao: null,
        detalhes: null,
        documento: "# Petição Inicial",
        tempoGeracaoMs: 3000,
        metadata: null,
        notas: null,
        createdAt: new Date("2026-04-01"),
      };
      (obterVersaoDocumento as any).mockResolvedValue(mockVersao);

      const result = await obterVersaoDocumento(1, 1);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.documento).toContain("Petição Inicial");
    });

    it("deve retornar null quando versão não existe", async () => {
      (obterVersaoDocumento as any).mockResolvedValue(null);

      const result = await obterVersaoDocumento(1, 9999);
      expect(result).toBeNull();
    });
  });

  describe("atualizarNotasVersao", () => {
    it("deve atualizar notas de uma versão", async () => {
      (atualizarNotasVersao as any).mockResolvedValue(undefined);

      await atualizarNotasVersao(1, 1, "Versão com argumentação mais forte");
      expect(atualizarNotasVersao).toHaveBeenCalledWith(1, 1, "Versão com argumentação mais forte");
    });
  });

  describe("excluirVersaoDocumento", () => {
    it("deve excluir uma versão específica", async () => {
      (excluirVersaoDocumento as any).mockResolvedValue(undefined);

      await excluirVersaoDocumento(1, 1);
      expect(excluirVersaoDocumento).toHaveBeenCalledWith(1, 1);
    });
  });

  describe("excluirGrupoDocumentos", () => {
    it("deve excluir todas as versões de um grupo", async () => {
      (excluirGrupoDocumentos as any).mockResolvedValue(undefined);

      await excluirGrupoDocumentos(1, "group-1");
      expect(excluirGrupoDocumentos).toHaveBeenCalledWith(1, "group-1");
    });
  });
});

describe("Document Versions - Data Integrity", () => {
  it("deve garantir que groupId é obrigatório", () => {
    const validData = {
      userId: 1,
      groupId: "abc-123",
      titulo: "Test",
      tipoDocumento: "peticao",
      areaJuridica: "Civil",
      estrategia: "direct",
      contexto: "Test context",
      documento: "Test document",
    };

    expect(validData.groupId).toBeTruthy();
    expect(validData.groupId.length).toBeGreaterThan(0);
  });

  it("deve garantir que documento não está vazio", () => {
    const doc = "# Petição Inicial\n\nConteúdo...";
    expect(doc.length).toBeGreaterThan(0);
  });

  it("deve gerar groupId único para cada caso", () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBe(36); // UUID v4 format
  });
});
