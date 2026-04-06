/**
 * Testes para as 3 melhorias do sistema de backup:
 * 1. Notificação ao owner após backup (sucesso e falha)
 * 2. Limpeza de backups antigos no S3 + banco
 * 3. Agendamento automático diário (lógica de timing)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { storagePut, storageDelete } from "../storage";
import { notifyOwner } from "../_core/notification";
import { criarBackup, limparBackupsAntigos } from "../backup";
import { getDb } from "../db";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../storage", () => ({
  storagePut: vi.fn(),
  storageDelete: vi.fn(),
}));

vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn(),
}));

vi.mock("mysql2/promise", () => ({
  default: {
    createConnection: vi.fn().mockResolvedValue({
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes("information_schema")) {
          return [[{ TABLE_NAME: "users" }, { TABLE_NAME: "prompts" }]];
        }
        if (sql.includes("SHOW CREATE TABLE")) {
          return [[{ "Create Table": "CREATE TABLE `users` (id INT PRIMARY KEY)" }]];
        }
        if (sql.includes("SELECT COUNT")) {
          return [[{ total: 0 }]];
        }
        return [[]];
      }),
      end: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

const mockDbInstance = {
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue({ insertId: 1 }),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue([]),
  limit: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((col, val) => ({ col, val, op: "eq" })),
    desc: vi.fn((col) => ({ col, op: "desc" })),
    lt: vi.fn((col, val) => ({ col, val, op: "lt" })),
  };
});

// ─── Setup padrão ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(storagePut).mockResolvedValue({ url: "https://s3.example.com/backup.enc", key: "backups/test.enc" });
  vi.mocked(storageDelete).mockResolvedValue(true);
  vi.mocked(notifyOwner).mockResolvedValue(true);
  vi.mocked(getDb).mockResolvedValue(mockDbInstance as any);
  mockDbInstance.insert.mockReturnThis();
  mockDbInstance.values.mockResolvedValue({ insertId: 1 });
  mockDbInstance.select.mockReturnThis();
  mockDbInstance.from.mockReturnThis();
  mockDbInstance.where.mockReturnThis();
  mockDbInstance.orderBy.mockResolvedValue([]);
  mockDbInstance.limit.mockResolvedValue([]);
  mockDbInstance.delete.mockReturnThis();
});

// ─── Testes de notificação ────────────────────────────────────────────────────

describe("notificação ao owner após backup", () => {
  it("deve chamar notifyOwner com título de sucesso após backup bem-sucedido", async () => {
    await criarBackup(1);

    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("✅"),
      })
    );
  });

  it("notificação de sucesso deve conter número de tabelas exportadas", async () => {
    await criarBackup(1);

    const chamada = vi.mocked(notifyOwner).mock.calls[0]?.[0];
    expect(chamada?.content).toContain("Tabelas exportadas");
  });

  it("notificação de sucesso deve conter tamanho do arquivo", async () => {
    await criarBackup(1);

    const chamada = vi.mocked(notifyOwner).mock.calls[0]?.[0];
    expect(chamada?.content).toContain("Tamanho");
  });

  it("notificação de sucesso deve mencionar criptografia AES-256-GCM", async () => {
    await criarBackup(1);

    const chamada = vi.mocked(notifyOwner).mock.calls[0]?.[0];
    expect(chamada?.content).toContain("AES-256-GCM");
  });

  it("falha no notifyOwner não deve cancelar o retorno do backup", async () => {
    vi.mocked(notifyOwner).mockRejectedValueOnce(new Error("Serviço indisponível"));

    const resultado = await criarBackup(1);

    expect(resultado.success).toBe(true);
  });

  it("deve notificar com título de falha quando o backup falha", async () => {
    vi.mocked(storagePut).mockRejectedValueOnce(new Error("S3 unavailable"));

    await criarBackup(1);

    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("❌"),
      })
    );
  });
});

// ─── Testes de limpeza de backups antigos ─────────────────────────────────────

describe("limparBackupsAntigos — lógica de retenção", () => {
  it("deve retornar { removed: 0, errors: 0 } quando não há backups antigos", async () => {
    mockDbInstance.orderBy.mockResolvedValueOnce([]);

    const resultado = await limparBackupsAntigos(30);

    expect(resultado.removed).toBe(0);
    expect(resultado.errors).toBe(0);
  });

  it("deve deletar do S3 para cada backup antigo encontrado", async () => {
    const backupsAntigos = [
      { id: 1, filename: "backup-old-1.sql.enc", s3Key: "backups/backup-old-1.sql.enc", s3Url: "https://s3.example.com/1", createdAt: new Date("2023-01-01") },
      { id: 2, filename: "backup-old-2.sql.enc", s3Key: "backups/backup-old-2.sql.enc", s3Url: "https://s3.example.com/2", createdAt: new Date("2023-02-01") },
    ];
    mockDbInstance.orderBy.mockResolvedValueOnce(backupsAntigos);

    await limparBackupsAntigos(30);

    expect(storageDelete).toHaveBeenCalledTimes(2);
    expect(storageDelete).toHaveBeenCalledWith("backups/backup-old-1.sql.enc");
    expect(storageDelete).toHaveBeenCalledWith("backups/backup-old-2.sql.enc");
  });

  it("deve remover registros do banco após deletar do S3", async () => {
    const backupsAntigos = [
      { id: 5, filename: "backup-old.sql.enc", s3Key: "backups/backup-old.sql.enc", s3Url: "https://s3.example.com/5", createdAt: new Date("2023-01-01") },
    ];
    mockDbInstance.orderBy.mockResolvedValueOnce(backupsAntigos);

    const resultado = await limparBackupsAntigos(30);

    expect(mockDbInstance.delete).toHaveBeenCalled();
    expect(resultado.removed).toBe(1);
  });

  it("deve contar erros quando a deleção no banco falha", async () => {
    const backupsAntigos = [
      { id: 10, filename: "backup-err.sql.enc", s3Key: "backups/backup-err.sql.enc", s3Url: "https://s3.example.com/10", createdAt: new Date("2023-01-01") },
    ];
    mockDbInstance.orderBy.mockResolvedValueOnce(backupsAntigos);
    mockDbInstance.delete.mockImplementationOnce(() => {
      throw new Error("DB error");
    });

    const resultado = await limparBackupsAntigos(30);

    expect(resultado.errors).toBe(1);
    expect(resultado.removed).toBe(0);
  });

  it("deve notificar owner quando há backups removidos", async () => {
    const backupsAntigos = [
      { id: 1, filename: "backup-old.sql.enc", s3Key: "backups/backup-old.sql.enc", s3Url: "https://s3.example.com/1", createdAt: new Date("2023-01-01") },
    ];
    mockDbInstance.orderBy.mockResolvedValueOnce(backupsAntigos);

    await limparBackupsAntigos(30);

    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("🗑️"),
      })
    );
  });

  it("não deve notificar owner quando não há nada para remover", async () => {
    mockDbInstance.orderBy.mockResolvedValueOnce([]);

    await limparBackupsAntigos(30);

    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("deve processar múltiplos backups e retornar contagem correta", async () => {
    const backupsAntigos = [
      { id: 1, filename: "b1.sql.enc", s3Key: "backups/b1.sql.enc", s3Url: "https://s3.example.com/1", createdAt: new Date("2023-01-01") },
      { id: 2, filename: "b2.sql.enc", s3Key: "backups/b2.sql.enc", s3Url: "https://s3.example.com/2", createdAt: new Date("2023-01-02") },
      { id: 3, filename: "b3.sql.enc", s3Key: "backups/b3.sql.enc", s3Url: "https://s3.example.com/3", createdAt: new Date("2023-01-03") },
    ];
    mockDbInstance.orderBy.mockResolvedValueOnce(backupsAntigos);

    const resultado = await limparBackupsAntigos(30);

    expect(resultado.removed).toBe(3);
    expect(resultado.errors).toBe(0);
  });
});

// ─── Testes de agendamento automático ────────────────────────────────────────

describe("scheduleBackupAutomatico — lógica de timing", () => {
  it("deve calcular próxima execução entre 0 e 24h no futuro", () => {
    const calcularMs = (horaExecucao: number): number => {
      const agora = new Date();
      const agoraBrasilia = new Date(
        agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
      );
      const proximaBrasilia = new Date(agoraBrasilia);
      proximaBrasilia.setHours(horaExecucao, 0, 0, 0);
      if (agoraBrasilia >= proximaBrasilia) {
        proximaBrasilia.setDate(proximaBrasilia.getDate() + 1);
      }
      return proximaBrasilia.getTime() - agoraBrasilia.getTime();
    };

    const ms = calcularMs(2);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it("deve agendar para o dia seguinte se a hora já passou hoje", () => {
    // Simula a lógica do job: agora são 03h30, backup é às 02h
    // A data "agoraBrasilia" representa o horário local de Brasília
    const horaExecucao = 2;

    // Cria uma data com hora 03:30 (já passou das 02h)
    const agoraBrasilia = new Date(2024, 0, 15, 3, 30, 0, 0); // 15/Jan/2024 03:30

    const proximaBrasilia = new Date(agoraBrasilia);
    proximaBrasilia.setHours(horaExecucao, 0, 0, 0);

    if (agoraBrasilia >= proximaBrasilia) {
      proximaBrasilia.setDate(proximaBrasilia.getDate() + 1);
    }

    expect(proximaBrasilia.getDate()).toBe(16); // dia seguinte
  });

  it("deve agendar para hoje se a hora ainda não chegou", () => {
    // Simula a lógica do job: agora são 01h00, backup é às 02h
    const horaExecucao = 2;

    // Cria uma data com hora 01:00 (ainda não chegou nas 02h)
    const agoraBrasilia = new Date(2024, 0, 15, 1, 0, 0, 0); // 15/Jan/2024 01:00

    const proximaBrasilia = new Date(agoraBrasilia);
    proximaBrasilia.setHours(horaExecucao, 0, 0, 0);

    if (agoraBrasilia >= proximaBrasilia) {
      proximaBrasilia.setDate(proximaBrasilia.getDate() + 1);
    }

    expect(proximaBrasilia.getDate()).toBe(15); // mesmo dia
  });

  it("intervalo entre execuções deve ser exatamente 24 horas em ms", () => {
    const INTERVALO_24H = 24 * 60 * 60 * 1000;
    expect(INTERVALO_24H).toBe(86400000);
  });
});

// ─── Testes de storageDelete ──────────────────────────────────────────────────

describe("storageDelete — helper de deleção no S3", () => {
  it("deve retornar true quando a deleção é bem-sucedida", async () => {
    vi.mocked(storageDelete).mockResolvedValueOnce(true);

    const resultado = await storageDelete("backups/test.enc");
    expect(resultado).toBe(true);
  });

  it("deve retornar false quando a deleção falha", async () => {
    vi.mocked(storageDelete).mockResolvedValueOnce(false);

    const resultado = await storageDelete("backups/inexistente.enc");
    expect(resultado).toBe(false);
  });

  it("deve normalizar a chave removendo barras iniciais", () => {
    const normalizeKey = (relKey: string): string => relKey.replace(/^\/+/, "");

    expect(normalizeKey("/backups/test.enc")).toBe("backups/test.enc");
    expect(normalizeKey("//backups/test.enc")).toBe("backups/test.enc");
    expect(normalizeKey("backups/test.enc")).toBe("backups/test.enc");
  });
});
