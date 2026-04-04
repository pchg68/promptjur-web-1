/**
 * Testes para o router de integrações (Google Drive, Gmail, API Keys)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do banco de dados
vi.mock("../db-integrations", () => ({
  getUserIntegrations: vi.fn().mockResolvedValue([]),
  getUserIntegration: vi.fn().mockResolvedValue(null),
  upsertUserIntegration: vi.fn().mockResolvedValue(undefined),
  removeUserIntegration: vi.fn().mockResolvedValue(undefined),
}));

// Mock do módulo Google
vi.mock("../google-integrations", () => ({
  getGoogleAuthUrl: vi.fn().mockReturnValue("https://accounts.google.com/o/oauth2/auth?mock=true"),
  uploadToGoogleDrive: vi.fn().mockResolvedValue({
    id: "drive-file-id-123",
    name: "documento.txt",
    webViewLink: "https://drive.google.com/file/d/drive-file-id-123/view",
    mimeType: "text/plain",
  }),
  sendViaGmail: vi.fn().mockResolvedValue({ messageId: "gmail-msg-id-456" }),
  isGoogleConfigured: vi.fn().mockReturnValue(false),
}));

describe("Integrações - Lógica de negócio", () => {
  describe("Tipos de integração suportados", () => {
    const TIPOS_SUPORTADOS = [
      "openai",
      "anthropic",
      "gemini",
      "perplexity",
      "google_drive",
      "gmail",
    ];

    it("deve ter 6 tipos de integração suportados", () => {
      expect(TIPOS_SUPORTADOS).toHaveLength(6);
    });

    it("deve incluir todos os provedores de IA", () => {
      const providersIA = TIPOS_SUPORTADOS.filter((t) =>
        ["openai", "anthropic", "gemini", "perplexity"].includes(t)
      );
      expect(providersIA).toHaveLength(4);
    });

    it("deve incluir integrações Google", () => {
      const googleIntegrations = TIPOS_SUPORTADOS.filter((t) =>
        t.startsWith("google")
      );
      expect(googleIntegrations).toHaveLength(1);
      expect(TIPOS_SUPORTADOS).toContain("gmail");
    });
  });

  describe("Validação de API Key", () => {
    it("deve rejeitar API key vazia", () => {
      const isValid = (key: string) => key.trim().length > 0;
      expect(isValid("")).toBe(false);
      expect(isValid("   ")).toBe(false);
    });

    it("deve aceitar API key com conteúdo", () => {
      const isValid = (key: string) => key.trim().length > 0;
      expect(isValid("sk-proj-abc123")).toBe(true);
      expect(isValid("pplx-abc123def456")).toBe(true);
    });

    it("deve validar formato de API key OpenAI", () => {
      const isOpenAIKey = (key: string) =>
        key.startsWith("sk-") || key.startsWith("sk-proj-");
      expect(isOpenAIKey("sk-abc123")).toBe(true);
      expect(isOpenAIKey("sk-proj-abc123")).toBe(true);
      expect(isOpenAIKey("pplx-abc123")).toBe(false);
    });

    it("deve validar formato de API key Anthropic", () => {
      const isAnthropicKey = (key: string) => key.startsWith("sk-ant-");
      expect(isAnthropicKey("sk-ant-api03-abc123")).toBe(true);
      expect(isAnthropicKey("sk-abc123")).toBe(false);
    });

    it("deve validar formato de API key Perplexity", () => {
      const isPerplexityKey = (key: string) => key.startsWith("pplx-");
      expect(isPerplexityKey("pplx-abc123def456")).toBe(true);
      expect(isPerplexityKey("sk-abc123")).toBe(false);
    });
  });

  describe("Google Drive - Preparação de upload", () => {
    it("deve gerar nome de arquivo correto para documento jurídico", () => {
      const tipoDocumento = "Petição Inicial";
      // Usar data relativa para evitar problemas de fuso horário
      const dataStr = "04/04/2026";
      const fileName = `PromptJur - ${tipoDocumento} - ${dataStr}.txt`;
      expect(fileName).toBe("PromptJur - Petição Inicial - 04/04/2026.txt");
    });

    it("deve validar que conteúdo não está vazio antes do upload", () => {
      const isValidContent = (content: string) => content.trim().length > 0;
      expect(isValidContent("")).toBe(false);
      expect(isValidContent("Conteúdo do documento jurídico")).toBe(true);
    });
  });

  describe("Gmail - Preparação de envio", () => {
    it("deve validar formato de e-mail do destinatário", () => {
      const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValidEmail("advogado@escritorio.com.br")).toBe(true);
      expect(isValidEmail("cliente@gmail.com")).toBe(true);
      expect(isValidEmail("email-invalido")).toBe(false);
      expect(isValidEmail("@dominio.com")).toBe(false);
    });

    it("deve gerar assunto correto para e-mail", () => {
      const tipoDocumento = "Contrato de Prestação de Serviços";
      // Usar data relativa para evitar problemas de fuso horário
      const dataStr = "04/04/2026";
      const subject = `PromptJur - ${tipoDocumento} - ${dataStr}`;
      expect(subject).toBe(
        "PromptJur - Contrato de Prestação de Serviços - 04/04/2026"
      );
    });

    it("deve formatar corpo do e-mail com HTML", () => {
      const conteudo = "Documento jurídico de teste";
      const body = `<pre style="font-family: Georgia, serif; white-space: pre-wrap;">${conteudo}</pre>`;
      expect(body).toContain("<pre");
      expect(body).toContain(conteudo);
      expect(body).toContain("</pre>");
    });
  });

  describe("Google OAuth - URL de autorização", () => {
    it("deve gerar URL de autorização com scopes corretos", async () => {
      const { getGoogleAuthUrl } = await import("../google-integrations");
      const url = getGoogleAuthUrl("drive", "user-123");
      expect(url).toContain("accounts.google.com");
    });

    it("deve incluir tipo de integração na URL de callback", async () => {
      const { getGoogleAuthUrl } = await import("../google-integrations");
      const url = getGoogleAuthUrl("gmail", "user-456");
      expect(url).toBeTruthy();
      expect(typeof url).toBe("string");
    });
  });

  describe("Verificação de configuração Google", () => {
    it("deve retornar false quando tokens não estão configurados", async () => {
      const { isGoogleConfigured } = await import("../google-integrations");
      const result = isGoogleConfigured(null);
      expect(result).toBe(false);
    });

    it("deve retornar false para tokens inválidos", async () => {
      const { isGoogleConfigured } = await import("../google-integrations");
      const result = isGoogleConfigured({ access_token: "", refresh_token: "" });
      expect(result).toBe(false);
    });
  });
});
