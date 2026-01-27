/**
 * Integração com API Pública do DataJud (CNJ)
 * Busca precedentes processuais reais de todos os tribunais brasileiros
 * 
 * Documentação: https://datajud-wiki.cnj.jus.br/api-publica/
 */

// Chave pública do DataJud (disponível publicamente)
const DATAJUD_API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";
const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

/**
 * Tribunais disponíveis na API DataJud
 */
export const TRIBUNAIS = {
  // Tribunais Superiores
  STJ: "api_publica_stj",
  TST: "api_publica_tst",
  TSE: "api_publica_tse",
  STM: "api_publica_stm",
  
  // Justiça Federal
  TRF1: "api_publica_trf1",
  TRF2: "api_publica_trf2",
  TRF3: "api_publica_trf3",
  TRF4: "api_publica_trf4",
  TRF5: "api_publica_trf5",
  TRF6: "api_publica_trf6",
  
  // Justiça Estadual (principais)
  TJSP: "api_publica_tjsp",
  TJRJ: "api_publica_tjrj",
  TJMG: "api_publica_tjmg",
  TJRS: "api_publica_tjrs",
  TJPR: "api_publica_tjpr",
  TJSC: "api_publica_tjsc",
  TJBA: "api_publica_tjba",
  TJPE: "api_publica_tjpe",
  TJCE: "api_publica_tjce",
  TJGO: "api_publica_tjgo",
} as const;

export type TribunalCode = keyof typeof TRIBUNAIS;

/**
 * Estrutura de um processo retornado pela API DataJud
 */
export interface ProcessoDataJud {
  numeroProcesso: string;
  classe: {
    codigo: number;
    nome: string;
  };
  sistema: {
    codigo: number;
    nome: string;
  };
  formato: {
    codigo: number;
    nome: string;
  };
  tribunal: string;
  dataAjuizamento: string;
  dataHoraUltimaAtualizacao: string;
  grau: string;
  nivelSigilo: number;
  orgaoJulgador: {
    codigo: number;
    nome: string;
    codigoMunicipioIBGE?: number;
  };
  assuntos: Array<{
    codigo: number;
    nome: string;
  }>;
  movimentos: Array<{
    codigo: number;
    nome: string;
    dataHora: string;
    complementosTabelados?: Array<{
      codigo: number;
      valor: number;
      nome: string;
      descricao: string;
    }>;
  }>;
}

/**
 * Resultado da busca na API DataJud
 */
export interface ResultadoBuscaDataJud {
  took: number;
  timed_out: boolean;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number;
    hits: Array<{
      _index: string;
      _id: string;
      _score: number;
      _source: ProcessoDataJud;
    }>;
  };
}

/**
 * Buscar processos por número
 */
