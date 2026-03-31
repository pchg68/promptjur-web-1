/**
 * Testes unitários do router de tutoriais
 *
 * Verifica:
 * 1. Procedures públicas (listar, porId, estatisticasFeedback) funcionam sem autenticação
 * 2. Procedures protegidas (obterProgresso, obterFeedback, marcarConcluido, registrarFeedback)
 *    lançam UNAUTHORIZED quando chamadas sem sessão
 * 3. Regressão: nenhuma query protegida é disparada acidentalmente sem `enabled: isAuthenticated`
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock do módulo de banco de dados para isolar o router
vi.mock("../db", () => ({
  marcarTutorialConcluido: vi.fn().mockResolvedValue(undefined),
  obterProgressoTutoriais: vi.fn().mockResolvedValue([]),
  registrarFeedbackTutorial: vi.fn().mockResolvedValue(undefined),
  obterFeedbackUsuario: vi.fn().mockResolvedValue([]),
  obterEstatisticasFeedback: vi.fn().mockResolvedValue([]),
}));

// ─── Importações após mocks ───────────────────────────────────────────────────

import { tutoriais } from "@shared/tutoriais";

// ─── Helpers de contexto ──────────────────────────────────────────────────────

/** Contexto simulado de usuário autenticado */
const ctxAutenticado = {
  user: {
    id: 1,
    openId: "test-open-id",
    name: "Usuário Teste",
    email: "teste@example.com",
    role: "user" as const,
    subscriptionPlan: "free" as const,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: "google",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  },
  req: {} as any,
  res: {} as any,
};

/** Contexto simulado sem autenticação */
const ctxPublico = {
  user: null,
  req: {} as any,
  res: {} as any,
};

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("Router de Tutoriais — Procedures Públicas", () => {
  it("listar deve retornar todos os tutoriais sem autenticação", async () => {
    // Importar o appRouter após os mocks
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    const resultado = await caller.tutoriais.listar({});
    expect(Array.isArray(resultado)).toBe(true);
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.length).toBe(tutoriais.length);
  });

  it("listar deve filtrar por categoria", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    const resultado = await caller.tutoriais.listar({ categoria: "introducao" });
    expect(Array.isArray(resultado)).toBe(true);
    resultado.forEach((t) => expect(t.categoria).toBe("introducao"));
  });

  it("listar deve filtrar por nível", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    const resultado = await caller.tutoriais.listar({ nivel: "iniciante" });
    expect(Array.isArray(resultado)).toBe(true);
    resultado.forEach((t) => expect(t.nivel).toBe("iniciante"));
  });

  it("listar deve filtrar por busca textual", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    // Usa o título do primeiro tutorial como termo de busca
    const primeiraTutorial = tutoriais[0];
    const palavraChave = primeiraTutorial.titulo.split(" ")[0].toLowerCase();
    const resultado = await caller.tutoriais.listar({ busca: palavraChave });
    expect(Array.isArray(resultado)).toBe(true);
  });

  it("porId deve retornar tutorial existente sem autenticação", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    const primeiroId = tutoriais[0].id;
    const tutorial = await caller.tutoriais.porId(primeiroId);
    expect(tutorial).toBeDefined();
    expect(tutorial.id).toBe(primeiroId);
    expect(tutorial).toHaveProperty("titulo");
    expect(tutorial).toHaveProperty("conteudo");
    expect(tutorial).toHaveProperty("categoria");
    expect(tutorial).toHaveProperty("nivel");
  });

  it("porId deve lançar NOT_FOUND para ID inexistente", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    await expect(caller.tutoriais.porId("id-inexistente-xyz")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("estatisticasFeedback deve retornar array sem autenticação", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    const stats = await caller.tutoriais.estatisticasFeedback();
    expect(Array.isArray(stats)).toBe(true);
  });
});

describe("Router de Tutoriais — Procedures Protegidas (sem autenticação)", () => {
  it("obterProgresso deve lançar UNAUTHORIZED sem sessão", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    await expect(caller.tutoriais.obterProgresso()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("obterFeedback deve lançar UNAUTHORIZED sem sessão", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    await expect(caller.tutoriais.obterFeedback()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("marcarConcluido deve lançar UNAUTHORIZED sem sessão", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    const primeiroId = tutoriais[0].id;
    await expect(caller.tutoriais.marcarConcluido(primeiroId)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("registrarFeedback deve lançar UNAUTHORIZED sem sessão", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    await expect(
      caller.tutoriais.registrarFeedback({ tutorialId: tutoriais[0].id, util: true })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("Router de Tutoriais — Procedures Protegidas (com autenticação)", () => {
  it("obterProgresso deve retornar objeto de progresso para usuário autenticado", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxAutenticado as any);

    const progresso = await caller.tutoriais.obterProgresso();
    expect(progresso).toHaveProperty("tutoriaisConcluidosIds");
    expect(progresso).toHaveProperty("totalConcluidos");
    expect(progresso).toHaveProperty("totalTutoriais");
    expect(progresso).toHaveProperty("percentualConcluido");
    expect(Array.isArray(progresso.tutoriaisConcluidosIds)).toBe(true);
    expect(progresso.totalTutoriais).toBe(tutoriais.length);
  });

  it("obterFeedback deve retornar array de feedbacks para usuário autenticado", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxAutenticado as any);

    const feedbacks = await caller.tutoriais.obterFeedback();
    expect(Array.isArray(feedbacks)).toBe(true);
  });

  it("marcarConcluido deve executar com sucesso para usuário autenticado", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxAutenticado as any);

    const primeiroId = tutoriais[0].id;
    const resultado = await caller.tutoriais.marcarConcluido(primeiroId);
    expect(resultado).toEqual({ success: true });
  });

  it("registrarFeedback deve executar com sucesso para usuário autenticado", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxAutenticado as any);

    const resultado = await caller.tutoriais.registrarFeedback({
      tutorialId: tutoriais[0].id,
      util: true,
    });
    expect(resultado).toEqual({ success: true });
  });
});

describe("Regressão: nenhuma query protegida disparada sem enabled", () => {
  it("obterProgresso e obterFeedback devem lançar UNAUTHORIZED — não retornar HTML", async () => {
    const { appRouter } = await import("../routers");
    const caller = appRouter.createCaller(ctxPublico as any);

    // Verifica que o erro é TRPCError (UNAUTHORIZED), não um erro de parse de HTML
    const erroProgresso = await caller.tutoriais.obterProgresso().catch((e) => e);
    const erroFeedback = await caller.tutoriais.obterFeedback().catch((e) => e);

    expect(erroProgresso).toBeInstanceOf(TRPCError);
    expect(erroProgresso.code).toBe("UNAUTHORIZED");
    expect(erroProgresso.message).not.toMatch(/<!doctype/i);

    expect(erroFeedback).toBeInstanceOf(TRPCError);
    expect(erroFeedback.code).toBe("UNAUTHORIZED");
    expect(erroFeedback.message).not.toMatch(/<!doctype/i);
  });
});
