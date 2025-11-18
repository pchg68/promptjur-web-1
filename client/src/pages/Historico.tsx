import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO, APP_TITLE, AREAS_JURIDICAS, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, FileText, Filter, Heart, Loader2, Search, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Historico() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroArea, setFiltroArea] = useState<string>("todas");
  const [filtroFavoritos, setFiltroFavoritos] = useState(false);

  // Queries
  const { data: prompts, isLoading: promptsLoading } = trpc.historico.prompts.useQuery(
    {
      tipo: filtroTipo !== "todos" ? (filtroTipo as any) : undefined,
      area: filtroArea !== "todas" ? filtroArea : undefined,
      favoritos: filtroFavoritos || undefined,
      limit: 100
    },
    { enabled: isAuthenticated }
  );

  const { data: historico, isLoading: historicoLoading } = trpc.historico.listar.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  const toggleFavoritoMutation = trpc.prompts.toggleFavorito.useMutation({
    onSuccess: () => {
      // Invalidar queries para atualizar a lista
      trpc.useUtils().historico.prompts.invalidate();
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para acessar o histórico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Voltar para Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'analise': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'geracao': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'otimizacao': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getAcaoBadgeColor = (acao: string) => {
    switch (acao) {
      case 'analise': return 'bg-blue-500/20 text-blue-400';
      case 'geracao': return 'bg-green-500/20 text-green-400';
      case 'otimizacao': return 'bg-purple-500/20 text-purple-400';
      case 'verificacao': return 'bg-gold/20 text-gold';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-navy-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gold">Histórico</h1>
                <p className="text-sm text-gray-400">Visualize e gerencie seus prompts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{user?.name}</span>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="prompts">
              <FileText className="h-4 w-4 mr-2" />
              Prompts Salvos
            </TabsTrigger>
            <TabsTrigger value="atividades">
              <Calendar className="h-4 w-4 mr-2" />
              Atividades
            </TabsTrigger>
          </TabsList>

          {/* Tab: Prompts Salvos */}
          <TabsContent value="prompts" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="analise">Análise</SelectItem>
                        <SelectItem value="geracao">Geração</SelectItem>
                        <SelectItem value="otimizacao">Otimização</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Área Jurídica</label>
                    <Select value={filtroArea} onValueChange={setFiltroArea}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        {AREAS_JURIDICAS.map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant={filtroFavoritos ? "default" : "outline"}
                      onClick={() => setFiltroFavoritos(!filtroFavoritos)}
                      className="w-full"
                    >
                      <Heart className={`h-4 w-4 mr-2 ${filtroFavoritos ? 'fill-current' : ''}`} />
                      Favoritos
                    </Button>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFiltroTipo("todos");
                        setFiltroArea("todas");
                        setFiltroFavoritos(false);
                      }}
                      className="w-full"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Prompts */}
            {promptsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            ) : prompts && prompts.length > 0 ? (
              <div className="grid gap-4">
                {prompts.map((prompt) => (
                  <Card key={prompt.id} className="hover:border-gold/30 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getTipoBadgeColor(prompt.tipo)}>
                              {prompt.tipo === 'analise' ? 'Análise' : 
                               prompt.tipo === 'geracao' ? 'Geração' : 'Otimização'}
                            </Badge>
                            {prompt.areaJuridica && (
                              <Badge variant="outline">{prompt.areaJuridica}</Badge>
                            )}
                            {prompt.qualidade && (
                              <Badge variant="outline" className={
                                prompt.qualidade === 'excelente' ? 'border-green-500/50 text-green-400' :
                                prompt.qualidade === 'bom' ? 'border-yellow-500/50 text-yellow-400' :
                                'border-red-500/50 text-red-400'
                              }>
                                {prompt.qualidade === 'excelente' ? 'Excelente' :
                                 prompt.qualidade === 'bom' ? 'Bom' : 'Ruim'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {formatDate(prompt.createdAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavoritoMutation.mutate({
                            promptId: prompt.id,
                            isFavorito: !prompt.isFavorito
                          })}
                        >
                          <Heart className={`h-5 w-5 ${prompt.isFavorito ? 'fill-gold text-gold' : 'text-gray-400'}`} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Prompt Original:</h4>
                        <p className="text-sm line-clamp-2">{prompt.promptOriginal}</p>
                      </div>
                      {prompt.promptOtimizado && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Prompt Otimizado:</h4>
                          <p className="text-sm line-clamp-2 text-green-400">{prompt.promptOtimizado}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                        <Button size="sm" variant="outline">
                          Reutilizar
                        </Button>
                        <Button size="sm" variant="outline">
                          Salvar como Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">Nenhum prompt encontrado com os filtros selecionados.</p>
                  <Button asChild>
                    <Link href="/dashboard">Criar Novo Prompt</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Atividades */}
          <TabsContent value="atividades" className="space-y-4">
            {historicoLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            ) : historico && historico.length > 0 ? (
              <div className="space-y-3">
                {historico.map((item) => (
                  <Card key={item.id} className="hover:border-gold/30 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge className={getAcaoBadgeColor(item.acao)}>
                            {item.acao === 'analise' ? 'Análise' :
                             item.acao === 'geracao' ? 'Geração' :
                             item.acao === 'otimizacao' ? 'Otimização' : 'Verificação'}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">
                              {item.sucesso ? 'Concluído com sucesso' : 'Falhou'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(item.createdAt)}
                              {item.duracaoMs && ` • ${(item.duracaoMs / 1000).toFixed(2)}s`}
                            </p>
                          </div>
                        </div>
                        {!item.sucesso && item.mensagemErro && (
                          <Badge variant="destructive">Erro</Badge>
                        )}
                      </div>
                      {!item.sucesso && item.mensagemErro && (
                        <p className="text-xs text-red-400 mt-2">{item.mensagemErro}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Nenhuma atividade registrada ainda.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
