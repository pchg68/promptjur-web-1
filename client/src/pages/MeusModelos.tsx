import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookTemplate, 
  Plus, 
  Search, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  Globe,
  Lock,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ModeloPersonalizadoForm } from "@/components/ModeloPersonalizadoForm";
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

/**
 * Página de gerenciamento de modelos personalizados
 * Permite criar, editar, duplicar e deletar modelos
 */
export default function MeusModelos() {
  const [busca, setBusca] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [modeloEditando, setModeloEditando] = useState<number | undefined>();
  const [modeloDeletando, setModeloDeletando] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Query para listar modelos
  const modelosQuery = trpc.modelosPersonalizados.listar.useQuery({
    apenasAtivos: true
  });

  // Mutation para duplicar
  const duplicarMutation = trpc.modelosPersonalizados.duplicar.useMutation({
    onSuccess: () => {
      toast.success("Modelo duplicado com sucesso!");
      utils.modelosPersonalizados.listar.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao duplicar: ${error.message}`);
    }
  });

  // Mutation para deletar
  const deletarMutation = trpc.modelosPersonalizados.deletar.useMutation({
    onSuccess: () => {
      toast.success("Modelo deletado com sucesso!");
      utils.modelosPersonalizados.listar.invalidate();
      setModeloDeletando(null);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    }
  });

  const handleNovoModelo = () => {
    setModeloEditando(undefined);
    setFormOpen(true);
  };

  const handleEditarModelo = (id: number) => {
    setModeloEditando(id);
    setFormOpen(true);
  };

  const handleDuplicarModelo = (id: number) => {
    duplicarMutation.mutate({ id });
  };

  const handleDeletarModelo = (id: number) => {
    setModeloDeletando(id);
  };

  const confirmarDelecao = () => {
    if (modeloDeletando) {
      deletarMutation.mutate({ id: modeloDeletando });
    }
  };

  // Filtrar modelos pela busca
  const modelosFiltrados = modelosQuery.data?.filter((modelo: any) => {
    if (!busca) return true;
    const buscaLower = busca.toLowerCase();
    return (
      modelo.nome.toLowerCase().includes(buscaLower) ||
      modelo.descricao?.toLowerCase().includes(buscaLower) ||
      modelo.areaJuridica.toLowerCase().includes(buscaLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookTemplate className="w-8 h-8 text-primary" />
                Meus Modelos Personalizados
              </h1>
              <p className="text-muted-foreground mt-2">
                Crie e gerencie seus próprios modelos de documentos jurídicos
              </p>
            </div>
            <Button onClick={handleNovoModelo} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Novo Modelo
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        {/* Barra de Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modelos por nome, descrição ou área..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading */}
        {modelosQuery.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Lista de Modelos */}
        {modelosFiltrados && modelosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modelosFiltrados.map((modelo: any) => (
              <Card key={modelo.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{modelo.nome}</CardTitle>
                      <CardDescription className="mt-1">
                        {modelo.descricao || "Sem descrição"}
                      </CardDescription>
                    </div>
                    <div className="ml-2">
                      {modelo.isPublico ? (
                        <Globe className="w-4 h-4 text-green-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Área Jurídica */}
                  <div>
                    <Badge variant="secondary">{modelo.areaJuridica}</Badge>
                  </div>

                  {/* Preview do Template */}
                  <div className="bg-muted p-3 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                    <p className="text-sm font-mono line-clamp-3">
                      {modelo.template}
                    </p>
                  </div>

                  {/* Data de Atualização */}
                  <p className="text-xs text-muted-foreground">
                    Atualizado em {new Date(modelo.updatedAt).toLocaleDateString('pt-BR')}
                  </p>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditarModelo(modelo.id)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicarModelo(modelo.id)}
                      disabled={duplicarMutation.isPending}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletarModelo(modelo.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Estado Vazio
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookTemplate className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum modelo encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                {busca
                  ? "Nenhum modelo corresponde à sua busca"
                  : "Crie seu primeiro modelo personalizado para começar"}
              </p>
              {!busca && (
                <Button onClick={handleNovoModelo}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Modelo
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <ModeloPersonalizadoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        modeloId={modeloEditando}
        onSuccess={() => {
          setFormOpen(false);
          setModeloEditando(undefined);
        }}
      />

      {/* Dialog de Confirmação de Deleção */}
      <AlertDialog open={!!modeloDeletando} onOpenChange={() => setModeloDeletando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo será marcado como inativo e não aparecerá mais na lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarDelecao}
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