export async function buscarPorNumeroProcesso(
  numeroProcesso: string,
  tribunal: TribunalCode = "STJ"
): Promise<ProcessoDataJud[]> {
  const tribunalAlias = TRIBUNAIS[tribunal];
  const url = `${DATAJUD_BASE_URL}/${tribunalAlias}/_search`;

  const query = {
    query: {
      match: {
        numeroProcesso: numeroProcesso.replace(/\D/g, ""), // Remove formatação
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${DATAJUD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      console.error(`[DataJud] Erro HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: ResultadoBuscaDataJud = await response.json();
    return data.hits.hits.map((hit) => hit._source);
  } catch (error) {
    console.error("[DataJud] Erro ao buscar processo:", error);
    return [];
  }
}

/**
 * Buscar processos por assunto (palavras-chave)
 */
export async function buscarPorAssunto(
  assunto: string,
  tribunal: TribunalCode = "STJ",
  limite: number = 10
): Promise<ProcessoDataJud[]> {
  const tribunalAlias = TRIBUNAIS[tribunal];
  const url = `${DATAJUD_BASE_URL}/${tribunalAlias}/_search`;

  const query = {
    size: limite,
    query: {
      match: {
        "assuntos.nome": assunto,
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${DATAJUD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      console.error(`[DataJud] Erro HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: ResultadoBuscaDataJud = await response.json();
    return data.hits.hits.map((hit) => hit._source);
  } catch (error) {
    console.error("[DataJud] Erro ao buscar por assunto:", error);
    return [];
  }
}

/**
 * Buscar processos por classe processual e órgão julgador
 */
export async function buscarPorClasseEOrgao(
  codigoClasse: number,
  codigoOrgao: number,
  tribunal: TribunalCode = "STJ",
  limite: number = 10
): Promise<ProcessoDataJud[]> {
  const tribunalAlias = TRIBUNAIS[tribunal];
  const url = `${DATAJUD_BASE_URL}/${tribunalAlias}/_search`;

  const query = {
    size: limite,
    query: {
      bool: {
        must: [
          { match: { "classe.codigo": codigoClasse } },
          { match: { "orgaoJulgador.codigo": codigoOrgao } },
        ],
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${DATAJUD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      console.error(`[DataJud] Erro HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: ResultadoBuscaDataJud = await response.json();
    return data.hits.hits.map((hit) => hit._source);
  } catch (error) {
    console.error("[DataJud] Erro ao buscar por classe e órgão:", error);
    return [];
  }
}

/**
 * Buscar precedentes similares baseado em contexto
 * Usa busca por assuntos e classe processual
 */
export async function buscarPrecedentesSimilares(
  contexto: string,
  areaJuridica: string,
  tipoDocumento: string,
  tribunais: TribunalCode[] = ["STJ", "TRF1", "TJSP"],
  limitePorTribunal: number = 5
): Promise<Array<ProcessoDataJud & { tribunal_busca: string; score_relevancia: number }>> {
  const resultados: Array<ProcessoDataJud & { tribunal_busca: string; score_relevancia: number }> = [];

  // Buscar em múltiplos tribunais em paralelo
  const promessas = tribunais.map(async (tribunal) => {
    // Buscar por palavras-chave do contexto e área jurídica
    const palavrasChave = `${areaJuridica} ${contexto}`.substring(0, 100);
    const processos = await buscarPorAssunto(palavrasChave, tribunal, limitePorTribunal);

    return processos.map((processo) => ({
      ...processo,
      tribunal_busca: tribunal,
      score_relevancia: calcularScoreRelevancia(processo, contexto, areaJuridica),
    }));
  });

  const resultadosPorTribunal = await Promise.all(promessas);
  resultados.push(...resultadosPorTribunal.flat());

  // Ordenar por relevância
  resultados.sort((a, b) => b.score_relevancia - a.score_relevancia);

  return resultados.slice(0, 10); // Retornar top 10
}

/**
 * Calcular score de relevância de um processo
 * Baseado em similaridade de assuntos e atualidade
 */
function calcularScoreRelevancia(
  processo: ProcessoDataJud,
  contexto: string,
  areaJuridica: string
): number {
  let score = 0;

  // Pontuação por assuntos relacionados
  const contextoLower = contexto.toLowerCase();
  const areaLower = areaJuridica.toLowerCase();

  processo.assuntos.forEach((assunto) => {
    const assuntoLower = assunto.nome.toLowerCase();
    if (assuntoLower.includes(areaLower)) score += 3;
    if (contextoLower.split(" ").some((palavra) => assuntoLower.includes(palavra))) score += 2;
  });

  // Pontuação por atualidade (processos mais recentes são mais relevantes)
  const dataAtualizacao = new Date(processo.dataHoraUltimaAtualizacao);
  const idadeEmAnos = (Date.now() - dataAtualizacao.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (idadeEmAnos < 1) score += 5;
  else if (idadeEmAnos < 3) score += 3;
  else if (idadeEmAnos < 5) score += 1;

  // Pontuação por grau (instâncias superiores são mais relevantes)
  if (processo.grau === "2") score += 2;
  if (processo.tribunal === "STJ" || processo.tribunal === "STF") score += 3;

  return score;
}

/**
 * Formatar processo para exibição amigável
 */
export function formatarProcessoParaTexto(processo: ProcessoDataJud): string {
  const assuntos = processo.assuntos.map((a) => a.nome).join(", ");
  const dataAjuizamento = new Date(processo.dataAjuizamento).toLocaleDateString("pt-BR");

  return `
**Processo:** ${processo.numeroProcesso}
**Tribunal:** ${processo.tribunal} - ${processo.orgaoJulgador.nome}
**Classe:** ${processo.classe.nome}
**Assuntos:** ${assuntos}
**Data de Ajuizamento:** ${dataAjuizamento}
**Grau:** ${processo.grau}
  `.trim();
}
