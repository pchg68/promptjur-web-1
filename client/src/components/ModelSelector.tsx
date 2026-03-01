import { useState } from "react";
import { Bot, Sparkles, Crown, Lock, ArrowUpRight } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { toast } from "sonner";

export type LLMProvider = "manus" | "openai" | "anthropic" | "google" | "perplexity";
export type PlanTier = "free" | "pro" | "enterprise";

export interface ModelOption {
  provider: LLMProvider;
  model: string;
  name: string;
  description: string;
  tier: PlanTier;
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

const PLAN_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

function canAccessTier(userPlan: PlanTier, requiredTier: PlanTier): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredTier];
}

interface ModelSelectorProps {
  value: string; // formato: "provider:model" ex: "openai:gpt-4o"
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const { user } = useAuth();
  const userPlan = ((user as any)?.subscriptionPlan || "free") as PlanTier;
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [blockedModel, setBlockedModel] = useState<ModelOption | null>(null);

  // Group models by provider
  const groupedModels = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<LLMProvider, ModelOption[]>);

  const providerOrder: LLMProvider[] = ["manus", "openai", "anthropic", "google", "perplexity"];

  const handleModelChange = (newValue: string) => {
    // Find the model to check access
    const model = AVAILABLE_MODELS.find(m => `${m.provider}:${m.model}` === newValue);
    if (model && !canAccessTier(userPlan, model.tier)) {
      setBlockedModel(model);
      setUpgradeDialogOpen(true);
      return;
    }
    onChange(newValue);
  };

  return (
    <>
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
                Modelos com <Lock className="inline h-3 w-3" /> requerem upgrade de plano.
              </p>
            </TooltipContent>
          </Tooltip>
          {userPlan !== "free" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              <Crown className="h-3 w-3 mr-0.5" />
              {TIER_LABELS[userPlan]}
            </Badge>
          )}
        </div>
        
        <Select value={value} onValueChange={handleModelChange} disabled={disabled}>
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
                  {models.map((model) => {
                    const hasAccess = canAccessTier(userPlan, model.tier);
                    return (
                      <SelectItem
                        key={`${model.provider}:${model.model}`}
                        value={`${model.provider}:${model.model}`}
                        className={!hasAccess ? "opacity-60" : ""}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              {!hasAccess && (
                                <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className={`font-medium ${!hasAccess ? "text-muted-foreground" : ""}`}>
                                {model.name}
                              </span>
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
                    );
                  })}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Modal de Upgrade */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Upgrade Necessário
            </DialogTitle>
            <DialogDescription>
              {blockedModel && (
                <>
                  O modelo <strong>{blockedModel.name}</strong> requer o plano{" "}
                  <strong>{TIER_LABELS[blockedModel.tier]}</strong>.
                  {blockedModel.tier === "pro" && (
                    <span className="block mt-2 text-sm">
                      O plano Profissional custa <strong>R$ 49,90/mês</strong> e inclui acesso a GPT-4o, Claude Sonnet, Gemini Pro, Perplexity e muito mais.
                    </span>
                  )}
                  {blockedModel.tier === "enterprise" && (
                    <span className="block mt-2 text-sm">
                      O plano Escritório custa <strong>R$ 149,90/mês</strong> e inclui acesso a todos os modelos, incluindo o1, Claude Opus e Sonar Reasoning Pro.
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-muted/50 rounded-sm p-3 text-sm space-y-2">
              <p className="font-medium">O que você ganha com o upgrade:</p>
              <ul className="space-y-1 text-muted-foreground">
                {blockedModel?.tier === "pro" ? (
                  <>
                    <li>500 prompts por mês</li>
                    <li>GPT-4o + Claude Sonnet + Gemini Pro</li>
                    <li>Multi-IA com consenso</li>
                    <li>Knowledge Retrieval (DataJud)</li>
                    <li>Exportação DOCX/PDF/ABNT</li>
                  </>
                ) : (
                  <>
                    <li>Prompts ilimitados</li>
                    <li>Todos os provedores de IA (o1, Claude Opus, etc.)</li>
                    <li>Multi-IA com consenso avançado</li>
                    <li>Knowledge Retrieval completo</li>
                    <li>Suporte prioritário 24h</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              Continuar com plano atual
            </Button>
            <Link href="/planos">
              <Button
                className="gap-1.5"
                onClick={() => setUpgradeDialogOpen(false)}
              >
                Ver Planos
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
