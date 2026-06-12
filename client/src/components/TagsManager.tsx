import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, X, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

const CORES_PREDEFINIDAS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export default function TagsManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaTag, setNovaTag] = useState({ nome: "", cor: "#3b82f6" });
  
  const { data: tags, isLoading, refetch } = trpc.tags.minhas.useQuery();
  const criarTag = trpc.tags.criar.useMutation({
    onSuccess: () => {
      toast.success("Tag criada com sucesso!");
      refetch();
      setDialogOpen(false);
      setNovaTag({ nome: "", cor: "#3b82f6" });
    },
    onError: (error) => {
      toast.error(`Erro ao criar tag: ${error.message}`);
    }
  });
  
  const deletarTag = trpc.tags.deletar.useMutation({
    onSuccess: () => {
      toast.success("Tag deletada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar tag: ${error.message}`);
    }
  });

  const handleCriarTag = () => {
    if (!novaTag.nome.trim()) {
      toast.error("Nome da tag não pode estar vazio");
      return;
    }
    criarTag.mutate(novaTag);
  };

  const handleDeletarTag = (tagId: number) => {
    if (confirm("Tem certeza que deseja deletar esta tag? Ela será removida de todos os prompts e templates.")) {
      deletarTag.mutate({ tagId });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-500" />
            <div>
              <CardTitle>Gerenciar Tags</CardTitle>
              <CardDescription>Organize seus prompts e templates com tags personalizadas</CardDescription>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Tag</DialogTitle>
                <DialogDescription>
                  Crie uma tag personalizada para organizar seus prompts e templates
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Tag</Label>
                  <Input
                    id="nome"
                    value={novaTag.nome}
                    onChange={(e) => setNovaTag({ ...novaTag, nome: e.target.value })}
                    placeholder="Ex: Contratos, Petições, Urgente..."
                    maxLength={50}
                  />
                </div>
                
                <div>
                  <Label>Cor da Tag</Label>
                  <div className="grid grid-cols-8 gap-2 mt-2">
                    {CORES_PREDEFINIDAS.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          novaTag.cor === cor ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: cor }}
                        onClick={() => setNovaTag({ ...novaTag, cor })}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-3">
                    <Label htmlFor="cor-custom">Ou escolha uma cor personalizada</Label>
                    <Input
                      id="cor-custom"
                      type="color"
                      value={novaTag.cor}
                      onChange={(e) => setNovaTag({ ...novaTag, cor: e.target.value })}
                      className="w-full h-10 mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">Prévia:</span>
                  <Badge style={{ backgroundColor: novaTag.cor, color: "#fff" }}>
                    {novaTag.nome || "Nome da Tag"}
                  </Badge>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleCriarTag} 
                    disabled={criarTag.isPending}
                    className="flex-1"
                  >
                    {criarTag.isPending ? "Criando..." : "Criar Tag"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Carregando tags...
          </div>
        ) : tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: any) => (
              <div
                key={tag.id}
                className="group relative"
              >
                <Badge
                  style={{ backgroundColor: tag.cor || "#3b82f6", color: "#fff" }}
                  className="pr-8"
                >
                  {tag.nome}
                </Badge>
                <button
                  onClick={() => handleDeletarTag(tag.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Deletar tag"
                >
                  <X className="w-3 h-3 text-white hover:text-red-200" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma tag criada ainda</p>
            <p className="text-sm mt-1">Crie tags para organizar seus prompts e templates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
