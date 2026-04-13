import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, FileText, Zap, Loader2 } from "lucide-react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { copyToClipboard } from "@/utils/dashboardUtils";

/**
 * Sprint 5: Página pública de prompt compartilhado.
 *
 * Acessível sem login em /shared/:token.
 * Exibe o prompt gerado read-only com metadados (área, qualidade, data).
 * Inclui CTA para se cadastrar e gerar prompts próprios.
 */
export default function SharedPrompt() {
  const [, params] = useRoute("/shared/:token");
  const token = params?.token || "";

  const { data, isLoading, error } = trpc.prompts.getShared.useQuery(
    { token },
    { enabled: !!token, retry: false },
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Prompt não encontrado</h2>
            <p className="text-muted-foreground text-sm">
              Este link pode ter expirado ou sido revogado pelo autor.
            </p>
            <Button asChild className="w-full">
              <a href="/">Ir para o PromptJur</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = new Date(data.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header simples */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-primary font-bold text-lg hover:opacity-80 transition-opacity">
            <Zap className="w-5 h-5" />
            PromptJur
          </a>
          <Button asChild size="sm">
            <a href="/dashboard">Criar meu prompt</a>
          </Button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg">Prompt Jurídico Compartilhado</CardTitle>
                <CardDescription className="mt-1">
                  Criado em {formattedDate}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {data.areaJuridica && (
                  <Badge variant="secondary">{data.areaJuridica}</Badge>
                )}
                {data.qualidade && (
                  <Badge
                    className={
                      data.qualidade === "excelente"
                        ? "bg-green-600 text-white"
                        : data.qualidade === "bom"
                          ? "bg-amber-500 text-white"
                          : "bg-red-500 text-white"
                    }
                  >
                    {data.qualidade === "excelente" ? "Excelente" : data.qualidade === "bom" ? "Bom" : "Regular"}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Texto do prompt */}
            <div className="p-4 bg-muted/20 rounded-md border">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap text-foreground font-sans">
                {data.promptOtimizado || "Conteúdo não disponível"}
              </pre>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  copyToClipboard(data.promptOtimizado || "");
                  toast.success("Prompt copiado para a área de transferência!");
                }}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Prompt
              </Button>
            </div>

            {/* CTA */}
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg text-center space-y-3">
              <h3 className="font-semibold text-primary">Quer gerar prompts jurídicos profissionais?</h3>
              <p className="text-sm text-muted-foreground">
                O PromptJur usa IA para criar prompts otimizados para petições, contratos,
                pareceres e muito mais — com fundamentação legal e critérios de qualidade.
              </p>
              <Button asChild size="lg" className="gap-2">
                <a href="/dashboard">
                  <Zap className="w-4 h-4" />
                  Experimentar Gratuitamente
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer mínimo */}
      <footer className="border-t mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          PromptJur — Engenharia de Prompts Jurídicos com IA
        </div>
      </footer>
    </div>
  );
}
