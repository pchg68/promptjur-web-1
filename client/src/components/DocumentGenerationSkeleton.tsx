import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Brain, Sparkles, BookOpen, Scale, Search, PenTool, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type EstrategiaIA = "direct" | "chain_of_thought" | "knowledge_retrieval";

interface DocumentGenerationSkeletonProps {
  estrategia: EstrategiaIA;
  tipoDocumento: string;
}

interface StepInfo {
  icon: React.ReactNode;
  label: string;
  durationMs: number;
}

const STEPS_BY_STRATEGY: Record<EstrategiaIA, StepInfo[]> = {
  direct: [
    { icon: <Search className="w-4 h-4" />, label: "Analisando contexto do caso...", durationMs: 3000 },
    { icon: <Scale className="w-4 h-4" />, label: "Identificando fundamentos legais...", durationMs: 5000 },
    { icon: <PenTool className="w-4 h-4" />, label: "Redigindo documento...", durationMs: 10000 },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Revisando e formatando...", durationMs: 5000 },
  ],
  chain_of_thought: [
    { icon: <Search className="w-4 h-4" />, label: "Analisando contexto do caso...", durationMs: 3000 },
    { icon: <Brain className="w-4 h-4" />, label: "Construindo raciocínio jurídico...", durationMs: 6000 },
    { icon: <Scale className="w-4 h-4" />, label: "Identificando argumentos e teses...", durationMs: 6000 },
    { icon: <PenTool className="w-4 h-4" />, label: "Redigindo documento estruturado...", durationMs: 12000 },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Revisando coerência e formatação...", durationMs: 5000 },
  ],
  knowledge_retrieval: [
    { icon: <Search className="w-4 h-4" />, label: "Analisando contexto do caso...", durationMs: 3000 },
    { icon: <BookOpen className="w-4 h-4" />, label: "Consultando base do CNJ (DataJud)...", durationMs: 8000 },
    { icon: <Scale className="w-4 h-4" />, label: "Recuperando legislação e precedentes...", durationMs: 8000 },
    { icon: <Brain className="w-4 h-4" />, label: "Fundamentando argumentação...", durationMs: 6000 },
    { icon: <PenTool className="w-4 h-4" />, label: "Redigindo documento com citações...", durationMs: 12000 },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Validando referências e formatando...", durationMs: 5000 },
  ],
};

const STRATEGY_LABELS: Record<EstrategiaIA, { label: string; icon: React.ReactNode }> = {
  direct: { label: "Resposta Direta", icon: <Sparkles className="w-5 h-5" /> },
  chain_of_thought: { label: "Raciocínio Passo a Passo", icon: <Brain className="w-5 h-5" /> },
  knowledge_retrieval: { label: "Recuperação de Conhecimento", icon: <BookOpen className="w-5 h-5" /> },
};

const ESTIMATED_TIMES: Record<EstrategiaIA, string> = {
  direct: "15–30 segundos",
  chain_of_thought: "30–60 segundos",
  knowledge_retrieval: "45–90 segundos",
};

export default function DocumentGenerationSkeleton({ estrategia, tipoDocumento }: DocumentGenerationSkeletonProps) {
  const steps = STEPS_BY_STRATEGY[estrategia];
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Avançar etapas com base no tempo acumulado
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);

      let accumulated = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulated += steps[i].durationMs;
        if (elapsed < accumulated) {
          setCurrentStep(i);
          return;
        }
      }
      // Se passou de todas as etapas, ficar na última
      setCurrentStep(steps.length - 1);
    }, 500);

    return () => clearInterval(interval);
  }, [steps]);

  // Calcular progresso total
  const totalDuration = steps.reduce((sum, s) => sum + s.durationMs, 0);
  const progressPercent = Math.min((elapsedMs / totalDuration) * 100, 95); // Nunca chega a 100% (a mutation resolve)

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Gerando Documento</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                {STRATEGY_LABELS[estrategia].icon}
                {STRATEGY_LABELS[estrategia].label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground tabular-nums">{elapsedSeconds}s</p>
            <p className="text-xs text-muted-foreground">Estimado: {ESTIMATED_TIMES[estrategia]}</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1.5">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{Math.round(progressPercent)}%</p>
        </div>

        {/* Etapas */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-primary/10 border border-primary/20"
                    : isCompleted
                    ? "opacity-60"
                    : "opacity-30"
                }`}
              >
                <div
                  className={`flex-shrink-0 ${
                    isActive ? "text-primary animate-pulse" : isCompleted ? "text-green-500" : "text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                </div>
                <span
                  className={`text-sm ${
                    isActive ? "text-foreground font-medium" : isCompleted ? "text-muted-foreground line-through" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Skeleton do documento */}
        <div className="space-y-3 pt-2">
          <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted/30 rounded animate-pulse w-full" />
          <div className="h-3 bg-muted/30 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-muted/30 rounded animate-pulse w-full" />
          <div className="h-3 bg-muted/30 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2 mt-4" />
          <div className="h-3 bg-muted/30 rounded animate-pulse w-full" />
          <div className="h-3 bg-muted/30 rounded animate-pulse w-4/5" />
        </div>

        {/* Dica */}
        <p className="text-xs text-muted-foreground text-center pt-2 italic">
          Documentos mais complexos podem levar mais tempo. Não feche esta página.
        </p>
      </CardContent>
    </Card>
  );
}
