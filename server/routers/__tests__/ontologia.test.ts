/**
 * ontologia.test.ts — Testes unitários do router de ontologia jurídica (JurisOS)
 *
 * Estratégia: testes estruturais (arquivo existe, exporta procedimentos esperados)
 * e testes de contrato (schema Drizzle contém as tabelas necessárias).
 * Não requerem conexão com banco de dados.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const routersDir = resolve(import.meta.dirname, "..");
const schemaPath = resolve(import.meta.dirname, "../../../drizzle/schema.ts");
const migrationPath = resolve(import.meta.dirname, "../../../drizzle/0047_ontologia_juridica.sql");
const seedPath = resolve(import.meta.dirname, "../../../scripts/seed-ontologia.mjs");
const runbookPath = resolve(import.meta.dirname, "../../../references/ONTOLOGIA-MIGRATION-RUNBOOK.md");
const rlsPath = resolve(import.meta.dirname, "../../../references/rls-ontologia.sql");

// ─── Estrutura de arquivos ────────────────────────────────────────────────────

describe("Ontologia Jurídica — Estrutura de arquivos", () => {
  it("deve ter o arquivo do router ontologia.ts", () => {
    expect(existsSync(resolve(routersDir, "ontologia.ts"))).toBe(true);
  });

  it("deve ter a migration SQL 0047_ontologia_juridica.sql", () => {
    expect(existsSync(migrationPath)).toBe(true);
  });

  it("deve ter o seed script seed-ontologia.mjs", () => {
    expect(existsSync(seedPath)).toBe(true);
  });

  it("deve ter o runbook de migração em references/", () => {
    expect(existsSync(runbookPath)).toBe(true);
  });

  it("deve ter o rls-ontologia.sql em references/", () => {
    expect(existsSync(rlsPath)).toBe(true);
  });
});

// ─── Schema Drizzle ───────────────────────────────────────────────────────────

describe("Ontologia Jurídica — Schema Drizzle", () => {
  const schema = readFileSync(schemaPath, "utf8");

  const expectedTables = [
    "ont_areas_direito",
    "ont_dispositivos",
    "ont_tipos_peca",
    "ont_requisitos_legais",
    "ont_institutos",
    "ont_teses",
    "ont_precedentes",
    "ont_teses_peca",
    "ont_teses_dispositivo",
    "ont_teses_precedente",
    "ont_institutos_dispositivo",
  ];

  for (const table of expectedTables) {
    it(`deve definir a tabela ${table}`, () => {
      expect(schema).toContain(`"${table}"`);
    });
  }

  it("deve exportar o tipo AreaDireito", () => {
    expect(schema).toContain("export type AreaDireito");
  });

  it("deve exportar o tipo TipoPeca", () => {
    expect(schema).toContain("export type TipoPeca");
  });

  it("deve exportar o tipo Tese", () => {
    expect(schema).toContain("export type Tese");
  });

  it("deve exportar o tipo Precedente", () => {
    expect(schema).toContain("export type Precedente");
  });

  it("deve ter enum de status com RASCUNHO, REVISAO, PUBLICADO", () => {
    expect(schema).toContain("RASCUNHO");
    expect(schema).toContain("REVISAO");
    expect(schema).toContain("PUBLICADO");
  });
});

// ─── Router — procedimentos canônicos ────────────────────────────────────────

describe("Ontologia Jurídica — Router (procedimentos canônicos)", () => {
  const routerContent = readFileSync(resolve(routersDir, "ontologia.ts"), "utf8");

  const expectedProcedures = [
    // Leitura pública
    "listarAreas",
    "listTiposPeca",
    "montarContexto",
    "buscarTeseCompleta",
    // Verificador (loop ancorado)
    "verificarCitacao",
    // Escrita admin
    "createTese",
    "linkTesePrecedente",
    "validarPrecedente",
    "setStatus",
    "adminListarTodos",
  ];

  for (const proc of expectedProcedures) {
    it(`deve expor o procedimento ${proc}`, () => {
      expect(routerContent).toContain(proc);
    });
  }

  it("deve usar publicProcedure para procedimentos de leitura pública", () => {
    expect(routerContent).toContain("publicProcedure");
  });

  it("deve usar protectedProcedure para verificarCitacao", () => {
    expect(routerContent).toContain("protectedProcedure");
  });

  it("deve definir adminProcedure com verificação de role admin", () => {
    expect(routerContent).toContain("adminProcedure");
    expect(routerContent).toContain("role !== \"admin\"");
  });
});

// ─── Axiomas implementados ────────────────────────────────────────────────────

describe("Ontologia Jurídica — Axiomas (verificação de contrato)", () => {
  const routerContent = readFileSync(resolve(routersDir, "ontologia.ts"), "utf8");

  it("A1: deve filtrar precedentes por verificadoEm != null no montarContexto", () => {
    expect(routerContent).toContain("isNotNull(precedentes.verificadoEm)");
  });

  it("A1: verificarCitacao deve checar verificadoEm e urlOficial", () => {
    expect(routerContent).toContain("FONTE_NAO_VALIDADA");
    expect(routerContent).toContain("verificadoEm");
    expect(routerContent).toContain("urlOficial");
  });

  it("A2: verificarCitacao deve checar aresta TesePrecedente", () => {
    expect(routerContent).toContain("PRECEDENTE_IMPERTINENTE");
    expect(routerContent).toContain("tesesPrecedente");
  });

  it("A3: verificarCitacao deve checar aresta TesePeca (cabimento)", () => {
    expect(routerContent).toContain("TESE_INCABIVEL");
    expect(routerContent).toContain("tesesPeca");
  });

  it("A5: montarContexto deve ordenar por vinculante desc, peso desc", () => {
    expect(routerContent).toContain("desc(precedentes.vinculante)");
    expect(routerContent).toContain("desc(tesesPrecedente.peso)");
  });

  it("A6: listTiposPeca deve filtrar status PUBLICADO para usuário comum", () => {
    expect(routerContent).toContain("eq(tiposPeca.status, \"PUBLICADO\")");
  });

  it("A6: montarContexto deve filtrar status PUBLICADO", () => {
    expect(routerContent).toContain("eq(tiposPeca.status, \"PUBLICADO\")");
    expect(routerContent).toContain("eq(teses.status, \"PUBLICADO\")");
  });

  it("nós devem nascer em RASCUNHO (createTese)", () => {
    expect(routerContent).toContain("status: \"RASCUNHO\"");
  });
});

// ─── Migration SQL ────────────────────────────────────────────────────────────

describe("Ontologia Jurídica — Migration SQL", () => {
  const sql = readFileSync(migrationPath, "utf8");

  it("deve criar a tabela ont_areas_direito", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS `ont_areas_direito`");
  });

  it("deve criar a tabela ont_teses", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS `ont_teses`");
  });

  it("deve criar a tabela ont_precedentes", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS `ont_precedentes`");
  });

  it("deve ter índice único tribunal+identificador para precedentes", () => {
    expect(sql).toContain("idx_prec_tribunal_id");
  });

  it("deve ter campo verificadoEm para axioma A1 (validação de precedentes)", () => {
    expect(sql).toContain("verificadoEm");
  });

  it("deve ter campo peso na tabela ont_teses_precedente (axioma A2)", () => {
    expect(sql).toContain("peso");
  });
});

// ─── Registro no routers.ts principal ────────────────────────────────────────

describe("Ontologia Jurídica — Registro no appRouter", () => {
  const mainRouters = readFileSync(
    resolve(import.meta.dirname, "../../routers.ts"),
    "utf8"
  );

  it("deve importar ontologiaRouter", () => {
    expect(mainRouters).toContain("ontologiaRouter");
  });

  it("deve registrar ontologia no appRouter", () => {
    expect(mainRouters).toContain("ontologia: ontologiaRouter");
  });
});

// ─── Documentação de referência ───────────────────────────────────────────────

describe("Ontologia Jurídica — Documentação de referência", () => {
  it("runbook deve mencionar os axiomas A1 e A6", () => {
    const runbook = readFileSync(runbookPath, "utf8");
    expect(runbook).toContain("A1");
    expect(runbook).toContain("A6");
  });

  it("rls-ontologia.sql deve ter policies para TipoPeca e Tese", () => {
    const rls = readFileSync(rlsPath, "utf8");
    expect(rls).toContain("tipopeca_select");
    expect(rls).toContain("tese_select");
  });

  it("rls-ontologia.sql deve ter rollback documentado", () => {
    const rls = readFileSync(rlsPath, "utf8");
    expect(rls).toContain("Rollback");
  });
});
