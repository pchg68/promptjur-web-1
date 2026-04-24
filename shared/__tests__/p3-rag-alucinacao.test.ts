import { describe, it, expect } from "vitest";
import {
  buscarSumulasRelevantes,
  buscarLegislacaoRelevante,
  formatarFontesParaContexto,
  SUMULAS_BASE,
  LEGISLACAO_BASE,
  RAG_CONFIG_PADRAO,
  type FonteRAG,
} from "../rag-juridico";
import {
  verificarArtigo,
  verificarSumula,
  verificarLei,
  calcularRiscoGeral,
  gerarMensagemAlerta,
  PADROES_CITACAO,
  LIMITES_ARTIGOS,
  LIMITES_SUMULAS,
  LEIS_CONHECIDAS,
  type CitacaoDetectada,
} from "../alucinacao-detector";

// ─── RAG Jurídico ────────────────────────────────────────────────────────────

describe("RAG Jurídico — Base de Conhecimento", () => {
  it("deve ter súmulas na base", () => {
    expect(SUMULAS_BASE.length).toBeGreaterThan(5);
  });

  it("deve ter legislação na base", () => {
    expect(LEGISLACAO_BASE.length).toBeGreaterThan(3);
  });

  it("cada súmula deve ter campos obrigatórios", () => {
    for (const s of SUMULAS_BASE) {
      expect(s.id).toBeTruthy();
      expect(s.tribunal).toBeTruthy();
      expect(s.numero).toBeGreaterThan(0);
      expect(s.enunciado.length).toBeGreaterThan(10);
      expect(s.areas.length).toBeGreaterThan(0);
      expect(s.termos.length).toBeGreaterThan(0);
    }
  });

  it("cada legislação deve ter artigos-chave", () => {
    for (const leg of LEGISLACAO_BASE) {
      expect(leg.id).toBeTruthy();
      expect(leg.codigo).toBeTruthy();
      expect(leg.artigosChave.length).toBeGreaterThan(0);
      for (const art of leg.artigosChave) {
        expect(art.numero).toBeGreaterThan(0);
        expect(art.texto.length).toBeGreaterThan(10);
      }
    }
  });

  it("configuração padrão deve ter valores válidos", () => {
    expect(RAG_CONFIG_PADRAO.maxFontes).toBeGreaterThan(0);
    expect(RAG_CONFIG_PADRAO.relevanciaMinimaFonte).toBeGreaterThanOrEqual(0);
    expect(RAG_CONFIG_PADRAO.tribunais.length).toBeGreaterThan(0);
  });
});

describe("RAG Jurídico — Busca Semântica Local", () => {
  it("deve encontrar súmulas por termos relevantes", () => {
    const resultados = buscarSumulasRelevantes("terceirização vínculo empregatício", "Trabalhista");
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados[0].tribunal).toBe("TST");
  });

  it("deve encontrar súmulas de consumidor", () => {
    const resultados = buscarSumulasRelevantes("instituições financeiras consumidor fraude", "Consumidor");
    expect(resultados.length).toBeGreaterThan(0);
  });

  it("deve retornar menos resultados para consulta irrelevante", () => {
    const relevantes = buscarSumulasRelevantes("terceirização vínculo", "Trabalhista");
    const irrelevantes = buscarSumulasRelevantes("xyzabc123", "Internacional");
    // Consulta irrelevante pode retornar resultados por área, mas menos que uma consulta específica
    expect(irrelevantes.length).toBeLessThanOrEqual(relevantes.length);
  });

  it("deve encontrar legislação por termos", () => {
    const resultados = buscarLegislacaoRelevante("ato ilícito dano moral responsabilidade", "Civil");
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados[0].legislacao.codigo).toBe("CC");
  });

  it("deve encontrar artigos da CLT para busca trabalhista", () => {
    const resultados = buscarLegislacaoRelevante("empregado vínculo subordinação salário", "Trabalhista");
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados.some(r => r.legislacao.codigo === "CLT")).toBe(true);
  });

  it("deve respeitar o limite de resultados", () => {
    const resultados = buscarLegislacaoRelevante("direito propriedade contrato", "Civil", 2);
    expect(resultados.length).toBeLessThanOrEqual(2);
  });
});

