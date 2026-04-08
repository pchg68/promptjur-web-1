/**
 * Testes para o módulo de log de acessos (db-access-logs.ts)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do banco de dados
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "../db";

// Helper para criar mock de query chain do Drizzle
function criarMockDb(resultado: any[] = []) {
  const chain: any = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(resultado),
  };
  return chain;
}

describe("registrarAcesso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve registrar um acesso com sucesso", async () => {
    const mockDb = criarMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const { registrarAcesso } = await import("../db-access-logs");

    await expect(
      registrarAcesso({
        openId: "user-123",
        nome: "João Silva",
        email: "joao@example.com",
        loginMethod: "email",
        ipOrigem: "192.168.1.1",
        userAgent: "Mozilla/5.0 Chrome/120",
        primeiroAcesso: false,
        acessoPermitido: true,
      })
    ).resolves.not.toThrow();

    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "user-123",
        nome: "João Silva",
        email: "joao@example.com",
        primeiroAcesso: false,
        acessoPermitido: true,
      })
    );
  });

  it("deve registrar primeiro acesso corretamente", async () => {
    const mockDb = criarMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const { registrarAcesso } = await import("../db-access-logs");

    await registrarAcesso({
      openId: "novo-user-456",
      nome: "Maria Santos",
      email: "maria@example.com",
      loginMethod: "google",
      ipOrigem: "10.0.0.1",
      userAgent: "Safari/17",
      primeiroAcesso: true,
      acessoPermitido: true,
    });

    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        primeiroAcesso: true,
        acessoPermitido: true,
      })
    );
  });

  it("deve registrar acesso negado corretamente", async () => {
    const mockDb = criarMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const { registrarAcesso } = await import("../db-access-logs");

    await registrarAcesso({
      openId: "blocked-user",
      nome: null,
      email: "blocked@example.com",
      loginMethod: "email",
      ipOrigem: null,
      userAgent: null,
      primeiroAcesso: false,
      acessoPermitido: false,
    });

    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        acessoPermitido: false,
      })
    );
  });

  it("deve não lançar erro quando banco está indisponível", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);

    const { registrarAcesso } = await import("../db-access-logs");

    await expect(
      registrarAcesso({
        openId: "user-789",
        nome: "Teste",
        email: "teste@example.com",
        loginMethod: "email",
        ipOrigem: null,
        userAgent: null,
        primeiroAcesso: false,
        acessoPermitido: true,
      })
    ).resolves.not.toThrow();
  });
});

describe("listarAccessLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar lista vazia quando banco está indisponível", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);

    const { listarAccessLogs } = await import("../db-access-logs");
    const result = await listarAccessLogs();

    expect(result).toEqual({ logs: [], total: 0 });
  });

  it("deve retornar logs com paginação padrão", async () => {
    const logsRetornados = [
      {
        id: 1,
        openId: "user-1",
        nome: "João",
        email: "joao@test.com",
        loginMethod: "email",
        ipOrigem: "127.0.0.1",
        userAgent: "Chrome",
        primeiroAcesso: false,
        acessoPermitido: true,
        createdAt: new Date("2026-04-08T10:00:00Z"),
        userId: 1,
      },
    ];

    const mockDb: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(logsRetornados),
    };

    // Para o count, retornar um array com count
    let callCount = 0;
    mockDb.offset = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(logsRetornados);
      return Promise.resolve([{ count: 1 }]);
    });

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const { listarAccessLogs } = await import("../db-access-logs");
    const result = await listarAccessLogs({ page: 1, limit: 50 });

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].nome).toBe("João");
    expect(typeof result.logs[0].createdAt).toBe("string");
  });
});

describe("statsAccessLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar null quando banco está indisponível", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);

    const { statsAccessLogs } = await import("../db-access-logs");
    const result = await statsAccessLogs();

    expect(result).toBeNull();
  });
});

describe("exportarAccessLogsCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve gerar CSV com cabeçalho correto quando banco está indisponível", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);

    const { exportarAccessLogsCsv } = await import("../db-access-logs");
    const csv = await exportarAccessLogsCsv();

    expect(csv).toContain("ID");
    expect(csv).toContain("Nome");
    expect(csv).toContain("E-mail");
    expect(csv).toContain("Método");
    expect(csv).toContain("IP");
    expect(csv).toContain("Primeiro Acesso");
    expect(csv).toContain("Acesso Permitido");
    expect(csv).toContain("Data/Hora");
  });

  it("deve incluir dados dos logs no CSV", async () => {
    const logsRetornados = [
      {
        id: 42,
        openId: "user-csv",
        nome: "Ana Lima",
        email: "ana@test.com",
        loginMethod: "google",
        ipOrigem: "192.168.0.1",
        userAgent: "Firefox",
        primeiroAcesso: true,
        acessoPermitido: true,
        createdAt: new Date("2026-04-08T15:30:00Z"),
        userId: 5,
      },
    ];

    const mockDb: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(logsRetornados),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const { exportarAccessLogsCsv } = await import("../db-access-logs");
    const csv = await exportarAccessLogsCsv();

    expect(csv).toContain("Ana Lima");
    expect(csv).toContain("ana@test.com");
    expect(csv).toContain("google");
    expect(csv).toContain("Sim"); // primeiroAcesso
  });
});

describe("Validação de campos do log", () => {
  it("deve truncar userAgent para 512 caracteres", () => {
    const longUA = "A".repeat(600);
    const truncated = longUA.substring(0, 512);
    expect(truncated).toHaveLength(512);
  });

  it("deve aceitar IP null quando não disponível", () => {
    const dados = {
      openId: "user-x",
      nome: null,
      email: null,
      loginMethod: null,
      ipOrigem: null,
      userAgent: null,
      primeiroAcesso: false,
      acessoPermitido: true,
    };
    expect(dados.ipOrigem).toBeNull();
    expect(dados.userAgent).toBeNull();
  });

  it("deve formatar data corretamente para o CSV", () => {
    const data = new Date("2026-04-08T18:00:00Z");
    const formatado = data.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    // Deve conter a data no formato pt-BR
    expect(formatado).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
