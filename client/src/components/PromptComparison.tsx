import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText } from "lucide-react";

interface PromptComparisonProps {
  promptOriginal: string;
  promptOtimizado: string;
  melhorias?: string[];
}

export function PromptComparison({ promptOriginal, promptOtimizado, melhorias }: PromptComparisonProps) {
  return (
    <div className="space-y-4">
      {/* Comparação Lado a Lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prompt Original */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Prompt Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-md border border-border">
              <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {promptOriginal}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seta de Transformação */}
        <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>

        {/* Prompt Otimizado */}
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Prompt Otimizado
              <Badge variant="default" className="ml-auto">Melhorado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background p-4 rounded-md border-2 border-primary/30">
              <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {promptOtimizado}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Melhorias */}
      {melhorias && melhorias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Melhorias Aplicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {melhorias.map((melhoria, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">✓</span>
                  <span className="text-sm">{melhoria}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
