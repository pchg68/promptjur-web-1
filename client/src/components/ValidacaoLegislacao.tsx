import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, XCircle, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CitacaoValidada {
  texto: string;
  tipo: "artigo" | "lei" | "decreto" | "codigo" | "portaria";
  confiabilidade: "alta" | "media" | "baixa";
  link?: string;
  mensagem: string;
}

interface ValidacaoLegislacaoProps {
  validacao: {
    citacoes: CitacaoValidada[];
    totalCitacoes: number;
    confiabilidadeGeral: "alta" | "media" | "baixa";
  };
}

export function ValidacaoLegislacao({ validacao }: ValidacaoLegislacaoProps) {
  if (!validacao || validacao.totalCitacoes === 0) {
    return null;
  }

  const getConfiabilidadeIcon = (confiabilidade: string) => {
    switch (confiabilidade) {
      case "alta":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "media":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "baixa":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getConfiabilidadeBadge = (confiabilidade: string) => {
    switch (confiabilidade) {
      case "alta":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Alta Confiabilidade</Badge>;
      case "media":
        return <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700">Confiabilidade Média</Badge>;
      case "baixa":
        return <Badge variant="destructive">Baixa Confiabilidade</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Validação de Legislação
            </CardTitle>
            <CardDescription>
              {validacao.totalCitacoes} citação(ões) encontrada(s) e validada(s)
            </CardDescription>
          </div>
          {getConfiabilidadeBadge(validacao.confiabilidadeGeral)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {validacao.citacoes.map((citacao, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200"
            >
              <div className="mt-0.5">
                {getConfiabilidadeIcon(citacao.confiabilidade)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {citacao.texto}
                  </code>
                  <Badge variant="outline" className="text-xs">
                    {citacao.tipo}
                  </Badge>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-gray-600 mt-1 cursor-help">
                      {citacao.mensagem}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {citacao.confiabilidade === "alta" && "Código/lei reconhecido e amplamente utilizado"}
                      {citacao.confiabilidade === "media" && "Citação válida, mas recomenda-se verificação manual"}
                      {citacao.confiabilidade === "baixa" && "Citação não reconhecida automaticamente - verifique manualmente"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                {citacao.link && (
                  <a
                    href={citacao.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                  >
                    Ver fonte oficial
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
