import { describe, it, expect } from "vitest";

// ─── Personas Jurídicas ─────────────────────────────────────────────────────
import {
  PERSONAS_JURIDICAS,
  getPersonaById,
  getPersonasParaArea,
  buildPersonaPromptFragment,
} from "../personas-juridicas";

describe("Personas Jurídicas (P1)", () => {
  it("deve ter pelo menos 5 personas definidas", () => {
    expect(PERSONAS_JURIDICAS.length).toBeGreaterThanOrEqual(5);
  });

  it("cada persona deve ter id, nome, descricao, icone e areasRelevantes", () => {
    for (const p of PERSONAS_JURIDICAS) {
      expect(p.id).toBeTruthy();
      expect(p.nome).toBeTruthy();
      expect(p.descricao).toBeTruthy();
      expect(p.icone).toBeTruthy();
      expect(Array.isArray(p.areasRelevantes)).toBe(true);
      expect(p.areasRelevantes.length).toBeGreaterThan(0);
    }
  });

  it("getPersonaById deve retornar persona correta", () => {
    const p = getPersonaById("advogado_tributarista");
    expect(p).toBeDefined();
    expect(p?.nome).toContain("Tributarista");
  });

  it("getPersonaById deve retornar undefined para id inexistente", () => {
    expect(getPersonaById("inexistente")).toBeUndefined();
  });

  it("getPersonasParaArea deve filtrar personas relevantes", () => {
    const penalistas = getPersonasParaArea("Penal");
    expect(penalistas.length).toBeGreaterThan(0);
    // Deve incluir o criminalista
    expect(penalistas.some(p => p.id === "advogado_penalista")).toBe(true);
  });

  it("buildPersonaPromptFragment deve retornar string vazia sem persona", () => {
    expect(buildPersonaPromptFragment(undefined)).toBe("");
    expect(buildPersonaPromptFragment("")).toBe("");
  });

  it("buildPersonaPromptFragment deve retornar fragmento com persona válida", () => {
    const fragment = buildPersonaPromptFragment("advogado_tributarista");
    expect(fragment).toContain("PERSONA");
    expect(fragment.length).toBeGreaterThan(20);
  });
});

// ─── Chain of Thought ────────────────────────────────────────────────────────
import {
  ETAPAS_RACIOCINIO,
  buildCoTFragment,
} from "../chain-of-thought";

describe("Chain of Thought Jurídico (P1)", () => {
  it("deve ter pelo menos 5 etapas definidas", () => {
    expect(ETAPAS_RACIOCINIO.length).toBeGreaterThanOrEqual(5);
  });

  it("cada etapa deve ter id, nome, descricao e instrucao", () => {
    for (const e of ETAPAS_RACIOCINIO) {
      expect(e.numero).toBeTruthy();
      expect(e.titulo).toBeTruthy();
      expect(e.descricao).toBeTruthy();
      expect(e.icone).toBeTruthy();
    }
  });

  it("buildCoTFragment deve retornar string vazia quando desativado", () => {
    expect(buildCoTFragment(false)).toBe("");
  });

  it("buildCoTFragment deve retornar fragmento quando ativado", () => {
    const fragment = buildCoTFragment(true);
    expect(fragment).toContain("MODO RACIOC\u00cdNIO JUR\u00cdDICO");
    expect(fragment.length).toBeGreaterThan(50);
  });
});

// ─── Few-Shot Examples ───────────────────────────────────────────────────────
import {
  FEW_SHOT_EXAMPLES_EXPANDIDOS,
  getFewShotExamples,
  buildFewShotFragment,
} from "../few-shot-examples";

