/**
 * Roteamento Inteligente de Modelos por Tipo de Tarefa
 * 
 * Seleciona automaticamente o melhor modelo/provider com base em:
 * 1. Tipo de tarefa (classificação, análise, geração, verificação)
 * 2. Complexidade estimada do input
 * 3. Plano do usuário (modelos disponíveis)
 * 4. Custo-benefício (prioriza modelos econômicos para tarefas simples)
 */

import { LLMProvider } from "./unified-llm";
import { PLANS } from "./stripe-products";

export type TaskType = 
  | "classificacao"     // Identificar área jurídica, tipo de documento
  | "analise"           // Analisar qualidade, extrair entidades
  | "geracao_simples"   // Gerar prompts curtos, refinamentos
  | "geracao_complexa"  // Gerar documentos completos, petições
  | "verificacao"       // Verificar citações, validar legislação
  | "pesquisa"          // Buscar jurisprudência, RAG
  | "comparacao"        // Comparar versões, consenso multi-IA
  | "otimizacao";       // Otimizar prompts existentes

export interface RoutingDecision {
  provider: LLMProvider;
  model: string;
  reason: string;
  costTier: "economico" | "intermediario" | "premium";
  estimatedTokens: { input: number; output: number };
}

interface RoutingConfig {
  taskType: TaskType;
  userPlan: string;
  inputLength: number;
  requiresRAG?: boolean;
  requiresCitations?: boolean;
}

/**
 * Mapeamento de modelos por tier de custo e capacidade
 */
const MODEL_TIERS = {
  economico: [
    { provider: "manus" as LLMProvider, model: "manus-default", priority: 1 },
    { provider: "google" as LLMProvider, model: "gemini-2.0-flash-lite", priority: 2 },
    { provider: "openai" as LLMProvider, model: "gpt-4o-mini", priority: 3 },
  ],
  intermediario: [
    { provider: "openai" as LLMProvider, model: "gpt-4o", priority: 1 },
    { provider: "google" as LLMProvider, model: "gemini-2.0-flash", priority: 2 },
    { provider: "manus" as LLMProvider, model: "manus-default", priority: 3 },
  ],
  premium: [
    { provider: "claude" as LLMProvider, model: "claude-3.5-sonnet", priority: 1 },
    { provider: "openai" as LLMProvider, model: "gpt-4o", priority: 2 },
    { provider: "google" as LLMProvider, model: "gemini-1.5-pro", priority: 3 },
  ],
  pesquisa: [
    { provider: "perplexity" as LLMProvider, model: "sonar-pro", priority: 1 },
    { provider: "perplexity" as LLMProvider, model: "sonar", priority: 2 },
    { provider: "manus" as LLMProvider, model: "manus-default", priority: 3 },
  ],
};

/**
 * Regras de roteamento por tipo de tarefa
 */
const TASK_ROUTING_RULES: Record<TaskType, {
  preferredTier: keyof typeof MODEL_TIERS;
  maxTokensInput: number;
  maxTokensOutput: number;
  description: string;
}> = {
  classificacao: {
    preferredTier: "economico",
    maxTokensInput: 1000,
    maxTokensOutput: 200,
    description: "Classificação rápida — modelo econômico suficiente",
  },
  analise: {
    preferredTier: "intermediario",
    maxTokensInput: 4000,
    maxTokensOutput: 2000,
    description: "Análise requer compreensão — modelo intermediário",
  },
  geracao_simples: {
    preferredTier: "economico",
    maxTokensInput: 2000,
    maxTokensOutput: 1500,
    description: "Geração curta — modelo econômico com bom output",
  },
  geracao_complexa: {
    preferredTier: "premium",
    maxTokensInput: 8000,
    maxTokensOutput: 6000,
    description: "Documento completo — modelo premium para qualidade",
  },
  verificacao: {
    preferredTier: "intermediario",
    maxTokensInput: 6000,
    maxTokensOutput: 2000,
    description: "Verificação factual — modelo intermediário preciso",
  },
  pesquisa: {
    preferredTier: "pesquisa",
    maxTokensInput: 3000,
    maxTokensOutput: 4000,
    description: "Pesquisa com citações — Perplexity preferido",
  },
  comparacao: {
    preferredTier: "intermediario",
    maxTokensInput: 4000,
    maxTokensOutput: 3000,
    description: "Comparação — modelo intermediário para análise",
  },
  otimizacao: {
    preferredTier: "intermediario",
    maxTokensInput: 3000,
    maxTokensOutput: 2000,
    description: "Otimização — modelo intermediário para reescrita",
  },
};

/**
 * Estima a complexidade do input baseado em heurísticas
 */
function estimateComplexity(inputLength: number): "baixa" | "media" | "alta" {
  if (inputLength < 500) return "baixa";
  if (inputLength < 2000) return "media";
  return "alta";
}

/**
 * Verifica se um modelo está disponível para o plano do usuário
 */
