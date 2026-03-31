/**
 * Testes do job de expiração automática da whitelist
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock do módulo de banco de dados
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock do schema
vi.mock("../../drizzle/schema", () => ({
  accessWhitelist: {
    id: "id",
    email: "email",
    ativo: "ativo",
    expiresAt: "expiresAt",
  },
}));

// Mock do drizzle-orm/sql
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ type: "eq", col, val })),
  sql: Object.assign(
    vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      type: "sql",
      strings,
      values,
    })),
    { raw: vi.fn() }
  ),
}));

import { runWhitelistExpiryJob } from "../jobs/whitelist-expiry";
import { getDb } from "../db";

describe("runWhitelistExpiryJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve retornar 0 quando o banco não está disponível", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);

    const result = await runWhitelistExpiryJob();

    expect(result).toBe(0);
    expect(getDb).toHaveBeenCalledOnce();
  });

  it("deve retornar 0 quando não há entradas expiradas", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await runWhitelistExpiryJob();

    expect(result).toBe(0);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("deve desativar entradas expiradas e retornar a contagem", async () => {
    const expirados = [
      { id: 1, email: "a@test.com" },
      { id: 2, email: "b@test.com" },
    ];

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(expirados),
      update: vi.fn().mockReturnValue(mockUpdate),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await runWhitelistExpiryJob();

    expect(result).toBe(2);
    expect(mockDb.update).toHaveBeenCalledTimes(2);
    expect(mockUpdate.set).toHaveBeenCalledTimes(2);
    expect(mockUpdate.set).toHaveBeenCalledWith({ ativo: false });
  });

  it("deve logar as entradas desativadas", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const expirados = [{ id: 3, email: "c@test.com" }];

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(expirados),
      update: vi.fn().mockReturnValue(mockUpdate),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    await runWhitelistExpiryJob();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("c@test.com")
    );
  });
});
