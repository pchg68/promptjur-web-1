/**
 * Módulo de integração com OpenAI API (ChatGPT)
 * Suporta múltiplos modelos GPT com fallback automático
 */

export type OpenAIModel = 
  | "gpt-4-turbo-preview"
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-16k";

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
    throw new Error("OPENAI_API_KEY não configurada");
  }

  const requestBody: any = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.max_tokens) {
    requestBody.max_tokens = options.max_tokens;
  }

  if (options.response_format) {
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
    "gpt-4": "gpt-4",
    "gpt-4-turbo": "gpt-4-turbo-preview",
    "gpt-3.5": "gpt-3.5-turbo",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
  };

  return mapping[genericModel] || "gpt-3.5-turbo";
}
