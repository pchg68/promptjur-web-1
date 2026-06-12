import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";

export function TagManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: number; nome: string; cor: string | null } | null>(null);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#3b82f6");

  const utils = trpc.useUtils();
  const { data: tags = [], isLoading } = trpc.tags.minhas.useQuery();

  const criarMutation = trpc.tags.criar.useMutation({
    onSuccess: () => {
      utils.tags.minhas.invalidate();
      setNome("");
      setCor("#3b82f6");
      setIsOpen(false);
      toast.success("Tag criada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao criar tag: ${error.message}`);
    },
  });

  const atualizarMutation = trpc.tags.atualizar.useMutation({
    onSuccess: () => {
      utils.tags.minhas.invalidate();
      setEditingTag(null);
      setNome("");
      setCor("#3b82f6");
      setIsOpen(false);
      toast.success("Tag atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar tag: ${error.message}`);
    },
  });

  const deletarMutation = trpc.tags.deletar.useMutation({
    onSuccess: () => {
      utils.tags.minhas.invalidate();
      toast.success("Tag removida com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao remover tag: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("Digite um nome para a tag");
      return;
    }

    if (editingTag) {
      atualizarMutation.mutate({
        tagId: editingTag.id,
        nome: nome.trim(),
        cor,
      });
    } else {
      criarMutation.mutate({
        nome: nome.trim(),
        cor,
      });
    }
  };

  const handleEdit = (tag: { id: number; nome: string; cor: string | null }) => {
    setEditingTag(tag);
    setNome(tag.nome);
    setCor(tag.cor || "#3b82f6");
    setIsOpen(true);
  };

  const handleDelete = (tagId: number) => {
    if (confirm("Tem certeza que deseja remover esta tag? Ela será removida de todos os prompts associados.")) {
      deletarMutation.mutate({ tagId });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingTag(null);
    setNome("");
    setCor("#3b82f6");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TagIcon className="w-5 h-5" />
          Minhas Tags
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleClose()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? "Editar Tag" : "Criar Nova Tag"}</DialogTitle>
              <DialogDescription>
                {editingTag
                  ? "Atualize o nome e a cor da tag"
                  : "Crie uma tag personalizada para organizar seus prompts"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Tag</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Casos Urgentes"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="cor"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    placeholder="#3b82f6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Label>Preview</Label>
                <div className="mt-2">
                  <Badge style={{ backgroundColor: cor, borderColor: cor }}>
                    {nome || "Nome da Tag"}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={criarMutation.isPending || atualizarMutation.isPending}
              >
                {editingTag ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando tags...</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Você ainda não criou nenhuma tag. Clique em "Nova Tag" para começar.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: any) => (
            <div key={tag.id} className="group relative">
              <Badge
                style={{ backgroundColor: tag.cor || "#3b82f6", borderColor: tag.cor || "#3b82f6" }}
                className="pr-16"
              >
                {tag.nome}
              </Badge>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 hover:bg-white/20"
                  onClick={() => handleEdit(tag)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 hover:bg-white/20"
                  onClick={() => handleDelete(tag.id)}
                  disabled={deletarMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
