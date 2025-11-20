import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AREAS_JURIDICAS } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Template {
  id: number;
  nome: string;
  descricao: string | null;
  areaJuridica: string;
  template: string;
  isPublico: boolean;
}

interface EditTemplateDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditTemplateDialog({ template, open, onOpenChange, onSuccess }: EditTemplateDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [areaJuridica, setAreaJuridica] = useState("");
  const [conteudo, setConteudo] = useState("");

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setDescricao(template.descricao || "");
      setAreaJuridica(template.areaJuridica);
      setConteudo(template.template);
    }
  }, [template]);

  const atualizarMutation = trpc.templates.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    }
  });

  const handleSubmit = () => {
    if (!template) return;
    
    if (!nome.trim() || !conteudo.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    atualizarMutation.mutate({
      id: template.id,
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      areaJuridica,
      template: conteudo.trim()
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Template</DialogTitle>
          <DialogDescription>
            Atualize as informações do template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Template *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Petição Inicial - Ação de Cobrança"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Área Jurídica *</Label>
            <Select value={areaJuridica} onValueChange={setAreaJuridica}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a área" />
              </SelectTrigger>
              <SelectContent>
                {AREAS_JURIDICAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição do template"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo do Template *</Label>
            <Textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Digite o conteúdo do template..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={atualizarMutation.isPending}
          >
            {atualizarMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