describe("RAG Jurídico — Formatação de Contexto", () => {
  it("deve formatar fontes para contexto", () => {
    const fontes: FonteRAG[] = [
      { id: "1", tipo: "legislacao", titulo: "Art. 186 do CC", conteudo: "Ato ilícito...", origem: "Planalto", relevancia: 90 },
      { id: "2", tipo: "sumula", titulo: "Súmula 297 do STJ", conteudo: "CDC aplicável...", origem: "STJ", relevancia: 85 },
    ];
    const resultado = formatarFontesParaContexto(fontes);
    expect(resultado).toContain("LEGISLAÇÃO RELEVANTE");
    expect(resultado).toContain("Art. 186 do CC");
    expect(resultado).toContain("SÚMULAS APLICÁVEIS");
    expect(resultado).toContain("Súmula 297 do STJ");
  });

  it("deve retornar string vazia para array vazio", () => {
    expect(formatarFontesParaContexto([])).toBe("");
  });
});

// ─── Detecção de Alucinações ─────────────────────────────────────────────────

describe("Detecção de Alucinações — Verificação de Artigos", () => {
  it("deve verificar artigo válido do CC", () => {
    const resultado = verificarArtigo(186, "CC");
    expect(resultado.status).toBe("verificado");
    expect(resultado.risco).toBe("ok");
  });

  it("deve detectar artigo inexistente do CC", () => {
    const resultado = verificarArtigo(9999, "CC");
    expect(resultado.status).toBe("nao_encontrado");
    expect(resultado.risco).toBe("critico");
  });

  it("deve verificar artigo válido do CPC", () => {
    const resultado = verificarArtigo(300, "CPC");
    expect(resultado.status).toBe("verificado");
  });

  it("deve verificar artigo válido da CF", () => {
    const resultado = verificarArtigo(5, "CF");
    expect(resultado.status).toBe("verificado");
  });

  it("deve detectar artigo com número inválido", () => {
    const resultado = verificarArtigo(0, "CC");
    expect(resultado.status).toBe("formato_invalido");
    expect(resultado.risco).toBe("alto");
  });

  it("deve marcar código desconhecido como suspeito", () => {
    const resultado = verificarArtigo(10, "CODIGO_INEXISTENTE");
    expect(resultado.status).toBe("suspeito");
    expect(resultado.risco).toBe("medio");
  });

  it("deve verificar artigo do CP", () => {
    const resultado = verificarArtigo(121, "CP");
    expect(resultado.status).toBe("verificado");
  });

  it("deve detectar artigo acima do limite do CP", () => {
    const resultado = verificarArtigo(500, "CP");
    expect(resultado.status).toBe("nao_encontrado");
    expect(resultado.risco).toBe("critico");
  });
});

describe("Detecção de Alucinações — Verificação de Súmulas", () => {
  it("deve verificar súmula válida do STF", () => {
    const resultado = verificarSumula(100, "STF");
    expect(resultado.status).toBe("verificado");
  });

  it("deve detectar súmula inexistente do STF", () => {
    const resultado = verificarSumula(999, "STF");
    expect(resultado.status).toBe("nao_encontrado");
    expect(resultado.risco).toBe("critico");
  });

  it("deve verificar súmula vinculante válida", () => {
    const resultado = verificarSumula(11, "STF", true);
    expect(resultado.status).toBe("verificado");
  });

  it("deve detectar súmula vinculante inexistente", () => {
    const resultado = verificarSumula(100, "STF", true);
    expect(resultado.status).toBe("nao_encontrado");
  });

  it("deve verificar súmula do STJ", () => {
    const resultado = verificarSumula(297, "STJ");
    expect(resultado.status).toBe("verificado");
  });

  it("deve verificar súmula do TST", () => {
    const resultado = verificarSumula(331, "TST");
    expect(resultado.status).toBe("verificado");
  });
});

describe("Detecção de Alucinações — Verificação de Leis", () => {
  it("deve verificar lei conhecida (CDC)", () => {
    const resultado = verificarLei("8.078/90");
    expect(resultado.status).toBe("verificado");
    expect(resultado.risco).toBe("ok");
  });

  it("deve verificar LGPD", () => {
    const resultado = verificarLei("13.709/2018");
    expect(resultado.status).toBe("verificado");
  });

  it("deve marcar lei desconhecida como suspeita", () => {
    const resultado = verificarLei("99.999/2025");
    expect(resultado.status).toBe("suspeito");
    expect(resultado.risco).toBe("medio");
  });

  it("deve detectar formato inválido de lei", () => {
    const resultado = verificarLei("abc");
    expect(resultado.status).toBe("formato_invalido");
    expect(resultado.risco).toBe("alto");
  });
});

