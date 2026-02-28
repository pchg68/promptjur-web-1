/**
 * Módulo de integração com Anthropic Claude API
 * Claude 3.5 Sonnet - Excelente para raciocínio jurídico e textos longos (200K tokens)
 * 
 * Documentação: https://docs.anthropic.com/en/api/messages
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
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Invoca API da Anthropic Claude
 */
export async function invokeClaude(
  options: ClaudeRequestOptions
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada. Configure em Settings → Secrets.");
  }

  const requestBody: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    max_tokens: options.max_tokens || 4096,
    temperature: options.temperature ?? 0.7,
  };

  if (options.system) {
    requestBody.system = options.system;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Claude API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data: ClaudeResponse = await response.json();
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
