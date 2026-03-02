/**
 * Integração com API Pública do DataJud (CNJ)
 * Busca precedentes processuais reais de todos os tribunais brasileiros
 * 
 * Documentação: https://datajud-wiki.cnj.jus.br/api-publica/
 * 
 * Cobertura completa:
 * - STF (Supremo Tribunal Federal)
 * - STJ (Superior Tribunal de Justiça)
 * - TST (Tribunal Superior do Trabalho)
 * - TSE (Tribunal Superior Eleitoral)
 * - STM (Superior Tribunal Militar)
 * - TRFs 1ª a 6ª Região (Justiça Federal - 2º grau)
 * - TRTs 1º ao 24º (Justiça do Trabalho - 2º grau)
 * - Todos os 27 TJs estaduais (Justiça Estadual - 2º grau)
 */

// Chave de API do DataJud (configurada via variável de ambiente)
const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY || "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";
const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

// AVISO: A chave padrão acima é uma chave pública de demonstração.
// Para produção, configure DATAJUD_API_KEY nas variáveis de ambiente.

/**
 * Todos os tribunais disponíveis na API DataJud
 * Formato: { CÓDIGO: "alias_da_api" }
 * 
 * Referência: https://datajud-wiki.cnj.jus.br/api-publica/endpoints
 */
export const TRIBUNAIS = {
  // ============================================================================
  // TRIBUNAIS SUPERIORES (3º grau)
  // ============================================================================
  STF: "api_publica_stf",
  STJ: "api_publica_stj",
  TST: "api_publica_tst",
  TSE: "api_publica_tse",
  STM: "api_publica_stm",
  
  // ============================================================================
  // JUSTIÇA FEDERAL - TRFs (2º grau)
  // ============================================================================
  TRF1: "api_publica_trf1",   // 1ª Região (DF, GO, MT, TO, AC, AM, AP, BA, MA, MG, PA, PI, RO, RR)
  TRF2: "api_publica_trf2",   // 2ª Região (RJ, ES)
  TRF3: "api_publica_trf3",   // 3ª Região (SP, MS)
  TRF4: "api_publica_trf4",   // 4ª Região (RS, PR, SC)
  TRF5: "api_publica_trf5",   // 5ª Região (PE, CE, AL, SE, PB, RN)
  TRF6: "api_publica_trf6",   // 6ª Região (MG) - criado em 2022
  
  // ============================================================================
  // JUSTIÇA DO TRABALHO - TRTs (2º grau)
  // ============================================================================
  TRT1: "api_publica_trt1",   // 1ª Região (RJ)
  TRT2: "api_publica_trt2",   // 2ª Região (SP - Capital e Grande SP)
  TRT3: "api_publica_trt3",   // 3ª Região (MG)
  TRT4: "api_publica_trt4",   // 4ª Região (RS)
  TRT5: "api_publica_trt5",   // 5ª Região (BA)
  TRT6: "api_publica_trt6",   // 6ª Região (PE)
  TRT7: "api_publica_trt7",   // 7ª Região (CE)
  TRT8: "api_publica_trt8",   // 8ª Região (PA, AP)
  TRT9: "api_publica_trt9",   // 9ª Região (PR)
  TRT10: "api_publica_trt10", // 10ª Região (DF, TO)
  TRT11: "api_publica_trt11", // 11ª Região (AM, RR)
  TRT12: "api_publica_trt12", // 12ª Região (SC)
  TRT13: "api_publica_trt13", // 13ª Região (PB)
  TRT14: "api_publica_trt14", // 14ª Região (RO, AC)
  TRT15: "api_publica_trt15", // 15ª Região (SP - Interior/Campinas)
  TRT16: "api_publica_trt16", // 16ª Região (MA)
  TRT17: "api_publica_trt17", // 17ª Região (ES)
  TRT18: "api_publica_trt18", // 18ª Região (GO)
  TRT19: "api_publica_trt19", // 19ª Região (AL)
  TRT20: "api_publica_trt20", // 20ª Região (SE)
  TRT21: "api_publica_trt21", // 21ª Região (RN)
  TRT22: "api_publica_trt22", // 22ª Região (PI)
  TRT23: "api_publica_trt23", // 23ª Região (MT)
  TRT24: "api_publica_trt24", // 24ª Região (MS)
  
  // ============================================================================
  // JUSTIÇA ESTADUAL - TJs (2º grau) - Todos os 27 estados + DF
  // ============================================================================
  TJAC: "api_publica_tjac",   // Acre
  TJAL: "api_publica_tjal",   // Alagoas
  TJAM: "api_publica_tjam",   // Amazonas
  TJAP: "api_publica_tjap",   // Amapá
  TJBA: "api_publica_tjba",   // Bahia
  TJCE: "api_publica_tjce",   // Ceará
  TJDF: "api_publica_tjdft",  // Distrito Federal e Territórios
  TJES: "api_publica_tjes",   // Espírito Santo
  TJGO: "api_publica_tjgo",   // Goiás
  TJMA: "api_publica_tjma",   // Maranhão
  TJMG: "api_publica_tjmg",   // Minas Gerais
  TJMS: "api_publica_tjms",   // Mato Grosso do Sul
  TJMT: "api_publica_tjmt",   // Mato Grosso
  TJPA: "api_publica_tjpa",   // Pará
  TJPB: "api_publica_tjpb",   // Paraíba
  TJPE: "api_publica_tjpe",   // Pernambuco
  TJPI: "api_publica_tjpi",   // Piauí
  TJPR: "api_publica_tjpr",   // Paraná
  TJRJ: "api_publica_tjrj",   // Rio de Janeiro
  TJRN: "api_publica_tjrn",   // Rio Grande do Norte
  TJRO: "api_publica_tjro",   // Rondônia
  TJRR: "api_publica_tjrr",   // Roraima
  TJRS: "api_publica_tjrs",   // Rio Grande do Sul
  TJSC: "api_publica_tjsc",   // Santa Catarina
  TJSE: "api_publica_tjse",   // Sergipe
  TJSP: "api_publica_tjsp",   // São Paulo
  TJTO: "api_publica_tjto",   // Tocantins
} as const;

