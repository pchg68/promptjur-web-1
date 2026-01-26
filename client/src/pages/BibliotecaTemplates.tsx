import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  BookTemplate, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Copy, 
  Eye,
  Loader2,
  FileText,
  Plus
} from "lucide-react";
import { AREAS_JURIDICAS } from "@/const";
import { Badge } from "@/components/ui/badge";

const TIPOS_DOCUMENTO = [
  "Todos",
  "peticao",
  "parecer",
  "contrato",
  "recurso",
  "defesa",
  "memorando",
  "agravo",
  "apelacao",
  "contestacao",
  "embargos",
  "mandado_seguranca",
  "habeas_corpus",
  "notificacao",
  "procuracao",
  "outro"
];

const TIPO_DOCUMENTO_LABELS: Record<string, string> = {
  peticao: "Petição",
  parecer: "Parecer",
  contrato: "Contrato",
  recurso: "Recurso",
  defesa: "Defesa",
  memorando: "Memorando",
  agravo: "Agravo",
  apelacao: "Apelação",
  contestacao: "Contestação",
  embargos: "Embargos",
  mandado_seguranca: "Mandado de Segurança",
  habeas_corpus: "Habeas Corpus",
  notificacao: "Notificação Extrajudicial",
  procuracao: "Procuração",
  outro: "Outro"
};

