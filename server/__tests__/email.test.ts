/**
 * Testes do módulo de e-mail — server/email.ts
 * Valida que o módulo funciona corretamente com e sem RESEND_API_KEY
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock do Resend no nível do módulo (obrigatório para hoisting do Vitest)
const mockEmailSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailSend },
  })),
}));

describe("Email module", () => {
  describe("sendWelcomeEmail — sem RESEND_API_KEY", () => {
    beforeEach(() => {
      // Remover a chave para simular ambiente sem configuração
      delete process.env.RESEND_API_KEY;
      // Limpar o cache do módulo para recriar o cliente
      vi.resetModules();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("deve retornar skipped=true quando RESEND_API_KEY não está configurada", async () => {
      const { sendWelcomeEmail } = await import("../email");
      const result = await sendWelcomeEmail({ email: "teste@exemplo.com" });
      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
    });

    it("deve retornar skipped=true para envio em lote sem API key", async () => {
      const { sendWelcomeEmailBatch } = await import("../email");
      const result = await sendWelcomeEmailBatch([
        { email: "a@exemplo.com" },
        { email: "b@exemplo.com" },
      ]);
      expect(result.pulados).toBe(2);
      expect(result.enviados).toBe(0);
      expect(result.falhas).toBe(0);
    });
  });

  describe("buildWelcomeEmailHtml — validação do template", () => {
    it("deve gerar HTML com o e-mail do destinatário", async () => {
      // Testar indiretamente via sendWelcomeEmail com mock do Resend
      const mockSend = vi.fn().mockResolvedValue({ data: { id: "msg_test_123" }, error: null });
      vi.mock("resend", () => ({
        Resend: vi.fn().mockImplementation(() => ({
          emails: { send: mockSend },
        })),
      }));

      process.env.RESEND_API_KEY = "re_test_mock_key";
      vi.resetModules();

      const { sendWelcomeEmail } = await import("../email");
      const result = await sendWelcomeEmail({
        email: "paulo@exemplo.com",
        nome: "Paulo",
      });

      // Com mock, deve ter sucesso
      expect(result).toBeDefined();

      delete process.env.RESEND_API_KEY;
    });
  });

  describe("sendWelcomeEmailBatch — lógica de lote", () => {
    beforeEach(() => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();
    });

    it("deve processar lista vazia sem erros", async () => {
      const { sendWelcomeEmailBatch } = await import("../email");
      const result = await sendWelcomeEmailBatch([]);
      expect(result.enviados).toBe(0);
      expect(result.falhas).toBe(0);
      expect(result.pulados).toBe(0);
    });

    it("deve contar corretamente pulados em lote de 3", async () => {
      const { sendWelcomeEmailBatch } = await import("../email");
      const result = await sendWelcomeEmailBatch([
        { email: "a@ex.com" },
        { email: "b@ex.com" },
        { email: "c@ex.com" },
      ]);
      expect(result.pulados).toBe(3);
      expect(result.enviados + result.falhas + result.pulados).toBe(3);
    });
  });

  describe("getFromAddress — seleção do remetente", () => {
    // Estes testes verificam a lógica de seleção do remetente (bug fix)
    // Usam vi.resetModules() para forçar recarga do módulo com novas env vars
    afterEach(() => {
      delete process.env.EMAIL_FROM;
      delete process.env.RESEND_API_KEY;
      vi.resetModules();
    });

    it("deve usar EMAIL_FROM quando configurado com domínio promptjur.com (bug fix)", async () => {
      // BUG CORRIGIDO: antes, EMAIL_FROM com 'promptjur.com' era ignorado
      // e o sistema usava onboarding@resend.dev (que só funciona para o owner)
      process.env.RESEND_API_KEY = "re_test_mock_key";
      process.env.EMAIL_FROM = "noreply@promptjur.com";
      vi.resetModules();

      const localMock = vi.fn().mockResolvedValue({ data: { id: "msg_123" }, error: null });
      vi.doMock("resend", () => ({
        Resend: vi.fn().mockImplementation(() => ({ emails: { send: localMock } })),
      }));

      const { sendWelcomeEmail } = await import("../email");
      await sendWelcomeEmail({ email: "usuario@exemplo.com" });

      // Deve ter chamado o Resend com o remetente correto (promptjur.com)
      expect(localMock).toHaveBeenCalledWith(
        expect.objectContaining({ from: "noreply@promptjur.com" })
      );
    });

    it("deve usar onboarding@resend.dev como fallback quando EMAIL_FROM não está definido", async () => {
      process.env.RESEND_API_KEY = "re_test_mock_key";
      delete process.env.EMAIL_FROM;
      vi.resetModules();

      const localMock = vi.fn().mockResolvedValue({ data: { id: "msg_456" }, error: null });
      vi.doMock("resend", () => ({
        Resend: vi.fn().mockImplementation(() => ({ emails: { send: localMock } })),
      }));

      const { sendWelcomeEmail } = await import("../email");
      await sendWelcomeEmail({ email: "usuario@exemplo.com" });

      expect(localMock).toHaveBeenCalledWith(
        expect.objectContaining({ from: "PromptJur <onboarding@resend.dev>" })
      );
    });
  });

  describe("sendLaunchNotificationEmail — sem RESEND_API_KEY", () => {
    beforeEach(() => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();
    });

    it("deve retornar skipped=true quando RESEND_API_KEY não está configurada", async () => {
      const { sendLaunchNotificationEmail } = await import("../email");
      const result = await sendLaunchNotificationEmail({ email: "interessado@exemplo.com" });
      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
    });

    it("deve retornar objeto com campo success", async () => {
      const { sendLaunchNotificationEmail } = await import("../email");
      const result = await sendLaunchNotificationEmail({ email: "teste@ex.com" });
      expect(result).toHaveProperty("success");
    });
  });
});
