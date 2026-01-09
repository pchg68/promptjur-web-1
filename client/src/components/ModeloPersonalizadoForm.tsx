import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X } from "lucide-react";
import { AREAS_JURIDICAS } from "@shared/juridico";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ModeloPersonalizadoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modeloId?: number; // Se fornecido, é edição; senão é criação
  onSuccess?: () => void;
}

/**
 * Formulário para criar ou editar modelo personalizado de documento
 */
export function ModeloPersonalizadoForm({
  open,
  onOpenChange,
  modeloId,
  onSuccess
}: ModeloPersonalizadoFormProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [template, setTemplate] = useState("");
  const [areaJuridica, setAreaJuridica] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [isPublico, setIsPublico] = useState(false);

  const utils = trpc.useUtils();

  // Query para carregar modelo existente (se edição)
  const modeloQuery = trpc.modelosPersonalizados.obterPorId.useQuery(
    { id: modeloId! },
    { enabled: !!modeloId }
  );

  // Preencher formulário quando modelo é carregado
  useState(() => {
    if (modeloQuery.data) {
      setNome(modeloQuery.data.nome);
      setDescricao(modeloQuery.data.descricao || "");
      setTemplate(modeloQuery.data.template);
      setAreaJuridica(modeloQuery.data.areaJuridica);
      setIsPublico(modeloQuery.data.isPublico || false);
    }
  });

  // Mutation para criar modelo
  const criarMutation = trpc.modelosPersonalizados.criar.useMutation({
    onSuccess: () => {
      toast.success("Modelo criado com sucesso!");
      utils.modelosPersonalizados.listar.invalidate();
      onOpenChange(false);
      limparFormulario();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erro ao criar modelo: ${error.message}`);
    }
  });

  // Mutation para atualizar modelo
  const atualizarMutation = trpc.modelosPersonalizados.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Modelo atualizado com sucesso!");
      utils.modelosPersonalizados.listar.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar modelo: ${error.message}`);
    }
  });

  const limparFormulario = () => {
    setNome("");
    setDescricao("");
    setTemplate("");
    setAreaJuridica("");
    setTipoDocumento("");
    setIsPublico(false);
  };

  const handleSubmit = () => {
    if (!nome || !template || !areaJuridica) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (modeloId) {
      // Atualizar modelo existente
      atualizarMutation.mutate({
        id: modeloId,
        nome,
        descricao,
        template,
        areaJuridica,
        isPublico
      });
    } else {
      // Criar novo modelo
      criarMutation.mutate({
        nome,
        descricao,
        template,
        areaJuridica,
        tipoDocumento,
        isPublico
      });
    }
  };

  const isLoading = criarMutation.isPending || atualizarMutation.isPending || modeloQuery.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{modeloId ? "Editar" : "Criar"} Modelo Personalizado</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Crie modelos personalizados de documentos para reutilizar em seus prompts jurídicos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome do Modelo */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Modelo *</Label>
            <Input
              id="nome"
              placeholder="Ex: Petição Trabalhista - Horas Extras"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva para que serve este modelo..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Área Jurídica */}
          <div className="space-y-2">
            <Label htmlFor="area">Área Jurídica *</Label>
            <Select value={areaJuridica} onValueChange={setAreaJuridica}>
              <SelectTrigger id="area">
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

          {/* Tipo de Documento */}
          {!modeloId && (
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Documento</Label>
              <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peticao">Petição</SelectItem>
                  <SelectItem value="parecer">Parecer</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="recurso">Recurso</SelectItem>
                  <SelectItem value="defesa">Defesa</SelectItem>
                  <SelectItem value="memorando">Memorando</SelectItem>
                  <SelectItem value="agravo">Agravo</SelectItem>
                  <SelectItem value="apelacao">Apelação</SelectItem>
                  <SelectItem value="contestacao">Contestação</SelectItem>
                  <SelectItem value="embargos">Embargos</SelectItem>
                  <SelectItem value="mandado_seguranca">Mandado de Segurança</SelectItem>
                  <SelectItem value="habeas_corpus">Habeas Corpus</SelectItem>
                  <SelectItem value="notificacao">Notificação Extrajudicial</SelectItem>
                  <SelectItem value="procuracao">Procuração</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Template (Prompt) */}
          <div className="space-y-2">
            <Label htmlFor="template">Template do Prompt *</Label>
            <Textarea
              id="template"
              placeholder="Digite o template do prompt. Use {{variavel}} para criar campos personalizáveis.&#10;&#10;Exemplo:&#10;Elabore uma {{tipo_documento}} de {{area}} considerando:&#10;- Fatos: {{fatos}}&#10;- Pedidos: {{pedidos}}"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Dica: Use {`{{nome_variavel}}`} para criar campos personalizáveis que podem ser preenchidos ao usar o modelo
            </p>
          </div>

          {/* Público */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="publico">Modelo Público</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que outros usuários vejam e usem este modelo
              </p>
            </div>
            <Switch
              id="publico"
              checked={isPublico}
              onCheckedChange={setIsPublico}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {modeloId ? "Atualizar" : "Criar"} Modelo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
