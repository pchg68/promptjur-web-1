/**
 * Interface unificada para múltiplos provedores de LLM
 * Suporta: Manus AI (padrão), OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), Perplexity
 * 
 * Funcionalidades:
 * - Fallback automático: qualquer provider -> Manus AI
 * - Análise de consenso: consulta múltiplos providers e compara respostas
 * - Detecção automática de providers configurados
 */

import { invokeLLM } from "./_core/llm";
import { invokeOpenAI, mapToOpenAIModel, extractOpenAIContent, isOpenAIConfigured } from "./openai-integration";
import { invokeClaude, mapToClaudeModel, extractClaudeContent, isClaudeConfigured } from "./claude-integration";
import { invokeGemini, mapToGeminiModel, extractGeminiContent, isGeminiConfigured } from "./gemini-integration";
import { invokePerplexity, mapToPerplexityModel, extractPerplexityContent, extractPerplexityCitations, isPerplexityConfigured } from "./perplexity-integration";

export type LLMProvider = "manus" | "openai" | "anthropic" | "google" | "perplexity" | "claude" | "gemini";

export interface UnifiedLLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface UnifiedLLMOptions {
  provider?: LLMProvider;
  model?: string;
  messages: UnifiedLLMMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_schema" | "json_object" | "text";
    json_schema?: unknown;
  };
}

