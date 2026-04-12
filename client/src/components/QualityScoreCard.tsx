import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, TrendingUp, Lightbulb, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useState } from "react";

/**
 * Sprint 4: Card visual de pontuação de qualidade do prompt gerado.
 *
 * Mostra:
 *  - Nota geral (0-100) com arco de cor e badge categórico
 *  - Breakdown por critério da rubrica com barra de progresso
 *  - Sugestões de melhoria quando nota < 80
 *
 * Usado no resultado de `prompts.gerar` e `prompts.otimizar`.
 */

interface CriterioAvaliado {
  nome: string;
  nota: number;
  justificativa: string;
}

export interface AvaliacaoQualidade {
  notaGeral: number;
  criterios: CriterioAvaliado[];
  sugestoes: string[];
}

export interface QualidadeComparacao {
  antes: { notaGeral: number; sugestoes: string[] };
  depois: { notaGeral: number; sugestoes: string[] };
  delta: number;
}

interface QualityScoreCardProps {
  avaliacao?: AvaliacaoQualidade | null;
  comparacao?: QualidadeComparacao | null;
}

function getScoreColor(nota: number): string {
  if (nota >= 80) return "text-green-600 dark:text-green-500";
  if (nota >= 50) return "text-amber-600 dark:text-amber-500";
  return "text-red-600 dark:text-red-500";
}

function getProgressColor(nota: number): string {
  if (nota >= 80) return "bg-green-600";
  if (nota >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getBadge(nota: number) {
  if (nota >= 80) return <Badge className="bg-green-600 hover:bg-green-700 text-white">Excelente</Badge>;
  if (nota >= 50) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Bom</Badge>;
  return <Badge variant="destructive">Precisa melhorar</Badge>;
}

function ScoreRing({ nota }: { nota: number }) {
  // SVG arco de 270 graus
  const radius = 40;
  const stroke = 6;
  const center = radius + stroke;
  const size = center * 2;
  const circumference = 2 * Math.PI * radius;
  // Arco de 270 graus (3/4 do círculo)
  const arcLength = circumference * 0.75;
  const offset = arcLength - (arcLength * nota) / 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform rotate-[135deg]">
        {/* Trilha de fundo */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          className="text-muted/30"
        />
        {/* Arco de progresso */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={nota >= 80 ? "stroke-green-600" : nota >= 50 ? "stroke-amber-500" : "stroke-red-500"}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${getScoreColor(nota)}`}>{nota}</span>
        <span className="text-[10px] text-muted-foreground -mt-0.5">/100</span>
      </div>
    </div>
  );
}

function DeltaIndicator({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
        <ArrowUp className="w-4 h-4" />
        <span className="text-sm font-semibold">+{delta} pontos</span>
      </div>
    );
  }
  if (delta < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-500">
        <ArrowDown className="w-4 h-4" />
        <span className="text-sm font-semibold">{delta} pontos</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="w-4 h-4" />
      <span className="text-sm">Sem alteração</span>
    </div>
  );
}

export function QualityScoreCard({ avaliacao, comparacao }: QualityScoreCardProps) {
  const [showCriterios, setShowCriterios] = useState(false);

  // Modo comparação (otimizar): mostra antes/depois com delta
  if (comparacao) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Comparação de Qualidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-around gap-4">
            {/* Antes */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Antes</span>
              <ScoreRing nota={comparacao.antes.notaGeral} />
              {getBadge(comparacao.antes.notaGeral)}
            </div>

            {/* Delta */}
            <div className="flex flex-col items-center gap-1">
              <DeltaIndicator delta={comparacao.delta} />
            </div>

            {/* Depois */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Depois</span>
              <ScoreRing nota={comparacao.depois.notaGeral} />
              {getBadge(comparacao.depois.notaGeral)}
            </div>
          </div>

          {/* Sugestões remanescentes (pós-otimização) */}
          {comparacao.depois.sugestoes.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Ainda pode melhorar
              </div>
              <ul className="space-y-1.5 pl-6">
                {comparacao.depois.sugestoes.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground list-disc">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Modo avaliação (gerar): score card completo com breakdown por critério
  if (!avaliacao) return null;

  return (
    <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Avaliação de Qualidade
          </CardTitle>
          {getBadge(avaliacao.notaGeral)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score ring + resumo */}
        <div className="flex items-center gap-4">
          <ScoreRing nota={avaliacao.notaGeral} />
          <div className="flex-1 space-y-1">
            <p className="text-sm text-muted-foreground">
              {avaliacao.notaGeral >= 80
                ? "O prompt atende aos critérios de qualidade profissional."
                : avaliacao.notaGeral >= 50
                  ? "O prompt tem boa base, mas pode ser aprimorado."
                  : "O prompt precisa de melhorias significativas."}
            </p>
            {avaliacao.criterios.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCriterios(v => !v)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {showCriterios ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showCriterios ? "Ocultar detalhes" : `Ver ${avaliacao.criterios.length} critérios`}
              </button>
            )}
          </div>
        </div>

        {/* Breakdown por critério */}
        {showCriterios && avaliacao.criterios.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
            {avaliacao.criterios.map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs font-medium truncate cursor-help max-w-[260px]">{c.nome}</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{c.justificativa}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className={`text-xs font-bold tabular-nums ${getScoreColor(c.nota)}`}>{c.nota}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getProgressColor(c.nota)}`}
                    style={{ width: `${c.nota}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sugestões de melhoria */}
        {avaliacao.sugestoes.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Sugestões de Melhoria
            </div>
            <ul className="space-y-1.5 pl-6">
              {avaliacao.sugestoes.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground list-disc">{s}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
