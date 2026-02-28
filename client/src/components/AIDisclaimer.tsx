import { AlertTriangle } from "lucide-react";

interface AIDisclaimerProps {
  className?: string;
  compact?: boolean;
}

export default function AIDisclaimer({ className = "", compact = false }: AIDisclaimerProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 ${className}`}>
        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
        <span>Conteúdo gerado por IA — revise antes de usar profissionalmente.</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-sm ${className}`}>
      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
      <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
        <strong>Aviso Importante:</strong> O conteúdo gerado por inteligência artificial é uma ferramenta auxiliar. 
        Sempre revise e valide as informações antes de utilizar em contextos profissionais. 
        A responsabilidade pelo uso é do operador.
      </div>
    </div>
  );
}
