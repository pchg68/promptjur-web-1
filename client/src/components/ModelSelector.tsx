import { Bot, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type LLMProvider = "manus" | "openai";

export interface ModelOption {
  provider: LLMProvider;
  model: string;
  name: string;
  description: string;
}

const AVAILABLE_MODELS: ModelOption[] = [
  {
    provider: "manus",
    model: "manus-default",
    name: "Manus AI (Padrão)",
    description: "Modelo otimizado para tarefas jurídicas brasileiras",
  },
  {
    provider: "openai",
    model: "gpt-4",
    name: "GPT-4",
    description: "Modelo mais avançado da OpenAI, melhor qualidade",
  },
  {
    provider: "openai",
    model: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Versão mais rápida do GPT-4 com contexto maior",
  },
  {
    provider: "openai",
    model: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Modelo rápido e econômico",
  },
];

interface ModelSelectorProps {
  value: string; // formato: "provider:model" ex: "openai:gpt-4"
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
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
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1">Escolha o modelo de IA:</p>
            <ul className="text-sm space-y-1">
              <li>• <strong>Manus AI:</strong> Otimizado para direito brasileiro</li>
              <li>• <strong>GPT-4:</strong> Melhor qualidade, mais lento</li>
              <li>• <strong>GPT-4 Turbo:</strong> Equilíbrio entre qualidade e velocidade</li>
              <li>• <strong>GPT-3.5:</strong> Mais rápido e econômico</li>
            </ul>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="model-selector">
          <SelectValue placeholder="Selecione o modelo" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem
              key={`${model.provider}:${model.model}`}
              value={`${model.provider}:${model.model}`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">
                  {model.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Parse valor do seletor para provider e model
 */
export function parseModelValue(value: string): { provider: LLMProvider; model: string } {
  const [provider, model] = value.split(":");
  return {
    provider: (provider as LLMProvider) || "manus",
    model: model || "manus-default",
  };
}

/**
 * Formata valor para o seletor
 */
export function formatModelValue(provider: LLMProvider, model: string): string {
  return `${provider}:${model}`;
}
