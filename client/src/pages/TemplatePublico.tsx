import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Download, Shield } from "lucide-react";
import { toast } from "sonner";
import LazyStreamdown from "@/components/LazyStreamdown";
import { Link } from "wouter";

export default function TemplatePublico() {
  const [, params] = useRoute("/template/:id");
  const templateId = params?.id ? parseInt(params.id) : null;

  // Buscar template público
  const templateQuery = trpc.templates.sistema.useQuery(undefined, {
    enabled: !!templateId
  });

  const template = templateQuery.data?.find(t => t.id === templateId);

  const handleCopiar = () => {
    if (template?.template) {
      navigator.clipboard.writeText(template.template);
      toast.success("Conteúdo copiado para área de transferência!");
    }
  };

  const handleImportar = () => {
    if (template) {
      // Redirecionar para dashboard com template ID
      window.location.href = `/dashboard?template=${template.id}`;
    }
  };

  if (templateQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Template não encontrado</CardTitle>
            <CardDescription>
              O template solicitado não existe ou não está mais disponível publicamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Início
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{template.nome}</CardTitle>
                <CardDescription>{template.descricao}</CardDescription>
                <div className="flex gap-2">
                  <Badge variant="secondary">{template.areaJuridica}</Badge>
                </div>
              </div>
            </div>

            {/* Disclaimer de Responsabilidade */}
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <Shield className="w-4 h-4 inline mr-1" />
                <strong>Aviso de Responsabilidade:</strong> Este template é fornecido apenas para fins educacionais e informativos. 
                Sempre verifique citações legais (leis, artigos, CF/88) em fontes oficiais antes de usar em documentos jurídicos. 
                O uso inadequado é de responsabilidade exclusiva do usuário.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Conteúdo do Template */}
            <div>
              <h3 className="font-semibold mb-3">Conteúdo do Template</h3>
              <div className="bg-muted rounded-lg p-4 prose prose-sm dark:prose-invert max-w-none">
                <LazyStreamdown>{template.template}</LazyStreamdown>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3">
              <Button onClick={handleCopiar} variant="outline" className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Conteúdo
              </Button>
              <Button onClick={handleImportar} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Importar para Minha Biblioteca
              </Button>
            </div>

            {/* Informações Adicionais */}
            <div className="text-sm text-muted-foreground border-t pt-4">
              <p>
                <strong>Como usar:</strong> Clique em "Importar para Minha Biblioteca" para adicionar este template 
                ao seu dashboard e começar a usá-lo imediatamente. Você poderá personalizá-lo conforme suas necessidades.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
