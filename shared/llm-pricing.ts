/**
 * Tabela de preços dos modelos de linguagem por provider.
 * Preços em USD por 1.000 tokens (padrão da indústria).
 * Fontes:
 *  - OpenAI: https://openai.com/pricing (Abril/2025)
 *  - Anthropic: https://www.anthropic.com/pricing (Abril/2025)
 *  - Google: https://ai.google.dev/pricing (Abril/2025)
 *  - Manus AI: custo interno estimado (equivalente ao GPT-4o Mini)
 */

export interface ModeloPricing {
  /** Identificador único do modelo (ex: "gpt-4o", "claude-3-5-sonnet") */
  modeloId: string;
  /** Nome amigável para exibição */
  nomeExibicao: string;
  /** Provider (ex: "openai", "anthropic", "google", "manus") */
  provider: string;
  /** Custo por 1.000 tokens de entrada (USD) */
  custoPorMilTokensEntrada: number;
  /** Custo por 1.000 tokens de saída (USD) */
  custoPorMilTokensSaida: number;
  /** Contexto máximo em tokens */
  contextoMaxTokens: number;
  /** Se o modelo está ativo/disponível */
  ativo: boolean;
  /** Categoria do modelo para agrupamento */
  categoria: "premium" | "standard" | "economico" | "interno";
}

/** Tabela completa de preços — Abril 2025 */
export const TABELA_PRECOS: ModeloPricing[] = [
  // ─── OpenAI ───────────────────────────────────────────────────────────────
  {
    modeloId: "gpt-4o",
    nomeExibicao: "GPT-4o",
    provider: "openai",
    custoPorMilTokensEntrada: 0.0025,
    custoPorMilTokensSaida: 0.01,
    contextoMaxTokens: 128000,
    ativo: true,
    categoria: "premium",
  },
  {
    modeloId: "gpt-4o-mini",
    nomeExibicao: "GPT-4o Mini",
    provider: "openai",
    custoPorMilTokensEntrada: 0.00015,
    custoPorMilTokensSaida: 0.0006,
    contextoMaxTokens: 128000,
    ativo: true,
    categoria: "economico",
  },
  {
    modeloId: "gpt-4-turbo",
    nomeExibicao: "GPT-4 Turbo",
    provider: "openai",
    custoPorMilTokensEntrada: 0.01,
    custoPorMilTokensSaida: 0.03,
    contextoMaxTokens: 128000,
    ativo: true,
    categoria: "premium",
  },
  {
    modeloId: "gpt-3.5-turbo",
    nomeExibicao: "GPT-3.5 Turbo",
    provider: "openai",
    custoPorMilTokensEntrada: 0.0005,
    custoPorMilTokensSaida: 0.0015,
    contextoMaxTokens: 16385,
    ativo: true,
    categoria: "economico",
  },
  {
    modeloId: "o1",
    nomeExibicao: "o1",
    provider: "openai",
    custoPorMilTokensEntrada: 0.015,
    custoPorMilTokensSaida: 0.06,
    contextoMaxTokens: 200000,
    ativo: true,
    categoria: "premium",
  },
  {
    modeloId: "o1-mini",
    nomeExibicao: "o1 Mini",
    provider: "openai",
    custoPorMilTokensEntrada: 0.003,
    custoPorMilTokensSaida: 0.012,
    contextoMaxTokens: 128000,
    ativo: true,
    categoria: "standard",
  },
  // ─── Anthropic ────────────────────────────────────────────────────────────
  {
    modeloId: "claude-3-5-sonnet-20241022",
    nomeExibicao: "Claude 3.5 Sonnet",
    provider: "anthropic",
    custoPorMilTokensEntrada: 0.003,
    custoPorMilTokensSaida: 0.015,
    contextoMaxTokens: 200000,
    ativo: true,
    categoria: "premium",
  },
  {
    modeloId: "claude-3-5-haiku-20241022",
    nomeExibicao: "Claude 3.5 Haiku",
    provider: "anthropic",
    custoPorMilTokensEntrada: 0.0008,
    custoPorMilTokensSaida: 0.004,
    contextoMaxTokens: 200000,
    ativo: true,
    categoria: "economico",
  },
  {
    modeloId: "claude-3-opus-20240229",
    nomeExibicao: "Claude 3 Opus",
    provider: "anthropic",
    custoPorMilTokensEntrada: 0.015,
    custoPorMilTokensSaida: 0.075,
    contextoMaxTokens: 200000,
    ativo: true,
    categoria: "premium",
  },
  {
    modeloId: "claude-3-haiku-20240307",
    nomeExibicao: "Claude 3 Haiku",
    provider: "anthropic",
    custoPorMilTokensEntrada: 0.00025,
    custoPorMilTokensSaida: 0.00125,
    contextoMaxTokens: 200000,
    ativo: true,
    categoria: "economico",
  },
  // ─── Google ───────────────────────────────────────────────────────────────
  {
    modeloId: "gemini-1.5-pro",
    nomeExibicao: "Gemini 1.5 Pro",
    provider: "google",
    custoPorMilTokensEntrada: 0.00125,
    custoPorMilTokensSaida: 0.005,
    contextoMaxTokens: 2000000,
    ativo: true,
    categoria: "premium",
  },
  {
    modeloId: "gemini-1.5-flash",
    nomeExibicao: "Gemini 1.5 Flash",
    provider: "google",
    custoPorMilTokensEntrada: 0.000075,
    custoPorMilTokensSaida: 0.0003,
    contextoMaxTokens: 1000000,
    ativo: true,
    categoria: "economico",
  },
  {
    modeloId: "gemini-2.0-flash",
    nomeExibicao: "Gemini 2.0 Flash",
    provider: "google",
    custoPorMilTokensEntrada: 0.0001,
    custoPorMilTokensSaida: 0.0004,
    contextoMaxTokens: 1000000,
    ativo: true,
    categoria: "economico",
  },
  // ─── Manus AI (interno) ───────────────────────────────────────────────────
  {
    modeloId: "manus-default",
    nomeExibicao: "Manus AI (padrão)",
    provider: "manus",
    custoPorMilTokensEntrada: 0.00015,  // equivalente ao GPT-4o Mini
    custoPorMilTokensSaida: 0.0006,
    contextoMaxTokens: 128000,
    ativo: true,
    categoria: "interno",
  },
  {
    modeloId: "manus-pro",
    nomeExibicao: "Manus AI Pro",
    provider: "manus",
    custoPorMilTokensEntrada: 0.0025,   // equivalente ao GPT-4o
    custoPorMilTokensSaida: 0.01,
    contextoMaxTokens: 128000,
    ativo: true,
    categoria: "interno",
  },
];

