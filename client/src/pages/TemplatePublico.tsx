import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, Copy, Download, Loader2 } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

/**
 * Página Pública de Template
 * Permite visualização e importação de templates compartilhados
 */
export default function TemplatePublico() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const templateId = parseInt(id || "0", 10);

  // Buscar template público
  const { data: template, isLoading, error } = trpc.templates.getPublico.useQuery(
    { id: templateId },
    { enabled: templateId > 0 }
  );

  // Mutation para importar template
  const importarMutation = trpc.templates.importar.useMutation({
    onSuccess: () => {
      toast.success("Template importado com sucesso!");
      setLocation("/templates");
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });

  const handleCopiar = () => {
    if (template?.conteudo) {
      navigator.clipboard.writeText(template.conteudo);
      toast.success("Conteúdo copiado para a área de transferência!");
    }
  };

  const handleImportar = () => {
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para importar templates");
      window.location.href = getLoginUrl();
      return;
    }
    importarMutation.mutate({ templateId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Template Não Encontrado</CardTitle>
            <CardDescription>
              O template solicitado não existe ou não está mais disponível publicamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
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
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCopiar}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Conteúdo
              </Button>
              <Button 
                onClick={handleImportar}
                disabled={importarMutation.isPending}
              >
                {importarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Importar para Minha Biblioteca
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Aviso de Responsabilidade */}
        <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este template foi compartilhado publicamente. Sempre revise e adapte o conteúdo
            às suas necessidades específicas antes de usar. Não nos responsabilizamos pelo
            uso inadequado ou por erros no conteúdo compartilhado.
          </AlertDescription>
        </Alert>

        {/* Template Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{template.nome}</CardTitle>
                <CardDescription className="text-base">
                  {template.descricao}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {template.areaJuridica}
              </span>
              <span>Criado por: {template.criadoPor}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Conteúdo do Template</h3>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                    {template.conteudo}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        {!isAuthenticated && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Quer usar este template?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Faça login para importar este template para sua biblioteca e começar a usar.
                </p>
                <Button asChild>
                  <a href={getLoginUrl()}>
                    Fazer Login
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
