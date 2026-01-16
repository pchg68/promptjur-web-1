import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scale, Library, Copy, Eye, Home, History, BookTemplate, FileText, Search, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function BibliotecaPublica() {
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [filtroArea, setFiltroArea] = useState<string>("todas");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modeloPreview, setModeloPreview] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Buscar modelos públicos
  const modelosPublicosQuery = trpc.modelosPersonalizados.publicos.useQuery();
  
  // Clonar modelo
  const clonarMutation = trpc.modelosPersonalizados.clonar.useMutation({
    onSuccess: () => {
      toast.success("Modelo clonado com sucesso! Acesse 'Meus Modelos' para editá-lo.");
    },
    onError: (error) => {
      toast.error(`Erro ao clonar modelo: ${error.message}`);
    }
  });
  
  // Filtrar modelos
  const modelosFiltrados = modelosPublicosQuery.data?.filter(modelo => {
    const matchBusca = !busca || 
      modelo.nome.toLowerCase().includes(busca.toLowerCase()) ||
      modelo.descricao?.toLowerCase().includes(busca.toLowerCase());
    
    const matchArea = filtroArea === "todas" || modelo.areaJuridica === filtroArea;
    const matchTipo = filtroTipo === "todos" || modelo.tipoDocumento === filtroTipo;
    
    return matchBusca && matchArea && matchTipo;
  }) || [];
  
  const handleClonar = (modeloId: number) => {
    clonarMutation.mutate({ modeloId });
  };
  
  const handlePreview = (modelo: any) => {
    setModeloPreview(modelo);
    setShowPreviewModal(true);
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
                <p className="text-sm text-muted-foreground">Biblioteca Pública</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-4 h-4" />
                  Início
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <BookTemplate className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link href="/meus-modelos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <FileText className="w-4 h-4" />
                  Meus Modelos
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Library className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Biblioteca Pública de Modelos</h2>
          </div>
          <p className="text-muted-foreground">
            Explore modelos compartilhados pela comunidade e clone para usar em seus documentos
          </p>
        </div>
        
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou descrição..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Área Jurídica</Label>
                <Select value={filtroArea} onValueChange={setFiltroArea}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Áreas</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                    <SelectItem value="Penal">Penal</SelectItem>
                    <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                    <SelectItem value="Tributário">Tributário</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                    <SelectItem value="Constitucional">Constitucional</SelectItem>
                    <SelectItem value="Empresarial">Empresarial</SelectItem>
                    <SelectItem value="Consumidor">Consumidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Tipos</SelectItem>
                    <SelectItem value="peticao">Petição</SelectItem>
                    <SelectItem value="parecer">Parecer</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="recurso">Recurso</SelectItem>
                    <SelectItem value="defesa">Defesa</SelectItem>
                    <SelectItem value="memorando">Memorando</SelectItem>
                    <SelectItem value="agravo">Agravo</SelectItem>
                    <SelectItem value="apelacao">Apelação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Lista de Modelos */}
        {modelosPublicosQuery.isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando modelos...</p>
          </div>
        ) : modelosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Library className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Nenhum modelo encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros ou criar seu próprio modelo
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modelosFiltrados.map(modelo => (
              <Card key={modelo.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{modelo.nome}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {modelo.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{modelo.areaJuridica}</Badge>
                    <Badge variant="secondary">
                      {modelo.tipoDocumento === "peticao" && "Petição"}
                      {modelo.tipoDocumento === "parecer" && "Parecer"}
                      {modelo.tipoDocumento === "contrato" && "Contrato"}
                      {modelo.tipoDocumento === "recurso" && "Recurso"}
                      {modelo.tipoDocumento === "defesa" && "Defesa"}
                      {modelo.tipoDocumento === "memorando" && "Memorando"}
                      {modelo.tipoDocumento === "agravo" && "Agravo"}
                      {modelo.tipoDocumento === "apelacao" && "Apelação"}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePreview(modelo)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleClonar(modelo.id)}
                      disabled={clonarMutation.isPending}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Clonar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      {/* Modal de Preview */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modeloPreview?.nome}</DialogTitle>
            <DialogDescription>{modeloPreview?.descricao}</DialogDescription>
          </DialogHeader>
          
          {modeloPreview && (
            <div className="space-y-4 py-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{modeloPreview.areaJuridica}</Badge>
                <Badge variant="secondary">{modeloPreview.tipoDocumento}</Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Template</Label>
                <Textarea
                  value={modeloPreview.template}
                  readOnly
                  className="font-mono text-sm min-h-[300px]"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    handleClonar(modeloPreview.id);
                    setShowPreviewModal(false);
                  }}
                  disabled={clonarMutation.isPending}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Clonar Modelo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
