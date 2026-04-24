import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Clock,
  FileWarning,
} from "lucide-react";

type NivelRisco = "critico" | "alto" | "medio" | "baixo" | "ok";

interface CitacaoDetectada {
  textoOriginal: string;
  tipo: "artigo" | "sumula" | "lei" | "jurisprudencia" | "decreto" | "portaria";
  identificador: string;
  referencia?: string;
  status: "verificado" | "suspeito" | "nao_encontrado" | "formato_invalido";
  risco: NivelRisco;
  explicacao: string;
  sugestaoCorrecao?: string;
  linkVerificacao?: string;
}

interface DeteccaoAlucinacao {
  citacoes: CitacaoDetectada[];
  resumo: {
    total: number;
    verificadas: number;
    suspeitas: number;
    naoEncontradas: number;
    formatoInvalido: number;
  };
  riscoGeral: NivelRisco;
  mensagemAlerta: string;
  tempoMs: number;
}

interface AlucinacaoAlertProps {
  deteccao: DeteccaoAlucinacao | null;
  className?: string;
}

const RISCO_CONFIG: Record<NivelRisco, { icon: typeof AlertTriangle; color: string; bgColor: string; borderColor: string; label: string }> = {
  critico: { icon: XCircle, color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", label: "Crítico" },
  alto: { icon: AlertTriangle, color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200", label: "Alto" },
  medio: { icon: HelpCircle, color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", label: "Médio" },
  baixo: { icon: Shield, color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200", label: "Baixo" },
  ok: { icon: CheckCircle2, color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", label: "OK" },
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  verificado: { icon: CheckCircle2, color: "text-green-600", label: "Verificado" },
  suspeito: { icon: HelpCircle, color: "text-amber-600", label: "Não verificado" },
  nao_encontrado: { icon: XCircle, color: "text-red-600", label: "Não encontrado" },
  formato_invalido: { icon: FileWarning, color: "text-orange-600", label: "Formato inválido" },
};

const TIPO_LABELS: Record<string, string> = {
  artigo: "Artigo",
  sumula: "Súmula",
  lei: "Lei",
  jurisprudencia: "Jurisprudência",
  decreto: "Decreto",
  portaria: "Portaria",
};

export function AlucinacaoAlert({ deteccao, className = "" }: AlucinacaoAlertProps) {
  const [expanded, setExpanded] = useState(false);

  if (!deteccao || deteccao.resumo.total === 0) return null;

  const riscoConfig = RISCO_CONFIG[deteccao.riscoGeral];
  const RiscoIcon = riscoConfig.icon;

  return (
    <div className={`rounded-md border ${riscoConfig.borderColor} ${riscoConfig.bgColor} ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <RiscoIcon className={`w-4 h-4 ${riscoConfig.color}`} />
          <span className={`text-sm font-semibold ${riscoConfig.color}`}>
            Verificação de Alucinações — Risco {riscoConfig.label}
          </span>
          <Badge variant="outline" className="text-[10px]">
            <Clock className="w-3 h-3 mr-1" />
            {deteccao.tempoMs}ms
          </Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Mensagem de alerta */}
      <div className="px-3 pb-2">
        <p className={`text-xs ${riscoConfig.color} opacity-80`}>{deteccao.mensagemAlerta}</p>
      </div>

      {/* Resumo de contagem */}
      <div className="px-3 pb-2 flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-[10px] bg-white/60">
          {deteccao.resumo.total} citação(ões) analisada(s)
        </Badge>
        {deteccao.resumo.verificadas > 0 && (
          <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {deteccao.resumo.verificadas} verificada(s)
          </Badge>
        )}
        {deteccao.resumo.suspeitas > 0 && (
          <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
            <HelpCircle className="w-3 h-3 mr-1" />
            {deteccao.resumo.suspeitas} não verificada(s)
          </Badge>
        )}
        {deteccao.resumo.naoEncontradas > 0 && (
          <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {deteccao.resumo.naoEncontradas} não encontrada(s)
          </Badge>
        )}
        {deteccao.resumo.formatoInvalido > 0 && (
          <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200">
            <FileWarning className="w-3 h-3 mr-1" />
            {deteccao.resumo.formatoInvalido} formato inválido
          </Badge>
        )}
      </div>

      {/* Lista detalhada de citações */}
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-current/10 pt-2">
          {deteccao.citacoes.map((citacao, idx) => {
            const statusConfig = STATUS_CONFIG[citacao.status] || STATUS_CONFIG.suspeito;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={idx}
                className="rounded-sm border border-current/10 bg-white/60 p-2 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-3.5 h-3.5 flex-shrink-0 ${statusConfig.color}`} />
                  <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded flex-1 truncate">
                    {citacao.textoOriginal}
                  </code>
                  <Badge variant="outline" className="text-[10px]">
                    {TIPO_LABELS[citacao.tipo] || citacao.tipo}
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground pl-5">
                  {citacao.explicacao}
                </p>

                {citacao.sugestaoCorrecao && (
                  <p className="text-[11px] text-amber-700 pl-5 font-medium">
                    Sugestão: {citacao.sugestaoCorrecao}
                  </p>
                )}

                {citacao.linkVerificacao && (
                  <a
                    href={citacao.linkVerificacao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline pl-5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Verificar manualmente
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
