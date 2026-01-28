/**
 * Interface unificada para múltiplos provedores de LLM
 * Suporta Manus AI (padrão) e OpenAI (ChatGPT)
 */

import { invokeLLM } from "./_core/llm";
import { invokeOpenAI, mapToOpenAIModel, extractOpenAIContent, type OpenAIModel } from "./openai-integration";

export type LLMProvider = "manus" | "openai";

export interface UnifiedLLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface UnifiedLLMOptions {
  provider?: LLMProvider;
  model?: string; // "gpt-4", "gpt-3.5-turbo", etc.
  messages: UnifiedLLMMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_schema" | "json_object" | "text";
    json_schema?: any;
  };
}

export interface UnifiedLLMResponse {
  provider: LLMProvider;
  model: string;
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Invoca LLM com provider unificado
 * Fallback automático: OpenAI -> Manus AI
 */
export async function invokeUnifiedLLM(
  options: UnifiedLLMOptions
): Promise<UnifiedLLMResponse> {
  const provider = options.provider || "manus";
  
  try {
    if (provider === "openai") {
      return await invokeOpenAIProvider(options);
    } else {
      return await invokeManusProvider(options);
    }
  } catch (error) {
    console.error(`[UnifiedLLM] Erro no provider ${provider}:`, error);
    
    // Fallback: se OpenAI falhar, tenta Manus
    if (provider === "openai") {
      console.log("[UnifiedLLM] Fallback para Manus AI");
      return await invokeManusProvider(options);
    }
    
    throw error;
  }
}

/**
 * Invoca OpenAI API
 */
async function invokeOpenAIProvider(
  options: UnifiedLLMOptions
): Promise<UnifiedLLMResponse> {
  const model = mapToOpenAIModel(options.model || "gpt-3.5-turbo");
  
  // Converter response_format se necessário
  let responseFormat: any = undefined;
  if (options.response_format) {
    if (options.response_format.type === "json_schema" || options.response_format.type === "json_object") {
      responseFormat = { type: "json_object" };
    }
  }
  
  const response = await invokeOpenAI({
    model,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
    response_format: responseFormat,
  });
  
  return {
    provider: "openai",
    model: response.model,
    content: extractOpenAIContent(response),
    usage: response.usage,
  };
}

/**
 * Invoca Manus AI (LLM padrão)
 */
async function invokeManusProvider(
  options: UnifiedLLMOptions
): Promise<UnifiedLLMResponse> {
  const response = await invokeLLM({
    messages: options.messages as any,
    response_format: options.response_format as any,
  });
  
  const content = response.choices[0].message.content;
  
  return {
    provider: "manus",
    model: response.model || "manus-default",
    content: typeof content === "string" ? content : JSON.stringify(content),
    usage: response.usage,
  };
}

/**
 * Lista de modelos disponíveis por provider
 */
export const AVAILABLE_MODELS: Record<LLMProvider, Array<{ id: string; name: string; description: string }>> = {
  manus: [
    {
      id: "manus-default",
      name: "Manus AI",
      description: "Modelo padrão otimizado para tarefas jurídicas",
    },
  ],
  openai: [
    {
      id: "gpt-4",
      name: "GPT-4",
      description: "Modelo mais avançado, melhor qualidade e raciocínio",
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      description: "Versão mais rápida do GPT-4 com contexto maior",
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "Modelo rápido e econômico, boa qualidade",
    },
  ],
};
