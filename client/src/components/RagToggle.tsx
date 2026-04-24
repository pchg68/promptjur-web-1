import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Database, BookOpen, Scale, Gavel, ChevronDown, ChevronUp, Settings2 } from "lucide-react";

interface RagConfig {
  buscarLegislacao: boolean;
  buscarSumulas: boolean;
  buscarJurisprudencia: boolean;
  tribunais: string[];
}

interface RagToggleProps {
  ativo: boolean;
  config: RagConfig;
  onAtivoChange: (v: boolean) => void;
  onConfigChange: (config: RagConfig) => void;
  disabled?: boolean;
  compact?: boolean;
}

const TRIBUNAIS_DISPONIVEIS = [
  { id: "STF", label: "STF" },
  { id: "STJ", label: "STJ" },
  { id: "TST", label: "TST" },
  { id: "TJSP", label: "TJ-SP" },
  { id: "TJRJ", label: "TJ-RJ" },
  { id: "TJRS", label: "TJ-RS" },
  { id: "TJMG", label: "TJ-MG" },
  { id: "TJPR", label: "TJ-PR" },
  { id: "TRF1", label: "TRF-1" },
  { id: "TRF2", label: "TRF-2" },
  { id: "TRF3", label: "TRF-3" },
  { id: "TRF4", label: "TRF-4" },
  { id: "TRF5", label: "TRF-5" },
];

export function RagToggle({ ativo, config, onAtivoChange, onConfigChange, disabled, compact }: RagToggleProps) {
  const [showConfig, setShowConfig] = useState(false);

  const toggleTribunal = (id: string) => {
    const tribunais = config.tribunais.includes(id)
      ? config.tribunais.filter(t => t !== id)
      : [...config.tribunais, id];
    onConfigChange({ ...config, tribunais });
  };

  return (
    <div className="rounded-md border border-blue-200/60 bg-blue-50/30 p-3 space-y-2">
      {/* Toggle principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className={`w-4 h-4 ${ativo ? "text-blue-600" : "text-muted-foreground"}`} />
          <div>
            <Label className="text-sm font-medium">RAG Jurídico</Label>
            <p className="text-[10px] text-muted-foreground">
              Busca automática de legislação, súmulas e jurisprudência
            </p>
          </div>
        </div>
        <Switch checked={ativo} onCheckedChange={onAtivoChange} disabled={disabled} />
      </div>

      {ativo && !compact && (
        <>
          {/* Fontes ativas */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onConfigChange({ ...config, buscarLegislacao: !config.buscarLegislacao })}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border transition-colors ${
                config.buscarLegislacao
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-muted/50 text-muted-foreground border-border"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              Legislação
            </button>
            <button
              type="button"
              onClick={() => onConfigChange({ ...config, buscarSumulas: !config.buscarSumulas })}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border transition-colors ${
                config.buscarSumulas
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-muted/50 text-muted-foreground border-border"
              }`}
            >
              <Scale className="w-3 h-3" />
              Súmulas
            </button>
            <button
              type="button"
              onClick={() => onConfigChange({ ...config, buscarJurisprudencia: !config.buscarJurisprudencia })}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border transition-colors ${
                config.buscarJurisprudencia
                  ? "bg-purple-100 text-purple-700 border-purple-300"
                  : "bg-muted/50 text-muted-foreground border-border"
              }`}
            >
              <Gavel className="w-3 h-3" />
              Jurisprudência
            </button>
          </div>

          {/* Configuração de tribunais */}
          {config.buscarJurisprudencia && (
            <>
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings2 className="w-3 h-3" />
                Tribunais ({config.tribunais.length} selecionados)
                {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showConfig && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {TRIBUNAIS_DISPONIVEIS.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTribunal(t.id)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        config.tribunais.includes(t.id)
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted/30 text-muted-foreground border-border hover:border-primary/20"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {ativo && compact && (
        <div className="flex flex-wrap gap-1">
          {config.buscarLegislacao && <Badge variant="outline" className="text-[9px]">Legislação</Badge>}
          {config.buscarSumulas && <Badge variant="outline" className="text-[9px]">Súmulas</Badge>}
          {config.buscarJurisprudencia && <Badge variant="outline" className="text-[9px]">Jurisprud.</Badge>}
        </div>
      )}
    </div>
  );
}
