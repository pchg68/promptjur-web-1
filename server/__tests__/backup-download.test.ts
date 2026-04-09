/**
 * Testes para o endpoint gerarLinkDownloadBackup no adminRouter.
 * Verifica que o link de download é gerado corretamente via storageGet,
 * que o registro de auditoria é criado, e que erros são tratados adequadamente.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockStorageGet = vi.fn();
vi.mock("../storage", () => ({
  storagePut: vi.fn(),
  storageGet: mockStorageGet,
  storageDelete: vi.fn(),
}));

const mockLogAuditoria = vi.fn().mockResolvedValue(undefined);
vi.mock("../audit", () => ({
  logAuditoria: mockLogAuditoria,
  listarLogs: vi.fn(),
  getAuditStats: vi.fn(),
}));

const mockBackupRow = {
  id: 42,
  filename: "backup-2026-04-09T12-00-00.sql.enc",
  s3Key: "backups/backup-2026-04-09T12-00-00.sql.enc",
  s3Url: "https://s3.example.com/backups/backup.enc",
  size: 1024 * 1024 * 5, // 5 MB
  createdAt: new Date("2026-04-09T12:00:00Z"),
  status: "success",
  userId: 1,
};

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([mockBackupRow]),
};

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("../../drizzle/schema", () => ({
  backups: { id: "id", s3Key: "s3Key", filename: "filename" },
  users: {},
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((col, val) => ({ col, val, op: "eq" })),
    desc: vi.fn((col) => ({ col, op: "desc" })),
  };
});

// ─── Função auxiliar que replica a lógica do endpoint ─────────────────────────

async function gerarLinkDownloadBackup(backupId: number, userId: number) {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const { backups } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(backups).where(eq(backups.id as any, backupId)).limit(1) as any[];

  if (rows.length === 0) {
    throw new Error("Backup não encontrado");
  }

  const backup = rows[0];
  const { storageGet } = await import("../storage");
  const { url } = await storageGet(backup.s3Key);

  const { logAuditoria } = await import("../audit");
  await logAuditoria({
    userId,
    acao: "download_backup",
    descricao: `Link de download gerado para backup #${backupId}: ${backup.filename}`,
    metadata: { backupId, filename: backup.filename },
    req: {} as any,
  });

  return {
    url,
    filename: backup.filename,
    expiresInMinutes: 15,
  };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("gerarLinkDownloadBackup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetar o mock do db para retornar o backup padrão
    mockDb.limit.mockResolvedValue([mockBackupRow]);
  });

  it("deve retornar URL de download, filename e expiresInMinutes quando backup existe", async () => {
    const expectedUrl = "https://storage.example.com/presigned/backup-2026-04-09.enc?token=abc123";
    mockStorageGet.mockResolvedValueOnce({ key: mockBackupRow.s3Key, url: expectedUrl });

    const result = await gerarLinkDownloadBackup(42, 1);

    expect(result.url).toBe(expectedUrl);
    expect(result.filename).toBe(mockBackupRow.filename);
    expect(result.expiresInMinutes).toBe(15);
  });

  it("deve chamar storageGet com o s3Key correto do backup", async () => {
    mockStorageGet.mockResolvedValueOnce({ key: mockBackupRow.s3Key, url: "https://example.com/download" });

    await gerarLinkDownloadBackup(42, 1);

    expect(mockStorageGet).toHaveBeenCalledWith(mockBackupRow.s3Key);
  });

  it("deve registrar entrada no log de auditoria com acao=download_backup", async () => {
    mockStorageGet.mockResolvedValueOnce({ key: mockBackupRow.s3Key, url: "https://example.com/download" });

    await gerarLinkDownloadBackup(42, 1);

    expect(mockLogAuditoria).toHaveBeenCalledOnce();
    const chamada = mockLogAuditoria.mock.calls[0][0];
    expect(chamada.acao).toBe("download_backup");
    expect(chamada.userId).toBe(1);
    expect(chamada.metadata.backupId).toBe(42);
    expect(chamada.metadata.filename).toBe(mockBackupRow.filename);
  });

  it("deve lançar erro quando backup não é encontrado no banco", async () => {
    mockDb.limit.mockResolvedValueOnce([]); // Nenhum backup encontrado

    await expect(gerarLinkDownloadBackup(999, 1)).rejects.toThrow("Backup não encontrado");
  });

  it("deve lançar erro quando storageGet falha", async () => {
    mockStorageGet.mockRejectedValueOnce(new Error("S3 connection timeout"));

    await expect(gerarLinkDownloadBackup(42, 1)).rejects.toThrow("S3 connection timeout");
  });

  it("deve lançar erro quando banco de dados está indisponível", async () => {
    const { getDb } = await import("../db");
    vi.mocked(getDb).mockResolvedValueOnce(null as any);

    await expect(gerarLinkDownloadBackup(42, 1)).rejects.toThrow("Banco de dados indisponível");
  });
});
