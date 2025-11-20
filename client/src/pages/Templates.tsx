import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, BookTemplate, Trash2, Copy, Home, History, FileText, Sparkles, Search, Play, X, Tag, Plus, CheckCircle2, Share2, Globe, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { AREAS_JURIDICAS } from "@/const";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EditTemplateDialog } from "@/components/EditTemplateDialog";

export default function Templates() {
  const { user } = useAuth();
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [managingTagsFor, setManagingTagsFor] = useState<number | null>(null);
  const [templateTags, setTemplateTags] = useState<Record<number, number[]>>({});
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  
  const templatesQuery = trpc.templates.meus.useQuery();
  const tagsQuery = trpc.tags.minhas.useQuery();
  const createTagMutation = trpc.tags.criar.useMutation({
    onSuccess: () => {
      toast.success("Tag criada com sucesso!");
      tagsQuery.refetch();
      setShowCreateTag(false);
      setNewTagName("");
      setNewTagColor("#3b82f6");
    },
    onError: (error) => {
      toast.error(`Erro ao criar tag: ${error.message}`);
    }
  });

  const atribuirTagMutation = trpc.tags.atribuirTemplate.useMutation({
    onSuccess: () => {
      toast.success("Tag atribuída com sucesso!");
      templatesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atribuir tag: ${error.message}`);
    }
  });

  const togglePublicoMutation = trpc.templates.togglePublico.useMutation({
    onSuccess: () => {
      toast.success("Visibilidade alterada com sucesso!");
      templatesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao alterar visibilidade: ${error.message}`);
    }
  });

  const removerTagMutation = trpc.tags.removerTemplate.useMutation({
    onSuccess: () => {
      toast.success("Tag removida com sucesso!");
      templatesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao remover tag: ${error.message}`);
    }
  });

  const deleteTagMutation = trpc.tags.deletar.useMutation({
    onSuccess: () => {
      toast.success("Tag deletada com sucesso!");
      tagsQuery.refetch();
      templatesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar tag: ${error.message}`);
    }
  });

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

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Nome da tag é obrigatório");
      return;
    }
    createTagMutation.mutate({
      nome: newTagName.trim(),
      cor: newTagColor
    });
  };

  const toggleTagFilter = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleTogglePublico = (templateId: number) => {
    togglePublicoMutation.mutate({ templateId });
  };

  const handleCopyShareLink = (templateId: number) => {
    const shareUrl = `${window.location.origin}/template/${templateId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copiado para área de transferência!");
  };

  const toggleTemplateTag = (templateId: number, tagId: number) => {
    const currentTags = templateTags[templateId] || [];
    if (currentTags.includes(tagId)) {
      removerTagMutation.mutate({ templateId, tagId });
      setTemplateTags(prev => ({
        ...prev,
        [templateId]: currentTags.filter(id => id !== tagId)
      }));
    } else {
      atribuirTagMutation.mutate({ templateId, tagId });
      setTemplateTags(prev => ({
        ...prev,
        [templateId]: [...currentTags, tagId]
      }));
    }
  };

  // Filtrar templates com base na busca e área selecionada
  const filteredTemplates = templatesQuery.data?.filter(template => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      template.nome.toLowerCase().includes(query) ||
      template.descricao?.toLowerCase().includes(query) ||
      template.areaJuridica.toLowerCase().includes(query);
    
    const matchesArea = !selectedArea || template.areaJuridica === selectedArea;
    
    return matchesSearch && matchesArea;
  }) || [];
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedArea(null);
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
                <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-4 h-4" />
                  Início
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Sparkles className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link href="/historico" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <History className="w-4 h-4" />
                  Histórico
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
          <p className="text-muted-foreground mb-4">
            Gerencie seus templates personalizados de prompts jurídicos
          </p>
          
          {/* Campo de Busca e Filtros */}
          {templatesQuery.data && templatesQuery.data.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar templates por nome, descrição ou área..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {(searchQuery || selectedArea) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
              
              {/* Chips de Áreas Jurídicas */}
              <div className="flex flex-wrap gap-2">
                {AREAS_JURIDICAS.map((area) => (
                  <Badge
                    key={area}
                    variant={selectedArea === area ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setSelectedArea(selectedArea === area ? null : area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>

              {/* Tags Personalizadas */}
              {tagsQuery.data && tagsQuery.data.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Filtrar por Tags</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateTag(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Tag
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tagsQuery.data.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        style={{
                          backgroundColor: selectedTags.includes(tag.id) ? (tag.cor || undefined) : undefined,
                          borderColor: tag.cor || undefined
                        }}
                        onClick={() => toggleTagFilter(tag.id)}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão para criar primeira tag */}
              {(!tagsQuery.data || tagsQuery.data.length === 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateTag(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Tag
                </Button>
              )}
            </div>
          )}
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
          <>
            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum template encontrado</h3>
                  <p className="text-muted-foreground mb-6">
                    Nenhum template corresponde à sua busca "{searchQuery}". Tente outros termos.
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Limpar Busca
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {template.nome}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary">{template.areaJuridica}</Badge>
                        {template.isPublico && <Badge variant="outline">Público</Badge>}
                        {/* Exibir tags atribuídas */}
                        {(templateTags[template.id] || []).map(tagId => {
                          const tag = tagsQuery.data?.find(t => t.id === tagId);
                          return tag ? (
                            <Badge 
                              key={tagId} 
                              variant="outline"
                              style={{ borderColor: tag.cor || undefined }}
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag.nome}
                            </Badge>
                          ) : null;
                        })}
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
                      asChild
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/dashboard?template=${template.id}`}>
                        <Play className="w-4 h-4 mr-2" />
                        Usar Template
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(template.template)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManagingTagsFor(template.id)}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Tags
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublico(template.id)}
                      title={template.isPublico ? "Tornar privado" : "Tornar público"}
                    >
                      {template.isPublico ? (
                        <Globe className="w-4 h-4" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </Button>
                    {template.isPublico && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyShareLink(template.id)}
                        title="Copiar link de compartilhamento"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
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
          </>
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

      {/* Dialog para gerenciar tags do template */}
      <Dialog open={managingTagsFor !== null} onOpenChange={(open) => !open && setManagingTagsFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Tags</DialogTitle>
            <DialogDescription>
              Selecione as tags para este template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {tagsQuery.data && tagsQuery.data.length > 0 ? (
              <div className="space-y-2">
                {tagsQuery.data.map((tag) => {
                  const isSelected = managingTagsFor ? (templateTags[managingTagsFor] || []).includes(tag.id) : false;
                  return (
                    <div
                      key={tag.id}
                      className="flex items-center gap-3 p-3 rounded-sm border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => managingTagsFor && toggleTemplateTag(managingTagsFor, tag.id)}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        style={{ borderColor: tag.cor || undefined }}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.nome}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Nenhuma tag criada ainda</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setManagingTagsFor(null);
                    setShowCreateTag(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Tag
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingTagsFor(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar tag */}
      <Dialog open={showCreateTag} onOpenChange={setShowCreateTag}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Tag</DialogTitle>
            <DialogDescription>
              Tags ajudam a organizar e filtrar seus templates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">Nome da Tag</Label>
              <Input
                id="tagName"
                placeholder="Ex: Urgente, Favorito, Revisar..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagColor">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="tagColor"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  placeholder="#3b82f6"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateTag(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={createTagMutation.isPending}
            >
              {createTagMutation.isPending ? "Criando..." : "Criar Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Template */}
      <EditTemplateDialog
        template={editingTemplate}
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        onSuccess={() => templatesQuery.refetch()}
      />
    </div>
  );
}
