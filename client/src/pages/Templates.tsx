import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, BookTemplate, Trash2, Copy, Home, History, FileText, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Templates() {
  const { user } = useAuth();
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  
  const templatesQuery = trpc.templates.meus.useQuery();
  const deleteMutation = trpc.templates.deletar.useMutation({
    onSuccess: () => {
      toast.success("Template deletado com sucesso!");
      templatesQuery.refetch();
      setTemplateToDelete(null);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar template: ${error.message}`);
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Template copiado para a área de transferência!");
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ templateId: id });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">PromptJur</h1>
                <p className="text-sm text-muted-foreground">Templates Salvos</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-4">
                <Link href="/">
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Home className="w-4 h-4" />
                    Início
                  </a>
                </Link>
                <Link href="/dashboard">
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Sparkles className="w-4 h-4" />
                    Dashboard
                  </a>
                </Link>
                <Link href="/historico">
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <History className="w-4 h-4" />
                    Histórico
                  </a>
                </Link>
              </nav>
              <span className="text-sm text-muted-foreground border-l border-border pl-6">Olá, {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookTemplate className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Meus Templates</h2>
          </div>
          <p className="text-muted-foreground">
            Gerencie seus templates personalizados de prompts jurídicos
          </p>
        </div>

        {templatesQuery.isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando templates...</p>
          </div>
        )}

        {templatesQuery.error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">Erro ao carregar templates: {templatesQuery.error.message}</p>
            </CardContent>
          </Card>
        )}

        {templatesQuery.data && templatesQuery.data.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <BookTemplate className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum template salvo</h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não salvou nenhum template. Use o botão "Salvar como Template" no dashboard para criar seu primeiro template.
              </p>
              <Link href="/dashboard">
                <Button>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ir para Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {templatesQuery.data && templatesQuery.data.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {templatesQuery.data.map((template) => (
              <Card key={template.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {template.nome}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{template.areaJuridica}</Badge>
                        {template.isPublico && <Badge variant="outline">Público</Badge>}
                      </div>
                    </div>
                  </div>
                  {template.descricao && (
                    <CardDescription>{template.descricao}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-sm border border-border">
                    <p className="text-sm font-mono text-foreground whitespace-pre-wrap">
                      {template.template.substring(0, 200)}
                      {template.template.length > 200 && "..."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(template.template)}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplateToDelete(template.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deletar
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={templateToDelete !== null} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && handleDelete(templateToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
