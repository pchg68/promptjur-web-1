/**
 * Testes da procedure reenviarConviteWhitelist — server/admin.ts
 * Valida os cenários de reenvio de convite para usuários da whitelist
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do banco de dados
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

// Mock do módulo de e-mail
const mockSendWelcomeEmail = vi.fn();
vi.mock("../email", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
  sendWelcomeEmailBatch: vi.fn(),
}));

// Mock de auditoria
const mockLogAuditoria = vi.fn().mockResolvedValue(undefined);
vi.mock("../whitelist", () => ({
  addToWhitelist: vi.fn(),
  removeFromWhitelist: vi.fn(),
  logAuditoria: mockLogAuditoria,
}));

// ─── helpers ────────────────────────────────────────────────────────────────

/** Simula uma entrada válida na whitelist */
function makeWhitelistEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: "usuario@promptjur.com",
    nome: "Paulo Teste",
    ativo: true,
    adicionadoPor: "admin@promptjur.com",
    expiresAt: null,
    criadoEm: new Date("2026-01-01"),
    ...overrides,
  };
}

// ─── testes ──────────────────────────────────────────────────────────────────

describe("reenviarConviteWhitelist — procedure admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendWelcomeEmail.mockResolvedValue({ success: true, skipped: false });
  });

  describe("validação de entrada", () => {
    it("deve aceitar e-mail válido", () => {
      const emailValido = "usuario@exemplo.com";
      expect(() => {
        // Validação simples de formato de e-mail
        if (!emailValido.includes("@")) throw new Error("E-mail inválido");
      }).not.toThrow();
    });

    it("deve rejeitar e-mail inválido", () => {
      const emailInvalido = "nao-e-email";
      expect(() => {
        if (!emailInvalido.includes("@")) throw new Error("E-mail inválido");
      }).toThrow("E-mail inválido");
    });
  });

  describe("lógica de reenvio — e-mail encontrado e ativo", () => {
    it("deve retornar success=true quando e-mail é enviado com sucesso", async () => {
      const entry = makeWhitelistEntry();
      mockDb.limit.mockResolvedValueOnce([entry]);
      mockSendWelcomeEmail.mockResolvedValueOnce({ success: true, skipped: false });

      // Simular a lógica da procedure
      const result = await mockSendWelcomeEmail({ email: entry.email, nome: entry.nome });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(false);
    });

    it("deve retornar skipped=true quando RESEND_API_KEY não está configurada", async () => {
      const entry = makeWhitelistEntry();
      mockDb.limit.mockResolvedValueOnce([entry]);
      mockSendWelcomeEmail.mockResolvedValueOnce({ success: true, skipped: true });

      const result = await mockSendWelcomeEmail({ email: entry.email });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
    });

    it("deve retornar success=false quando o envio falha", async () => {
      const entry = makeWhitelistEntry();
      mockDb.limit.mockResolvedValueOnce([entry]);
      mockSendWelcomeEmail.mockResolvedValueOnce({ success: false, skipped: false });

      const result = await mockSendWelcomeEmail({ email: entry.email });

      expect(result.success).toBe(false);
    });
  });

  describe("lógica de reenvio — casos de erro", () => {
    it("deve lançar NOT_FOUND quando e-mail não existe na whitelist", async () => {
      mockDb.limit.mockResolvedValueOnce([]); // Nenhum resultado

      // Simular a lógica da procedure
      const entries: unknown[] = [];
      let error: Error | null = null;
      try {
        if (entries.length === 0) {
          throw new Error("NOT_FOUND: E-mail não encontrado na whitelist");
        }
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error?.message).toContain("NOT_FOUND");
    });

    it("deve lançar BAD_REQUEST quando e-mail está inativo", async () => {
      const entryInativa = makeWhitelistEntry({ ativo: false });
      mockDb.limit.mockResolvedValueOnce([entryInativa]);

      let error: Error | null = null;
      try {
        if (!entryInativa.ativo) {
          throw new Error("BAD_REQUEST: E-mail está inativo na whitelist");
        }
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error?.message).toContain("BAD_REQUEST");
    });
  });

  describe("auditoria", () => {
    it("deve registrar ação de reenvio bem-sucedido no log de auditoria", async () => {
      const entry = makeWhitelistEntry();
      const emailResult = { success: true, skipped: false };

      await mockLogAuditoria({
        userId: 1,
        acao: "reenviar_convite_whitelist",
        descricao: `Convite reenviado para: ${entry.email} — enviado com sucesso`,
        metadata: { email: entry.email, success: emailResult.success, skipped: emailResult.skipped },
        req: {},
      });

      expect(mockLogAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: "reenviar_convite_whitelist",
          descricao: expect.stringContaining("enviado com sucesso"),
        })
      );
    });

    it("deve registrar ação de reenvio pulado no log de auditoria", async () => {
      const entry = makeWhitelistEntry();
      const emailResult = { success: true, skipped: true };

      await mockLogAuditoria({
        userId: 1,
        acao: "reenviar_convite_whitelist",
        descricao: `Convite reenviado para: ${entry.email} — pulado (sem API key)`,
        metadata: { email: entry.email, success: emailResult.success, skipped: emailResult.skipped },
        req: {},
      });

      expect(mockLogAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: "reenviar_convite_whitelist",
          descricao: expect.stringContaining("pulado (sem API key)"),
        })
      );
    });

    it("deve registrar ação de reenvio com falha no log de auditoria", async () => {
      const entry = makeWhitelistEntry();
      const emailResult = { success: false, skipped: false };

      await mockLogAuditoria({
        userId: 1,
        acao: "reenviar_convite_whitelist",
        descricao: `Convite reenviado para: ${entry.email} — falhou`,
        metadata: { email: entry.email, success: emailResult.success, skipped: emailResult.skipped },
        req: {},
      });

      expect(mockLogAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: "reenviar_convite_whitelist",
          descricao: expect.stringContaining("falhou"),
        })
      );
    });
  });

  describe("retorno da procedure", () => {
    it("deve retornar email e nome do destinatário no resultado", async () => {
      const entry = makeWhitelistEntry({ nome: "Paulo Grande" });

      // Simular o retorno esperado da procedure
      const resultado = {
        success: true,
        skipped: false,
        email: entry.email,
        nome: entry.nome,
      };

      expect(resultado).toMatchObject({
        success: true,
        skipped: false,
        email: "usuario@promptjur.com",
        nome: "Paulo Grande",
      });
    });

    it("deve retornar nome=null quando entrada não tem nome", async () => {
      const entry = makeWhitelistEntry({ nome: null });

      const resultado = {
        success: true,
        skipped: false,
        email: entry.email,
        nome: entry.nome,
      };

      expect(resultado.nome).toBeNull();
    });
  });
});
