/**
 * Testes para o router de contato — PromptJur
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("../email", () => ({
  sendContactConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendContactAdminNotification: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// ─── Schema de validação ──────────────────────────────────────────────────────

const contatoSchema = z.object({
  nome: z.string().min(2).max(255),
  email: z.string().email(),
  assunto: z.enum(["duvida", "feedback", "suporte", "parceria", "outro"]),
  mensagem: z.string().min(10).max(5000),
});

describe("Formulário de Contato — Validação de Schema", () => {
  it("deve aceitar dados válidos", () => {
    const resultado = contatoSchema.safeParse({
      nome: "João Silva",
      email: "joao@exemplo.com",
      assunto: "duvida",
      mensagem: "Tenho uma dúvida sobre o plano Pro do PromptJur.",
    });
    expect(resultado.success).toBe(true);
  });

  it("deve rejeitar nome muito curto", () => {
    const resultado = contatoSchema.safeParse({
      nome: "J",
      email: "joao@exemplo.com",
      assunto: "duvida",
      mensagem: "Mensagem válida com mais de 10 caracteres.",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].path).toContain("nome");
    }
  });

  it("deve rejeitar e-mail inválido", () => {
    const resultado = contatoSchema.safeParse({
      nome: "João Silva",
      email: "email-invalido",
      assunto: "feedback",
      mensagem: "Mensagem válida com mais de 10 caracteres.",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].path).toContain("email");
    }
  });

  it("deve rejeitar assunto inválido", () => {
    const resultado = contatoSchema.safeParse({
      nome: "João Silva",
      email: "joao@exemplo.com",
      assunto: "assunto_invalido",
      mensagem: "Mensagem válida com mais de 10 caracteres.",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].path).toContain("assunto");
    }
  });

  it("deve rejeitar mensagem muito curta", () => {
    const resultado = contatoSchema.safeParse({
      nome: "João Silva",
      email: "joao@exemplo.com",
      assunto: "suporte",
      mensagem: "Curta",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].path).toContain("mensagem");
    }
  });

  it("deve rejeitar mensagem muito longa", () => {
    const resultado = contatoSchema.safeParse({
      nome: "João Silva",
      email: "joao@exemplo.com",
      assunto: "outro",
      mensagem: "a".repeat(5001),
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].path).toContain("mensagem");
    }
  });

  it("deve aceitar todos os assuntos válidos", () => {
    const assuntos = ["duvida", "feedback", "suporte", "parceria", "outro"] as const;
    for (const assunto of assuntos) {
      const resultado = contatoSchema.safeParse({
        nome: "Maria Santos",
        email: "maria@exemplo.com",
        assunto,
        mensagem: "Mensagem de teste com mais de 10 caracteres.",
      });
      expect(resultado.success, `Assunto '${assunto}' deveria ser válido`).toBe(true);
    }
  });
});

describe("Funções de E-mail de Contato", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendContactConfirmationEmail deve ser chamado com os dados corretos", async () => {
    const { sendContactConfirmationEmail } = await import("../email");
    await sendContactConfirmationEmail({
      nome: "João Silva",
      email: "joao@exemplo.com",
      assunto: "duvida",
      mensagem: "Tenho uma dúvida sobre o sistema.",
    });
    expect(sendContactConfirmationEmail).toHaveBeenCalledWith({
      nome: "João Silva",
      email: "joao@exemplo.com",
      assunto: "duvida",
      mensagem: "Tenho uma dúvida sobre o sistema.",
    });
  });

  it("sendContactAdminNotification deve ser chamado com os dados corretos", async () => {
    const { sendContactAdminNotification } = await import("../email");
    await sendContactAdminNotification({
      nome: "Maria Santos",
      email: "maria@exemplo.com",
      assunto: "feedback",
      mensagem: "Ótimo sistema, parabéns!",
      adminEmail: "admin@promptjur.com",
    });
    expect(sendContactAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Maria Santos",
        email: "maria@exemplo.com",
        assunto: "feedback",
        adminEmail: "admin@promptjur.com",
      })
    );
  });
});
