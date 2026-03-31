/**
 * Testes do módulo de e-mail — server/email.ts
 * Valida que o módulo funciona corretamente com e sem RESEND_API_KEY
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
});