export default function BibliotecaTemplates() {
  const [busca, setBusca] = useState("");
  const [areaFiltro, setAreaFiltro] = useState<string>("Todas");
  const [tipoFiltro, setTipoFiltro] = useState<string>("Todos");
  const [templateSelecionado, setTemplateSelecionado] = useState<any>(null);
  const [dialogVisualizarAberto, setDialogVisualizarAberto] = useState(false);
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);

  // Estados do formulário de edição
  const [nomeEdit, setNomeEdit] = useState("");
  const [descricaoEdit, setDescricaoEdit] = useState("");
  const [templateEdit, setTemplateEdit] = useState("");
  const [areaEdit, setAreaEdit] = useState("");

  const utils = trpc.useUtils();
  
  // Query para listar templates
  const { data: templates, isLoading } = trpc.templates.meus.useQuery();

  // Mutations
  const deletarMutation = trpc.templates.deletar.useMutation({
    onSuccess: () => {
      utils.templates.meus.invalidate();
      toast.success("Template excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir template: ${error.message}`);
    }
  });

  const atualizarMutation = trpc.templates.atualizar.useMutation({
    onSuccess: () => {
      utils.templates.meus.invalidate();
      setDialogEditarAberto(false);
      toast.success("Template atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    }
  });

  // Filtrar templates
  const templatesFiltrados = useMemo(() => {
    if (!templates) return [];

    return templates.filter((template) => {
      const matchBusca = template.nome.toLowerCase().includes(busca.toLowerCase()) ||
                        (template.descricao?.toLowerCase() || "").includes(busca.toLowerCase());
      const matchArea = areaFiltro === "Todas" || template.areaJuridica === areaFiltro;
      const matchTipo = tipoFiltro === "Todos"; // Tipo de documento não está no schema

      return matchBusca && matchArea && matchTipo;
    });
  }, [templates, busca, areaFiltro, tipoFiltro]);

  const handleVisualizar = (template: any) => {
    setTemplateSelecionado(template);
    setDialogVisualizarAberto(true);
  };

  const handleEditar = (template: any) => {
    setTemplateSelecionado(template);
    setNomeEdit(template.nome);
    setDescricaoEdit(template.descricao || "");
    setTemplateEdit(template.template);
    setAreaEdit(template.areaJuridica);
    setDialogEditarAberto(true);
  };

  const handleSalvarEdicao = () => {
    if (!templateSelecionado) return;

    atualizarMutation.mutate({
      id: templateSelecionado.id,
      nome: nomeEdit,
      descricao: descricaoEdit,
      template: templateEdit,
      areaJuridica: areaEdit
    });
  };

  const handleDeletar = (templateId: number, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o template "${nome}"?`)) {
      deletarMutation.mutate({ templateId });
    }
  };

  const handleCopiar = (conteudo: string) => {
    navigator.clipboard.writeText(conteudo);
    toast.success("Template copiado para área de transferência!");
  };

  const handleAplicar = (template: any) => {
    // Armazenar no localStorage para uso na página de geração
    localStorage.setItem("template_aplicado", JSON.stringify(template));
    toast.success("Template pronto para aplicar! Vá para a página de Geração.");
    // Opcional: redirecionar automaticamente
    // window.location.href = "/dashboard?tab=gerar";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BookTemplate className="w-8 h-8 text-primary" />
              Biblioteca de Templates
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus templates salvos de prompts jurídicos
            </p>
          </div>
          <Button onClick={() => window.location.href = "/dashboard?tab=gerar"}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Template
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca por nome */}
              <div className="space-y-2">
                <Label htmlFor="busca">Buscar por nome ou descrição</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="busca"
                    placeholder="Digite para buscar..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro por área jurídica */}
              <div className="space-y-2">
                <Label htmlFor="area-filtro">Área Jurídica</Label>
                <Select value={areaFiltro} onValueChange={setAreaFiltro}>
                  <SelectTrigger id="area-filtro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas as áreas</SelectItem>
                    {AREAS_JURIDICAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por tipo de documento */}
              <div className="space-y-2">
                <Label htmlFor="tipo-filtro">Tipo de Documento</Label>
                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger id="tipo-filtro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo === "Todos" ? "Todos os tipos" : TIPO_DOCUMENTO_LABELS[tipo] || tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                "Carregando..."
              ) : (
                `${templatesFiltrados.length} template${templatesFiltrados.length !== 1 ? 's' : ''} encontrado${templatesFiltrados.length !== 1 ? 's' : ''}`
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Templates */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : templatesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {templates?.length === 0 
                  ? "Você ainda não criou nenhum template. Crie seu primeiro template na página de Geração!"
                  : "Tente ajustar os filtros para encontrar o que procura."}
              </p>
              {templates?.length === 0 && (
                <Button onClick={() => window.location.href = "/dashboard?tab=gerar"}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesFiltrados.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {template.nome}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.descricao || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{template.areaJuridica}</Badge>
                    {/* Tipo de documento não disponível no schema */}
                  </div>

                  {/* Data de criação */}
                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVisualizar(template)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditar(template)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopiar(template.template)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAplicar(template)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Aplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletar(template.id, template.nome)}
                      disabled={deletarMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Visualizar */}
        <Dialog open={dialogVisualizarAberto} onOpenChange={setDialogVisualizarAberto}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{templateSelecionado?.nome}</DialogTitle>
              <DialogDescription>
                {templateSelecionado?.descricao || "Sem descrição"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge>{templateSelecionado?.areaJuridica}</Badge>
                {/* Tipo de documento não disponível no schema */}
              </div>
              <div className="bg-muted p-4 rounded-sm">
                <pre className="whitespace-pre-wrap text-sm">
                  {templateSelecionado?.template}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleCopiar(templateSelecionado?.template)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Template
                </Button>
                <Button variant="outline" onClick={() => setDialogVisualizarAberto(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Editar */}
        <Dialog open={dialogEditarAberto} onOpenChange={setDialogEditarAberto}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Template</DialogTitle>
              <DialogDescription>
                Atualize as informações do template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-edit">Nome do Template *</Label>
                <Input
                  id="nome-edit"
                  value={nomeEdit}
                  onChange={(e) => setNomeEdit(e.target.value)}
                  placeholder="Ex: Petição de Cobrança Padrão"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area-edit">Área Jurídica *</Label>
                <Select value={areaEdit} onValueChange={setAreaEdit}>
                  <SelectTrigger id="area-edit">
                    <SelectValue />
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
                <Label htmlFor="descricao-edit">Descrição</Label>
                <Textarea
                  id="descricao-edit"
                  value={descricaoEdit}
                  onChange={(e) => setDescricaoEdit(e.target.value)}
                  placeholder="Descreva quando usar este template..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-edit">Conteúdo do Template *</Label>
                <Textarea
                  id="template-edit"
                  value={templateEdit}
                  onChange={(e) => setTemplateEdit(e.target.value)}
                  placeholder="Cole o conteúdo do template aqui..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSalvarEdicao}
                  disabled={atualizarMutation.isPending || !nomeEdit || !templateEdit || !areaEdit}
                >
                  {atualizarMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDialogEditarAberto(false)}
                  disabled={atualizarMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
