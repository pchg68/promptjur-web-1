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

/** Tempo limite padrão para chamadas OpenAI (ms) */
const OPENAI_TIMEOUT_MS = 60_000;

/** Número máximo de tentativas */
const OPENAI_MAX_RETRIES = 2;

/**
 * Aguarda um tempo antes de tentar novamente (backoff exponencial)
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determina se o erro é transitório (vale tentar novamente)
 */
function isRetryableError(status: number): boolean {
  // 429 = rate limit, 500/502/503/504 = erros temporários do servidor
  return status === 429 || status >= 500;
}

/**
 * Invoca API da OpenAI com retry automático, timeout e fallback
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

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= OPENAI_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Backoff exponencial: 2s, 4s
      const waitMs = Math.pow(2, attempt) * 1000;
      console.log(`[OpenAI] Tentativa ${attempt + 1}/${OPENAI_MAX_RETRIES + 1} após ${waitMs}ms...`);
      await sleep(waitMs);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errorMsg = (errorData?.error as Record<string, unknown>)?.message
          || JSON.stringify(errorData);

        // Erros de autenticação/autorização não devem ser retentados
        if (response.status === 401 || response.status === 403) {
          throw new Error(`OpenAI: credenciais inválidas (${response.status}). Verifique a OPENAI_API_KEY em Settings → Secrets.`);
        }

        // Erro de modelo não encontrado
        if (response.status === 404) {
          throw new Error(`OpenAI: modelo "${options.model}" não encontrado ou sem acesso. Tente GPT-4o Mini ou Manus AI.`);
        }

        // Erros transitórios: tentar novamente
        if (isRetryableError(response.status) && attempt < OPENAI_MAX_RETRIES) {
          lastError = new Error(`OpenAI API error ${response.status}: ${errorMsg}`);
          console.warn(`[OpenAI] Erro transitório ${response.status}, tentando novamente...`);
          continue;
        }

        throw new Error(`OpenAI API error ${response.status}: ${errorMsg}`);
      }

      const data: OpenAIResponse = await response.json();
      return data;

    } catch (error) {
      // Timeout
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error(`OpenAI: tempo limite excedido (${OPENAI_TIMEOUT_MS / 1000}s). Tente novamente ou use o Manus AI.`);
        if (attempt < OPENAI_MAX_RETRIES) continue;
        throw lastError;
      }

      // Erro de rede (sem conexão)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        lastError = new Error("OpenAI: falha de conexão. Verifique a conexão com a internet.");
        if (attempt < OPENAI_MAX_RETRIES) continue;
        throw lastError;
      }

      // Erro já tratado acima (não retentável)
      console.error("[OpenAI] Erro na chamada:", error);
      throw error;
    }
  }

  // Exauriu as tentativas
  throw lastError || new Error("OpenAI: falha após múltiplas tentativas. Tente o Manus AI.");
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
