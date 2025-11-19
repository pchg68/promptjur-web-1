import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function TemplatePublico() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [copiado, setCopiado] = useState(false);

  const { data: template, isLoading, error } = trpc.templates.getPublico.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  const importarMutation = trpc.templates.importar.useMutation({
    onSuccess: () => {
      toast.success("Template importado com sucesso!");
      setLocation("/templates");
    },
    onError: (error) => {
      if (error.message.includes("login")) {
        toast.error("Faça login para importar templates");
        // Redirecionar para login
      } else {
        toast.error("Erro ao importar template");
      }
    },
  });

  const copiarConteudo = () => {
    if (template) {
      navigator.clipboard.writeText(template.template);
      setCopiado(true);
      toast.success("Conteúdo copiado!");
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const importar = () => {
    if (template) {
      importarMutation.mutate({ templateId: template.id });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <CardTitle>Template não encontrado</CardTitle>
            </div>
            <CardDescription>
              Este template não existe ou não está mais público.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-blue-900">{APP_TITLE}</h1>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{template.nome}</CardTitle>
                {template.descricao && (
                  <CardDescription className="text-base">{template.descricao}</CardDescription>
                )}
              </div>
              <Badge variant="secondary" className="ml-4">
                {template.areaJuridica || "Geral"}
              </Badge>
            </div>

            {/* Tags removidas temporariamente */}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Conteúdo do Template */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Conteúdo do Prompt</h3>
              <div className="bg-slate-50 border rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono">{template.template}</pre>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                onClick={importar}
                disabled={importarMutation.isPending}
                className="flex-1"
              >
                {importarMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Importar para Minha Biblioteca
                  </>
                )}
              </Button>

              <Button
                onClick={copiarConteudo}
                variant="outline"
                className="flex-1"
              >
                {copiado ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Conteúdo
                  </>
                )}
              </Button>
            </div>

            {/* Aviso */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="text-amber-900">
                <strong>⚠️ Aviso:</strong> Este template foi compartilhado publicamente por outro usuário.
                Revise e adapte o conteúdo antes de usar em documentos oficiais.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
