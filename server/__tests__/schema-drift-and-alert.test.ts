/**
 * Testes unitários para:
 * - schema-drift-monitor: verificação de divergência entre schema Drizzle e banco
 * - query-error-alert: alerta proativo de erros de query com threshold
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================
// MOCKS
// ============================================================

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ============================================================
// TESTES: schema-drift-monitor
// ============================================================

describe("schema-drift-monitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar ok=true quando todas as tabelas existem no banco", async () => {
    const { getDb } = await import("../db");
    const { SCHEMA_TABLES, checkSchemaDrift } = await import("../jobs/schema-drift-monitor");

    // Simular banco com todas as tabelas do schema + extras
    const allTables = [...SCHEMA_TABLES, "shared_prompts", "user_petitions"].map(
      (t) => ({ TABLE_NAME: t })
    );

    vi.mocked(getDb).mockResolvedValue({
      execute: vi.fn().mockResolvedValue([allTables]),
    } as any);

    const result = await checkSchemaDrift();

    expect(result.ok).toBe(true);
    expect(result.missingTables).toHaveLength(0);
    expect(result.extraTables).toEqual(
      expect.arrayContaining(["shared_prompts", "user_petitions"])
    );
  });

  it("deve detectar tabelas faltando no banco", async () => {
    const { getDb } = await import("../db");
    const { checkSchemaDrift } = await import("../jobs/schema-drift-monitor");

    // Banco sem admin_cards_arquivados e onboarding_emails
    const tablesWithoutMissing = [
      { TABLE_NAME: "users" },
      { TABLE_NAME: "prompts" },
      { TABLE_NAME: "notifications" },
      // admin_cards_arquivados e onboarding_emails propositalmente ausentes
    ];

    vi.mocked(getDb).mockResolvedValue({
      execute: vi.fn().mockResolvedValue([tablesWithoutMissing]),
    } as any);

    const result = await checkSchemaDrift();

    expect(result.ok).toBe(false);
    expect(result.missingTables).toContain("admin_cards_arquivados");
    expect(result.missingTables).toContain("onboarding_emails");
  });

  it("deve notificar o owner quando há tabelas faltando", async () => {
    const { getDb } = await import("../db");
    const { notifyOwner } = await import("../_core/notification");
    const { runSchemaDriftMonitor } = await import("../jobs/schema-drift-monitor");

    vi.mocked(getDb).mockResolvedValue({
      execute: vi.fn().mockResolvedValue([[{ TABLE_NAME: "users" }]]),
    } as any);

    await runSchemaDriftMonitor();

    expect(notifyOwner).toHaveBeenCalledOnce();
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Schema Drift"),
        content: expect.stringContaining("admin_cards_arquivados"),
      })
    );
  });

  it("não deve notificar quando schema está OK", async () => {
    const { getDb } = await import("../db");
    const { notifyOwner } = await import("../_core/notification");
    const { SCHEMA_TABLES, runSchemaDriftMonitor } = await import(
      "../jobs/schema-drift-monitor"
    );

    const allTables = [...SCHEMA_TABLES].map((t) => ({ TABLE_NAME: t }));

    vi.mocked(getDb).mockResolvedValue({
      execute: vi.fn().mockResolvedValue([allTables]),
    } as any);

    await runSchemaDriftMonitor();

    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("deve retornar ok=true quando DB está indisponível (não alarmar)", async () => {
    const { getDb } = await import("../db");
    const { checkSchemaDrift } = await import("../jobs/schema-drift-monitor");

    vi.mocked(getDb).mockResolvedValue(null as any);

    const result = await checkSchemaDrift();

    expect(result.ok).toBe(true);
    expect(result.missingTables).toHaveLength(0);
  });

  it("deve retornar ok=true quando execute lança exceção (não alarmar)", async () => {
    const { getDb } = await import("../db");
    const { checkSchemaDrift } = await import("../jobs/schema-drift-monitor");

    vi.mocked(getDb).mockResolvedValue({
      execute: vi.fn().mockRejectedValue(new Error("Connection refused")),
    } as any);

    const result = await checkSchemaDrift();

    expect(result.ok).toBe(true);
  });

  it("SCHEMA_TABLES deve conter as tabelas críticas corrigidas", async () => {
    const { SCHEMA_TABLES } = await import("../jobs/schema-drift-monitor");

    expect(SCHEMA_TABLES).toContain("admin_cards_arquivados");
    expect(SCHEMA_TABLES).toContain("onboarding_emails");
    expect(SCHEMA_TABLES).toContain("price_change_notices");
    expect(SCHEMA_TABLES).toContain("users");
  });
});

// ============================================================
// TESTES: query-error-alert
// ============================================================

describe("query-error-alert", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Limpar estado interno entre testes via reimport
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("não deve notificar abaixo do threshold (< 3 erros)", async () => {
    const { notifyOwner } = await import("../_core/notification");
    const { trackQueryError } = await import("../_core/query-error-alert");

    const msg = "Failed query: select `id` from `admin_cards_arquivados`";

    await trackQueryError(msg, "admin.listarCardsArquivados");
    await trackQueryError(msg, "admin.listarCardsArquivados");

    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("deve notificar ao atingir o threshold (3 erros em 1h)", async () => {
    const { notifyOwner } = await import("../_core/notification");
    const { trackQueryError } = await import("../_core/query-error-alert");

    const msg = "Failed query: select `id` from `tabela_teste_threshold`";

    await trackQueryError(msg, "admin.endpoint1");
    await trackQueryError(msg, "admin.endpoint2");
    await trackQueryError(msg, "admin.endpoint3");

    expect(notifyOwner).toHaveBeenCalledOnce();
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Query Error Alert"),
        content: expect.stringContaining("tabela_teste_threshold"),
      })
    );
  });

  it("deve respeitar o cooldown de 2h entre notificações", async () => {
    const { notifyOwner } = await import("../_core/notification");
    const { trackQueryError } = await import("../_core/query-error-alert");

    const msg = "Failed query: select `id` from `tabela_cooldown_test`";

    // Primeiro threshold
    await trackQueryError(msg, "path1");
    await trackQueryError(msg, "path2");
    await trackQueryError(msg, "path3");

    expect(notifyOwner).toHaveBeenCalledTimes(1);

    // Mais erros imediatamente (dentro do cooldown)
    await trackQueryError(msg, "path4");
    await trackQueryError(msg, "path5");

    // Não deve notificar novamente (cooldown ativo)
    expect(notifyOwner).toHaveBeenCalledTimes(1);
  });

  it("deve notificar novamente após o cooldown expirar", async () => {
    const { notifyOwner } = await import("../_core/notification");
    const { trackQueryError } = await import("../_core/query-error-alert");

    const msg = "Failed query: select `id` from `tabela_pos_cooldown`";

    // Primeiro threshold
    await trackQueryError(msg, "path1");
    await trackQueryError(msg, "path2");
    await trackQueryError(msg, "path3");

    expect(notifyOwner).toHaveBeenCalledTimes(1);

    // Avançar 3 horas (além do cooldown de 2h)
    vi.advanceTimersByTime(3 * 60 * 60 * 1000);

    // Novos erros após cooldown
    await trackQueryError(msg, "path4");
    await trackQueryError(msg, "path5");
    await trackQueryError(msg, "path6");

    expect(notifyOwner).toHaveBeenCalledTimes(2);
  });

  it("deve ignorar erros que não são de query", async () => {
    const { notifyOwner } = await import("../_core/notification");
    const { trackQueryError } = await import("../_core/query-error-alert");

    // Mensagem sem "Failed query" ou "doesn't exist"
    await trackQueryError("Validation error: campo obrigatório", "user.update");
    await trackQueryError("Validation error: campo obrigatório", "user.update");
    await trackQueryError("Validation error: campo obrigatório", "user.update");

    // Não deve notificar (fingerprint null)
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("deve retornar estatísticas corretas", async () => {
    const { trackQueryError, getQueryErrorStats } = await import(
      "../_core/query-error-alert"
    );

    const msg = "Failed query: select `id` from `tabela_stats_test`";

    await trackQueryError(msg, "admin.endpoint");
    await trackQueryError(msg, "admin.endpoint");

    const stats = getQueryErrorStats();

    expect(stats.length).toBeGreaterThan(0);
    const stat = stats.find((s) => s.fingerprint.includes("tabela_stats_test"));
    expect(stat).toBeDefined();
    expect(stat?.recentCount).toBe(2);
    expect(stat?.lastSeenAt).toBeInstanceOf(Date);
  });

  it("deve agrupar erros da mesma tabela independente do path", async () => {
    const { notifyOwner } = await import("../_core/notification");
    const { trackQueryError } = await import("../_core/query-error-alert");

    const table = "tabela_agrupamento_test";
    const msg = `Failed query: select \`id\`, \`nome\` from \`${table}\` where id = 1`;

    // Erros de endpoints diferentes mas mesma tabela
    await trackQueryError(msg, "admin.listar");
    await trackQueryError(msg, "admin.buscar");
    await trackQueryError(msg, "admin.contar");

    expect(notifyOwner).toHaveBeenCalledOnce();
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining(table),
      })
    );
  });
});
