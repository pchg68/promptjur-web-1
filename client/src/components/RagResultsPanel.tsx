import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Scale,
  Gavel,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Database,
  Clock,
  Search,
} from "lucide-react";

interface FonteRAG {
  id: string;
  tipo: "legislacao" | "sumula" | "jurisprudencia" | "doutrina";
  titulo: string;
  conteudo: string;
  origem: string;
  url?: string;
  relevancia: number;
}

interface RagResultProps {
  ragResult: {
    fontes: FonteRAG[];
    totalFontes: number;
    tempoMs: number;
    resumo: string;
  } | null;
  className?: string;
}

const TIPO_CONFIG = {
  legislacao: { icon: BookOpen, label: "Legislação", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  sumula: { icon: Scale, label: "Súmula", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  jurisprudencia: { icon: Gavel, label: "Jurisprudência", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  doutrina: { icon: BookOpen, label: "Doutrina", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
};

export function RagResultsPanel({ ragResult, className = "" }: RagResultProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedFontes, setExpandedFontes] = useState<Set<string>>(new Set());

  if (!ragResult || ragResult.totalFontes === 0) return null;

  const toggleFonte = (id: string) => {
    setExpandedFontes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className={`rounded-md border border-blue-200 bg-blue-50/50 ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-blue-50/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">
            RAG Jurídico — {ragResult.totalFontes} fonte(s) encontrada(s)
          </span>
          <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600">
            <Clock className="w-3 h-3 mr-1" />
            {ragResult.tempoMs}ms
          </Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
      </button>

      {/* Resumo sempre visível */}
      <div className="px-3 pb-2">
        <p className="text-xs text-blue-700/80">{ragResult.resumo}</p>
      </div>

      {/* Lista de fontes (expandível) */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-blue-100 pt-2">
          {ragResult.fontes.map((fonte) => {
            const config = TIPO_CONFIG[fonte.tipo] || TIPO_CONFIG.legislacao;
            const Icon = config.icon;
            const isExpanded = expandedFontes.has(fonte.id);

            return (
              <div
                key={fonte.id}
                className="rounded-sm border border-blue-100 bg-white/80 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFonte(fonte.id)}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-blue-50/50 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">
                    {fonte.titulo}
                  </span>
                  <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                    {config.label}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Search className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{fonte.relevancia}%</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-2 pb-2 border-t border-blue-50">
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {fonte.conteudo}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {fonte.origem}
                      </Badge>
                      {fonte.url && (
                        <a
                          href={fonte.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Verificar fonte
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
