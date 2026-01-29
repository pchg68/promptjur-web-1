import { Badge } from "@/components/ui/badge";

interface ModelBadgeProps {
  provider: string;
  model: string;
  className?: string;
}

export function ModelBadge({ provider, model, className }: ModelBadgeProps) {
  const getIcon = () => {
    if (provider === "openai") return "🤖";
    return "✨";
  };

  const getLabel = () => {
    if (provider === "openai") {
      if (model === "gpt-4") return "GPT-4";
      if (model === "gpt-4-turbo") return "GPT-4 Turbo";
      if (model === "gpt-3.5-turbo") return "GPT-3.5 Turbo";
      return model;
    }
    return "Manus AI";
  };

  const getVariant = () => {
    if (provider === "openai") return "secondary";
    return "default";
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {getIcon()} Gerado com {getLabel()}
    </Badge>
  );
}
