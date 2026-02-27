import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Clock, Tag, X, ThumbsUp, ThumbsDown, Play, PlayCircle, ExternalLink, ArrowLeft, Scale, Home, GraduationCap, Video, FileText } from "lucide-react";
import { Streamdown } from "streamdown";
import { CATEGORIAS_NOMES, CATEGORIAS_DESCRICOES, NIVEIS_NOMES, type CategoriaTutorial, type NivelTutorial } from "@shared/tutoriais";
import { toast } from "sonner";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE } from "@/const";

interface VideoTutorial {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  duracao: string;
  youtubeId: string;
  topicos: string[];
}

const videosTutoriais: VideoTutorial[] = [
  {
    id: "video-1",
    numero: 1,
    titulo: "Introdução ao PromptJur",
    descricao: "Conheça o PromptJur e descubra como transformar prompts em peças jurídicas profissionais usando IA.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_1",
    topicos: [
      "O que é o PromptJur",
      "Principais funcionalidades",
      "Benefícios práticos",
      "Visão geral do sistema"
    ]
  },
  {
    id: "video-2",
    numero: 2,
    titulo: "Analisando Prompts Jurídicos",
    descricao: "Aprenda a usar a funcionalidade de Análise para avaliar a qualidade de prompts e identificar pontos de melhoria.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_2",
    topicos: [
      "Acessando a Análise",
      "Inserindo prompts",
      "Interpretando resultados",
      "Salvando análises"
    ]
  },
  {
    id: "video-3",
    numero: 3,
    titulo: "Gerando Prompts Profissionais",
    descricao: "Descubra como criar prompts jurídicos completos e estruturados do zero usando IA.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_3",
    topicos: [
      "Configurando a geração",
      "Definindo objetivo e contexto",
      "Explorando resultados",
      "Criando modelos"
    ]
  },
  {
    id: "video-4",
    numero: 4,
    titulo: "Otimizando Prompts Existentes",
    descricao: "Transforme prompts básicos em prompts profissionais com a funcionalidade de Otimização.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_4",
    topicos: [
      "Preparando otimização",
      "Focos: Clareza, Completude, Precisão",
      "Comparando antes e depois",
      "Aplicando melhorias"
    ]
  },
  {
    id: "video-5",
    numero: 5,
    titulo: "Recursos Avançados e Dicas Finais",
    descricao: "Aprenda recursos avançados: modelos personalizados, validação de legislação e exportação em formato ABNT.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_5",
    topicos: [
      "Modelos personalizados",
      "Validação de legislação",
      "Exportação ABNT",
      "Dicas profissionais"
    ]
  }
];