describe("Detecção de Alucinações — Cálculo de Risco", () => {
  it("deve retornar ok para array vazio", () => {
    expect(calcularRiscoGeral([])).toBe("ok");
  });

  it("deve retornar critico se houver citação crítica", () => {
    const citacoes: CitacaoDetectada[] = [
      { textoOriginal: "Art. 9999 do CC", tipo: "artigo", identificador: "9999", status: "nao_encontrado", risco: "critico", explicacao: "Não encontrado" },
    ];
    expect(calcularRiscoGeral(citacoes)).toBe("critico");
  });

  it("deve retornar ok se todas verificadas", () => {
    const citacoes: CitacaoDetectada[] = [
      { textoOriginal: "Art. 186 do CC", tipo: "artigo", identificador: "186", status: "verificado", risco: "ok", explicacao: "OK" },
      { textoOriginal: "Art. 927 do CC", tipo: "artigo", identificador: "927", status: "verificado", risco: "ok", explicacao: "OK" },
    ];
    expect(calcularRiscoGeral(citacoes)).toBe("ok");
  });

  it("deve gerar mensagem de alerta correta", () => {
    const resumo = { total: 5, verificadas: 3, suspeitas: 1, naoEncontradas: 1, formatoInvalido: 0 };
    const msg = gerarMensagemAlerta("critico", resumo);
    expect(msg).toContain("ATENÇÃO CRÍTICA");
  });

  it("deve gerar mensagem ok quando tudo verificado", () => {
    const resumo = { total: 3, verificadas: 3, suspeitas: 0, naoEncontradas: 0, formatoInvalido: 0 };
    const msg = gerarMensagemAlerta("ok", resumo);
    expect(msg).toContain("3 citações verificadas");
  });
});

describe("Detecção de Alucinações — Padrões Regex", () => {
  it("deve extrair artigos de texto", () => {
    const texto = "Conforme o Art. 186 do CC e art. 5º da CF";
    const matches = [...texto.matchAll(new RegExp(PADROES_CITACAO.artigos.source, PADROES_CITACAO.artigos.flags))];
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("deve extrair súmulas de texto", () => {
    const texto = "A Súmula 331 do TST e a Súmula Vinculante 11 do STF";
    const matches = [...texto.matchAll(new RegExp(PADROES_CITACAO.sumulas.source, PADROES_CITACAO.sumulas.flags))];
    expect(matches.length).toBe(2);
  });

  it("deve extrair leis de texto", () => {
    const texto = "Nos termos da Lei 8.078/90 e da Lei nº 13.105/2015";
    const matches = [...texto.matchAll(new RegExp(PADROES_CITACAO.leis.source, PADROES_CITACAO.leis.flags))];
    expect(matches.length).toBe(2);
  });

  it("deve extrair jurisprudência de texto", () => {
    const texto = "Conforme decidido no RE 641.320/RS e no REsp 1.234.567/SP";
    const matches = [...texto.matchAll(new RegExp(PADROES_CITACAO.jurisprudencia.source, PADROES_CITACAO.jurisprudencia.flags))];
    expect(matches.length).toBe(2);
  });
});

describe("Detecção de Alucinações — Bases de Verificação", () => {
  it("deve ter limites para os principais códigos", () => {
    expect(LIMITES_ARTIGOS["CC"]).toBeDefined();
    expect(LIMITES_ARTIGOS["CPC"]).toBeDefined();
    expect(LIMITES_ARTIGOS["CP"]).toBeDefined();
    expect(LIMITES_ARTIGOS["CLT"]).toBeDefined();
    expect(LIMITES_ARTIGOS["CDC"]).toBeDefined();
    expect(LIMITES_ARTIGOS["CF"]).toBeDefined();
  });

  it("deve ter limites de súmulas para tribunais superiores", () => {
    expect(LIMITES_SUMULAS["STF"]).toBeDefined();
    expect(LIMITES_SUMULAS["STJ"]).toBeDefined();
    expect(LIMITES_SUMULAS["TST"]).toBeDefined();
  });

  it("deve ter leis conhecidas na base", () => {
    expect(Object.keys(LEIS_CONHECIDAS).length).toBeGreaterThan(5);
    expect(LEIS_CONHECIDAS["8.078/90"]).toBeDefined();
    expect(LEIS_CONHECIDAS["13.105/2015"]).toBeDefined();
  });
});
