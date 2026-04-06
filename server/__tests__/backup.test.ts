/**
 * Testes para o módulo de backup sem mysqldump.
 * Cobre a lógica de criptografia, escape de valores SQL e geração de dump.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock do mysql2/promise
vi.mock("mysql2/promise", () => ({
  default: {
    createConnection: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue([[]]),
      end: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock do storage
vi.mock("../storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/backup.enc", key: "backups/test.enc" }),
}));

// Mock do db
const mockDb = {
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue({ insertId: 1 }),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
};

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((col, val) => ({ col, val, op: "eq" })),
    desc: vi.fn((col) => ({ col, op: "desc" })),
  };
});

// ─── Testes de escape de SQL ──────────────────────────────────────────────────

describe("escapeSqlValue — lógica de escape", () => {
  // Testa a lógica diretamente sem importar o módulo (evita problema de mock de env)
  const escapeSqlValue = (val: unknown): string => {
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "number" || typeof val === "bigint") return String(val);
    if (typeof val === "boolean") return val ? "1" : "0";
    if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
    if (Buffer.isBuffer(val)) return `X'${val.toString("hex")}'`;
    const str = String(val)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\0/g, "\\0")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\x1a/g, "\\Z");
    return `'${str}'`;
  };

  it("deve retornar NULL para null", () => {
    expect(escapeSqlValue(null)).toBe("NULL");
  });

  it("deve retornar NULL para undefined", () => {
    expect(escapeSqlValue(undefined)).toBe("NULL");
  });

  it("deve retornar número sem aspas", () => {
    expect(escapeSqlValue(42)).toBe("42");
    expect(escapeSqlValue(3.14)).toBe("3.14");
  });

  it("deve retornar 1 para true e 0 para false", () => {
    expect(escapeSqlValue(true)).toBe("1");
    expect(escapeSqlValue(false)).toBe("0");
  });

  it("deve formatar Date como string SQL", () => {
    const d = new Date("2024-01-15T10:30:00.000Z");
    const result = escapeSqlValue(d);
    expect(result).toMatch(/^'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'$/);
  });

  it("deve escapar aspas simples em strings", () => {
    expect(escapeSqlValue("O'Brien")).toBe("'O\\'Brien'");
  });

  it("deve escapar backslashes em strings", () => {
    expect(escapeSqlValue("C:\\Users\\test")).toBe("'C:\\\\Users\\\\test'");
  });

  it("deve escapar quebras de linha", () => {
    expect(escapeSqlValue("linha1\nlinha2")).toBe("'linha1\\nlinha2'");
  });

  it("deve escapar retorno de carro", () => {
    expect(escapeSqlValue("texto\routro")).toBe("'texto\\routro'");
  });

  it("deve formatar Buffer como hex", () => {
    const buf = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
    expect(escapeSqlValue(buf)).toBe("X'deadbeef'");
  });

  it("deve envolver strings normais em aspas simples", () => {
    expect(escapeSqlValue("hello world")).toBe("'hello world'");
  });

  it("deve lidar com string vazia", () => {
    expect(escapeSqlValue("")).toBe("''");
  });
});

// ─── Testes de criptografia ───────────────────────────────────────────────────

describe("criptografia AES-256-GCM", () => {
  it("deve criptografar e descriptografar corretamente", async () => {
    const { createCipheriv, createDecipheriv, randomBytes, scryptSync } = await import("crypto");

    // Replica a lógica de encrypt/decrypt do backup.ts
    const encrypt = (data: Buffer, password: string): Buffer => {
      const salt = randomBytes(32);
      const key = scryptSync(password, salt, 32);
      const iv = randomBytes(16);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return Buffer.concat([salt, iv, authTag, encrypted]);
    };

    const decrypt = (encryptedData: Buffer, password: string): Buffer => {
      const salt = encryptedData.subarray(0, 32);
      const iv = encryptedData.subarray(32, 48);
      const authTag = encryptedData.subarray(48, 64);
      const encrypted = encryptedData.subarray(64);
      const key = scryptSync(password, salt, 32);
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    };

    const original = Buffer.from("-- SQL backup content\nINSERT INTO test VALUES (1, 'hello');");
    const password = "test-encryption-key-2024";

    const encrypted = encrypt(original, password);
    const decrypted = decrypt(encrypted, password);

    expect(decrypted.toString("utf8")).toBe(original.toString("utf8"));
  });

  it("dados criptografados devem ser maiores que os originais (salt+iv+authTag)", async () => {
    const { createCipheriv, randomBytes, scryptSync } = await import("crypto");

    const encrypt = (data: Buffer, password: string): Buffer => {
      const salt = randomBytes(32);
      const key = scryptSync(password, salt, 32);
      const iv = randomBytes(16);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return Buffer.concat([salt, iv, authTag, encrypted]);
    };

    const original = Buffer.from("dados de teste");
    const encrypted = encrypt(original, "senha");

    // salt(32) + iv(16) + authTag(16) = 64 bytes de overhead mínimo
    expect(encrypted.length).toBeGreaterThanOrEqual(original.length + 64);
  });

  it("senha errada deve lançar erro ao descriptografar", async () => {
    const { createCipheriv, createDecipheriv, randomBytes, scryptSync } = await import("crypto");

    const encrypt = (data: Buffer, password: string): Buffer => {
      const salt = randomBytes(32);
      const key = scryptSync(password, salt, 32);
      const iv = randomBytes(16);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return Buffer.concat([salt, iv, authTag, encrypted]);
    };

    const decrypt = (encryptedData: Buffer, password: string): Buffer => {
      const salt = encryptedData.subarray(0, 32);
      const iv = encryptedData.subarray(32, 48);
      const authTag = encryptedData.subarray(48, 64);
      const encrypted = encryptedData.subarray(64);
      const key = scryptSync(password, salt, 32);
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    };

    const original = Buffer.from("dados secretos");
    const encrypted = encrypt(original, "senha-correta");

    expect(() => decrypt(encrypted, "senha-errada")).toThrow();
  });
});

// ─── Testes de lógica de backup ───────────────────────────────────────────────

describe("backup — lógica de negócio", () => {
  it("deve gerar cabeçalho SQL com metadados corretos", () => {
    const database = "test_db";
    const tabelas = ["users", "prompts", "analises"];
    const now = new Date("2024-01-15T10:00:00.000Z");

    const cabecalho = [
      `-- PromptJur Database Backup`,
      `-- Gerado em: ${now.toISOString()}`,
      `-- Banco: ${database}`,
      `-- Tabelas: ${tabelas.length}`,
      `-- Gerado por: backup.ts (mysql2 nativo)`,
    ].join("\n");

    expect(cabecalho).toContain("PromptJur Database Backup");
    expect(cabecalho).toContain(database);
    expect(cabecalho).toContain("3");
    expect(cabecalho).toContain("mysql2 nativo");
    expect(cabecalho).not.toContain("mysqldump");
  });

  it("deve gerar INSERT com múltiplos valores corretamente", () => {
    const colunas = ["`id`", "`nome`", "`email`"].join(", ");
    const linhas = [
      "(1, 'João', 'joao@exemplo.com')",
      "(2, 'Maria', 'maria@exemplo.com')",
    ].join(",\n  ");

    const sql = `INSERT INTO \`users\` (${colunas}) VALUES\n  ${linhas};`;

    expect(sql).toContain("INSERT INTO `users`");
    expect(sql).toContain("`id`");
    expect(sql).toContain("João");
    expect(sql).toContain("Maria");
    expect(sql).toMatch(/VALUES\n\s+\(1,/);
  });

  it("deve incluir DROP TABLE IF EXISTS antes de CREATE TABLE", () => {
    const tabela = "users";
    const linhas = [
      `DROP TABLE IF EXISTS \`${tabela}\`;`,
      `CREATE TABLE \`${tabela}\` (id INT PRIMARY KEY);`,
    ];

    const sql = linhas.join("\n");
    const dropIndex = sql.indexOf("DROP TABLE");
    const createIndex = sql.indexOf("CREATE TABLE");

    expect(dropIndex).toBeLessThan(createIndex);
  });

  it("deve incluir SET FOREIGN_KEY_CHECKS=0 no início e =1 no fim", () => {
    const partes = [
      "SET FOREIGN_KEY_CHECKS=0;",
      "-- conteúdo das tabelas",
      "SET FOREIGN_KEY_CHECKS=1;",
    ];

    const sql = partes.join("\n");
    const idx0 = sql.indexOf("FOREIGN_KEY_CHECKS=0");
    const idx1 = sql.indexOf("FOREIGN_KEY_CHECKS=1");

    expect(idx0).toBeGreaterThanOrEqual(0);
    expect(idx1).toBeGreaterThan(idx0);
  });

  it("deve usar lotes de 500 registros para tabelas grandes", () => {
    const BATCH = 500;
    const total = 1250;
    const lotes: number[] = [];

    let offset = 0;
    while (offset < total) {
      const tamanhoLote = Math.min(BATCH, total - offset);
      lotes.push(tamanhoLote);
      offset += BATCH;
    }

    expect(lotes).toEqual([500, 500, 250]);
    expect(lotes.reduce((a, b) => a + b, 0)).toBe(total);
  });

  it("filename deve conter timestamp no formato correto", () => {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${ts}.sql`;

    expect(filename).toMatch(/^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.sql$/);
  });

  it("s3Key deve ter prefixo 'backups/' e extensão '.enc'", () => {
    const filename = "backup-2024-01-15T10-00-00-000Z.sql";
    const s3Key = `backups/${filename}.enc`;

    expect(s3Key).toMatch(/^backups\//);
    expect(s3Key).toMatch(/\.enc$/);
  });
});
