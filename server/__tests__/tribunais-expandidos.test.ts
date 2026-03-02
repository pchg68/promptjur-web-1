import { describe, it, expect } from "vitest";
import {
  TRIBUNAIS,
  TRIBUNAIS_METADATA,
  getTribunaisPorCategoria,
  getCategorias,
  type TribunalCode,
  type GrauJurisdicao,
} from "../knowledge-retrieval-datajud";

describe("Catálogo Expandido de Tribunais", () => {
  describe("Cobertura completa", () => {
    it("deve ter o STF no catálogo", () => {
      expect(TRIBUNAIS.STF).toBe("api_publica_stf");
      expect(TRIBUNAIS_METADATA.STF.nome).toBe("Supremo Tribunal Federal");
      expect(TRIBUNAIS_METADATA.STF.categoria).toBe("Tribunais Superiores");
    });

    it("deve ter o STJ no catálogo", () => {
      expect(TRIBUNAIS.STJ).toBe("api_publica_stj");
      expect(TRIBUNAIS_METADATA.STJ.nome).toBe("Superior Tribunal de Justiça");
    });

    it("deve ter o TST no catálogo", () => {
      expect(TRIBUNAIS.TST).toBe("api_publica_tst");
      expect(TRIBUNAIS_METADATA.TST.nome).toBe("Tribunal Superior do Trabalho");
    });

    it("deve ter todos os 5 tribunais superiores", () => {
      const superiores = ["STF", "STJ", "TST", "TSE", "STM"];
      superiores.forEach(t => {
        expect(TRIBUNAIS[t as TribunalCode]).toBeDefined();
        expect(TRIBUNAIS_METADATA[t as TribunalCode]).toBeDefined();
      });
    });

    it("deve ter todos os 6 TRFs", () => {
      for (let i = 1; i <= 6; i++) {
        const code = `TRF${i}` as TribunalCode;
        expect(TRIBUNAIS[code]).toBe(`api_publica_trf${i}`);
        expect(TRIBUNAIS_METADATA[code]).toBeDefined();
        expect(TRIBUNAIS_METADATA[code].categoria).toBe("Justiça Federal");
      }
    });

    it("deve ter todos os 24 TRTs", () => {
      for (let i = 1; i <= 24; i++) {
        const code = `TRT${i}` as TribunalCode;
        expect(TRIBUNAIS[code]).toBe(`api_publica_trt${i}`);
        expect(TRIBUNAIS_METADATA[code]).toBeDefined();
        expect(TRIBUNAIS_METADATA[code].categoria).toBe("Justiça do Trabalho");
      }
    });

    it("deve ter todos os 27 TJs estaduais", () => {
      const tjs = [
        "TJAC", "TJAL", "TJAM", "TJAP", "TJBA", "TJCE", "TJDF", "TJES",
        "TJGO", "TJMA", "TJMG", "TJMS", "TJMT", "TJPA", "TJPB", "TJPE",
        "TJPI", "TJPR", "TJRJ", "TJRN", "TJRO", "TJRR", "TJRS", "TJSC",
        "TJSE", "TJSP", "TJTO",
      ];
      expect(tjs.length).toBe(27);
      tjs.forEach(t => {
        expect(TRIBUNAIS[t as TribunalCode]).toBeDefined();
        expect(TRIBUNAIS_METADATA[t as TribunalCode]).toBeDefined();
        expect(TRIBUNAIS_METADATA[t as TribunalCode].categoria).toBe("Justiça Estadual");
      });
    });

    it("deve ter pelo menos 62 tribunais no total (5 superiores + 6 TRFs + 24 TRTs + 27 TJs)", () => {
      const totalTribunais = Object.keys(TRIBUNAIS).length;
      expect(totalTribunais).toBeGreaterThanOrEqual(62);
    });
  });

  describe("Metadados dos tribunais", () => {
    it("cada tribunal deve ter nome, sigla e categoria", () => {
      Object.entries(TRIBUNAIS_METADATA).forEach(([code, meta]) => {
        expect(meta.nome).toBeTruthy();
        expect(meta.sigla).toBeTruthy();
        expect(meta.categoria).toBeTruthy();
      });
    });

    it("TRTs devem ter UF associada", () => {
      for (let i = 1; i <= 24; i++) {
        const code = `TRT${i}` as TribunalCode;
        expect(TRIBUNAIS_METADATA[code].uf).toBeTruthy();
      }
    });

    it("TJs devem ter UF associada", () => {
      const tjs = Object.entries(TRIBUNAIS_METADATA).filter(([_, m]) => m.categoria === "Justiça Estadual");
      tjs.forEach(([code, meta]) => {
        expect(meta.uf).toBeTruthy();
      });
    });

    it("TRFs devem ter região associada", () => {
      for (let i = 1; i <= 6; i++) {
        const code = `TRF${i}` as TribunalCode;
        expect((TRIBUNAIS_METADATA[code] as any).regiao).toBeTruthy();
      }
    });
  });

  describe("Funções auxiliares", () => {
    it("getTribunaisPorCategoria deve retornar tribunais corretos", () => {
      const superiores = getTribunaisPorCategoria("Tribunais Superiores");
      expect(superiores).toContain("STF");
      expect(superiores).toContain("STJ");
      expect(superiores).toContain("TST");

      const federais = getTribunaisPorCategoria("Justiça Federal");
      expect(federais.length).toBe(6);

      const trabalho = getTribunaisPorCategoria("Justiça do Trabalho");
      expect(trabalho.length).toBe(24);

      const estaduais = getTribunaisPorCategoria("Justiça Estadual");
      expect(estaduais.length).toBe(27);
    });

    it("getCategorias deve retornar todas as categorias", () => {
      const categorias = getCategorias();
      expect(categorias).toContain("Tribunais Superiores");
      expect(categorias).toContain("Justiça Federal");
      expect(categorias).toContain("Justiça do Trabalho");
      expect(categorias).toContain("Justiça Estadual");
    });
  });

  describe("Aliases da API DataJud", () => {
    it("cada tribunal deve ter um alias válido começando com api_publica_", () => {
      Object.entries(TRIBUNAIS).forEach(([code, alias]) => {
        expect(alias).toMatch(/^api_publica_/);
      });
    });

    it("aliases devem ser únicos", () => {
      const aliases = Object.values(TRIBUNAIS);
      const uniqueAliases = new Set(aliases);
      expect(uniqueAliases.size).toBe(aliases.length);
    });
  });

  describe("Tipos de grau de jurisdição", () => {
    it("deve suportar os graus G1, G2, JE, TR e todos", () => {
      const graus: GrauJurisdicao[] = ["G1", "G2", "JE", "TR", "todos"];
      graus.forEach(g => {
        expect(typeof g).toBe("string");
      });
    });
  });

  describe("TRF6 (criado em 2022)", () => {
    it("deve estar presente no catálogo", () => {
      expect(TRIBUNAIS.TRF6).toBe("api_publica_trf6");
      expect(TRIBUNAIS_METADATA.TRF6.nome).toBe("TRF da 6ª Região");
      expect(TRIBUNAIS_METADATA.TRF6.regiao).toBe("MG");
    });
  });

  describe("TJDF (Distrito Federal e Territórios)", () => {
    it("deve ter alias correto (tjdft)", () => {
      expect(TRIBUNAIS.TJDF).toBe("api_publica_tjdft");
      expect(TRIBUNAIS_METADATA.TJDF.sigla).toBe("TJDFT");
    });
  });
});