describe("Few-Shot Examples Expandidos (P2)", () => {
  it("deve ter pelo menos 5 exemplos definidos", () => {
    expect(FEW_SHOT_EXAMPLES_EXPANDIDOS.length).toBeGreaterThanOrEqual(5);
  });

  it("cada exemplo deve ter tipoDocumento, titulo, exemplo e qualidade", () => {
    for (const e of FEW_SHOT_EXAMPLES_EXPANDIDOS) {
      expect(e.tipoDocumento).toBeTruthy();
      expect(e.titulo).toBeTruthy();
      expect(e.exemplo).toBeTruthy();
      expect(["exemplar", "bom"]).toContain(e.qualidade);
    }
  });

  it("getFewShotExamples deve retornar exemplos para tipo existente", () => {
    const exemplos = getFewShotExamples("agravo");
    expect(exemplos.length).toBeGreaterThan(0);
  });

  it("getFewShotExamples deve retornar array vazio para tipo inexistente", () => {
    expect(getFewShotExamples("inexistente")).toHaveLength(0);
  });

  it("buildFewShotFragment deve retornar string vazia para tipo inexistente", () => {
    expect(buildFewShotFragment("inexistente")).toBe("");
  });

  it("buildFewShotFragment deve retornar fragmento para tipo existente", () => {
    const fragment = buildFewShotFragment("agravo");
    expect(fragment.length).toBeGreaterThan(20);
  });
});

// ─── Briefing Jurídico ──────────────────────────────────────────────────────
import {
  CAMPOS_BRIEFING,
  montarContextoBriefing,
  calcularCompletudeBriefing,
} from "../briefing-juridico";

describe("Briefing Jurídico Estruturado (P1)", () => {
  it("deve ter pelo menos 8 campos definidos", () => {
    expect(CAMPOS_BRIEFING.length).toBeGreaterThanOrEqual(8);
  });

  it("campos obrigatórios devem existir", () => {
    const obrigatorios = CAMPOS_BRIEFING.filter(c => c.obrigatorio);
    expect(obrigatorios.length).toBeGreaterThanOrEqual(3);
    const ids = obrigatorios.map(c => c.id);
    expect(ids).toContain("parteAtiva");
    expect(ids).toContain("fatosRelevantes");
    expect(ids).toContain("pretensao");
  });

  it("montarContextoBriefing deve montar texto estruturado", () => {
    const ctx = montarContextoBriefing({
      parteAtiva: "João da Silva",
      fatosRelevantes: "Fatos do caso",
      pretensao: "Indenização",
    });
    expect(ctx).toContain("PARTE ATIVA");
    expect(ctx).toContain("João da Silva");
    expect(ctx).toContain("FATOS RELEVANTES");
  });

  it("montarContextoBriefing deve ignorar campos vazios", () => {
    const ctx = montarContextoBriefing({
      parteAtiva: "João",
      partePassiva: "",
      fatosRelevantes: "  ",
    });
    expect(ctx).toContain("PARTE ATIVA");
    expect(ctx).not.toContain("PARTE PASSIVA");
    expect(ctx).not.toContain("FATOS RELEVANTES");
  });

  it("calcularCompletudeBriefing deve retornar 0% para dados vazios", () => {
    const result = calcularCompletudeBriefing({});
    expect(result.percentual).toBe(0);
    expect(result.camposFaltantes.length).toBeGreaterThan(0);
  });

  it("calcularCompletudeBriefing deve retornar percentual correto", () => {
    const result = calcularCompletudeBriefing({
      parteAtiva: "João",
      partePassiva: "Maria",
      fatosRelevantes: "Fatos",
      pretensao: "Pedido",
    });
    expect(result.percentual).toBeGreaterThan(50);
    expect(result.camposPreenchidos).toBeGreaterThanOrEqual(4);
  });
});

// ─── Refinamento Iterativo ──────────────────────────────────────────────────
import {
  TIPOS_REFINAMENTO,
  CATEGORIAS_REFINAMENTO,
  getRefinamentosPorCategoria,
  getRefinamentoById,
} from "../refinamento-iterativo";

