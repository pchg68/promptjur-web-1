/**
 * Testes para o sistema de cache de validação de legislação.
 *
 * A suíte usa um banco em memória para validar o contrato do helper sem exigir
 * DATABASE_URL, MySQL/TiDB ou migrações reais no ambiente de teste.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const cacheStore = vi.hoisted(() => new Map<string, any>());
let nextId = 1;

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((column, value) => ({ op: "eq", column, value })),
    lt: vi.fn((column, value) => ({ op: "lt", column, value })),
  };
});

vi.mock("../server/db", () => ({
  getDb: vi.fn(async () => ({
    select: vi.fn(() => ({
      from: vi.fn(() => Object.assign(Array.from(cacheStore.values()), {
        where: vi.fn((condition: any) => ({
          limit: vi.fn(() => {
            if (condition?.op === "eq") {
              const found = cacheStore.get(String(condition.value).trim());
              return found ? [found] : [];
            }
            return [];
          }),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((entry: any) => ({
        onDuplicateKeyUpdate: vi.fn(({ set }: any) => {
          const citacao = String(entry.citacao).trim();
          const existing = cacheStore.get(citacao);
          cacheStore.set(citacao, {
            id: existing?.id ?? nextId++,
            ...existing,
            ...entry,
            ...set,
            citacao,
            createdAt: existing?.createdAt ?? new Date("2024-01-01T00:00:00.000Z"),
          });
          return Promise.resolve();
        }),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn((condition: any) => {
        if (condition?.op === "lt") {
          for (const [key, value] of cacheStore.entries()) {
            if (value.expiresAt && value.expiresAt < condition.value) {
              cacheStore.delete(key);
            }
          }
        }
        if (condition?.op === "eq") {
          for (const [key, value] of cacheStore.entries()) {
            if (value.id === condition.value) {
              cacheStore.delete(key);
            }
          }
        }
        return Promise.resolve();
      }),
    })),
  })),
}));

import { getCachedValidation, setCachedValidation, getCacheStatistics, cleanExpiredCache, populateCommonLaws } from "../server/db-legislacao-cache";

beforeEach(() => {
  cacheStore.clear();
  nextId = 1;
});

describe("Sistema de Cache de Legislação", () => {
  it("deve salvar e recuperar validação do cache", async () => {
    const citacao = "Lei 8.078/90";
    const tipo = "lei";
    const confiabilidade = "alta";
    const motivo = "Código de Defesa do Consumidor";
    const linkOficial = "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm";

    const saved = await setCachedValidation(citacao, tipo, confiabilidade, motivo, linkOficial);
    expect(saved).toBe(true);

    const cached = await getCachedValidation(citacao);
    expect(cached).not.toBeNull();
    expect(cached?.citacao).toBe(citacao);
    expect(cached?.tipo).toBe(tipo);
    expect(cached?.confiabilidade).toBe(confiabilidade);
    expect(cached?.motivo).toBe(motivo);
  });

  it("deve retornar estatísticas do cache", async () => {
    const stats = await getCacheStatistics();
    
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("porTipo");
    expect(stats).toHaveProperty("porConfiabilidade");
    expect(typeof stats.total).toBe("number");
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });

  it("deve popular cache com leis comuns", async () => {
    const count = await populateCommonLaws();
    
    expect(count).toBeGreaterThanOrEqual(40);
    
    const cdc = await getCachedValidation("Lei 8.078/90");
    expect(cdc).not.toBeNull();
    expect(cdc?.motivo).toContain("Consumidor");
    
    const lgpd = await getCachedValidation("Lei 13.709/2018");
    expect(lgpd).not.toBeNull();
    expect(lgpd?.motivo).toContain("LGPD");
  });

  it("deve limpar cache expirado", async () => {
    const removed = await cleanExpiredCache();
    
    expect(typeof removed).toBe("number");
    expect(removed).toBeGreaterThanOrEqual(0);
  });

  it("deve retornar null para citação não encontrada", async () => {
    const cached = await getCachedValidation("Lei Inexistente 99999/9999");
    expect(cached).toBeNull();
  });

  it("deve atualizar cache existente", async () => {
    const citacao = "Lei 10.406/2002";
    
    await setCachedValidation(citacao, "lei", "alta", "Código Civil v1", "http://example.com");
    await setCachedValidation(citacao, "lei", "alta", "Código Civil v2 atualizado", "http://planalto.gov.br");
    
    const cached = await getCachedValidation(citacao);
    expect(cached?.motivo).toBe("Código Civil v2 atualizado");
  });
});
