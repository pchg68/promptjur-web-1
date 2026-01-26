import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DisclaimerLegalProps {
  variant?: "default" | "destructive";
  className?: string;
}

/**
 * Componente de disclaimer legal sobre verificação de fontes jurídicas
 * Deve ser exibido em todas as páginas que geram ou otimizam prompts jurídicos
 */
export function DisclaimerLegal({ variant = "destructive", className }: DisclaimerLegalProps) {
  return (
    <Alert variant={variant} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Aviso Importante sobre Verificação de Fontes</AlertTitle>
      <AlertDescription>
        As citações legais, jurisprudências e referências normativas geradas por inteligência
        artificial <strong>não são verificadas automaticamente</strong>. É fundamental que você
        revise e confirme a validade, atualidade e aplicabilidade de todas as referências
        jurídicas antes de utilizá-las em documentos oficiais, petições ou pareceres legais.
        <br />
        <br />
        O PromptJur é uma ferramenta de auxílio na elaboração de prompts jurídicos, mas a
        responsabilidade pela verificação e validação das informações é sempre do profissional
        do Direito.
      </AlertDescription>
    </Alert>
  );
}
