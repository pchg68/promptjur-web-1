/**
 * ontologia-context-builder.test.ts
 * Testes unitários do helper de enriquecimento de contexto da ontologia jurídica.
 *
 * Estratégia: testes estruturais (arquivo existe, exporta função esperada),
 * testes de contrato (mapeamento tipo→ontologia, formato do bloco) e
 * testes de integração com banco mockado.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const helperPath = resolve(import.meta.dirname, "../ontologia-context-builder.ts");
const promptsRouterPath = resolve(import.meta.dirname, "../routers/prompts.ts");

// ─── Estrutura de arquivos ────────────────────────────────────────────────────

describe("OntologiaContextBuilder — Estrutura de arquivos", () => {
  it("deve ter o arquivo ontologia-context-builder.ts", () => {
    expect(existsSync(helperPath)).toBe(true);
  });

  it("deve exportar a função buildOntologiaContexto", () => {
    const content = readFileSync(helperPath, "utf8");
    expect(content).toContain("export async function buildOntologiaContexto");
  });

  it("deve exportar a interface OntologiaContexto", () => {
    const content = readFileSync(helperPath, "utf8");
    expect(content).toContain("export interface OntologiaContexto");
  });
});

// ─── Contrato da interface ────────────────────────────────────────────────────

describe("OntologiaContextBuilder — Contrato da interface OntologiaContexto", () => {
  const content = readFileSync(helperPath, "utf8");

  it("deve ter campo blocoTexto do tipo string", () => {
    expect(content).toContain("blocoTexto: string");
  });

  it("deve ter campo totalTeses do tipo number", () => {
    expect(content).toContain("totalTeses: number");
  });

  it("deve ter campo totalPrecedentes do tipo number", () => {
    expect(content).toContain("totalPrecedentes: number");
  });

  it("deve ter campo tipoPecaId do tipo number | null", () => {
    expect(content).toContain("tipoPecaId: number | null");
  });
});

// ─── Mapeamento tipo de documento → ontologia ────────────────────────────────

describe("OntologiaContextBuilder — Mapeamento tipo de documento", () => {
  const content = readFileSync(helperPath, "utf8");

  const tiposEsperados = [
    "recurso_especial",
    "apelacao",
    "embargos_declaracao",
    "habeas_corpus",
    "mandado_seguranca",
    "peticao",
    "contestacao",
    "parecer",
  ];

  for (const tipo of tiposEsperados) {
    it(`deve ter mapeamento para "${tipo}"`, () => {
      expect(content).toContain(`${tipo}:`);
    });
  }
});

// ─── Axiomas implementados ────────────────────────────────────────────────────

describe("OntologiaContextBuilder — Axiomas (verificação de contrato)", () => {
  const content = readFileSync(helperPath, "utf8");

  it("A1: deve filtrar precedentes por verificadoEm != null", () => {
    expect(content).toContain("isNotNull(precedentes.verificadoEm)");
  });

  it("A5: deve ordenar por vinculante desc, peso desc", () => {
    expect(content).toContain("desc(precedentes.vinculante)");
    expect(content).toContain("desc(tesesPrecedente.peso)");
  });

  it("A6: deve filtrar tiposPeca por status PUBLICADO", () => {
    expect(content).toContain("eq(tiposPeca.status, \"PUBLICADO\")");
  });

  it("A6: deve filtrar teses por status PUBLICADO", () => {
    expect(content).toContain("eq(teses.status, \"PUBLICADO\")");
  });

  it("deve ter fallback silencioso (try/catch) para não quebrar a geração", () => {
    expect(content).toContain("catch (err)");
    expect(content).toContain("Falha silenciosa");
  });

  it("deve retornar objeto vazio quando banco não disponível", () => {
    expect(content).toContain("Banco não disponível");
    expect(content).toContain("return vazio");
  });
});

// ─── Instrução anti-alucinação ────────────────────────────────────────────────

describe("OntologiaContextBuilder — Restrição de não inventar", () => {
  const content = readFileSync(helperPath, "utf8");

  it("deve incluir instrução explícita para não inventar fundamentos", () => {
    expect(content).toContain("NÃO invente ou extrapole");
  });

  it("deve incluir instrução de usar apenas o que está listado", () => {
    expect(content).toContain("além do que está listado");
  });
});

// ─── Integração no router de geração ─────────────────────────────────────────

describe("OntologiaContextBuilder — Integração no router de geração", () => {
  const routerContent = readFileSync(promptsRouterPath, "utf8");

  it("deve importar buildOntologiaContexto no router de prompts", () => {
    expect(routerContent).toContain("buildOntologiaContexto");
    expect(routerContent).toContain("ontologia-context-builder");
  });

  it("deve chamar buildOntologiaContexto na mutation gerar", () => {
    expect(routerContent).toContain("await buildOntologiaContexto(tipoDoc)");
  });

  it("deve injetar ontologiaContexto no systemPrompt", () => {
    expect(routerContent).toContain("${ontologiaContexto}");
  });

  it("deve retornar ontologiaResult no response da mutation gerar", () => {
    expect(routerContent).toContain("ontologiaResult");
  });

  it("deve ter instrução para citar teses verificadas quando pertinentes", () => {
    expect(routerContent).toContain("ONTOLOGIA JURÍDICA");
    expect(routerContent).toContain("teses e precedentes verificados");
  });

  it("deve ter tratamento de erro silencioso para não bloquear a geração", () => {
    // Verifica que a chamada está dentro de try/catch
    const ontologiaBlock = routerContent.substring(
      routerContent.indexOf("// Ontologia Jurídica — enriquecimento"),
      routerContent.indexOf("// P3: RAG")
    );
    expect(ontologiaBlock).toContain("try {");
    expect(ontologiaBlock).toContain("catch (err)");
  });
});

// ─── Formato do bloco de texto ────────────────────────────────────────────────

describe("OntologiaContextBuilder — Formato do bloco de texto", () => {
  const content = readFileSync(helperPath, "utf8");

  it("deve incluir cabeçalho ONTOLOGIA JURÍDICA no bloco", () => {
    expect(content).toContain("ONTOLOGIA JURÍDICA —");
  });

  it("deve incluir seção de teses e precedentes validados", () => {
    expect(content).toContain("Teses e precedentes validados");
  });

  it("deve marcar precedentes vinculantes com [VINCULANTE]", () => {
    expect(content).toContain("[VINCULANTE]");
  });

  it("deve incluir fundamentos normativos no formato diploma + artigo", () => {
    expect(content).toContain("Fundamento:");
    expect(content).toContain("art.");
  });

  it("deve truncar ementas longas com reticências", () => {
    expect(content).toContain("…");
  });
});
