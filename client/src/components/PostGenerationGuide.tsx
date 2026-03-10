import { PlayCircle, FileText, Shield, Copy } from "lucide-react";

const steps = [
  { icon: PlayCircle, label: "Executar", desc: "Execute direto com IA integrada" },
  { icon: FileText, label: "Documento", desc: "Elabore o documento completo" },
  { icon: Shield, label: "Analisar", desc: "Analise a qualidade do prompt" },
  { icon: Copy, label: "Copiar", desc: "Copie para uso externo" },
];

export default function PostGenerationGuide({ className = "" }: { className?: string }) {
  return (
    <div className={`p-4 bg-muted/30 rounded-sm ${className}`}>
      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">O que fazer agora</p>
      <div className="grid grid-cols-4 gap-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex flex-col items-center text-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">{step.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{step.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
