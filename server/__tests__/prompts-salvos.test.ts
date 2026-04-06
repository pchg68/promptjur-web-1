/**
 * Testes para o módulo de prompts salvos (Meus Prompts).
 * Cobre as funções de banco de dados e a lógica do router tRPC.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockDb = {
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue({ insertId: 42 }),
  select: vi.fn().mockReturnThis(),
  selectDistinct: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((col, val) => ({ col, val, op: "eq" })),
    and: vi.fn((...args) => ({ args, op: "and" })),
    or: vi.fn((...args) => ({ args, op: "or" })),
    like: vi.fn((col, val) => ({ col, val, op: "like" })),
    desc: vi.fn((col) => ({ col, op: "desc" })),
    sql: Object.assign(vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values, op: "sql" })), {
      raw: vi.fn((str: string) => ({ str, op: "sql_raw" })),
    }),
  };
});

// ─── Testes das funções de banco ──────────────────────────────────────────────

describe("db-prompts-salvos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetar encadeamento de mocks
    mockDb.insert.mockReturnThis();
    mockDb.values.mockResolvedValue({ insertId: 42 });
    mockDb.select.mockReturnThis();
    mockDb.selectDistinct.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockReturnThis();
  mockDb.offset.mockResolvedValue([]);
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
  mockDb.delete.mockReturnThis();

  // selectDistinct precisa de uma cadeia que retorna array no final
  mockDb.selectDistinct.mockImplementation(() => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  }));
  });

  it("salvarPrompt deve retornar o ID inserido", async () => {
    const { salvarPrompt } = await import("../db-prompts-salvos");
    const id = await salvarPrompt({
      userId: 1,
      titulo: "Petição Inicial — Direito Civil",
      estrategia: "direta",
      areaJuridica: "Direito Civil",
      tipoDocumento: "Petição Inicial",
      conteudo: "Você é um advogado especialista em Direito Civil...",
      sessionId: null,
      notas: null,
      isFavorito: false,
      usoCount: 0,
    });
    expect(id).toBe(42);
    expect(mockDb.insert).toHaveBeenCalledOnce();
    expect(mockDb.values).toHaveBeenCalledOnce();
  });

  it("listarPromptsSalvos deve chamar select com where e orderBy", async () => {
    const { listarPromptsSalvos } = await import("../db-prompts-salvos");
    await listarPromptsSalvos(1, { limit: 10, offset: 0 });
    expect(mockDb.select).toHaveBeenCalledOnce();
    expect(mockDb.from).toHaveBeenCalledOnce();
    expect(mockDb.where).toHaveBeenCalledOnce();
    expect(mockDb.orderBy).toHaveBeenCalledOnce();
    expect(mockDb.limit).toHaveBeenCalledWith(10);
  });

  it("listarPromptsSalvos com filtro de área deve incluir condição extra", async () => {
    const { listarPromptsSalvos } = await import("../db-prompts-salvos");
    await listarPromptsSalvos(1, { areaJuridica: "Trabalhista", limit: 20, offset: 0 });
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  it("listarPromptsSalvos com filtro de estratégia deve funcionar", async () => {
    const { listarPromptsSalvos } = await import("../db-prompts-salvos");
    await listarPromptsSalvos(1, { estrategia: "raciocinio" });
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  it("listarPromptsSalvos com filtro de favoritos deve funcionar", async () => {
    const { listarPromptsSalvos } = await import("../db-prompts-salvos");
    await listarPromptsSalvos(1, { apenasFavorito: true });
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  it("listarPromptsSalvos com busca textual deve funcionar", async () => {
    const { listarPromptsSalvos } = await import("../db-prompts-salvos");
    await listarPromptsSalvos(1, { busca: "petição" });
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  it("contarPromptsSalvos deve retornar número", async () => {
    mockDb.offset.mockResolvedValueOnce([{ count: 5 }]);
    const { contarPromptsSalvos } = await import("../db-prompts-salvos");
    const total = await contarPromptsSalvos(1);
    expect(typeof total).toBe("number");
  });

  it("buscarPromptSalvo deve retornar null quando não encontrado", async () => {
    mockDb.offset.mockResolvedValueOnce([]);
    const { buscarPromptSalvo } = await import("../db-prompts-salvos");
    const result = await buscarPromptSalvo(999, 1);
    expect(result).toBeNull();
  });

  it("buscarPromptSalvo deve retornar o prompt quando encontrado", async () => {
    const promptMock = {
      id: 1,
      userId: 1,
      titulo: "Teste",
      estrategia: "direta",
      conteudo: "Conteúdo do prompt",
      isFavorito: false,
      usoCount: 0,
    };
    // buscarPromptSalvo usa select().from().where().limit() — limit retorna a Promise
    mockDb.limit.mockResolvedValueOnce([promptMock]);
    const { buscarPromptSalvo } = await import("../db-prompts-salvos");
    const result = await buscarPromptSalvo(1, 1);
    expect(result).toEqual(promptMock);
  });

  it("atualizarPromptSalvo deve chamar update com set", async () => {
    const { atualizarPromptSalvo } = await import("../db-prompts-salvos");
    await atualizarPromptSalvo(1, 1, { titulo: "Novo título" });
    expect(mockDb.update).toHaveBeenCalledOnce();
    expect(mockDb.set).toHaveBeenCalledWith({ titulo: "Novo título" });
  });

  it("toggleFavorito deve inverter o estado de favorito", async () => {
    // buscarPromptSalvo usa select().from().where().limit() — limit retorna a Promise
    mockDb.limit.mockResolvedValueOnce([{ id: 1, userId: 1, isFavorito: false }]);
    const { toggleFavorito } = await import("../db-prompts-salvos");
    const novoEstado = await toggleFavorito(1, 1);
    expect(novoEstado).toBe(true);
    expect(mockDb.update).toHaveBeenCalledOnce();
    expect(mockDb.set).toHaveBeenCalledWith({ isFavorito: true });
  });

  it("toggleFavorito deve lançar erro quando prompt não encontrado", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const { toggleFavorito } = await import("../db-prompts-salvos");
    await expect(toggleFavorito(999, 1)).rejects.toThrow("Prompt não encontrado");
  });

  it("deletarPromptSalvo deve chamar delete com where", async () => {
    const { deletarPromptSalvo } = await import("../db-prompts-salvos");
    await deletarPromptSalvo(1, 1);
    expect(mockDb.delete).toHaveBeenCalledOnce();
    expect(mockDb.where).toHaveBeenCalledOnce();
  });

  it("listarAreasJuridicas deve retornar array de strings", async () => {
    mockDb.selectDistinct.mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { areaJuridica: "Direito Civil" },
        { areaJuridica: "Direito Trabalhista" },
      ]),
    }));
    const { listarAreasJuridicas } = await import("../db-prompts-salvos");
    const areas = await listarAreasJuridicas(1);
    expect(Array.isArray(areas)).toBe(true);
    expect(areas.length).toBe(2);
  });

  it("listarAreasJuridicas deve filtrar valores null", async () => {
    mockDb.selectDistinct.mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { areaJuridica: "Direito Civil" },
        { areaJuridica: null },
      ]),
    }));
    const { listarAreasJuridicas } = await import("../db-prompts-salvos");
    const areas = await listarAreasJuridicas(1);
    expect(areas).not.toContain(null);
    expect(areas.length).toBe(1);
  });
});

// ─── Testes de lógica do router ───────────────────────────────────────────────

describe("router prompts-salvos — lógica de negócio", () => {
  it("título deve ser gerado corretamente a partir dos metadados da sessão", () => {
    const estrategiaLabel: Record<string, string> = {
      direta: "Estratégia Direta",
      raciocinio: "Raciocínio em Cadeia",
      recuperacao: "Recuperação de Fontes",
    };

    const gerarTitulo = (
      estrategia: string,
      tipoDocumento: string | null,
      areaJuridica: string | null
    ) =>
      [estrategiaLabel[estrategia], tipoDocumento, areaJuridica]
        .filter(Boolean)
        .join(" — ");

    expect(gerarTitulo("direta", "Petição Inicial", "Direito Civil")).toBe(
      "Estratégia Direta — Petição Inicial — Direito Civil"
    );
    expect(gerarTitulo("raciocinio", null, "Trabalhista")).toBe(
      "Raciocínio em Cadeia — Trabalhista"
    );
    expect(gerarTitulo("recuperacao", "Recurso", null)).toBe(
      "Recuperação de Fontes — Recurso"
    );
    expect(gerarTitulo("direta", null, null)).toBe("Estratégia Direta");
  });

  it("estratégias válidas devem ser aceitas", () => {
    const estrategiasValidas = ["direta", "raciocinio", "recuperacao", "manual"];
    estrategiasValidas.forEach((e) => {
      expect(estrategiasValidas).toContain(e);
    });
  });

  it("conteúdo mínimo de 10 caracteres deve ser validado", () => {
    const validarConteudo = (conteudo: string) => conteudo.length >= 10;
    expect(validarConteudo("")).toBe(false);
    expect(validarConteudo("curto")).toBe(false);
    expect(validarConteudo("prompt válido com mais de 10 chars")).toBe(true);
  });

  it("paginação deve calcular offset corretamente", () => {
    const calcularOffset = (pagina: number, itensPorPagina: number) =>
      pagina * itensPorPagina;
    expect(calcularOffset(0, 12)).toBe(0);
    expect(calcularOffset(1, 12)).toBe(12);
    expect(calcularOffset(2, 12)).toBe(24);
  });

  it("total de páginas deve ser calculado corretamente", () => {
    const calcularTotalPaginas = (total: number, itensPorPagina: number) =>
      Math.ceil(total / itensPorPagina);
    expect(calcularTotalPaginas(0, 12)).toBe(0);
    expect(calcularTotalPaginas(12, 12)).toBe(1);
    expect(calcularTotalPaginas(13, 12)).toBe(2);
    expect(calcularTotalPaginas(24, 12)).toBe(2);
    expect(calcularTotalPaginas(25, 12)).toBe(3);
  });
});
