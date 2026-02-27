import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Search, BookOpen, Clock, Tag, X, ThumbsUp, ThumbsDown, Play } from "lucide-react";
import { Streamdown } from "streamdown";
import { CATEGORIAS_NOMES, CATEGORIAS_DESCRICOES, NIVEIS_NOMES, type CategoriaTutorial, type NivelTutorial } from "@shared/tutoriais";
import { toast } from "sonner";

export default function TabTutoriais() {
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaTutorial | "todas">("todas");
  const [nivelFiltro, setNivelFiltro] = useState<NivelTutorial | "todos">("todos");
  const [tutorialSelecionado, setTutorialSelecionado] = useState<string | null>(null);

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

  // Verificar feedback do usuário para um tutorial
  const getMeuFeedback = (tutorialId: string): boolean | null => {
    if (!meusFeedbacks) return null;
    const feedback = meusFeedbacks.find(f => f.tutorialId === tutorialId);
    return feedback ? feedback.util : null;
  };

  // Obter estatísticas de feedback para um tutorial
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tutoriais</h2>
        <p className="text-muted-foreground mt-2">
          Aprenda a usar o PromptJur com nossos tutoriais organizados por categoria e nível
        </p>
      </div>

      {/* Barra de Progresso */}
      {progresso && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Seu Progresso</CardTitle>
                <CardDescription>
                  {progresso.totalConcluidos} de {progresso.totalTutoriais} tutoriais concluídos
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {progresso.percentualConcluido}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${progresso.percentualConcluido}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de Busca e Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por palavras-chave..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Categoria */}
            <Select
              value={categoriaFiltro}
              onValueChange={(value) => setCategoriaFiltro(value as CategoriaTutorial | "todas")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {Object.entries(CATEGORIAS_NOMES).map(([key, nome]) => (
                  <SelectItem key={key} value={key}>
                    {nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Nível */}
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

            {/* Botão Limpar Filtros */}
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

      {/* Lista de Tutoriais */}
      {!isLoading && tutoriais && tutoriais.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tutoriais.map((tutorial) => {
            const stats = getEstatisticas(tutorial.id);
            const meuFeedback = getMeuFeedback(tutorial.id);
            
            return (
              <Card
                key={tutorial.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
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
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {/* Badge Concluído */}
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
                    {/* Badge de vídeo disponível */}
                    {tutorial.videoId && (
                      <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
                        <Play className="h-3 w-3" />
                        Vídeo
                      </Badge>
                    )}
                  </div>

                  {/* Feedback resumido no card */}
                  {stats && stats.total > 0 && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-green-600" />
                        {stats.totalUtil}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3 text-red-500" />
                        {stats.totalNaoUtil}
                      </span>
                      {meuFeedback !== null && (
                        <Badge variant="outline" className="text-xs py-0 px-1.5">
                          {meuFeedback ? "Você achou útil" : "Você achou não útil"}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Tags */}
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
      {!isLoading && tutoriais && tutoriais.length === 0 && (
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
    </div>
  );
}
