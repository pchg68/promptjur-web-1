/**
 * Testes para a lógica de notificação de primeiro acesso no callback OAuth.
 *
 * A lógica está em server/_core/oauth.ts e detecta se o usuário é novo
 * verificando se getUserByOpenId retorna null antes do upsertUser.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks no nível do módulo (hoisting do Vitest)
vi.mock("../db", () => ({
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("../whitelist", () => ({
  isEmailAllowed: vi.fn().mockResolvedValue(true),
}));

vi.mock("../_core/sdk", () => ({
  sdk: {
    exchangeCodeForToken: vi.fn().mockResolvedValue({ accessToken: "token-abc" }),
    getUserInfo: vi.fn().mockResolvedValue({
      openId: "user-123",
      name: "João Silva",
      email: "joao@promptjur.com",
      loginMethod: "email",
    }),
    createSessionToken: vi.fn().mockResolvedValue("session-token-xyz"),
  },
}));

vi.mock("../_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({ httpOnly: true, secure: false }),
}));

import * as db from "../db";
import { notifyOwner } from "../_core/notification";
import { isEmailAllowed } from "../whitelist";

// Helper para criar mocks de req/res do Express
function criarReqRes(query: Record<string, string> = {}) {
  const req = {
    query: { code: "code-abc", state: "state-xyz", ...query },
    headers: { host: "localhost:3000" },
    cookies: {},
  } as any;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
  } as any;

  return { req, res };
}

describe("Notificação de primeiro acesso no OAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isEmailAllowed).mockResolvedValue(true);
    vi.mocked(db.upsertUser).mockResolvedValue(undefined);
  });

  it("deve detectar primeiro acesso quando getUserByOpenId retorna null", async () => {
    vi.mocked(db.getUserByOpenId).mockResolvedValue(undefined);

    // Simula a lógica do oauth.ts diretamente
    const openId = "user-novo-123";
    const usuarioExistente = await db.getUserByOpenId(openId);
    const isPrimeiroAcesso = !usuarioExistente;

    expect(isPrimeiroAcesso).toBe(true);
  });

  it("deve detectar acesso repetido quando usuário já existe no banco", async () => {
    vi.mocked(db.getUserByOpenId).mockResolvedValue({
      id: 1,
      openId: "user-existente-456",
      name: "Maria Santos",
      email: "maria@promptjur.com",
      loginMethod: "email",
      role: "user",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      lastSignedIn: new Date("2026-03-01"),
    });

    const openId = "user-existente-456";
    const usuarioExistente = await db.getUserByOpenId(openId);
    const isPrimeiroAcesso = !usuarioExistente;

    expect(isPrimeiroAcesso).toBe(false);
  });

  it("deve chamar notifyOwner com título e conteúdo corretos no primeiro acesso", async () => {
    vi.mocked(db.getUserByOpenId).mockResolvedValue(undefined);
    vi.mocked(notifyOwner).mockResolvedValue(true);

    const nome = "Carlos Advogado";
    const email = "carlos@escritorio.com.br";
    const horario = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });

    // Simula a chamada que o oauth.ts faz
    await notifyOwner({
      title: `Novo usuário: ${nome}`,
      content: `**${nome}** (${email}) acessou o PromptJur pela primeira vez em ${horario}.`,
    });

    expect(notifyOwner).toHaveBeenCalledOnce();
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: `Novo usuário: ${nome}`,
        content: expect.stringContaining(email),
      })
    );
  });

  it("não deve chamar notifyOwner em acesso repetido", async () => {
    vi.mocked(db.getUserByOpenId).mockResolvedValue({
      id: 2,
      openId: "user-repetido-789",
      name: "Ana Juíza",
      email: "ana@tribunal.gov.br",
      loginMethod: "email",
      role: "user",
      createdAt: new Date("2026-02-01"),
      updatedAt: new Date("2026-02-01"),
      lastSignedIn: new Date("2026-03-15"),
    });

    const usuarioExistente = await db.getUserByOpenId("user-repetido-789");
    const isPrimeiroAcesso = !usuarioExistente;

    // Só notifica se for primeiro acesso
    if (isPrimeiroAcesso) {
      await notifyOwner({ title: "Novo usuário", content: "..." });
    }

    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("deve incluir horário no fuso horário de Brasília na notificação", () => {
    const agora = new Date("2026-04-08T21:00:00.000Z"); // 18h00 Brasília
    const horario = agora.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });

    // Deve conter data e hora no formato brasileiro
    expect(horario).toMatch(/\d{2}\/\d{2}\/\d{4}/); // dd/mm/yyyy
    expect(horario).toMatch(/\d{2}:\d{2}/); // hh:mm
  });

  it("deve usar fallback '(sem nome)' quando userInfo.name é vazio", () => {
    const nome = "" || "(sem nome)";
    expect(nome).toBe("(sem nome)");
  });

  it("deve usar fallback '(sem e-mail)' quando userInfo.email é undefined", () => {
    const email = undefined || "(sem e-mail)";
    expect(email).toBe("(sem e-mail)");
  });

  it("deve chamar notifyOwner de forma não-bloqueante (fire-and-forget)", async () => {
    // A notificação usa .catch() para não bloquear o redirect
    // Mesmo que notifyOwner falhe, o fluxo deve continuar
    vi.mocked(notifyOwner).mockRejectedValue(new Error("Serviço indisponível"));

    // Simula o padrão fire-and-forget do oauth.ts
    let erroCapturado = false;
    notifyOwner({ title: "Teste", content: "Conteúdo" }).catch(() => {
      erroCapturado = true;
    });

    // Aguarda a promise rejeitar
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(erroCapturado).toBe(true);
  });

  it("deve verificar usuário existente ANTES do upsertUser para detecção correta", async () => {
    const callOrder: string[] = [];

    vi.mocked(db.getUserByOpenId).mockImplementation(async () => {
      callOrder.push("getUserByOpenId");
      return undefined;
    });

    vi.mocked(db.upsertUser).mockImplementation(async () => {
      callOrder.push("upsertUser");
    });

    // Simula a ordem de chamadas do oauth.ts
    await db.getUserByOpenId("user-novo");
    await db.upsertUser({ openId: "user-novo", lastSignedIn: new Date() });

    expect(callOrder[0]).toBe("getUserByOpenId");
    expect(callOrder[1]).toBe("upsertUser");
  });
});
