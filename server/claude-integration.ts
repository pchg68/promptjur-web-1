/**
 * Módulo de integração com Anthropic Claude API
 * Claude 3.5 Sonnet - Excelente para raciocínio jurídico e textos longos (200K tokens)
 * 
 * Documentação: https://docs.anthropic.com/en/api/messages
 * 
 * PROMPT CACHING:
 * Implementa cache automático nos system prompts jurídicos para reduzir custos em ~90%.
 * O cache funciona para prompts com ≥1024 tokens (2048 para Sonnet).
 * Cache write: 1.25x do preço base, Cache read: 0.1x do preço base.
 * TTL padrão: 5 minutos (renovado automaticamente a cada hit).
 */

export type ClaudeModel =
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "claude-3-opus-20240229";

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeRequestOptions {
  model: ClaudeModel;
  messages: ClaudeMessage[];
  system?: string;
  temperature?: number;
  max_tokens?: number;
  /** Habilitar prompt caching no system prompt (padrão: true) */
  enableCaching?: boolean;
}

export interface ClaudeCacheUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: Array<{
    type: "text";
    text: string;
  }>;
  stop_reason: string;
  usage: ClaudeCacheUsage;
}

/**
 * Invoca API da Anthropic Claude com suporte a Prompt Caching
 * 
 * Quando enableCaching=true (padrão), o system prompt é enviado como
 * array de content blocks com cache_control, permitindo que a Anthropic
 * reutilize o prefixo em chamadas subsequentes com o mesmo system prompt.
 * 
 * Economia estimada: ~90% nos tokens de input para system prompts repetitivos.
 */
export async function invokeClaude(
  options: ClaudeRequestOptions
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada. Configure em Settings → Secrets.");
  }

  const enableCaching = options.enableCaching !== false; // true por padrão

  const requestBody: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    max_tokens: options.max_tokens || 4096,
    temperature: options.temperature ?? 0.7,
  };

  // ── Prompt Caching: converter system para formato com cache_control ──────
  if (options.system) {
    if (enableCaching) {
      // Formato com cache: system como array de content blocks
      // O cache_control no último bloco indica onde o cache deve ser criado
      requestBody.system = [
        {
          type: "text",
          text: options.system,
          cache_control: { type: "ephemeral" },
        },
      ];
    } else {
      // Formato simples sem cache
      requestBody.system = options.system;
    }
  }

  try {
    const headers: Record<string, string> = {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Claude API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data: ClaudeResponse = await response.json();

    // ── Log de cache para monitoramento de custos ──────────────────────────
    if (enableCaching && data.usage) {
      const cacheCreation = data.usage.cache_creation_input_tokens || 0;
      const cacheRead = data.usage.cache_read_input_tokens || 0;
      const regularInput = data.usage.input_tokens || 0;

      if (cacheCreation > 0) {
        console.log(`[Claude:Cache] WRITE ${cacheCreation} tokens (model: ${data.model})`);
      }
      if (cacheRead > 0) {
        const savings = Math.round((cacheRead * 0.9 / (cacheRead + regularInput)) * 100);
        console.log(`[Claude:Cache] HIT ${cacheRead} tokens — economia ~${savings}% (model: ${data.model})`);
      }
    }

    return data;
  } catch (error) {
    console.error("[Claude] Erro na chamada:", error);
    throw error;
  }
}

/**
 * Extrai conteúdo de texto da resposta do Claude
 */
export function extractClaudeContent(response: ClaudeResponse): string {
  if (!response.content || response.content.length === 0) {
    throw new Error("Resposta do Claude não contém conteúdo");
  }

  return response.content
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("\n");
}

/**
 * Mapeia modelo genérico para modelo específico do Claude
 */
export function mapToClaudeModel(genericModel: string): ClaudeModel {
  const mapping: Record<string, ClaudeModel> = {
    "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
    "claude-sonnet": "claude-3-5-sonnet-20241022",
    "claude-3.5-haiku": "claude-3-5-haiku-20241022",
    "claude-3-5-haiku": "claude-3-5-haiku-20241022",
    "claude-haiku": "claude-3-5-haiku-20241022",
    "claude-3-opus": "claude-3-opus-20240229",
    "claude-opus": "claude-3-opus-20240229",
  };

  return mapping[genericModel] || "claude-3-5-sonnet-20241022";
}

/**
 * Verifica se a API key do Claude está configurada
 */
export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Calcula economia estimada do cache para monitoramento
 */
export function calculateCacheSavings(usage: ClaudeCacheUsage): {
  totalInputTokens: number;
  cachedTokens: number;
  savingsPercent: number;
  estimatedSavingsUSD: number;
} {
  const cacheRead = usage.cache_read_input_tokens || 0;
  const cacheWrite = usage.cache_creation_input_tokens || 0;
  const regular = usage.input_tokens || 0;
  const total = regular + cacheRead + cacheWrite;

  // Preço base do Sonnet: $3/MTok
  // Cache read: $0.30/MTok (economia de $2.70/MTok por token cacheado)
  const savingsPerToken = 2.70 / 1_000_000; // USD por token economizado
  const estimatedSavingsUSD = cacheRead * savingsPerToken;
  const savingsPercent = total > 0 ? Math.round((cacheRead * 0.9 / total) * 100) : 0;

  return {
    totalInputTokens: total,
    cachedTokens: cacheRead,
    savingsPercent,
    estimatedSavingsUSD,
  };
}
