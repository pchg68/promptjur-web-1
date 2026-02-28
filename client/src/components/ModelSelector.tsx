import { Bot, Sparkles, Crown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type LLMProvider = "manus" | "openai" | "anthropic" | "google" | "perplexity";

export interface ModelOption {
  provider: LLMProvider;
  model: string;
  name: string;
  description: string;
  tier: "free" | "pro" | "enterprise";
  badge?: string;
}

const AVAILABLE_MODELS: ModelOption[] = [
  // Manus AI
  {
    provider: "manus",
    model: "manus-default",
    name: "Manus AI",
    description: "Otimizado para direito brasileiro",
    tier: "free",
    badge: "Padrão",
  },
  // OpenAI
  {
    provider: "openai",
    model: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Rápido e econômico, ideal para tarefas simples",
    tier: "free",
  },
  {
    provider: "openai",
    model: "gpt-4o",
    name: "GPT-4o",
    description: "Modelo multimodal avançado da OpenAI",
    tier: "pro",
  },
  {
    provider: "openai",
    model: "o1",
    name: "o1 (Raciocínio)",
    description: "Raciocínio profundo para análises complexas",
    tier: "enterprise",
    badge: "Novo",
  },
  // Anthropic Claude
  {
    provider: "anthropic",
    model: "claude-sonnet",
    name: "Claude Sonnet",
    description: "Raciocínio jurídico superior, 200K tokens",
    tier: "pro",
    badge: "Recomendado",
  },
  {
    provider: "anthropic",
    model: "claude-opus",
    name: "Claude Opus",
    description: "Máxima qualidade para casos complexos",
    tier: "enterprise",
  },
  // Google Gemini
  {
    provider: "google",
    model: "gemini-pro",
    name: "Gemini Pro",
    description: "Contexto de 1M tokens para processos volumosos",
    tier: "pro",
  },
  {
    provider: "google",
    model: "gemini-flash",
    name: "Gemini Flash",
    description: "Ultra-rápido para tarefas em lote",
    tier: "pro",
  },
  // Perplexity
  {
    provider: "perplexity",
    model: "perplexity-sonar",
    name: "Perplexity Sonar",
    description: "Pesquisa com fontes citadas automaticamente",
    tier: "pro",
    badge: "Pesquisa",
  },
];

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  manus: "Manus AI",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  perplexity: "Perplexity",
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-zinc-500/10 text-zinc-500",
  pro: "bg-amber-500/10 text-amber-600",
  enterprise: "bg-violet-500/10 text-violet-600",
};

const TIER_LABELS: Record<string, string> = {
  free: "Grátis",
  pro: "Pro",
  enterprise: "Escritório",
};

interface ModelSelectorProps {
  value: string; // formato: "provider:model" ex: "openai:gpt-4o"
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  // Group models by provider
  const groupedModels = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<LLMProvider, ModelOption[]>);

  const providerOrder: LLMProvider[] = ["manus", "openai", "anthropic", "google", "perplexity"];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="model-selector" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Modelo de IA
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Sparkles className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p className="font-semibold mb-2">Provedores de IA disponíveis:</p>
            <ul className="text-sm space-y-1.5">
              <li><strong>Manus AI:</strong> Otimizado para direito brasileiro</li>
              <li><strong>OpenAI (GPT-4o):</strong> Modelo multimodal avançado</li>
              <li><strong>Claude (Anthropic):</strong> Raciocínio jurídico superior</li>
              <li><strong>Gemini (Google):</strong> Contexto longo (1M tokens)</li>
              <li><strong>Perplexity:</strong> Pesquisa com fontes citadas</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Modelos marcados com Pro/Escritório requerem plano correspondente.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="model-selector">
          <SelectValue placeholder="Selecione o modelo" />
        </SelectTrigger>
        <SelectContent>
          {providerOrder.map((provider) => {
            const models = groupedModels[provider];
            if (!models?.length) return null;
            return (
              <SelectGroup key={provider}>
                <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                  {PROVIDER_LABELS[provider]}
                </SelectLabel>
                {models.map((model) => (
                  <SelectItem
                    key={`${model.provider}:${model.model}`}
                    value={`${model.provider}:${model.model}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{model.name}</span>
                          {model.badge && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                              {model.badge}
                            </Badge>
                          )}
                          {model.tier !== "free" && (
                            <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${TIER_COLORS[model.tier]}`}>
                              {TIER_LABELS[model.tier]}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Parse valor do seletor para provider e model
 */
export function parseModelValue(value: string): { provider: LLMProvider; model: string } {
  const [provider, ...modelParts] = value.split(":");
  const model = modelParts.join(":") || "manus-default";
  return {
    provider: (provider as LLMProvider) || "manus",
    model,
  };
}

/**
 * Formata valor para o seletor
 */
export function formatModelValue(provider: LLMProvider, model: string): string {
  return `${provider}:${model}`;
}

/**
 * Retorna a lista de modelos disponíveis
 */
export function getAvailableModels(): ModelOption[] {
  return AVAILABLE_MODELS;
}
