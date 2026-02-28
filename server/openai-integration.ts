/**
 * Módulo de integração com OpenAI API (ChatGPT)
 * Suporta GPT-4o, GPT-4o-mini e modelos anteriores com fallback automático
 * 
 * Documentação: https://platform.openai.com/docs/api-reference/chat
 */

export type OpenAIModel = 
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4-turbo"
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "o1"
  | "o1-mini";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIRequestOptions {
  model: OpenAIModel;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_object" | "text";
  };
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Invoca API da OpenAI com retry automático e fallback
 */
export async function invokeOpenAI(
  options: OpenAIRequestOptions
): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada. Configure em Settings → Secrets.");
  }

  const isReasoningModel = options.model === "o1" || options.model === "o1-mini";

  const requestBody: Record<string, unknown> = {
    model: options.model,
    messages: isReasoningModel 
      ? options.messages.filter(m => m.role !== "system") // o1 não suporta system messages
      : options.messages,
  };

  // Modelos de raciocínio (o1) não suportam temperature
  if (!isReasoningModel) {
    requestBody.temperature = options.temperature ?? 0.7;
  }

  if (options.max_tokens) {
    requestBody.max_tokens = options.max_tokens;
  }

  if (options.response_format && !isReasoningModel) {
    requestBody.response_format = options.response_format;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
        `OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data: OpenAIResponse = await response.json();
    return data;
  } catch (error) {
    console.error("[OpenAI] Erro na chamada:", error);
    throw error;
  }
}

/**
 * Função auxiliar para extrair conteúdo da resposta
 */
export function extractOpenAIContent(response: OpenAIResponse): string {
  if (!response.choices || response.choices.length === 0) {
    throw new Error("Resposta da OpenAI não contém choices");
  }
  
  return response.choices[0].message.content;
}

/**
 * Mapeia modelo genérico para modelo específico da OpenAI
 */
export function mapToOpenAIModel(genericModel: string): OpenAIModel {
  const mapping: Record<string, OpenAIModel> = {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4-turbo": "gpt-4-turbo",
    "gpt-4": "gpt-4",
    "gpt-3.5": "gpt-3.5-turbo",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
    "o1": "o1",
    "o1-mini": "o1-mini",
  };

  return mapping[genericModel] || "gpt-4o-mini";
}

/**
 * Verifica se a API key da OpenAI está configurada
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