describe("Refinamento Iterativo (P2)", () => {
  it("deve ter pelo menos 8 tipos de refinamento", () => {
    expect(TIPOS_REFINAMENTO.length).toBeGreaterThanOrEqual(8);
  });

  it("cada refinamento deve ter id, label, instrucaoLLM e categoria", () => {
    for (const r of TIPOS_REFINAMENTO) {
      expect(r.id).toBeTruthy();
      expect(r.label).toBeTruthy();
      expect(r.instrucaoLLM).toBeTruthy();
      expect(r.categoria).toBeTruthy();
      expect(["tom", "conteudo", "estrutura", "tecnico"]).toContain(r.categoria);
    }
  });

  it("getRefinamentoById deve retornar refinamento correto", () => {
    const r = getRefinamentoById("mais_formal");
    expect(r).toBeDefined();
    expect(r?.label).toContain("Formal");
  });

  it("getRefinamentoById deve retornar undefined para id inexistente", () => {
    expect(getRefinamentoById("inexistente")).toBeUndefined();
  });

  it("getRefinamentosPorCategoria deve agrupar corretamente", () => {
    const grupos = getRefinamentosPorCategoria();
    expect(Object.keys(grupos).length).toBeGreaterThanOrEqual(3);
    expect(grupos["tom"]).toBeDefined();
    expect(grupos["conteudo"]).toBeDefined();
  });

  it("CATEGORIAS_REFINAMENTO deve ter labels para todas as categorias", () => {
    const categoriasUsadas = [...new Set(TIPOS_REFINAMENTO.map(r => r.categoria))];
    for (const cat of categoriasUsadas) {
      expect(CATEGORIAS_REFINAMENTO[cat]).toBeDefined();
      expect(CATEGORIAS_REFINAMENTO[cat].label).toBeTruthy();
    }
  });
});

// ─── Checklist de Contexto e Revisão ────────────────────────────────────────
import {
  CHECKLIST_CONTEXTO,
  calcularChecklistContexto,
  CHECKLIST_REVISAO,
  CATEGORIAS_REVISAO,
  getRevisaoPorCategoria,
} from "../checklist-revisao";

describe("Checklist de Contexto (P2)", () => {
  it("deve ter pelo menos 6 itens no checklist", () => {
    expect(CHECKLIST_CONTEXTO.length).toBeGreaterThanOrEqual(6);
  });

  it("calcularChecklistContexto deve retornar 'incompleto' para campos vazios", () => {
    const result = calcularChecklistContexto({});
    expect(result.nivel).toBe("incompleto");
    expect(result.percentual).toBeLessThan(40);
  });

  it("calcularChecklistContexto deve retornar nível adequado para campos preenchidos", () => {
    const result = calcularChecklistContexto({
      tipoDocumento: "peticao",
      contexto: "Fatos do caso",
      objetivo: "Indenização",
      areaJuridica: "Civil",
      parteContraria: "Empresa X",
      fundamentacao: "Art. 186 CC",
      tribunal: "TJ-SP",
      attachedDocs: [{ fileName: "doc.pdf" }],
    });
    expect(result.nivel).toBe("completo");
    expect(result.percentual).toBeGreaterThanOrEqual(90);
  });
});

describe("Checklist de Revisão (P2)", () => {
  it("deve ter pelo menos 10 itens de revisão", () => {
    expect(CHECKLIST_REVISAO.length).toBeGreaterThanOrEqual(10);
  });

  it("cada item deve ter id, label, descricao e categoria", () => {
    for (const item of CHECKLIST_REVISAO) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.descricao).toBeTruthy();
      expect(["fundamentacao", "processual", "formal", "etica"]).toContain(item.categoria);
    }
  });

  it("getRevisaoPorCategoria deve agrupar corretamente", () => {
    const grupos = getRevisaoPorCategoria();
    expect(Object.keys(grupos).length).toBeGreaterThanOrEqual(3);
    expect(grupos["fundamentacao"]).toBeDefined();
    expect(grupos["processual"]).toBeDefined();
  });

  it("CATEGORIAS_REVISAO deve ter labels para todas as categorias", () => {
    const categoriasUsadas = [...new Set(CHECKLIST_REVISAO.map(i => i.categoria))];
    for (const cat of categoriasUsadas) {
      expect(CATEGORIAS_REVISAO[cat]).toBeDefined();
      expect(CATEGORIAS_REVISAO[cat].label).toBeTruthy();
    }
  });
});
