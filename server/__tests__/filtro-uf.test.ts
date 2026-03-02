import { describe, it, expect } from "vitest";
import {
  UF_TRIBUNAIS_MAP,
  getTribunaisPorUF,
  getUFsDisponiveis,
  getUFsPorRegiao,
  TRIBUNAIS,
  TRIBUNAIS_METADATA,
} from "../knowledge-retrieval-datajud";

describe("Filtro Geográfico por UF", () => {
  describe("UF_TRIBUNAIS_MAP", () => {
    it("deve conter todas as 27 UFs brasileiras", () => {
      const ufs = Object.keys(UF_TRIBUNAIS_MAP);
      expect(ufs).toHaveLength(27);
      // Verificar todas as UFs
      const ufsEsperadas = [
        "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
        "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
        "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
      ];
      ufsEsperadas.forEach(uf => {
        expect(UF_TRIBUNAIS_MAP).toHaveProperty(uf);
      });
    });

    it("cada UF deve ter nome, região e pelo menos 3 tribunais (TJ + TRT + TRF)", () => {
      Object.entries(UF_TRIBUNAIS_MAP).forEach(([uf, data]) => {
        expect(data.nome).toBeTruthy();
        expect(data.regiao).toBeTruthy();
        expect(data.tribunais.length).toBeGreaterThanOrEqual(3);
        // Deve ter pelo menos um TJ
        expect(data.tribunais.some(t => t.startsWith("TJ"))).toBe(true);
        // Deve ter pelo menos um TRT
        expect(data.tribunais.some(t => t.startsWith("TRT"))).toBe(true);
        // Deve ter pelo menos um TRF
        expect(data.tribunais.some(t => t.startsWith("TRF"))).toBe(true);
      });
    });

    it("SP deve ter 4 tribunais (TJSP, TRT2, TRT15, TRF3)", () => {
      const sp = UF_TRIBUNAIS_MAP["SP"];
      expect(sp.tribunais).toHaveLength(4);
      expect(sp.tribunais).toContain("TJSP");
      expect(sp.tribunais).toContain("TRT2");
      expect(sp.tribunais).toContain("TRT15");
      expect(sp.tribunais).toContain("TRF3");
    });

    it("todos os tribunais referenciados devem existir no catálogo TRIBUNAIS", () => {
      Object.entries(UF_TRIBUNAIS_MAP).forEach(([uf, data]) => {
        data.tribunais.forEach(tribunal => {
          expect(TRIBUNAIS).toHaveProperty(tribunal);
        });
      });
    });

    it("deve mapear regiões corretamente", () => {
      const regioesValidas = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
      Object.values(UF_TRIBUNAIS_MAP).forEach(data => {
        expect(regioesValidas).toContain(data.regiao);
      });
    });

    it("RJ deve mapear para TRF2 (não TRF1)", () => {
      expect(UF_TRIBUNAIS_MAP["RJ"].tribunais).toContain("TRF2");
      expect(UF_TRIBUNAIS_MAP["RJ"].tribunais).not.toContain("TRF1");
    });

    it("MG deve mapear para TRF6 (novo TRF)", () => {
      expect(UF_TRIBUNAIS_MAP["MG"].tribunais).toContain("TRF6");
    });

    it("PR deve mapear para TRF4 (Sul)", () => {
      expect(UF_TRIBUNAIS_MAP["PR"].tribunais).toContain("TRF4");
    });
  });

  describe("getTribunaisPorUF", () => {
    it("deve retornar tribunais de uma única UF", () => {
      const tribunais = getTribunaisPorUF(["RJ"]);
      expect(tribunais).toContain("TJRJ");
      expect(tribunais).toContain("TRT1");
      expect(tribunais).toContain("TRF2");
    });

    it("deve retornar tribunais de múltiplas UFs sem duplicatas", () => {
      // RJ e ES compartilham TRF2
      const tribunais = getTribunaisPorUF(["RJ", "ES"]);
      expect(tribunais).toContain("TJRJ");
      expect(tribunais).toContain("TJES");
      expect(tribunais).toContain("TRF2");
      // TRF2 deve aparecer apenas uma vez
      const trf2Count = tribunais.filter(t => t === "TRF2").length;
      expect(trf2Count).toBe(1);
    });

    it("deve retornar array vazio para UF inválida", () => {
      const tribunais = getTribunaisPorUF(["XX"]);
      expect(tribunais).toHaveLength(0);
    });

    it("deve retornar array vazio para array vazio", () => {
      const tribunais = getTribunaisPorUF([]);
      expect(tribunais).toHaveLength(0);
    });

    it("deve ser case-insensitive", () => {
      const tribunais = getTribunaisPorUF(["rj"]);
      expect(tribunais).toContain("TJRJ");
    });

    it("deve consolidar tribunais da região Sul (PR + SC + RS)", () => {
      const tribunais = getTribunaisPorUF(["PR", "SC", "RS"]);
      // Deve ter 3 TJs
      expect(tribunais).toContain("TJPR");
      expect(tribunais).toContain("TJSC");
      expect(tribunais).toContain("TJRS");
      // Deve ter 3 TRTs
      expect(tribunais).toContain("TRT9");
      expect(tribunais).toContain("TRT12");
      expect(tribunais).toContain("TRT4");
      // Deve ter apenas 1 TRF (TRF4 para toda a região Sul)
      const trfs = tribunais.filter(t => t.startsWith("TRF"));
      expect(trfs).toHaveLength(1);
      expect(trfs[0]).toBe("TRF4");
    });

    it("deve retornar todos os tribunais únicos para todas as 27 UFs", () => {
      const todasUFs = Object.keys(UF_TRIBUNAIS_MAP);
      const tribunais = getTribunaisPorUF(todasUFs);
      // Deve ter pelo menos 27 TJs + 24 TRTs + 6 TRFs = 57 tribunais únicos
      expect(tribunais.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe("getUFsDisponiveis", () => {
    it("deve retornar 27 UFs", () => {
      const ufs = getUFsDisponiveis();
      expect(ufs).toHaveLength(27);
    });

    it("deve retornar UFs ordenadas por nome", () => {
      const ufs = getUFsDisponiveis();
      const nomes = ufs.map(u => u.nome);
      const nomesOrdenados = [...nomes].sort((a, b) => a.localeCompare(b));
      expect(nomes).toEqual(nomesOrdenados);
    });

    it("cada UF deve ter uf, nome, regiao e tribunaisCount", () => {
      const ufs = getUFsDisponiveis();
      ufs.forEach(u => {
        expect(u.uf).toBeTruthy();
        expect(u.nome).toBeTruthy();
        expect(u.regiao).toBeTruthy();
        expect(u.tribunaisCount).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("getUFsPorRegiao", () => {
    it("deve retornar 5 regiões", () => {
      const regioes = getUFsPorRegiao();
      expect(Object.keys(regioes)).toHaveLength(5);
      expect(regioes).toHaveProperty("Norte");
      expect(regioes).toHaveProperty("Nordeste");
      expect(regioes).toHaveProperty("Centro-Oeste");
      expect(regioes).toHaveProperty("Sudeste");
      expect(regioes).toHaveProperty("Sul");
    });

    it("Nordeste deve ter 9 UFs", () => {
      const regioes = getUFsPorRegiao();
      expect(regioes["Nordeste"]).toHaveLength(9);
    });

    it("Sul deve ter 3 UFs", () => {
      const regioes = getUFsPorRegiao();
      expect(regioes["Sul"]).toHaveLength(3);
    });

    it("Sudeste deve ter 4 UFs", () => {
      const regioes = getUFsPorRegiao();
      expect(regioes["Sudeste"]).toHaveLength(4);
    });

    it("Norte deve ter 7 UFs", () => {
      const regioes = getUFsPorRegiao();
      expect(regioes["Norte"]).toHaveLength(7);
    });

    it("Centro-Oeste deve ter 4 UFs (incluindo DF)", () => {
      const regioes = getUFsPorRegiao();
      expect(regioes["Centro-Oeste"]).toHaveLength(4);
    });

    it("UFs dentro de cada região devem estar ordenadas por nome", () => {
      const regioes = getUFsPorRegiao();
      Object.values(regioes).forEach(ufs => {
        const nomes = ufs.map(u => u.nome);
        const nomesOrdenados = [...nomes].sort((a, b) => a.localeCompare(b));
        expect(nomes).toEqual(nomesOrdenados);
      });
    });
  });

  describe("Mapeamento TRF correto por região", () => {
    it("UFs do Norte devem mapear para TRF1", () => {
      const norte = ["AC", "AM", "AP", "PA", "RO", "RR", "TO"];
      norte.forEach(uf => {
        expect(UF_TRIBUNAIS_MAP[uf].tribunais).toContain("TRF1");
      });
    });

    it("UFs do Nordeste devem mapear para TRF1 ou TRF5", () => {
      const nordeste = ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"];
      nordeste.forEach(uf => {
        const trfs = UF_TRIBUNAIS_MAP[uf].tribunais.filter(t => t.startsWith("TRF"));
        expect(trfs.length).toBe(1);
        expect(["TRF1", "TRF5"]).toContain(trfs[0]);
      });
    });

    it("UFs do Sul devem mapear para TRF4", () => {
      const sul = ["PR", "RS", "SC"];
      sul.forEach(uf => {
        expect(UF_TRIBUNAIS_MAP[uf].tribunais).toContain("TRF4");
      });
    });
  });
});
