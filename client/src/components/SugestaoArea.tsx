import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Lightbulb, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SugestaoAreaProps {
  contexto: string;
  objetivo?: string;
  onAplicarSugestao: (area: "Civil" | "Penal" | "Trabalhista" | "Tributário" | "Administrativo" | "Constitucional" | "Empresarial" | "Consumidor" | "Família" | "Previdenciário" | "Ambiental" | "Internacional" | "Processo Civil" | "Direito Médico" | "Direito Digital" | "Direito Internacional") => void;
}

export function SugestaoArea({ contexto, objetivo, onAplicarSugestao }: SugestaoAreaProps) {
  const [mostrarSugestao, setMostrarSugestao] = useState(false);
  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sugestaoQuery = trpc.sugestao.area.useQuery(
    { contexto, objetivo },
    { enabled: false }
  );
  
  // Debounce automático: sugerir área quando usuário parar de digitar por 500ms
  useEffect(() => {
    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Se o contexto for suficiente e a sugestão automática estiver habilitada
    if (autoSuggestEnabled && contexto && contexto.length >= 30) {
      debounceTimerRef.current = setTimeout(() => {
        sugestaoQuery.refetch();
      }, 500); // 500ms de debounce
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [contexto, objetivo, autoSuggestEnabled]);
  
  // Mostrar sugestão quando dados estiverem disponíveis
  if (sugestaoQuery.data && !mostrarSugestao && !sugestaoQuery.isFetching) {
    setMostrarSugestao(true);
  }

  const handleSugerir = () => {
    if (!contexto || contexto.length < 10) {
      toast.error("Digite um contexto mais detalhado para obter sugestão");
      return;
    }
    
    sugestaoQuery.refetch();
  };

  const handleAplicar = () => {
    if (sugestaoQuery.data) {
      onAplicarSugestao(sugestaoQuery.data.area as Parameters<typeof onAplicarSugestao>[0]);
      toast.success(`Área "${sugestaoQuery.data.area}" aplicada!`);
      setMostrarSugestao(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSugerir}
          disabled={sugestaoQuery.isFetching || !contexto || contexto.length < 10}
        >
          {sugestaoQuery.isFetching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4 mr-2" />
              Sugerir Área
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant={autoSuggestEnabled ? "default" : "ghost"}
          size="sm"
          onClick={() => setAutoSuggestEnabled(!autoSuggestEnabled)}
          title={autoSuggestEnabled ? "Desativar sugestão automática" : "Ativar sugestão automática"}
        >
          {autoSuggestEnabled ? "⚡ Auto" : "⚡"}
        </Button>
      </div>

      {mostrarSugestao && sugestaoQuery.data && (
        <Card className="p-4 space-y-3 border-primary/20 bg-primary/5">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Sugestão Inteligente</span>
                <Badge 
                  variant={sugestaoQuery.data.confianca >= 70 ? "default" : sugestaoQuery.data.confianca >= 40 ? "secondary" : "outline"}
                >
                  {sugestaoQuery.data.confianca}% confiança
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {sugestaoQuery.data.motivo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAplicar}
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Usar sugerida: {sugestaoQuery.data.area}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMostrarSugestao(false)}
            >
              Ignorar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
