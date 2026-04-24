import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UserCircle, ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERSONAS_JURIDICAS, getPersonasParaArea, type PersonaJuridica } from "@shared/personas-juridicas";

interface PersonaSelectorProps {
  value?: string;
  customValue?: string;
  area?: string;
  onChange: (personaId?: string) => void;
  onCustomChange: (custom?: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function PersonaSelector({
  value, customValue, area, onChange, onCustomChange, disabled, compact,
}: PersonaSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customDraft, setCustomDraft] = useState(customValue || "");

  const personas = useMemo(() => {
    return area ? getPersonasParaArea(area) : PERSONAS_JURIDICAS;
  }, [area]);

  const selectedPersona = useMemo(() => {
    return PERSONAS_JURIDICAS.find(p => p.id === value);
  }, [value]);

  const isCustom = !!customValue && !value;

  const handleSelect = (persona: PersonaJuridica) => {
    if (value === persona.id) {
      onChange(undefined);
    } else {
      onChange(persona.id);
      onCustomChange(undefined);
    }
  };

  const handleSaveCustom = () => {
    if (customDraft.trim()) {
      onCustomChange(customDraft.trim());
      onChange(undefined);
    }
    setShowCustomDialog(false);
  };

  const handleClearCustom = () => {
    onCustomChange(undefined);
    setCustomDraft("");
  };

  // Personas relevantes para a área (primeiras) e outras
  const relevantes = personas.filter(p => area && p.areasRelevantes.includes(area));
  const outras = personas.filter(p => !area || !p.areasRelevantes.includes(area));
  const displayPersonas = expanded ? personas : relevantes.length > 0 ? relevantes.slice(0, 4) : personas.slice(0, 4);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm flex items-center gap-1.5">
          <UserCircle className="w-4 h-4 text-primary" />
          Persona Jurídica
        </Label>
        {(value || isCustom) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => { onChange(undefined); handleClearCustom(); }}
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Seleção atual */}
      {(selectedPersona || isCustom) && !compact && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
          <span className="text-lg">{selectedPersona?.icone || "✏️"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {selectedPersona?.nome || "Persona Personalizada"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {selectedPersona?.descricao || customValue?.substring(0, 60) + "..."}
            </p>
          </div>
        </div>
      )}

      {/* Grid de personas */}
      <div className="grid grid-cols-2 gap-1.5">
        {displayPersonas.map((persona) => {
          const isSelected = value === persona.id;
          const isRelevante = area && persona.areasRelevantes.includes(area);
          return (
            <Tooltip key={persona.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(persona)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md text-left text-xs transition-all border",
                    isSelected
                      ? "bg-primary/10 border-primary/40 text-primary font-medium"
                      : "bg-background hover:bg-muted/50 border-border hover:border-primary/30",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <span className="text-base flex-shrink-0">{persona.icone}</span>
                  <span className="truncate">{persona.nome}</span>
                  {isRelevante && !isSelected && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-auto flex-shrink-0">
                      Recomendado
                    </Badge>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{persona.nome}</p>
                <p className="text-xs text-muted-foreground mt-1">{persona.descricao}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Expandir / Persona customizada */}
      <div className="flex items-center gap-2">
        {personas.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {expanded ? "Ver menos" : `Ver todas (${personas.length})`}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 text-xs", isCustom ? "text-primary" : "text-muted-foreground")}
          onClick={() => { setCustomDraft(customValue || ""); setShowCustomDialog(true); }}
        >
          <Pencil className="w-3 h-3 mr-1" />
          {isCustom ? "Editar persona" : "Persona customizada"}
        </Button>
      </div>

      {/* Dialog de persona customizada */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Persona Jurídica Customizada</DialogTitle>
            <DialogDescription>
              Descreva a perspectiva, especialidade e estilo que a IA deve adotar ao gerar o prompt.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={customDraft}
            onChange={e => setCustomDraft(e.target.value)}
            placeholder="Ex: Adote a perspectiva de um advogado especializado em direito imobiliário com 15 anos de experiência em usucapião..."
            rows={6}
            className="text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCustom} disabled={!customDraft.trim()}>Aplicar Persona</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