export default function Tutoriais() {
  const { user, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState("tutoriais");
  
  // Estados para tutoriais escritos
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaTutorial | "todas">("todas");
  const [nivelFiltro, setNivelFiltro] = useState<NivelTutorial | "todos">("todos");
  const [tutorialSelecionado, setTutorialSelecionado] = useState<string | null>(null);

  // Estado para vídeo selecionado
  const [videoSelecionado, setVideoSelecionado] = useState<VideoTutorial | null>(null);

  // Hook de utils para invalidação de cache
  const utils = trpc.useUtils();

  // Query com filtros
  const { data: tutoriais, isLoading } = trpc.tutoriais.listar.useQuery({
    busca: busca || undefined,
    categoria: categoriaFiltro !== "todas" ? categoriaFiltro : undefined,
    nivel: nivelFiltro !== "todos" ? nivelFiltro : undefined,
  });

  // Query para tutorial individual
  const { data: tutorialDetalhado } = trpc.tutoriais.porId.useQuery(
    tutorialSelecionado!,
    { enabled: !!tutorialSelecionado }
  );

  // Query de progresso do usuário
  const { data: progresso } = trpc.tutoriais.obterProgresso.useQuery();

  // Query de feedback do usuário
  const { data: meusFeedbacks } = trpc.tutoriais.obterFeedback.useQuery();

  // Query de estatísticas de feedback (pública)
  const { data: estatisticasFeedback } = trpc.tutoriais.estatisticasFeedback.useQuery();

  // Mutation para marcar tutorial como concluído
  const marcarConcluidoMutation = trpc.tutoriais.marcarConcluido.useMutation({
    onSuccess: () => {
      utils.tutoriais.obterProgresso.invalidate();
    },
  });

  // Mutation para registrar feedback
  const feedbackMutation = trpc.tutoriais.registrarFeedback.useMutation({
    onSuccess: () => {
      utils.tutoriais.obterFeedback.invalidate();
      utils.tutoriais.estatisticasFeedback.invalidate();
      toast.success("Obrigado pelo seu feedback!");
    },
    onError: () => {
      toast.error("Erro ao registrar feedback. Tente novamente.");
    },
  });

  // Marcar como concluído ao abrir tutorial
  const handleAbrirTutorial = (tutorialId: string) => {
    setTutorialSelecionado(tutorialId);
    setTimeout(() => {
      marcarConcluidoMutation.mutate(tutorialId);
    }, 3000);
  };

  const handleFeedback = (tutorialId: string, util: boolean) => {
    feedbackMutation.mutate({ tutorialId, util });
  };

  const getMeuFeedback = (tutorialId: string): boolean | null => {
    if (!meusFeedbacks) return null;
    const feedback = meusFeedbacks.find(f => f.tutorialId === tutorialId);
    return feedback ? feedback.util : null;
  };

  const getEstatisticas = (tutorialId: string) => {
    if (!estatisticasFeedback) return null;
    return estatisticasFeedback.find(s => s.tutorialId === tutorialId);
  };

  const limparFiltros = () => {
    setBusca("");
    setCategoriaFiltro("todas");
    setNivelFiltro("todos");
  };

  const getNivelColor = (nivel: NivelTutorial) => {
    switch (nivel) {
      case "iniciante":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "intermediario":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "profissional":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
    }
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
                <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
                <p className="text-sm text-muted-foreground">Central de Aprendizado</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Home className="w-4 h-4" />
                Início
              </Link>
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button variant="default" size="sm">
                    Dashboard
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background border-b border-border/30">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <GraduationCap className="w-4 h-4" />
              Central de Aprendizado
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Aprenda a dominar o PromptJur
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Tutoriais completos, vídeos práticos e FAQs para você aproveitar ao máximo todas as funcionalidades da plataforma
            </p>

            {/* Progresso do Usuário */}
            {progresso && (
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Seu Progresso</span>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {progresso.percentualConcluido}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progresso.percentualConcluido}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {progresso.totalConcluidos} de {progresso.totalTutoriais} tutoriais concluídos
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Tabs de Navegação */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 max-w-lg mx-auto">
            <TabsTrigger value="tutoriais" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tutoriais
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* ===== SEÇÃO: TUTORIAIS ESCRITOS ===== */}
          <TabsContent value="tutoriais" className="space-y-6">
            {/* Barra de Busca e Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por palavras-chave..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select
                    value={categoriaFiltro}
                    onValueChange={(value) => setCategoriaFiltro(value as CategoriaTutorial | "todas")}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      {Object.entries(CATEGORIAS_NOMES)
                        .filter(([key]) => key !== "faq")
                        .map(([key, nome]) => (
                          <SelectItem key={key} value={key}>
                            {nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={nivelFiltro}
                    onValueChange={(value) => setNivelFiltro(value as NivelTutorial | "todos")}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os níveis</SelectItem>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>

                  {(busca || categoriaFiltro !== "todas" || nivelFiltro !== "todos") && (
                    <Button
                      variant="outline"
                      onClick={limparFiltros}
                      className="whitespace-nowrap"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                Carregando tutoriais...
              </div>
            )}

            {/* Lista de Tutoriais (excluindo FAQs) */}
            {!isLoading && tutoriais && tutoriais.filter(t => t.categoria !== "faq").length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tutoriais
                  .filter(t => t.categoria !== "faq")
                  .map((tutorial) => {
                    const stats = getEstatisticas(tutorial.id);
                    const meuFeedback = getMeuFeedback(tutorial.id);

                    return (
                      <Card
                        key={tutorial.id}
                        className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/30"
                        onClick={() => handleAbrirTutorial(tutorial.id)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg line-clamp-2">
                              {tutorial.titulo}
                            </CardTitle>
                            <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                          <CardDescription className="line-clamp-2">
                            {CATEGORIAS_DESCRICOES[tutorial.categoria]}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {progresso?.tutoriaisConcluidosIds.includes(tutorial.id) && (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                ✓ Concluído
                              </Badge>
                            )}
                            <Badge className={getNivelColor(tutorial.nivel)}>
                              {NIVEIS_NOMES[tutorial.nivel]}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {tutorial.tempoLeitura} min
                            </Badge>
                            {tutorial.videoId && (
                              <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
                                <Play className="h-3 w-3" />
                                Vídeo
                              </Badge>
                            )}
                          </div>

                          {stats && stats.total > 0 && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3 text-green-600" />
                                {stats.totalUtil}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3 text-red-600" />
                                {stats.totalNaoUtil}
                              </span>
                              {meuFeedback !== null && (
                                <Badge variant="outline" className="text-xs py-0 px-1.5">
                                  {meuFeedback ? "Você achou útil" : "Você achou não útil"}
                                </Badge>
                              )}
                            </div>
                          )}

                          {tutorial.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tutorial.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs gap-1">
                                  <Tag className="h-2.5 w-2.5" />
                                  {tag}
                                </Badge>
                              ))}
                              {tutorial.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{tutorial.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}

            {/* Estado Vazio */}
            {!isLoading && tutoriais && tutoriais.filter(t => t.categoria !== "faq").length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum tutorial encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Tente ajustar os filtros ou usar outras palavras-chave
                  </p>
                  <Button variant="outline" onClick={limparFiltros}>
                    Limpar Filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== SEÇÃO: VÍDEOS ===== */}
          <TabsContent value="videos" className="space-y-6">
            {/* Info da Série */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  Série Completa: Tutorial PromptJur
                </CardTitle>
                <CardDescription>
                  5 vídeos • 15 minutos no total • Do básico ao avançado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Duração</div>
                      <div className="text-sm text-muted-foreground">3 min por vídeo</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Nível</div>
                      <div className="text-sm text-muted-foreground">Iniciante a Avançado</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PlayCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Formato</div>
                      <div className="text-sm text-muted-foreground">Demonstrações práticas</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aviso de vídeos em breve */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Em breve:</strong> Os vídeos estão sendo produzidos e serão publicados em nosso canal do YouTube. 
                Enquanto isso, explore nossos tutoriais escritos detalhados.
              </p>
            </div>

            {/* Grid de Vídeos */}
            <div className="grid gap-6">
              {videosTutoriais.map((video) => (
                <Card key={video.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {video.numero}
                          </Badge>
                          <CardTitle className="text-xl">{video.titulo}</CardTitle>
                        </div>
                        <CardDescription className="text-base">
                          {video.descricao}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="whitespace-nowrap">
                        <Clock className="h-3 w-3 mr-1" />
                        {video.duracao}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                          O que você vai aprender:
                        </h4>
                        <div className="grid md:grid-cols-2 gap-2">
                          {video.topicos.map((topico, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-primary mt-0.5">✓</span>
                              <span>{topico}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setVideoSelecionado(video)}
                          className="flex-1"
                          disabled={video.youtubeId.startsWith("SEU_VIDEO")}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {video.youtubeId.startsWith("SEU_VIDEO") ? "Em Breve" : "Assistir Agora"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank')}
                          disabled={video.youtubeId.startsWith("SEU_VIDEO")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          YouTube
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ===== SEÇÃO: FAQ ===== */}
          <TabsContent value="faq" className="space-y-6">
            {/* Busca no FAQ */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nas perguntas frequentes..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                Carregando FAQs...
              </div>
            )}

            {/* Lista de FAQs */}
            {!isLoading && tutoriais && (
              <div className="grid gap-4 md:grid-cols-2">
                {tutoriais
                  .filter(t => t.categoria === "faq")
                  .map((tutorial) => {
                    const stats = getEstatisticas(tutorial.id);
                    const meuFeedback = getMeuFeedback(tutorial.id);

                    return (
                      <Card
                        key={tutorial.id}
                        className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/30"
                        onClick={() => handleAbrirTutorial(tutorial.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base line-clamp-2">
                              {tutorial.titulo}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {progresso?.tutoriaisConcluidosIds.includes(tutorial.id) && (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                                ✓ Lido
                              </Badge>
                            )}
                            <Badge className={`text-xs ${getNivelColor(tutorial.nivel)}`}>
                              {NIVEIS_NOMES[tutorial.nivel]}
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Clock className="h-2.5 w-2.5" />
                              {tutorial.tempoLeitura} min
                            </Badge>
                          </div>

                          {stats && stats.total > 0 && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3 text-green-600" />
                                {stats.totalUtil}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3 text-red-600" />
                                {stats.totalNaoUtil}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}

            {/* Estado vazio FAQ */}
            {!isLoading && tutoriais && tutoriais.filter(t => t.categoria === "faq").length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma FAQ encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Tente usar outras palavras-chave na busca
                  </p>
                  <Button variant="outline" onClick={() => setBusca("")}>
                    Limpar Busca
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Vídeo */}
      {videoSelecionado && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setVideoSelecionado(null)}
        >
          <div
            className="bg-background rounded-lg max-w-5xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Vídeo {videoSelecionado.numero}: {videoSelecionado.titulo}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {videoSelecionado.descricao}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setVideoSelecionado(null)}>
                ✕
              </Button>
            </div>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoSelecionado.youtubeId}?autoplay=1`}
                title={videoSelecionado.titulo}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 border-t bg-muted/30">
              <h3 className="font-semibold mb-2">Neste vídeo:</h3>
              <ul className="space-y-1">
                {videoSelecionado.topicos.map((topico, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{topico}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Tutorial Detalhado */}
      <Dialog open={!!tutorialSelecionado} onOpenChange={() => setTutorialSelecionado(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {!tutorialDetalhado && (
            <VisuallyHidden>
              <DialogTitle>Tutorial</DialogTitle>
              <DialogDescription>Carregando tutorial...</DialogDescription>
            </VisuallyHidden>
          )}
          {tutorialDetalhado && (() => {
            const stats = getEstatisticas(tutorialDetalhado.id);
            const meuFeedback = getMeuFeedback(tutorialDetalhado.id);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{tutorialDetalhado.titulo}</DialogTitle>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge className={getNivelColor(tutorialDetalhado.nivel)}>
                      {NIVEIS_NOMES[tutorialDetalhado.nivel]}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {tutorialDetalhado.tempoLeitura} min de leitura
                    </Badge>
                    <Badge variant="secondary">
                      {CATEGORIAS_NOMES[tutorialDetalhado.categoria]}
                    </Badge>
                  </div>
                </DialogHeader>

                {/* Vídeo do YouTube (se disponível) */}
                {tutorialDetalhado.videoId && (
                  <div className="mt-4 mb-6">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${tutorialDetalhado.videoId}`}
                        title={tutorialDetalhado.titulo}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}

                {/* Conteúdo do Tutorial */}
                <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
                  <Streamdown>{tutorialDetalhado.conteudo}</Streamdown>
                </div>

                {/* Tags */}
                {tutorialDetalhado.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-medium mb-2">Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {tutorialDetalhado.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de Feedback */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Este tutorial foi útil para você?
                    </p>
                    <div className="flex items-center gap-4">
                      <Button
                        variant={meuFeedback === true ? "default" : "outline"}
                        size="sm"
                        className={`gap-2 ${meuFeedback === true ? "bg-green-600 hover:bg-green-700" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeedback(tutorialDetalhado.id, true);
                        }}
                        disabled={feedbackMutation.isPending}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Útil
                        {stats && stats.totalUtil > 0 && (
                          <span className="ml-1 text-xs opacity-80">({stats.totalUtil})</span>
                        )}
                      </Button>
                      <Button
                        variant={meuFeedback === false ? "default" : "outline"}
                        size="sm"
                        className={`gap-2 ${meuFeedback === false ? "bg-red-600 hover:bg-red-700" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeedback(tutorialDetalhado.id, false);
                        }}
                        disabled={feedbackMutation.isPending}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Não útil
                        {stats && stats.totalNaoUtil > 0 && (
                          <span className="ml-1 text-xs opacity-80">({stats.totalNaoUtil})</span>
                        )}
                      </Button>
                    </div>
                    {meuFeedback !== null && (
                      <p className="text-xs text-muted-foreground">
                        {meuFeedback
                          ? "Obrigado! Você marcou este tutorial como útil."
                          : "Obrigado pelo feedback! Vamos melhorar este conteúdo."}
                      </p>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6 mt-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Scale className="w-5 h-5 text-primary" />
              <span className="text-sm">© 2025 {APP_TITLE}. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              <a href="mailto:contato@promptjur.com" className="hover:text-foreground transition-colors">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
