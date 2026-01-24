import { useEffect, useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import { extractCitacoesLegais } from "@/lib/extractCitacoes";
import type { CitacaoLegal } from "@/lib/extractCitacoes";

interface HighlightedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showValidation?: boolean;
  minHeight?: string;
  onBlur?: () => void;
}

export function HighlightedTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  showValidation = true,
  minHeight = "200px",
  onBlur
}: HighlightedTextareaProps) {
  const [citacoes, setCitacoes] = useState<CitacaoLegal[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Debounce para validação
  useEffect(() => {
    if (!showValidation || !value) {
      setCitacoes([]);
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(() => {
      const extracted = extractCitacoesLegais(value);
      setCitacoes(extracted);
      setIsValidating(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [value, showValidation]);

  // Sincronizar scroll entre textarea e highlight
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Renderizar texto com highlights
  const renderHighlightedText = () => {
    if (!showValidation || citacoes.length === 0) {
      return value;
    }

    let result = value;
    const replacements: Array<{ start: number; end: number; html: string }> = [];

    citacoes.forEach((citacao) => {
      const regex = new RegExp(citacao.textoOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let match;
      
      while ((match = regex.exec(value)) !== null) {
        const confiabilidade = citacao.confiabilidade || 'media';
        const colorClass = 
          confiabilidade === 'alta' ? 'bg-green-500/20 border-b-2 border-green-500' :
          confiabilidade === 'media' ? 'bg-yellow-500/20 border-b-2 border-yellow-500' :
          'bg-red-500/20 border-b-2 border-red-500';
        
        replacements.push({
          start: match.index,
          end: match.index + match[0].length,
          html: `<span class="${colorClass} rounded-sm px-0.5">${match[0]}</span>`
        });
      }
    });

    // Ordenar por posição (do final para o início para não afetar índices)
    replacements.sort((a, b) => b.start - a.start);

    // Aplicar replacements
    replacements.forEach(({ start, end, html }) => {
      result = result.substring(0, start) + html + result.substring(end);
    });

    return result;
  };

  const getConfiabilidadeIcon = (confiabilidade: string) => {
    switch (confiabilidade) {
      case 'alta':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'media':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'baixa':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getConfiabilidadeBadge = (confiabilidade: string) => {
    switch (confiabilidade) {
      case 'alta':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">✓ Alta</Badge>;
      case 'media':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">⚠️ Média</Badge>;
      case 'baixa':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">✗ Baixa</Badge>;
      default:
        return <Badge variant="outline">Desconhecida</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Textarea com highlight overlay */}
      <div className="relative">
        {/* Camada de highlight (atrás) */}
        {showValidation && (
          <div
            ref={highlightRef}
            className="absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words p-3 font-mono text-sm leading-relaxed"
            style={{
              minHeight,
              color: 'transparent',
              zIndex: 1
            }}
            dangerouslySetInnerHTML={{ __html: renderHighlightedText() }}
          />
        )}

        {/* Textarea (frente) */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`relative font-mono text-sm leading-relaxed ${className}`}
          style={{
            minHeight,
            backgroundColor: showValidation ? 'transparent' : undefined,
            zIndex: 2
          }}
        />
      </div>

      {/* Legenda e citações encontradas */}
      {showValidation && (
        <div className="space-y-3">
          {/* Legenda */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500/30 border-b-2 border-green-500 rounded-sm" />
              <span>Alta Confiabilidade</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-yellow-500/30 border-b-2 border-yellow-500 rounded-sm" />
              <span>Média Confiabilidade</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-500/30 border-b-2 border-red-500 rounded-sm" />
              <span>Baixa Confiabilidade</span>
            </div>
            {isValidating && (
              <div className="ml-auto flex items-center gap-2 text-blue-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Validando...</span>
              </div>
            )}
          </div>

          {/* Lista de citações encontradas */}
          {citacoes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Info className="w-4 h-4" />
                Citações Legais Encontradas ({citacoes.length})
              </h4>
              <div className="grid gap-2">
                {citacoes.map((citacao, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors cursor-help">
                          {getConfiabilidadeIcon(citacao.confiabilidade || 'media')}
                          <code className="text-xs font-mono flex-1">{citacao.textoOriginal}</code>
                          {getConfiabilidadeBadge(citacao.confiabilidade || 'media')}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-sm">
                        <div className="space-y-1.5">
                          <p className="font-semibold">Tipo: {citacao.tipo}</p>
                          {citacao.numero && <p>Número: {citacao.numero}</p>}
                          {citacao.artigo && <p>Artigo: {citacao.artigo}</p>}
                          {citacao.fonte && <p className="text-xs text-muted-foreground">Fonte: {citacao.fonte}</p>}
                          <p className="text-xs text-muted-foreground mt-2">
                            {citacao.confiabilidade === 'alta' && 'Citação validada e encontrada em fontes oficiais'}
                            {citacao.confiabilidade === 'media' && 'Citação encontrada, mas requer verificação manual'}
                            {citacao.confiabilidade === 'baixa' && 'Citação não encontrada ou formato incorreto'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Aviso se não houver citações */}
          {citacoes.length === 0 && !isValidating && value.length > 50 && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md text-sm text-blue-600">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Nenhuma citação legal detectada. Considere adicionar referências a leis, artigos ou jurisprudências para aumentar a credibilidade do prompt.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
