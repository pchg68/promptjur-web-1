// @vitest-environment jsdom
import { describe, it, expect } from "vitest";

// Testar a lógica de filtragem isolada (mesma lógica usada no componente)
const TIPO_DOC_LABELS: Record<string, string> = {
  peticao: "Petição Inicial",
  contestacao: "Contestação",
  recurso: "Recurso",
  parecer: "Parecer Jurídico",
  contrato: "Contrato",
};

interface GrupoMock {
  groupId: string;
  titulo: string;
  tipoDocumento: string;
  areaJuridica: string;
  totalVersoes: number;
  ultimaCriacao: Date;
}

function filtrarGrupos(
  grupos: GrupoMock[],
  searchTerm: string,
  filtroTipoDoc: string,
  filtroArea: string,
  filtroPeriodo: string
): GrupoMock[] {
  const getDataLimite = (periodo: string): Date | null => {
    if (periodo === "todos") return null;
    const now = new Date();
    const dias = periodo === "7dias" ? 7 : periodo === "30dias" ? 30 : 90;
    return new Date(now.getTime() - dias * 24 * 60 * 60 * 1000);
  };

  const dataLimite = getDataLimite(filtroPeriodo);

  return grupos.filter((grupo) => {
    // Filtro de busca textual
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitulo = grupo.titulo?.toLowerCase().includes(term);
      const matchTipo = (TIPO_DOC_LABELS[grupo.tipoDocumento] || grupo.tipoDocumento).toLowerCase().includes(term);
      const matchArea = grupo.areaJuridica?.toLowerCase().includes(term);
      if (!matchTitulo && !matchTipo && !matchArea) return false;
    }

    // Filtro por tipo de documento
    if (filtroTipoDoc !== "todos" && grupo.tipoDocumento !== filtroTipoDoc) return false;

    // Filtro por área jurídica
    if (filtroArea !== "todos" && grupo.areaJuridica !== filtroArea) return false;

    // Filtro por período
    if (dataLimite && grupo.ultimaCriacao) {
      if (grupo.ultimaCriacao < dataLimite) return false;
    }

    return true;
  });
}

const MOCK_GRUPOS: GrupoMock[] = [
  {
    groupId: "g1",
    titulo: "Petição Inicial — Civil",
    tipoDocumento: "peticao",
    areaJuridica: "Civil",
    totalVersoes: 3,
    ultimaCriacao: new Date("2026-04-01"),
  },
  {
    groupId: "g2",
    titulo: "Parecer Jurídico — Trabalhista",
    tipoDocumento: "parecer",
    areaJuridica: "Trabalhista",
    totalVersoes: 1,
    ultimaCriacao: new Date("2026-03-15"),
  },
  {
    groupId: "g3",
    titulo: "Contrato — Empresarial",
    tipoDocumento: "contrato",
    areaJuridica: "Empresarial",
    totalVersoes: 2,
    ultimaCriacao: new Date("2026-01-10"),
  },
  {
    groupId: "g4",
    titulo: "Recurso — Penal",
    tipoDocumento: "recurso",
    areaJuridica: "Penal",
    totalVersoes: 1,
    ultimaCriacao: new Date("2025-12-01"),
  },
];

describe("Filtros do Histórico de Versões", () => {
  describe("Busca textual", () => {
    it("deve filtrar por título", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "Petição", "todos", "todos", "todos");
      expect(result).toHaveLength(1);
      expect(result[0].groupId).toBe("g1");
    });

    it("deve filtrar por tipo de documento (label)", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "Parecer", "todos", "todos", "todos");
      expect(result).toHaveLength(1);
      expect(result[0].groupId).toBe("g2");
    });

    it("deve filtrar por área jurídica", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "Empresarial", "todos", "todos", "todos");
      expect(result).toHaveLength(1);
      expect(result[0].groupId).toBe("g3");
    });

    it("deve ser case-insensitive", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "penal", "todos", "todos", "todos");
      expect(result).toHaveLength(1);
      expect(result[0].groupId).toBe("g4");
    });

    it("deve retornar vazio quando não há match", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "inexistente", "todos", "todos", "todos");
      expect(result).toHaveLength(0);
    });

    it("deve retornar todos quando busca está vazia", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "todos", "todos", "todos");
      expect(result).toHaveLength(4);
    });
  });

  describe("Filtro por tipo de documento", () => {
    it("deve filtrar por tipo específico", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "peticao", "todos", "todos");
      expect(result).toHaveLength(1);
      expect(result[0].tipoDocumento).toBe("peticao");
    });

    it("deve retornar todos quando tipo é 'todos'", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "todos", "todos", "todos");
      expect(result).toHaveLength(4);
    });

    it("deve retornar vazio quando tipo não existe nos dados", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "memorando", "todos", "todos");
      expect(result).toHaveLength(0);
    });
  });

  describe("Filtro por área jurídica", () => {
    it("deve filtrar por área específica", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "todos", "Trabalhista", "todos");
      expect(result).toHaveLength(1);
      expect(result[0].areaJuridica).toBe("Trabalhista");
    });

    it("deve retornar todos quando área é 'todos'", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "todos", "todos", "todos");
      expect(result).toHaveLength(4);
    });
  });

  describe("Filtro por período", () => {
    it("deve filtrar últimos 7 dias", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "todos", "todos", "7dias");
      // Apenas g1 (2026-04-01) está dentro de 7 dias de 2026-04-02
      expect(result).toHaveLength(1);
      expect(result[0].groupId).toBe("g1");
    });

    it("deve filtrar últimos 30 dias", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "todos", "todos", "30dias");
      // g1 (2026-04-01) e g2 (2026-03-15) estão dentro de 30 dias
      expect(result).toHaveLength(2);
    });

    it("deve retornar todos quando período é 'todos'", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "todos", "todos", "todos");
      expect(result).toHaveLength(4);
    });
  });

  describe("Filtros combinados", () => {
    it("deve combinar busca textual com tipo de documento", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "Civil", "peticao", "todos", "todos");
      expect(result).toHaveLength(1);
      expect(result[0].groupId).toBe("g1");
    });

    it("deve combinar tipo com área jurídica", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "parecer", "Trabalhista", "todos");
      expect(result).toHaveLength(1);
      expect(result[0].groupId).toBe("g2");
    });

    it("deve retornar vazio quando filtros combinados não têm match", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "", "peticao", "Penal", "todos");
      expect(result).toHaveLength(0);
    });

    it("deve combinar busca + tipo + área + período", () => {
      const result = filtrarGrupos(MOCK_GRUPOS, "Petição", "peticao", "Civil", "7dias");
      expect(result).toHaveLength(1);
      expect(result[0].groupId).toBe("g1");
    });
  });
});
