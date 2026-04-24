import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHECKLIST_REVISAO, CATEGORIAS_REVISAO, getRevisaoPorCategoria } from "@shared/checklist-revisao";

interface ReviewChecklistProps {
  className?: string;
  onComplete?: (allChecked: boolean) => void;
}

export function ReviewChecklist({ className, onComplete }: ReviewChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const totalItems = CHECKLIST_REVISAO.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = checkedCount === totalItems;
  const porCategoria = getRevisaoPorCategoria();

  const handleCheck = useCallback((id: string, value: boolean) => {
    const newChecked = { ...checked, [id]: value };
    setChecked(newChecked);
    const newCount = Object.values(newChecked).filter(Boolean).length;
    onComplete?.(newCount === totalItems);
  }, [checked, totalItems, onComplete]);

  return (
    <div className={cn("rounded-md border space-y-0", className,
      allChecked ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
    )}>
      {/* Disclaimer */}
      <div className="p-3 flex items-start gap-2.5">
        <ShieldAlert className={cn("w-5 h-5 flex-shrink-0 mt-0.5",
          allChecked ? "text-emerald-500" : "text-amber-500"
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {allChecked ? "Revisão concluída" : "Revisão obrigatória antes do uso"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            O conteúdo gerado por IA é um <strong>rascunho</strong> que requer revisão profissional.
            Verifique cada item abaixo antes de utilizar o documento.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className={cn("text-xs",
            allChecked ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30"
          )}>
            {checkedCount}/{totalItems}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Checklist expandido */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
          {Object.entries(porCategoria).map(([cat, itens]) => {
            const catConfig = CATEGORIAS_REVISAO[cat];
            const catChecked = itens.filter(i => checked[i.id]).length;
            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{catConfig?.icone}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {catConfig?.label}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {catChecked}/{itens.length}
                  </Badge>
                </div>
                <div className="space-y-1 pl-1">
                  {itens.map(item => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 cursor-pointer group py-0.5"
                    >
                      <Checkbox
                        checked={!!checked[item.id]}
                        onCheckedChange={(v) => handleCheck(item.id, !!v)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-xs transition-colors",
                          checked[item.id] ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {item.label}
                        </span>
                        <p className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
                          {item.descricao}
                        </p>
                      </div>
                      {checked[item.id] && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Aviso final */}
          <div className="flex items-start gap-2 p-2 rounded bg-background/50 border border-border/30">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong>Responsabilidade profissional:</strong> A IA pode gerar informações incorretas,
              incluindo artigos de lei inexistentes, jurisprudência fabricada ou fundamentação inadequada.
              O advogado é o responsável final pelo conteúdo de qualquer peça jurídica.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