export type TribunalCode = keyof typeof TRIBUNAIS;

/**
 * Graus de jurisdição disponíveis no DataJud
 */
export type GrauJurisdicao = "G1" | "G2" | "JE" | "TR" | "todos";

/**
 * Metadados dos tribunais com nome completo, UF e categoria
 */
export const TRIBUNAIS_METADATA: Record<TribunalCode, {
  nome: string;
  sigla: string;
  uf?: string;
  categoria: "Tribunais Superiores" | "Justiça Federal" | "Justiça do Trabalho" | "Justiça Estadual" | "Justiça Eleitoral" | "Justiça Militar";
  regiao?: string;
}> = {
  // Superiores
  STF: { nome: "Supremo Tribunal Federal", sigla: "STF", categoria: "Tribunais Superiores" },
  STJ: { nome: "Superior Tribunal de Justiça", sigla: "STJ", categoria: "Tribunais Superiores" },
  TST: { nome: "Tribunal Superior do Trabalho", sigla: "TST", categoria: "Tribunais Superiores" },
  TSE: { nome: "Tribunal Superior Eleitoral", sigla: "TSE", categoria: "Justiça Eleitoral" },
  STM: { nome: "Superior Tribunal Militar", sigla: "STM", categoria: "Justiça Militar" },
  
  // TRFs
  TRF1: { nome: "TRF da 1ª Região", sigla: "TRF1", categoria: "Justiça Federal", regiao: "DF, GO, MT, TO, AC, AM, AP, BA, MA, MG, PA, PI, RO, RR" },
  TRF2: { nome: "TRF da 2ª Região", sigla: "TRF2", categoria: "Justiça Federal", regiao: "RJ, ES" },
  TRF3: { nome: "TRF da 3ª Região", sigla: "TRF3", categoria: "Justiça Federal", regiao: "SP, MS" },
  TRF4: { nome: "TRF da 4ª Região", sigla: "TRF4", categoria: "Justiça Federal", regiao: "RS, PR, SC" },
  TRF5: { nome: "TRF da 5ª Região", sigla: "TRF5", categoria: "Justiça Federal", regiao: "PE, CE, AL, SE, PB, RN" },
  TRF6: { nome: "TRF da 6ª Região", sigla: "TRF6", categoria: "Justiça Federal", regiao: "MG" },
  
  // TRTs
  TRT1: { nome: "TRT da 1ª Região", sigla: "TRT1", uf: "RJ", categoria: "Justiça do Trabalho" },
  TRT2: { nome: "TRT da 2ª Região", sigla: "TRT2", uf: "SP", categoria: "Justiça do Trabalho" },
  TRT3: { nome: "TRT da 3ª Região", sigla: "TRT3", uf: "MG", categoria: "Justiça do Trabalho" },
  TRT4: { nome: "TRT da 4ª Região", sigla: "TRT4", uf: "RS", categoria: "Justiça do Trabalho" },
  TRT5: { nome: "TRT da 5ª Região", sigla: "TRT5", uf: "BA", categoria: "Justiça do Trabalho" },
  TRT6: { nome: "TRT da 6ª Região", sigla: "TRT6", uf: "PE", categoria: "Justiça do Trabalho" },
  TRT7: { nome: "TRT da 7ª Região", sigla: "TRT7", uf: "CE", categoria: "Justiça do Trabalho" },
  TRT8: { nome: "TRT da 8ª Região", sigla: "TRT8", uf: "PA/AP", categoria: "Justiça do Trabalho" },
  TRT9: { nome: "TRT da 9ª Região", sigla: "TRT9", uf: "PR", categoria: "Justiça do Trabalho" },
  TRT10: { nome: "TRT da 10ª Região", sigla: "TRT10", uf: "DF/TO", categoria: "Justiça do Trabalho" },
  TRT11: { nome: "TRT da 11ª Região", sigla: "TRT11", uf: "AM/RR", categoria: "Justiça do Trabalho" },
  TRT12: { nome: "TRT da 12ª Região", sigla: "TRT12", uf: "SC", categoria: "Justiça do Trabalho" },
  TRT13: { nome: "TRT da 13ª Região", sigla: "TRT13", uf: "PB", categoria: "Justiça do Trabalho" },
  TRT14: { nome: "TRT da 14ª Região", sigla: "TRT14", uf: "RO/AC", categoria: "Justiça do Trabalho" },
  TRT15: { nome: "TRT da 15ª Região", sigla: "TRT15", uf: "SP (Interior)", categoria: "Justiça do Trabalho" },
  TRT16: { nome: "TRT da 16ª Região", sigla: "TRT16", uf: "MA", categoria: "Justiça do Trabalho" },
  TRT17: { nome: "TRT da 17ª Região", sigla: "TRT17", uf: "ES", categoria: "Justiça do Trabalho" },
  TRT18: { nome: "TRT da 18ª Região", sigla: "TRT18", uf: "GO", categoria: "Justiça do Trabalho" },
  TRT19: { nome: "TRT da 19ª Região", sigla: "TRT19", uf: "AL", categoria: "Justiça do Trabalho" },
  TRT20: { nome: "TRT da 20ª Região", sigla: "TRT20", uf: "SE", categoria: "Justiça do Trabalho" },
  TRT21: { nome: "TRT da 21ª Região", sigla: "TRT21", uf: "RN", categoria: "Justiça do Trabalho" },
  TRT22: { nome: "TRT da 22ª Região", sigla: "TRT22", uf: "PI", categoria: "Justiça do Trabalho" },
  TRT23: { nome: "TRT da 23ª Região", sigla: "TRT23", uf: "MT", categoria: "Justiça do Trabalho" },
  TRT24: { nome: "TRT da 24ª Região", sigla: "TRT24", uf: "MS", categoria: "Justiça do Trabalho" },
  
  // TJs
  TJAC: { nome: "Tribunal de Justiça do Acre", sigla: "TJAC", uf: "AC", categoria: "Justiça Estadual" },
  TJAL: { nome: "Tribunal de Justiça de Alagoas", sigla: "TJAL", uf: "AL", categoria: "Justiça Estadual" },
  TJAM: { nome: "Tribunal de Justiça do Amazonas", sigla: "TJAM", uf: "AM", categoria: "Justiça Estadual" },
  TJAP: { nome: "Tribunal de Justiça do Amapá", sigla: "TJAP", uf: "AP", categoria: "Justiça Estadual" },
  TJBA: { nome: "Tribunal de Justiça da Bahia", sigla: "TJBA", uf: "BA", categoria: "Justiça Estadual" },
  TJCE: { nome: "Tribunal de Justiça do Ceará", sigla: "TJCE", uf: "CE", categoria: "Justiça Estadual" },
  TJDF: { nome: "Tribunal de Justiça do DF e Territórios", sigla: "TJDFT", uf: "DF", categoria: "Justiça Estadual" },
  TJES: { nome: "Tribunal de Justiça do Espírito Santo", sigla: "TJES", uf: "ES", categoria: "Justiça Estadual" },
  TJGO: { nome: "Tribunal de Justiça de Goiás", sigla: "TJGO", uf: "GO", categoria: "Justiça Estadual" },
  TJMA: { nome: "Tribunal de Justiça do Maranhão", sigla: "TJMA", uf: "MA", categoria: "Justiça Estadual" },
  TJMG: { nome: "Tribunal de Justiça de Minas Gerais", sigla: "TJMG", uf: "MG", categoria: "Justiça Estadual" },
  TJMS: { nome: "Tribunal de Justiça de Mato Grosso do Sul", sigla: "TJMS", uf: "MS", categoria: "Justiça Estadual" },
  TJMT: { nome: "Tribunal de Justiça de Mato Grosso", sigla: "TJMT", uf: "MT", categoria: "Justiça Estadual" },
  TJPA: { nome: "Tribunal de Justiça do Pará", sigla: "TJPA", uf: "PA", categoria: "Justiça Estadual" },
  TJPB: { nome: "Tribunal de Justiça da Paraíba", sigla: "TJPB", uf: "PB", categoria: "Justiça Estadual" },
  TJPE: { nome: "Tribunal de Justiça de Pernambuco", sigla: "TJPE", uf: "PE", categoria: "Justiça Estadual" },
  TJPI: { nome: "Tribunal de Justiça do Piauí", sigla: "TJPI", uf: "PI", categoria: "Justiça Estadual" },
  TJPR: { nome: "Tribunal de Justiça do Paraná", sigla: "TJPR", uf: "PR", categoria: "Justiça Estadual" },
  TJRJ: { nome: "Tribunal de Justiça do Rio de Janeiro", sigla: "TJRJ", uf: "RJ", categoria: "Justiça Estadual" },
  TJRN: { nome: "Tribunal de Justiça do Rio Grande do Norte", sigla: "TJRN", uf: "RN", categoria: "Justiça Estadual" },
  TJRO: { nome: "Tribunal de Justiça de Rondônia", sigla: "TJRO", uf: "RO", categoria: "Justiça Estadual" },
  TJRR: { nome: "Tribunal de Justiça de Roraima", sigla: "TJRR", uf: "RR", categoria: "Justiça Estadual" },
  TJRS: { nome: "Tribunal de Justiça do Rio Grande do Sul", sigla: "TJRS", uf: "RS", categoria: "Justiça Estadual" },
  TJSC: { nome: "Tribunal de Justiça de Santa Catarina", sigla: "TJSC", uf: "SC", categoria: "Justiça Estadual" },
  TJSE: { nome: "Tribunal de Justiça de Sergipe", sigla: "TJSE", uf: "SE", categoria: "Justiça Estadual" },
  TJSP: { nome: "Tribunal de Justiça de São Paulo", sigla: "TJSP", uf: "SP", categoria: "Justiça Estadual" },
  TJTO: { nome: "Tribunal de Justiça do Tocantins", sigla: "TJTO", uf: "TO", categoria: "Justiça Estadual" },
};

/**
 * Obter tribunais por categoria
 */
export function getTribunaisPorCategoria(categoria: string): TribunalCode[] {
  return (Object.entries(TRIBUNAIS_METADATA) as [TribunalCode, typeof TRIBUNAIS_METADATA[TribunalCode]][])
    .filter(([_, meta]) => meta.categoria === categoria)
    .map(([code]) => code);
}

/**
 * Obter todas as categorias disponíveis
 */
export function getCategorias(): string[] {
  const categorias = new Set(Object.values(TRIBUNAIS_METADATA).map(m => m.categoria));
  return Array.from(categorias);
}

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
