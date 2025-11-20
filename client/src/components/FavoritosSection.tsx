import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Eye, Trash2, FileDown } from "lucide-react";
import { exportToPDF, exportToDOCX } from "@/lib/exportPrompt";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function FavoritosSection() {
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);
  
  // Query de favoritos
  const favoritosQuery = trpc.prompts.listarFavoritos.useQuery();
  const utils = trpc.useUtils();
  
  // Mutation para toggle favorito
  const toggleFavoritoMutation = trpc.prompts.toggleFavorito.useMutation({
    onSuccess: () => {
      utils.prompts.listarFavoritos.invalidate();
      toast.success("Favorito removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover favorito: " + error.message);
    }
  });

  const handleToggleFavorito = (promptId: number) => {
    toggleFavoritoMutation.mutate({ promptId, isFavorito: false });
  };

  const handleCopy = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success("Prompt copiado!");
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      analise: "Análise",
      geracao: "Geração",
      otimizacao: "Otimização"
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      analise: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      geracao: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      otimizacao: "bg-green-500/10 text-green-500 border-green-500/20"
    };
    return colors[tipo] || "bg-gray-500/10 text-gray-500";
  };

  if (favoritosQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Prompts Favoritos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Carregando favoritos...</p>
        </CardContent>
      </Card>
    );
  }

  if (!favoritosQuery.data || favoritosQuery.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Prompts Favoritos
          </CardTitle>
          <CardDescription>
            Marque prompts como favoritos para acesso rápido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum favorito ainda</h3>
            <p className="text-sm text-muted-foreground">
              Prompts marcados como favoritos aparecerão aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            Prompts Favoritos
          </CardTitle>
          <CardDescription>
            {favoritosQuery.data.length} {favoritosQuery.data.length === 1 ? 'prompt favorito' : 'prompts favoritos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {favoritosQuery.data.map((prompt) => (
              <Card key={prompt.id} className="border-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getTipoColor(prompt.tipo)}>
                          {getTipoLabel(prompt.tipo)}
                        </Badge>
                        {prompt.areaJuridica && (
                          <Badge variant="secondary">
                            {prompt.areaJuridica}
                          </Badge>
                        )}
                        {prompt.qualidade && (
                          <Badge variant="secondary">
                            {prompt.qualidade}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDate(prompt.createdAt)}
                      </p>
                      
                      <p className="text-sm text-foreground line-clamp-2">
                        {prompt.promptOtimizado || prompt.promptOriginal}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFavorito(prompt.id)}
                        title="Remover dos favoritos"
                      >
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(prompt.promptOtimizado || prompt.promptOriginal)}
                        title="Copiar prompt"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPrompt(prompt)}
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToPDF(prompt);
                          toast.success("Exportando para PDF...");
                        }}
                        title="Exportar PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      <Dialog open={!!selectedPrompt} onOpenChange={() => setSelectedPrompt(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              Detalhes do Prompt
            </DialogTitle>
            <DialogDescription>
              {selectedPrompt && formatDate(selectedPrompt.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPrompt && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline" className={getTipoColor(selectedPrompt.tipo)}>
                  {getTipoLabel(selectedPrompt.tipo)}
                </Badge>
                {selectedPrompt.areaJuridica && (
                  <Badge variant="secondary">
                    {selectedPrompt.areaJuridica}
                  </Badge>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Prompt Original:</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedPrompt.promptOriginal}</p>
                </div>
              </div>
              
              {selectedPrompt.promptOtimizado && (
                <div>
                  <h4 className="font-semibold mb-2">Prompt Otimizado:</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedPrompt.promptOtimizado}</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopy(selectedPrompt.promptOtimizado || selectedPrompt.promptOriginal)}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Prompt
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    handleToggleFavorito(selectedPrompt.id);
                    setSelectedPrompt(null);
                  }}
                >
                  <Star className="w-4 h-4 mr-2 fill-yellow-500 text-yellow-500" />
                  Remover Favorito
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
