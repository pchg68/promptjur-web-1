/**
 * Módulo de integração com Perplexity AI API
 * Especializado em pesquisa com fontes citadas - ideal para jurisprudência atualizada
 * 
 * Documentação: https://docs.perplexity.ai/
 * 
 * Diferencial: Retorna citações/fontes junto com a resposta,
 * permitindo verificação automática de referências jurídicas
 */

export type PerplexityModel =
  | "sonar-pro"
  | "sonar"
  | "sonar-reasoning-pro"
  | "sonar-reasoning";

export interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PerplexityRequestOptions {
  model: PerplexityModel;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
  return_citations?: boolean;
  search_recency_filter?: "month" | "week" | "day" | "hour";
}

export interface PerplexityCitation {
  url: string;
  text?: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Invoca API do Perplexity
 */
export async function invokePerplexity(
  options: PerplexityRequestOptions
): Promise<PerplexityResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY não configurada. Configure em Settings → Secrets.");
  }

  const requestBody: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.2, // Baixa temperatura para respostas mais factuais
    max_tokens: options.max_tokens || 4096,
    return_citations: options.return_citations ?? true,
  };

  if (options.search_recency_filter) {
    requestBody.search_recency_filter = options.search_recency_filter;
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Perplexity API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data: PerplexityResponse = await response.json();
    return data;
  } catch (error) {
    console.error("[Perplexity] Erro na chamada:", error);
    throw error;
  }
}

/**
 * Extrai conteúdo de texto da resposta do Perplexity
 */
export function extractPerplexityContent(response: PerplexityResponse): string {
  if (!response.choices || response.choices.length === 0) {
    throw new Error("Resposta do Perplexity não contém choices");
  }

  return response.choices[0].message.content;
}

/**
 * Extrai citações/fontes da resposta do Perplexity
 */
export function extractPerplexityCitations(response: PerplexityResponse): string[] {
  return response.citations || [];
}

/**
 * Mapeia modelo genérico para modelo específico do Perplexity
 */
export function mapToPerplexityModel(genericModel: string): PerplexityModel {
  const mapping: Record<string, PerplexityModel> = {
    "sonar-pro": "sonar-pro",
    "sonar": "sonar",
    "sonar-reasoning-pro": "sonar-reasoning-pro",
    "sonar-reasoning": "sonar-reasoning",
    "perplexity-pro": "sonar-pro",
    "perplexity": "sonar",
  };

  return mapping[genericModel] || "sonar";
}

/**
 * Verifica se a API key do Perplexity está configurada
 */
export function isPerplexityConfigured(): boolean {
  return !!process.env.PERPLEXITY_API_KEY;
}