function isModelAvailableForPlan(model: string, userPlan: string): boolean {
  const plan = PLANS[userPlan];
  if (!plan) return false;
  
  // Manus sempre disponível
  if (model === "manus-default") return true;
  
  const availableModels = plan.limits.modelsAvailable;
  
  // Verificar match parcial (ex: "gpt-4o" match "gpt-4o-mini")
  return availableModels.some(m => 
    model.includes(m) || m.includes(model.split("-")[0])
  );
}

/**
 * Seleciona o melhor modelo disponível para a tarefa
 * Considera: tipo de tarefa, plano do usuário, complexidade do input
 */
export function selectSmartModel(config: RoutingConfig): RoutingDecision {
  const { taskType, userPlan, inputLength, requiresRAG, requiresCitations } = config;
  
  const rule = TASK_ROUTING_RULES[taskType];
  const complexity = estimateComplexity(inputLength);
  
  // Ajustar tier baseado na complexidade
  let effectiveTier = rule.preferredTier;
  
  if (complexity === "alta" && effectiveTier === "economico") {
    effectiveTier = "intermediario";
  }
  
  // Se requer citações, preferir Perplexity
  if (requiresCitations && effectiveTier !== "pesquisa") {
    effectiveTier = "pesquisa";
  }
  
  // Se requer RAG e plano não suporta, downgrade para manus
  if (requiresRAG && !PLANS[userPlan]?.limits.knowledgeRetrieval) {
    return {
      provider: "manus",
      model: "manus-default",
      reason: "RAG não disponível no plano — usando modelo padrão",
      costTier: "economico",
      estimatedTokens: { input: rule.maxTokensInput, output: rule.maxTokensOutput },
    };
  }
  
  // Buscar modelo disponível no tier preferido
  const tierModels = MODEL_TIERS[effectiveTier];
  
  for (const candidate of tierModels) {
    if (isModelAvailableForPlan(candidate.model, userPlan)) {
      const costTier = effectiveTier === "economico" ? "economico" 
        : effectiveTier === "premium" ? "premium" 
        : "intermediario";
      
      return {
        provider: candidate.provider,
        model: candidate.model,
        reason: rule.description,
        costTier,
        estimatedTokens: { input: rule.maxTokensInput, output: rule.maxTokensOutput },
      };
    }
  }
  
  // Fallback: sempre retornar manus como último recurso
  return {
    provider: "manus",
    model: "manus-default",
    reason: "Fallback — nenhum modelo do tier disponível no plano",
    costTier: "economico",
    estimatedTokens: { input: rule.maxTokensInput, output: rule.maxTokensOutput },
  };
}

/**
 * Detecta automaticamente o tipo de tarefa baseado no contexto
 */
export function detectTaskType(context: {
  operation: "analisar" | "gerar" | "otimizar" | "refinar" | "verificar" | "pesquisar" | "comparar" | "documento";
  inputLength: number;
  hasRAG?: boolean;
  tipoDocumento?: string;
}): TaskType {
  const { operation, inputLength, hasRAG, tipoDocumento } = context;
  
  switch (operation) {
    case "analisar":
      return inputLength < 500 ? "classificacao" : "analise";
    
    case "gerar":
      // Documentos completos (petição, contrato, parecer) = complexo
      const documentosComplexos = ["peticao", "petição", "contrato", "parecer", "recurso", "contestação", "contestacao"];
      if (tipoDocumento && documentosComplexos.some(d => tipoDocumento.toLowerCase().includes(d))) {
        return "geracao_complexa";
      }
      return inputLength > 1500 ? "geracao_complexa" : "geracao_simples";
    
    case "otimizar":
      return "otimizacao";
    
    case "refinar":
      return "geracao_simples";
    
    case "verificar":
      return "verificacao";
    
    case "pesquisar":
      return "pesquisa";
    
    case "comparar":
      return "comparacao";
    
    case "documento":
      return "geracao_complexa";
    
    default:
      return "analise";
  }
}

/**
 * Função principal: dado um contexto de operação, retorna a melhor configuração de modelo
 * Pode ser usada como substituição automática quando o usuário não seleciona provider/model
 */
export function getSmartRouting(params: {
  operation: "analisar" | "gerar" | "otimizar" | "refinar" | "verificar" | "pesquisar" | "comparar" | "documento";
  userPlan: string;
  inputText: string;
  tipoDocumento?: string;
  requiresRAG?: boolean;
  requiresCitations?: boolean;
}): RoutingDecision {
  const taskType = detectTaskType({
    operation: params.operation,
    inputLength: params.inputText.length,
    hasRAG: params.requiresRAG,
    tipoDocumento: params.tipoDocumento,
  });
  
  return selectSmartModel({
    taskType,
    userPlan: params.userPlan,
    inputLength: params.inputText.length,
    requiresRAG: params.requiresRAG,
    requiresCitations: params.requiresCitations,
  });
}
