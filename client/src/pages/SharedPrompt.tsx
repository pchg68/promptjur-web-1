import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Download, Eye, Share2, BookOpen, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SharedPrompt() {
  const { shareId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: shared, isLoading, error } = trpc.sharing.getSharedPrompt.useQuery(
    { shareId: shareId! },
    { enabled: !!shareId }
  );

  const importMutation = trpc.sharing.importShared.useMutation({
    onSuccess: () => {
      toast.success("Prompt importado para sua biblioteca!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const copyToClipboard = () => {
    if (shared) {
      navigator.clipboard.writeText(shared.conteudo);
      toast.success("Prompt copiado!");
    }
  };

  const downloadAsText = () => {
    if (shared) {
      const blob = new Blob([shared.conteudo], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${shared.titulo}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download iniciado!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !shared) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Prompt Não Encontrado</CardTitle>
            <CardDescription>
              Este link de compartilhamento pode ter expirado ou sido revogado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="w-8 h-8" />
            <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Acessar Plataforma
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  <Badge variant="outline">{shared.areaJuridica}</Badge>
                </div>
                <CardTitle className="text-2xl mb-2">{shared.titulo}</CardTitle>
                {shared.descricao && (
                  <CardDescription className="text-base">{shared.descricao}</CardDescription>
                )}
              </div>
            </div>

            {/* Metadados */}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{shared.visualizacoes} visualizações</span>
              </div>
              <div>
                Compartilhado em {format(new Date(shared.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Conteúdo do Prompt */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Prompt Jurídico
              </h3>
              <div className="bg-muted/30 p-6 rounded-lg border border-border">
                <Streamdown className="text-sm whitespace-pre-wrap">{shared.conteudo}</Streamdown>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              <Button variant="default" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Prompt
              </Button>
              <Button variant="outline" onClick={downloadAsText}>
                <Download className="w-4 h-4 mr-2" />
                Download TXT
              </Button>
              {isAuthenticated && (
                <Button
                  variant="outline"
                  onClick={() => importMutation.mutate({ shareId: shareId! })}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Importar para Minha Biblioteca
                    </>
                  )}
                </Button>
              )}
            </div>

            {!isAuthenticated && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Dica:</strong> Faça login para importar este prompt diretamente para sua
                  biblioteca e gerenciar suas próprias coleções.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-3"
                  onClick={() => setLocation("/dashboard")}
                >
                  Fazer Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Criado com <span className="text-red-500">♥</span> no {APP_TITLE}
          </p>
        </div>
      </main>
    </div>
  );
}
