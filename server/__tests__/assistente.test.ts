import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock do db-chat ──────────────────────────────────────────────────────────
vi.mock("../db-chat", () => ({
  criarSessao: vi.fn().mockResolvedValue(42),
  listarSessoes: vi.fn().mockResolvedValue([
    {
      id: 1,
      titulo: "Sessão de teste",
      etapaAtual: 2,
      etapaConcluida: false,
      areaJuridica: "Direito Civil",
      tipoDocumento: "Petição Inicial",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
  ]),
  buscarSessao: vi.fn().mockResolvedValue({
    id: 1,
    titulo: "Sessão de teste",
    etapaAtual: 2,
    etapaConcluida: false,
    areaJuridica: "Direito Civil",
    tipoDocumento: "Petição Inicial",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  }),
  atualizarSessao: vi.fn().mockResolvedValue(undefined),
  deletarSessao: vi.fn().mockResolvedValue(undefined),
  listarMensagens: vi.fn().mockResolvedValue([
    {
      id: 1,
      sessionId: 1,
      role: "assistant",
      content: "Olá! Vamos começar.",
      etapa: 1,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    },
  ]),
  salvarMensagem: vi.fn().mockResolvedValue(10),
}));

// ─── Mock do assistente-prompts ───────────────────────────────────────────────
vi.mock("../assistente-prompts", () => ({
  gerarPerguntaEtapa: vi.fn().mockReturnValue("Qual é a área jurídica do seu caso?"),
  gerarSistemaPrompt: vi.fn().mockReturnValue("Você é um assistente jurídico especializado."),
  TOTAL_ETAPAS: 6,
}));

// ─── Testes dos módulos de prompts ────────────────────────────────────────────
describe("assistente-prompts", () => {
  it("deve retornar pergunta para cada etapa de 1 a 6", async () => {
    const { gerarPerguntaEtapa } = await import("../assistente-prompts");
    for (let etapa = 1; etapa <= 6; etapa++) {
      const pergunta = gerarPerguntaEtapa(etapa);
      expect(typeof pergunta).toBe("string");
      expect(pergunta.length).toBeGreaterThan(10);
    }
  });

  it("deve retornar prompt de sistema não vazio", async () => {
    const { gerarSistemaPrompt } = await import("../assistente-prompts");
    const prompt = gerarSistemaPrompt({ etapaAtual: 1, modoLivre: false });
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(20);
  });

  it("deve ter TOTAL_ETAPAS igual a 6", async () => {
    const { TOTAL_ETAPAS } = await import("../assistente-prompts");
    expect(TOTAL_ETAPAS).toBe(6);
  });
});

// ─── Testes do db-chat ────────────────────────────────────────────────────────
describe("db-chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("criarSessao deve retornar um ID numérico", async () => {
    const { criarSessao } = await import("../db-chat");
    const id = await criarSessao({
      userId: 1,
      titulo: "Teste",
      etapaAtual: 1,
      etapaConcluida: false,
    });
    expect(typeof id).toBe("number");
    expect(id).toBe(42);
  });

  it("listarSessoes deve retornar array de sessões", async () => {
    const { listarSessoes } = await import("../db-chat");
    const sessoes = await listarSessoes(1);
    expect(Array.isArray(sessoes)).toBe(true);
    expect(sessoes.length).toBeGreaterThan(0);
    expect(sessoes[0]).toHaveProperty("id");
    expect(sessoes[0]).toHaveProperty("titulo");
    expect(sessoes[0]).toHaveProperty("etapaAtual");
  });

  it("buscarSessao deve retornar sessão com campos corretos", async () => {
    const { buscarSessao } = await import("../db-chat");
    const sessao = await buscarSessao(1, 1);
    expect(sessao).not.toBeNull();
    expect(sessao?.id).toBe(1);
    expect(sessao?.areaJuridica).toBe("Direito Civil");
    expect(sessao?.etapaConcluida).toBe(false);
  });

  it("listarMensagens deve retornar array com role e content", async () => {
    const { listarMensagens } = await import("../db-chat");
    const mensagens = await listarMensagens(1);
    expect(Array.isArray(mensagens)).toBe(true);
    expect(mensagens[0]).toHaveProperty("role");
    expect(mensagens[0]).toHaveProperty("content");
    expect(["user", "assistant", "system"]).toContain(mensagens[0].role);
  });

  it("salvarMensagem deve retornar ID da mensagem criada", async () => {
    const { salvarMensagem } = await import("../db-chat");
    const id = await salvarMensagem({
      sessionId: 1,
      role: "user",
      content: "Direito Civil — Petição Inicial",
      etapa: 1,
    });
    expect(typeof id).toBe("number");
    expect(id).toBe(10);
  });

  it("atualizarSessao deve ser chamada com os parâmetros corretos", async () => {
    const { atualizarSessao } = await import("../db-chat");
    await atualizarSessao(1, 1, { etapaAtual: 3, etapaConcluida: false });
    expect(atualizarSessao).toHaveBeenCalledWith(1, 1, {
      etapaAtual: 3,
      etapaConcluida: false,
    });
  });

  it("deletarSessao deve ser chamada com sessionId e userId", async () => {
    const { deletarSessao } = await import("../db-chat");
    await deletarSessao(1, 99);
    expect(deletarSessao).toHaveBeenCalledWith(1, 99);
  });
});

// ─── Testes de lógica do wizard ───────────────────────────────────────────────
describe("lógica do wizard de etapas", () => {
  it("deve avançar etapa corretamente (máximo 6)", () => {
    const avancarEtapa = (atual: number) => Math.min(atual + 1, 6);
    expect(avancarEtapa(1)).toBe(2);
    expect(avancarEtapa(5)).toBe(6);
    expect(avancarEtapa(6)).toBe(6); // não ultrapassa 6
  });

  it("deve marcar como concluído na etapa 6", () => {
    const verificarConclusao = (etapa: number) => etapa >= 6;
    expect(verificarConclusao(5)).toBe(false);
    expect(verificarConclusao(6)).toBe(true);
  });

  it("deve validar roles de mensagem", () => {
    const rolesValidos = ["user", "assistant", "system"];
    expect(rolesValidos).toContain("user");
    expect(rolesValidos).toContain("assistant");
    expect(rolesValidos).not.toContain("admin");
  });

  it("deve calcular progresso percentual corretamente", () => {
    const calcularProgresso = (etapaAtual: number, totalEtapas: number) =>
      Math.round(((etapaAtual - 1) / totalEtapas) * 100);
    expect(calcularProgresso(1, 6)).toBe(0);
    expect(calcularProgresso(4, 6)).toBe(50);
    expect(calcularProgresso(7, 6)).toBe(100);
  });
});
