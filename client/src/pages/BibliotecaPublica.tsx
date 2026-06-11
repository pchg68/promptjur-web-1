import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scale, Library, Copy, Eye, Home, BookTemplate, FileText, Search, Filter, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { promptsJuridicos, type PromptJuridico } from "@/data/promptsJuridicos";
import { getLoginUrl } from "@/const";

export default function BibliotecaPublica() {
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [filtroArea, setFiltroArea] = useState<string>("todas");
  const [filtroComplexidade, setFiltroComplexidade] = useState<string>("todas");
  const [promptPreview, setPromptPreview] = useState<PromptJuridico | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Extrair áreas únicas dos prompts
  const areas = useMemo(() => {
    const unique = Array.from(new Set(promptsJuridicos.map(p => p.area)));
    return unique.sort();
  }, []);

  // Filtrar prompts
  const promptsFiltrados = useMemo(() => {
    return promptsJuridicos.filter((prompt) => {
      const matchBusca = !busca ||
        prompt.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        prompt.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        prompt.subarea.toLowerCase().includes(busca.toLowerCase());

      const matchArea = filtroArea === "todas" || prompt.area === filtroArea;
      const matchComplexidade = filtroComplexidade === "todas" || prompt.complexidade === filtroComplexidade;

      return matchBusca && matchArea && matchComplexidade;
    });
  }, [busca, filtroArea, filtroComplexidade]);

  // Agrupar por área para exibição
  const promptsPorArea = useMemo(() => {
    const grouped: Record<string, PromptJuridico[]> = {};
    promptsFiltrados.forEach(p => {
      if (!grouped[p.area]) grouped[p.area] = [];
      grouped[p.area].push(p);
    });
    return grouped;
  }, [promptsFiltrados]);

  const handleCopiar = (prompt: PromptJuridico) => {
    if (!user) {
      toast.info("Faça login para copiar prompts completos", {
        action: {
          label: "Login",
          onClick: () => window.location.href = getLoginUrl(),
        }
      });
      return;
    }
    navigator.clipboard.writeText(prompt.prompt);
    toast.success("Prompt copiado para a área de transferência!");
  };

  const handlePreview = (prompt: PromptJuridico) => {
    setPromptPreview(prompt);
    setShowPreviewModal(true);
  };

  const complexidadeLabel = (c: string) => {
    switch (c) {
      case "basico": return "Básico";
      case "intermediario": return "Intermediário";
      case "avancado": return "Avançado";
      default: return c;
    }
  };

  const complexidadeColor = (c: string) => {
    switch (c) {
      case "basico": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "intermediario": return "bg-amber-100 text-amber-800 border-amber-200";
      case "avancado": return "bg-rose-100 text-rose-800 border-rose-200";
      default: return "";
    }
  };

  // Determinar se o prompt é gratuito (básico) ou requer plano
  const isGratuito = (prompt: PromptJuridico) => prompt.complexidade === "basico";

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
                <p className="text-sm text-muted-foreground">Biblioteca de Prompts Jurídicos</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-4 h-4" />
                  Início
                </Link>
                {user && (
                  <>
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <BookTemplate className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link href="/meus-modelos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <FileText className="w-4 h-4" />
                      Meus Modelos
                    </Link>
                  </>
                )}
              </nav>
              {!user && (
                <Button size="sm" asChild>
                  <a href={getLoginUrl()}>Entrar</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
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
          <div className="flex items-center gap-3 mb-2">
            <Library className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Biblioteca de Prompts Jurídicos</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Explore 100 prompts profissionais organizados por área do Direito. 
            Prompts básicos são gratuitos — intermediários e avançados requerem plano Profissional.
          </p>
          <div className="flex gap-3 mt-4">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Básico — Gratuito
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Intermediário — Plano Pro
            </Badge>
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
              Avançado — Plano Pro
            </Badge>
          </div>
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
                    placeholder="Título, descrição ou subárea..."
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
                    <SelectItem value="todas">Todas as Áreas ({promptsJuridicos.length})</SelectItem>
                    {areas.map(area => (
                      <SelectItem key={area} value={area}>
                        {area} ({promptsJuridicos.filter(p => p.area === area).length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Complexidade</Label>
                <Select value={filtroComplexidade} onValueChange={setFiltroComplexidade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="basico">Básico (Gratuito)</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contagem de resultados */}
        <div className="mb-4 text-sm text-muted-foreground">
          {promptsFiltrados.length} prompt{promptsFiltrados.length !== 1 ? "s" : ""} encontrado{promptsFiltrados.length !== 1 ? "s" : ""}
        </div>

        {/* Lista de Prompts agrupados por área */}
        {promptsFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Library className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Nenhum prompt encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros de busca
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(promptsPorArea).map(([area, prompts]) => (
              <div key={area}>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  {area}
                  <Badge variant="secondary" className="ml-2">{prompts.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prompts.map(prompt => (
                    <Card key={prompt.id} className="hover:border-primary/50 transition-colors group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-tight">{prompt.titulo}</CardTitle>
                          {!isGratuito(prompt) && !user && (
                            <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                        </div>
                        <CardDescription className="line-clamp-2 text-xs">
                          {prompt.descricao}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs">{prompt.subarea}</Badge>
                          <Badge className={`text-xs border ${complexidadeColor(prompt.complexidade)}`}>
                            {complexidadeLabel(prompt.complexidade)}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handlePreview(prompt)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleCopiar(prompt)}
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copiar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Preview */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{promptPreview?.titulo}</DialogTitle>
            <DialogDescription>{promptPreview?.descricao}</DialogDescription>
          </DialogHeader>

          {promptPreview && (
            <div className="space-y-4 py-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{promptPreview.area}</Badge>
                <Badge variant="outline">{promptPreview.subarea}</Badge>
                <Badge className={`border ${complexidadeColor(promptPreview.complexidade)}`}>
                  {complexidadeLabel(promptPreview.complexidade)}
                </Badge>
              </div>

              {/* Se gratuito ou usuário logado, mostra prompt completo */}
              {(isGratuito(promptPreview) || user) ? (
                <div className="space-y-2">
                  <Label>Prompt Completo</Label>
                  <Textarea
                    value={promptPreview.prompt}
                    readOnly
                    className="font-mono text-sm min-h-[300px] bg-muted/30"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Preview (parcial)</Label>
                    <Textarea
                      value={promptPreview.prompt.slice(0, 200) + "\n\n[...]\n\n🔒 Faça login ou assine o plano Profissional para ver o prompt completo."}
                      readOnly
                      className="font-mono text-sm min-h-[200px] bg-muted/30"
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <Lock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-amber-800 font-medium mb-2">
                      Prompt intermediário/avançado — requer plano Profissional
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" asChild>
                        <a href={getLoginUrl()}>Fazer Login</a>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href="/planos">Ver Planos</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Fechar
                </Button>
                {(isGratuito(promptPreview) || user) && (
                  <Button
                    onClick={() => {
                      handleCopiar(promptPreview);
                      setShowPreviewModal(false);
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Prompt
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
