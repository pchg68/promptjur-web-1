import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Undo2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { TIPOS_REFINAMENTO, CATEGORIAS_REFINAMENTO, getRefinamentosPorCategoria, type TipoRefinamento } from "@shared/refinamento-iterativo";

interface RefinamentoPanelProps {
  promptText: string;
  promptId?: number;
  selectedModel?: string;
  onRefinado: (novoTexto: string) => void;
  className?: string;
}

export function RefinamentoPanel({
  promptText, promptId, selectedModel, onRefinado, className,
}: RefinamentoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [historico, setHistorico] = useState<Array<{ texto: string; refinamento: string }>>([]);

  const refinamentoMutation = trpc.prompts.refinar.useMutation({
    onSuccess: (data) => {
      // Salvar versão anterior no histórico local
      setHistorico(prev => [...prev, { texto: promptText, refinamento: data.refinamentoAplicado }]);
      onRefinado(data.promptRefinado);
      toast.success(`Refinamento aplicado: ${data.refinamentoAplicado}`, {
        description: `Processado em ${(data.tempoMs / 1000).toFixed(1)}s`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao refinar", { description: error.message });
    },
  });

  const handleRefinar = (refinamento: TipoRefinamento) => {
    refinamentoMutation.mutate({
      promptText,
      refinamentoId: refinamento.id,
      promptId,
      model: selectedModel as any,
    });
  };

  const handleUndo = () => {
    if (historico.length === 0) return;
    const ultimo = historico[historico.length - 1];
    setHistorico(prev => prev.slice(0, -1));
    onRefinado(ultimo.texto);
    toast.info("Refinamento desfeito");
  };

  const porCategoria = getRefinamentosPorCategoria();

  return (
    <div className={cn("rounded-md border border-border bg-muted/20 p-3 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-primary" />
          Refinamento Iterativo
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <div className="flex items-center gap-2">
          {historico.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleUndo}
                  disabled={refinamentoMutation.isPending}
                >
                  <Undo2 className="w-3 h-3" />
                  Desfazer ({historico.length})
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desfazer último refinamento</TooltipContent>
            </Tooltip>
          )}
          {refinamentoMutation.isPending && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Refinando...
            </Badge>
          )}
        </div>
      </div>

      {!expanded && (
        <div className="flex flex-wrap gap-1.5">
          {TIPOS_REFINAMENTO.slice(0, 5).map(r => (
            <Tooltip key={r.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={refinamentoMutation.isPending}
                  onClick={() => handleRefinar(r)}
                >
                  <span>{r.icone}</span>
                  {r.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{r.descricao}</TooltipContent>
            </Tooltip>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setExpanded(true)}
          >
            +{TIPOS_REFINAMENTO.length - 5} mais
          </Button>
        </div>
      )}

      {expanded && (
        <div className="space-y-3">
          {Object.entries(porCategoria).map(([cat, refinamentos]) => {
            const catConfig = CATEGORIAS_REFINAMENTO[cat];
            return (
              <div key={cat} className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <span>{catConfig?.icone}</span>
                  {catConfig?.label || cat}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {refinamentos.map(r => (
                    <Tooltip key={r.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          disabled={refinamentoMutation.isPending}
                          onClick={() => handleRefinar(r)}
                        >
                          <span>{r.icone}</span>
                          {r.label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium">{r.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{r.descricao}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico de refinamentos aplicados */}
      {historico.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Refinamentos aplicados:</p>
          <div className="flex flex-wrap gap-1">
            {historico.map((h, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {i + 1}. {h.refinamento}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
