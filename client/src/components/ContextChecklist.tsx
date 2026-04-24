import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertTriangle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { calcularChecklistContexto } from "@shared/checklist-revisao";

interface ContextChecklistProps {
  campos: Record<string, any>;
  className?: string;
  compact?: boolean;
}

const NIVEL_CONFIG = {
  incompleto: { label: "Incompleto", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertTriangle },
  basico: { label: "Básico", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: Info },
  bom: { label: "Bom", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: CheckCircle2 },
  completo: { label: "Completo", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 },
};

export function ContextChecklist({ campos, className, compact }: ContextChecklistProps) {
  const checklist = useMemo(() => calcularChecklistContexto(campos), [campos]);
  const config = NIVEL_CONFIG[checklist.nivel];
  const Icon = config.icon;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1.5 cursor-help", className)}>
            <Icon className={cn("w-4 h-4", config.color)} />
            <span className={cn("text-xs font-medium", config.color)}>
              {checklist.percentual}%
            </span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", config.bg.replace("/10", ""))}
                style={{ width: `${checklist.percentual}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium mb-1">Contexto: {config.label} ({checklist.percentual}%)</p>
          {checklist.itens.filter(i => !i.preenchido).length > 0 && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Faltando:</p>
              {checklist.itens.filter(i => !i.preenchido).map(item => (
                <p key={item.id} className="text-xs flex items-center gap-1">
                  <Circle className="w-2.5 h-2.5 text-muted-foreground" />
                  {item.label}
                </p>
              ))}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn("rounded-md border p-3 space-y-2", config.border, config.bg, className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", config.color)} />
          <span className="text-sm font-medium">Contexto: {config.label}</span>
        </div>
        <Badge variant="outline" className={cn("text-xs", config.color)}>
          {checklist.percentual}%
        </Badge>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-1.5 bg-background/50 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            checklist.nivel === "completo" ? "bg-emerald-500" :
            checklist.nivel === "bom" ? "bg-blue-500" :
            checklist.nivel === "basico" ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${checklist.percentual}%` }}
        />
      </div>

      {/* Itens */}
      <div className="grid grid-cols-2 gap-1">
        {checklist.itens.map(item => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs cursor-help">
                {item.preenchido ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                )}
                <span className={cn(
                  "truncate",
                  item.preenchido ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{item.descricao}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
