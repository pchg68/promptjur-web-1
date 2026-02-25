import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, BookOpen, Clock, Tag, X } from "lucide-react";
import { Streamdown } from "streamdown";
import { CATEGORIAS_NOMES, CATEGORIAS_DESCRICOES, NIVEIS_NOMES, type CategoriaTutorial, type NivelTutorial } from "@shared/tutoriais";

export default function TabTutoriais() {
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaTutorial | "todas">("todas");
  const [nivelFiltro, setNivelFiltro] = useState<NivelTutorial | "todos">("todos");
  const [tutorialSelecionado, setTutorialSelecionado] = useState<string | null>(null);

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
          {tutoriais.map((tutorial) => (
            <Card
              key={tutorial.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setTutorialSelecionado(tutorial.id)}
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
                  <Badge className={getNivelColor(tutorial.nivel)}>
                    {NIVEIS_NOMES[tutorial.nivel]}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {tutorial.tempoLeitura} min
                  </Badge>
                </div>

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
          ))}
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
          {tutorialDetalhado && (
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
