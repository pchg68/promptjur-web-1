import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Bookmark, Save, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface GerenciadorPerfisProps {
  tipoDocumento: string;
  areaJuridica: string;
  modeloId?: string;
  onCarregarPerfil: (perfil: {
    tipoDocumento: string;
    areaJuridica: string;
    modeloId?: string;
  }) => void;
}

export function GerenciadorPerfis({
  tipoDocumento,
  areaJuridica,
  modeloId,
  onCarregarPerfil
}: GerenciadorPerfisProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [nomePerfil, setNomePerfil] = useState("");
  const [descricaoPerfil, setDescricaoPerfil] = useState("");

  const perfisQuery = trpc.perfis.listar.useQuery();
  
  const criarMutation = trpc.perfis.criar.useMutation({
    onSuccess: () => {
      toast.success("Perfil salvo com sucesso!");
      setDialogAberto(false);
      setNomePerfil("");
      setDescricaoPerfil("");
      perfisQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar perfil: ${error.message}`);
    }
  });

  const deletarMutation = trpc.perfis.deletar.useMutation({
    onSuccess: () => {
      toast.success("Perfil deletado!");
      perfisQuery.refetch();
    }
  });

  const handleSalvar = () => {
    if (!nomePerfil.trim()) {
      toast.error("Digite um nome para o perfil");
      return;
    }

    criarMutation.mutate({
      nome: nomePerfil,
      tipoDocumento: tipoDocumento as any,
      areaJuridica,
      modeloId,
      descricao: descricaoPerfil || undefined
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="w-4 h-4 mr-2" />
            Perfis
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setDialogAberto(true)}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configuração Atual
          </DropdownMenuItem>
          
          {perfisQuery.data && perfisQuery.data.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {perfisQuery.data.map((perfil) => (
                <DropdownMenuItem
                  key={perfil.id}
                  className="flex justify-between"
                  onClick={() => {
                    onCarregarPerfil({
                      tipoDocumento: perfil.tipoDocumento,
                      areaJuridica: perfil.areaJuridica,
                      modeloId: perfil.modeloId || undefined
                    });
                    toast.success(`Perfil "${perfil.nome}" carregado!`);
                  }}
                >
                  <span className="flex-1">{perfil.nome}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Deletar perfil "${perfil.nome}"?`)) {
                        deletarMutation.mutate({ id: perfil.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Perfil de Uso</DialogTitle>
            <DialogDescription>
              Salve a configuração atual (tipo de documento + área jurídica) para reutilizar depois.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome-perfil">Nome do Perfil *</Label>
              <Input
                id="nome-perfil"
                placeholder="Ex: Trabalhista Padrão"
                value={nomePerfil}
                onChange={(e) => setNomePerfil(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="descricao-perfil">Descrição (opcional)</Label>
              <Textarea
                id="descricao-perfil"
                placeholder="Descreva quando usar este perfil..."
                value={descricaoPerfil}
                onChange={(e) => setDescricaoPerfil(e.target.value)}
                rows={3}
              />
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Tipo:</strong> {tipoDocumento}</p>
              <p><strong>Área:</strong> {areaJuridica}</p>
              {modeloId && <p><strong>Modelo:</strong> {modeloId}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={criarMutation.isPending}>
              {criarMutation.isPending ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
