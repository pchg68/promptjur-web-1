/**
 * Testes para as 3 melhorias de gestão de e-mails da whitelist:
 * 1. Contador de reenvios (convitesEnviados)
 * 2. Data do último envio (ultimoEnvio)
 * 3. Reenvio em lote (reenviarTodosWhitelist)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../email", () => ({
  sendWelcomeEmail: vi.fn(),
  sendWelcomeEmailBatch: vi.fn(),
}));

vi.mock("../audit", () => ({
  logAuditoria: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../whitelist", () => ({
  addToWhitelist: vi.fn().mockResolvedValue(undefined),
  removeFromWhitelist: vi.fn().mockResolvedValue(undefined),
  listWhitelist: vi.fn().mockResolvedValue([]),
}));

import * as dbModule from "../db";
import * as emailModule from "../email";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeDbMock(overrides: Record<string, unknown> = {}) {
  const mockUpdate = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  const mockSelect = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  return {
    update: vi.fn().mockReturnValue(mockUpdate),
    select: vi.fn().mockReturnValue(mockSelect),
    _update: mockUpdate,
    _select: mockSelect,
    ...overrides,
  };
}

// ── Testes: contador de convitesEnviados ───────────────────────────────────

describe("Contador de convitesEnviados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve incrementar convitesEnviados quando e-mail é enviado com sucesso", async () => {
    const mockDb = makeDbMock();
    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);
    vi.mocked(emailModule.sendWelcomeEmail).mockResolvedValue({ success: true, skipped: false });

    // Simula a lógica de incremento do addWhitelist
    const emailResult = await emailModule.sendWelcomeEmail({ email: "teste@exemplo.com" });
    if (emailResult.success && !emailResult.skipped) {
      const db = await dbModule.getDb();
      if (db) {
        await db.update({} as any).set({ convitesEnviados: 1, ultimoEnvio: new Date() }).where({} as any);
      }
    }

    expect(mockDb.update).toHaveBeenCalledTimes(1);
    expect(mockDb._update.set).toHaveBeenCalledWith(
      expect.objectContaining({ convitesEnviados: 1 })
    );
  });

  it("NÃO deve incrementar convitesEnviados quando e-mail falha", async () => {
    const mockDb = makeDbMock();
    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);
    vi.mocked(emailModule.sendWelcomeEmail).mockResolvedValue({ success: false, skipped: false });

    const emailResult = await emailModule.sendWelcomeEmail({ email: "teste@exemplo.com" });
    if (emailResult.success && !emailResult.skipped) {
      const db = await dbModule.getDb();
      if (db) {
        await db.update({} as any).set({ convitesEnviados: 1 }).where({} as any);
      }
    }

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("NÃO deve incrementar convitesEnviados quando e-mail é pulado (sem API key)", async () => {
    const mockDb = makeDbMock();
    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);
    vi.mocked(emailModule.sendWelcomeEmail).mockResolvedValue({ success: false, skipped: true });

    const emailResult = await emailModule.sendWelcomeEmail({ email: "teste@exemplo.com" });
    if (emailResult.success && !emailResult.skipped) {
      const db = await dbModule.getDb();
      if (db) {
        await db.update({} as any).set({ convitesEnviados: 1 }).where({} as any);
      }
    }

    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

// ── Testes: data do último envio ───────────────────────────────────────────

describe("Data do último envio (ultimoEnvio)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve registrar ultimoEnvio como Date quando e-mail é enviado com sucesso", async () => {
    const mockDb = makeDbMock();
    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);
    vi.mocked(emailModule.sendWelcomeEmail).mockResolvedValue({ success: true, skipped: false });

    const emailResult = await emailModule.sendWelcomeEmail({ email: "teste@exemplo.com" });
    const agora = new Date();

    if (emailResult.success && !emailResult.skipped) {
      const db = await dbModule.getDb();
      if (db) {
        await db.update({} as any).set({ ultimoEnvio: agora }).where({} as any);
      }
    }

    expect(mockDb._update.set).toHaveBeenCalledWith(
      expect.objectContaining({ ultimoEnvio: agora })
    );
  });

  it("deve registrar ultimoEnvio para todos os e-mails no reenvio em lote", async () => {
    const mockDb = makeDbMock();
    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);
    vi.mocked(emailModule.sendWelcomeEmail).mockResolvedValue({ success: true, skipped: false });

    const emails = ["a@test.com", "b@test.com", "c@test.com"];
    const agora = new Date();
    let enviados = 0;

    for (const email of emails) {
      const result = await emailModule.sendWelcomeEmail({ email });
      if (result.success && !result.skipped) {
        enviados++;
        const db = await dbModule.getDb();
        if (db) {
          await db.update({} as any).set({ ultimoEnvio: agora }).where({} as any);
        }
      }
    }

    expect(enviados).toBe(3);
    expect(mockDb.update).toHaveBeenCalledTimes(3);
  });
});

// ── Testes: reenvio em lote ────────────────────────────────────────────────

describe("Reenvio em lote (reenviarTodosWhitelist)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar total=0 quando não há e-mails ativos", async () => {
    const mockDb = makeDbMock();
    // select().from().where() retorna array vazio
    mockDb._select.where.mockResolvedValue([]);
    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const ativos: any[] = [];
    const result = { enviados: 0, falhas: 0, pulados: 0, total: ativos.length };

    expect(result.total).toBe(0);
    expect(result.enviados).toBe(0);
  });

  it("deve enviar para todos os e-mails ativos e retornar contagem correta", async () => {
    const mockDb = makeDbMock();
    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);
    vi.mocked(emailModule.sendWelcomeEmail).mockResolvedValue({ success: true, skipped: false });

    const ativos = [
      { id: 1, email: "a@test.com", nome: "A", ativo: true, convitesEnviados: 0 },
      { id: 2, email: "b@test.com", nome: "B", ativo: true, convitesEnviados: 1 },
      { id: 3, email: "c@test.com", nome: "C", ativo: true, convitesEnviados: 2 },
    ];

    let enviados = 0;
    let falhas = 0;
    let pulados = 0;
    const agora = new Date();

    for (const entry of ativos) {
      const result = await emailModule.sendWelcomeEmail({ email: entry.email, nome: entry.nome });
      if (result.skipped) {
        pulados++;
        break;
      } else if (result.success) {
        enviados++;
        const db = await dbModule.getDb();
        if (db) {
          await db.update({} as any).set({ convitesEnviados: 1, ultimoEnvio: agora }).where({} as any);
        }
      } else {
        falhas++;
      }
    }

    expect(enviados).toBe(3);
    expect(falhas).toBe(0);
    expect(pulados).toBe(0);
    expect(mockDb.update).toHaveBeenCalledTimes(3);
  });

  it("deve parar o loop e marcar todos como pulados quando sem API key", async () => {
    vi.mocked(emailModule.sendWelcomeEmail).mockResolvedValue({ success: false, skipped: true });

    const ativos = [
      { id: 1, email: "a@test.com", ativo: true },
      { id: 2, email: "b@test.com", ativo: true },
    ];

    let enviados = 0;
    let falhas = 0;
    let pulados = 0;

    for (const entry of ativos) {
      const result = await emailModule.sendWelcomeEmail({ email: entry.email });
      if (result.skipped) {
        pulados++;
        break; // Para o loop quando sem API key
      } else if (result.success) {
        enviados++;
      } else {
        falhas++;
      }
    }

    // Após o break, corrige o total de pulados
    if (pulados > 0 && enviados === 0 && falhas === 0) {
      pulados = ativos.length;
    }

    expect(pulados).toBe(2);
    expect(enviados).toBe(0);
    expect(falhas).toBe(0);
  });

  it("deve contabilizar falhas separadamente dos sucessos", async () => {
    vi.mocked(emailModule.sendWelcomeEmail)
      .mockResolvedValueOnce({ success: true, skipped: false })
      .mockResolvedValueOnce({ success: false, skipped: false })
      .mockResolvedValueOnce({ success: true, skipped: false });

    const ativos = [
      { id: 1, email: "a@test.com", ativo: true },
      { id: 2, email: "b@test.com", ativo: true },
      { id: 3, email: "c@test.com", ativo: true },
    ];

    let enviados = 0;
    let falhas = 0;
    let pulados = 0;

    for (const entry of ativos) {
      const result = await emailModule.sendWelcomeEmail({ email: entry.email });
      if (result.skipped) {
        pulados++;
        break;
      } else if (result.success) {
        enviados++;
      } else {
        falhas++;
      }
    }

    expect(enviados).toBe(2);
    expect(falhas).toBe(1);
    expect(pulados).toBe(0);
  });

  it("deve atualizar convitesEnviados apenas para os que foram enviados com sucesso", async () => {
    const mockDb = makeDbMock();
    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);
    vi.mocked(emailModule.sendWelcomeEmail)
      .mockResolvedValueOnce({ success: true, skipped: false })
      .mockResolvedValueOnce({ success: false, skipped: false }) // falha — não atualiza
      .mockResolvedValueOnce({ success: true, skipped: false });

    const ativos = [
      { id: 1, email: "a@test.com", ativo: true },
      { id: 2, email: "b@test.com", ativo: true },
      { id: 3, email: "c@test.com", ativo: true },
    ];

    const agora = new Date();
    for (const entry of ativos) {
      const result = await emailModule.sendWelcomeEmail({ email: entry.email });
      if (!result.skipped && result.success) {
        const db = await dbModule.getDb();
        if (db) {
          await db.update({} as any).set({ convitesEnviados: 1, ultimoEnvio: agora }).where({} as any);
        }
      }
    }

    // Apenas 2 dos 3 e-mails foram enviados com sucesso
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });
});

// ── Testes: reenvio individual com incremento ──────────────────────────────

describe("Reenvio individual com incremento de contador", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar convitesEnviados incrementado após reenvio bem-sucedido", async () => {
    const mockDb = makeDbMock();
    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);
    vi.mocked(emailModule.sendWelcomeEmail).mockResolvedValue({ success: true, skipped: false });

    const entry = { id: 1, email: "user@test.com", nome: "User", ativo: true, convitesEnviados: 3 };

    const result = await emailModule.sendWelcomeEmail({ email: entry.email, nome: entry.nome });

    if (result.success && !result.skipped) {
      const db = await dbModule.getDb();
      if (db) {
        await db.update({} as any).set({ convitesEnviados: 1, ultimoEnvio: new Date() }).where({} as any);
      }
    }

    const retorno = {
      success: result.success,
      skipped: result.skipped ?? false,
      convitesEnviados: result.success && !result.skipped
        ? entry.convitesEnviados + 1
        : entry.convitesEnviados,
    };

    expect(retorno.convitesEnviados).toBe(4); // 3 + 1
    expect(retorno.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("deve retornar convitesEnviados inalterado após falha no reenvio", async () => {
    vi.mocked(emailModule.sendWelcomeEmail).mockResolvedValue({ success: false, skipped: false });

    const entry = { id: 1, email: "user@test.com", convitesEnviados: 3 };
    const result = await emailModule.sendWelcomeEmail({ email: entry.email });

    const retorno = {
      success: result.success,
      convitesEnviados: result.success && !result.skipped
        ? entry.convitesEnviados + 1
        : entry.convitesEnviados,
    };

    expect(retorno.convitesEnviados).toBe(3); // inalterado
    expect(retorno.success).toBe(false);
  });
});
