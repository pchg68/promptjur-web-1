import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Brain, FileSearch, Scale, Sparkles } from "lucide-react";

interface GenerationStepperProps {
  isGenerating: boolean;
  type: "analise" | "geracao" | "otimizacao";
}

const STEPS_CONFIG = {
  analise: [
    { label: "Processando prompt", icon: Brain, duration: 2000 },
    { label: "Identificando área jurídica", icon: FileSearch, duration: 3000 },
    { label: "Analisando qualidade", icon: Scale, duration: 4000 },
    { label: "Gerando sugestões", icon: Sparkles, duration: 5000 },
  ],
  geracao: [
    { label: "Analisando contexto jurídico", icon: Brain, duration: 2000 },
    { label: "Consultando legislação", icon: FileSearch, duration: 4000 },
    { label: "Estruturando prompt profissional", icon: Scale, duration: 7000 },
    { label: "Validando referências legais", icon: Sparkles, duration: 10000 },
  ],
  otimizacao: [
    { label: "Analisando prompt original", icon: Brain, duration: 2000 },
    { label: "Identificando melhorias", icon: FileSearch, duration: 4000 },
    { label: "Aplicando otimizações", icon: Scale, duration: 6000 },
    { label: "Finalizando versão otimizada", icon: Sparkles, duration: 8000 },
  ],
};

export default function GenerationStepper({ isGenerating, type }: GenerationStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = STEPS_CONFIG[type];

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((step, index) => {
      if (index > 0) {
        timers.push(setTimeout(() => setCurrentStep(index), step.duration));
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [isGenerating, type]);

  if (!isGenerating) return null;

  return (
    <div className="space-y-3 py-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isPending = index > currentStep;

        return (
          <div
            key={index}
            className={`flex items-center gap-3 transition-all duration-500 ${
              isPending ? "opacity-40" : "opacity-100"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
              isCompleted
                ? "bg-green-500/20 text-green-500"
                : isActive
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isActive ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            <span className={`text-sm transition-all duration-300 ${
              isActive ? "font-medium text-foreground" : isCompleted ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            }`}>
              {step.label}
              {isActive && <span className="ml-1 animate-pulse">...</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
