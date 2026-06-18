import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, FileSearch, Sparkles, RefreshCw } from "lucide-react";

interface WizardPromptGeneratorProps {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

export interface WizardData {
  objetivo: 'analisar' | 'gerar' | 'otimizar';
}

const OBJETIVOS = [
  {
    id: 'gerar' as const,
    titulo: 'Gerar Novo Prompt',
    descricao: 'Crie um prompt jurídico profissional a partir da descrição do seu caso',
    icon: Sparkles,
    cor: 'green',
  },
  {
    id: 'analisar' as const,
    titulo: 'Analisar Prompt',
    descricao: 'Avalie a qualidade e identifique melhorias em um prompt jurídico',
    icon: FileSearch,
    cor: 'blue',
  },
  {
    id: 'otimizar' as const,
    titulo: 'Otimizar Prompt',
    descricao: 'Melhore um prompt existente com técnicas avançadas',
    icon: RefreshCw,
    cor: 'purple',
  },
];

export function WizardPromptGenerator({ onComplete, onCancel }: WizardPromptGeneratorProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Assistente de Prompts Jurídicos</CardTitle>
        <CardDescription>
          O que você quer fazer? Escolha uma opção para começar — em seguida você faz tudo num único campo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {OBJETIVOS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => onComplete({ objetivo: opt.id })}
                className="p-6 rounded-lg border-2 border-border transition-all text-left hover:border-primary hover:shadow-md focus:outline-none focus:border-primary"
              >
                <div className="flex flex-col items-start gap-3">
                  <div className={`
                    p-3 rounded-lg
                    ${opt.cor === 'blue' ? 'bg-blue-500/10 text-blue-500' : ''}
                    ${opt.cor === 'green' ? 'bg-green-500/10 text-green-500' : ''}
                    ${opt.cor === 'purple' ? 'bg-purple-500/10 text-purple-500' : ''}
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{opt.titulo}</h4>
                    <p className="text-xs text-muted-foreground">{opt.descricao}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-start pt-4 border-t">
          <Button variant="ghost" onClick={onCancel}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Ir direto ao modo avançado
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