/** Mapa de lookup rápido por modeloId */
export const PRECOS_POR_MODELO: Record<string, ModeloPricing> = Object.fromEntries(
  TABELA_PRECOS.map(m => [m.modeloId, m])
);

/** Mapa de lookup por provider (retorna todos os modelos do provider) */
export function modelosPorProvider(provider: string): ModeloPricing[] {
  return TABELA_PRECOS.filter(m => m.provider === provider && m.ativo);
}

/**
 * Calcula o custo estimado de uma chamada em USD.
 * @param modeloId - ID do modelo (ex: "gpt-4o-mini")
 * @param tokensEntrada - Número de tokens de entrada
 * @param tokensSaida - Número de tokens de saída
 * @returns Custo em USD (ou null se o modelo não for encontrado)
 */
export function calcularCustoUsd(
  modeloId: string,
  tokensEntrada: number,
  tokensSaida: number
): number | null {
  const pricing = PRECOS_POR_MODELO[modeloId];
  if (!pricing) return null;

  const custoEntrada = (tokensEntrada / 1000) * pricing.custoPorMilTokensEntrada;
  const custoSaida = (tokensSaida / 1000) * pricing.custoPorMilTokensSaida;
  return custoEntrada + custoSaida;
}

/**
 * Converte USD para BRL usando uma taxa de câmbio configurável.
 * @param usd - Valor em USD
 * @param taxaCambio - Taxa de câmbio USD→BRL (padrão: 5.0)
 */
export function usdParaBrl(usd: number, taxaCambio = 5.0): number {
  return usd * taxaCambio;
}

/**
 * Formata um valor em USD para exibição.
 */
export function formatarUsd(usd: number): string {
  if (usd < 0.001) return `$${(usd * 1000).toFixed(4)}m`; // milésimos
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

/**
 * Formata um valor em BRL para exibição.
 */
export function formatarBrl(brl: number): string {
  return brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 });
}

/** Lista de providers disponíveis */
export const PROVIDERS_DISPONIVEIS = [
  { id: "openai", nome: "OpenAI", cor: "#10a37f" },
  { id: "anthropic", nome: "Anthropic", cor: "#d97706" },
  { id: "google", nome: "Google", cor: "#4285f4" },
  { id: "manus", nome: "Manus AI", cor: "#6366f1" },
] as const;

/** Cores por categoria de modelo */
export const CORES_CATEGORIA: Record<string, string> = {
  premium: "#ef4444",
  standard: "#f59e0b",
  economico: "#22c55e",
  interno: "#6366f1",
};