export interface UnifiedLLMResponse {
  provider: LLMProvider;
  model: string;
  content: string;
  citations?: string[]; // Fontes citadas (Perplexity)
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ConsensusResult {
  responses: UnifiedLLMResponse[];
  consensusLevel: "alto" | "medio" | "baixo";
  summary: string;
  providersUsed: LLMProvider[];
}

/**
 * Invoca LLM com provider unificado
 * Fallback automático: qualquer provider -> Manus AI
 */
export async function invokeUnifiedLLM(
  options: UnifiedLLMOptions
): Promise<UnifiedLLMResponse> {
  const provider = options.provider || "manus";

  try {
    switch (provider) {
      case "openai":
        return await invokeOpenAIProvider(options);
      case "claude":
      case "anthropic":
        return await invokeClaudeProvider(options);
      case "gemini":
      case "google":
        return await invokeGeminiProvider(options);
      case "perplexity":
        return await invokePerplexityProvider(options);
      default:
        return await invokeManusProvider(options);
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[UnifiedLLM] Erro no provider ${provider}: ${errMsg}`);

    // Fallback: se qualquer provider externo falhar, tenta Manus AI automaticamente
    if (provider !== "manus") {
      // Não fazer fallback para erros de autenticação (chave errada) — informa o usuário
      const isAuthError = errMsg.includes("credenciais inválidas") || errMsg.includes("401") || errMsg.includes("403");
      const isConfigError = errMsg.includes("não configurada");

      if (isAuthError || isConfigError) {
        // Propagar o erro original com contexto claro
        throw new Error(`LLM invoke failed: ${errMsg}`);
      }

      console.log(`[UnifiedLLM] Fallback de ${provider} para Manus AI`);
      try {
        const fallbackResult = await invokeManusProvider(options);
        console.log(`[UnifiedLLM] Fallback para Manus AI bem-sucedido`);
        return { ...fallbackResult, provider: "manus" };
      } catch (fallbackError) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error("[UnifiedLLM] Fallback para Manus também falhou:", fallbackMsg);
        // Lançar erro original com contexto do fallback
        throw new Error(`LLM invoke failed: ${errMsg} (fallback Manus também falhou: ${fallbackMsg})`);
      }
    }

    throw new Error(`LLM invoke failed: ${errMsg}`);
  }
}

/**
 * Análise de consenso: consulta múltiplos providers e compara respostas
 * Útil para validação cruzada de informações jurídicas
 */
export async function invokeConsensusAnalysis(
  options: Omit<UnifiedLLMOptions, "provider">,
  providers?: LLMProvider[]
): Promise<ConsensusResult> {
  const availableProviders = providers || getConfiguredProviders();

  if (availableProviders.length === 0) {
    availableProviders.push("manus");
  }

  // Consulta paralela a todos os providers
  const promises = availableProviders.map(provider =>
    invokeUnifiedLLM({ ...options, provider })
      .catch(error => {
        console.warn(`[Consensus] Provider ${provider} falhou:`, error);
        return null;
      })
  );

  const results = await Promise.allSettled(promises);
  const responses: UnifiedLLMResponse[] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      responses.push(result.value);
    }
  }

  // Calcular nível de consenso baseado na similaridade das respostas
  const consensusLevel = calculateConsensusLevel(responses);
  const providersUsed = responses.map(r => r.provider);

  return {
    responses,
    consensusLevel,
    summary: `${responses.length}/${availableProviders.length} providers responderam. Consenso: ${consensusLevel}.`,
    providersUsed,
  };
}

/**
 * Calcula nível de consenso entre respostas
 */
function calculateConsensusLevel(
  responses: UnifiedLLMResponse[]
): "alto" | "medio" | "baixo" {
  if (responses.length <= 1) return "baixo";

  // Comparação simplificada baseada em palavras-chave compartilhadas
  const keywordSets = responses.map(r => {
    const words = r.content.toLowerCase()
      .replace(/[^\w\sáéíóúàâêôãõç]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 4);
    return new Set(words);
  });

  let totalOverlap = 0;
  let comparisons = 0;

  for (let i = 0; i < keywordSets.length; i++) {
    for (let j = i + 1; j < keywordSets.length; j++) {
      const setI = Array.from(keywordSets[i]);
      const setJ = Array.from(keywordSets[j]);
      const intersection = setI.filter(word => keywordSets[j].has(word));
      const unionSet = new Set([...setI, ...setJ]);
      totalOverlap += unionSet.size > 0 ? intersection.length / unionSet.size : 0;
      comparisons++;
    }
  }

  const avgOverlap = comparisons > 0 ? totalOverlap / comparisons : 0;

  if (avgOverlap >= 0.3) return "alto";
  if (avgOverlap >= 0.15) return "medio";
  return "baixo";
}

// ============================================
// Provider-specific implementations
// ============================================

async function invokeOpenAIProvider(options: UnifiedLLMOptions): Promise<UnifiedLLMResponse> {
  const model = mapToOpenAIModel(options.model || "gpt-4o-mini");

  let responseFormat: { type: "json_object" | "text" } | undefined;
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

async function invokeClaudeProvider(options: UnifiedLLMOptions): Promise<UnifiedLLMResponse> {
  const model = mapToClaudeModel(options.model || "claude-3.5-sonnet");

  // Separar system message das demais (Claude usa campo separado para system)
  const systemMessages = options.messages.filter(m => m.role === "system");
  const otherMessages = options.messages.filter(m => m.role !== "system");

  const systemPrompt = systemMessages.map(m => m.content).join("\n");

  const response = await invokeClaude({
    model,
    system: systemPrompt || undefined,
    messages: otherMessages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    temperature: options.temperature,
    max_tokens: options.max_tokens,
  });

  return {
    provider: "claude",
    model: response.model,
    content: extractClaudeContent(response),
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

async function invokeGeminiProvider(options: UnifiedLLMOptions): Promise<UnifiedLLMResponse> {
  const model = mapToGeminiModel(options.model || "gemini-2.0-flash");

  let responseFormat: { type: "json_object" | "text" } | undefined;
  if (options.response_format) {
    if (options.response_format.type === "json_schema" || options.response_format.type === "json_object") {
      responseFormat = { type: "json_object" };
    }
  }

  const response = await invokeGemini({
    model,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
    response_format: responseFormat,
  });

  return {
    provider: "gemini",
    model: response.modelVersion || model,
    content: extractGeminiContent(response),
    usage: response.usageMetadata ? {
      prompt_tokens: response.usageMetadata.promptTokenCount,
      completion_tokens: response.usageMetadata.candidatesTokenCount,
      total_tokens: response.usageMetadata.totalTokenCount,
    } : undefined,
  };
}

async function invokePerplexityProvider(options: UnifiedLLMOptions): Promise<UnifiedLLMResponse> {
  const model = mapToPerplexityModel(options.model || "sonar");

  const response = await invokePerplexity({
    model,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
    return_citations: true,
  });

  return {
    provider: "perplexity",
    model: response.model,
    content: extractPerplexityContent(response),
    citations: extractPerplexityCitations(response),
    usage: response.usage,
  };
}

async function invokeManusProvider(options: UnifiedLLMOptions): Promise<UnifiedLLMResponse> {
  const response = await invokeLLM({
    messages: options.messages as Parameters<typeof invokeLLM>[0]["messages"],
    response_format: options.response_format as Parameters<typeof invokeLLM>[0]["response_format"],
  });

  const content = response.choices[0].message.content;

  return {
    provider: "manus",
    model: response.model || "manus-default",
    content: typeof content === "string" ? content : JSON.stringify(content),
    usage: response.usage,
  };
}

// ============================================
// Provider discovery and configuration
// ============================================

/**
 * Retorna lista de providers configurados (com API key válida)
 */
export function getConfiguredProviders(): LLMProvider[] {
  const providers: LLMProvider[] = ["manus"]; // Manus sempre disponível

  if (isOpenAIConfigured()) providers.push("openai");
  if (isClaudeConfigured()) providers.push("claude");
  if (isGeminiConfigured()) providers.push("gemini");
  if (isPerplexityConfigured()) providers.push("perplexity");

  return providers;
}

/**
 * Verifica se um provider específico está configurado
 */
export function isProviderConfigured(provider: LLMProvider): boolean {
  switch (provider) {
    case "manus": return true;
    case "openai": return isOpenAIConfigured();
    case "claude":
    case "anthropic": return isClaudeConfigured();
    case "gemini":
    case "google": return isGeminiConfigured();
    case "perplexity": return isPerplexityConfigured();
    default: return false;
  }
}

/**
 * Lista de modelos disponíveis por provider
 */
export const AVAILABLE_MODELS: Record<LLMProvider, Array<{ id: string; name: string; description: string; contextWindow: string; costTier: "gratuito" | "baixo" | "medio" | "alto" }>> = {
  manus: [
    {
      id: "manus-default",
      name: "Manus AI",
      description: "Modelo padrão otimizado para tarefas jurídicas",
      contextWindow: "128K tokens",
      costTier: "gratuito",
    },
  ],
  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Modelo mais avançado da OpenAI, multimodal e rápido",
      contextWindow: "128K tokens",
      costTier: "medio",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Versão compacta e econômica do GPT-4o",
      contextWindow: "128K tokens",
      costTier: "baixo",
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      description: "GPT-4 com contexto estendido e melhor custo-benefício",
      contextWindow: "128K tokens",
      costTier: "medio",
    },
    {
      id: "o1-mini",
      name: "o1-mini",
      description: "Modelo de raciocínio avançado, ideal para análise jurídica complexa",
      contextWindow: "128K tokens",
      costTier: "alto",
    },
  ],
  claude: [
    {
      id: "claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      description: "Excelente raciocínio jurídico, textos longos e análise detalhada",
      contextWindow: "200K tokens",
      costTier: "medio",
    },
    {
      id: "claude-3.5-haiku",
      name: "Claude 3.5 Haiku",
      description: "Versão rápida e econômica do Claude, boa para tarefas simples",
      contextWindow: "200K tokens",
      costTier: "baixo",
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      description: "Modelo mais poderoso do Claude para análises complexas",
      contextWindow: "200K tokens",
      costTier: "alto",
    },
  ],
  gemini: [
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      description: "Rápido e eficiente, ideal para processos volumosos",
      contextWindow: "1M tokens",
      costTier: "baixo",
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      description: "Versão ultra-econômica para tarefas simples",
      contextWindow: "1M tokens",
      costTier: "gratuito",
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      description: "Modelo premium com contexto massivo de 1M tokens",
      contextWindow: "1M tokens",
      costTier: "medio",
    },
  ],
  perplexity: [
    {
      id: "sonar-pro",
      name: "Sonar Pro",
      description: "Pesquisa avançada com fontes citadas, ideal para jurisprudência",
      contextWindow: "200K tokens",
      costTier: "medio",
    },
    {
      id: "sonar",
      name: "Sonar",
      description: "Pesquisa com fontes citadas, versão econômica",
      contextWindow: "128K tokens",
      costTier: "baixo",
    },
    {
      id: "sonar-reasoning-pro",
      name: "Sonar Reasoning Pro",
      description: "Raciocínio avançado com pesquisa e fontes verificáveis",
      contextWindow: "128K tokens",
      costTier: "alto",
    },
  ],
  // Aliases: anthropic -> claude, google -> gemini
  get anthropic() { return this.claude; },
  get google() { return this.gemini; },
};

/**
 * Retorna modelos disponíveis apenas para providers configurados
 */
export function getAvailableModels(): Record<string, Array<{ id: string; name: string; description: string; contextWindow: string; costTier: string }>> {
  const configured = getConfiguredProviders();
  const result: Record<string, Array<{ id: string; name: string; description: string; contextWindow: string; costTier: string }>> = {};

  for (const provider of configured) {
    result[provider] = AVAILABLE_MODELS[provider];
  }

  return result;
}
