import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scale, History as HistoryIcon, Home, BookTemplate, Filter, X, Eye, Copy, Search, Star, RotateCcw, Trash2, FileDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { AREAS_JURIDICAS } from "@/const";
import { AdvancedSearch, type SearchFilters } from "@/components/AdvancedSearch";

export default function Historico() {
  const { user } = useAuth();
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [page, setPage] = useState(0);
  const limite = 20;

  // Query de busca avançada
  const searchQuery = trpc.prompts.search.useQuery({
    ...searchFilters,
    limite,
    offset: page * limite,
  });

  // Query de histórico (fallback)
  const historicoQuery = trpc.historico.listar.useQuery({ limit: 100 });

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setPage(0); // Reset para primeira página
  };

  const prompts = searchQuery.data?.results || [];
  const totalResults = searchQuery.data?.total || 0;
  const totalPages = Math.ceil(totalResults / limite);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'analise':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">Análise</Badge>;
      case 'geracao':
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Geração</Badge>;
      case 'otimizacao':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">Otimização</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Prompt copiado para a área de transferência!");
  };

  // Mutation para favoritar
  const favoritarMutation = trpc.prompts.favoritar.useMutation({
    onSuccess: () => {
      searchQuery.refetch();
      toast.success("Favorito atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar favorito");
    }
  });

  // Mutation para excluir
  const excluirMutation = trpc.prompts.excluir.useMutation({
    onSuccess: () => {
      searchQuery.refetch();
      toast.success("Prompt excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir prompt");
    }
  });

  const handleFavoritar = (id: number, isFavorito: boolean) => {
    favoritarMutation.mutate({ id, favorito: !isFavorito });
  };

  const handleReutilizar = (prompt: any) => {
    // Redirecionar para dashboard com prompt carregado
    window.location.href = `/dashboard?prompt=${prompt.id}`;
  };

  const handleExcluir = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este prompt?")) {
      excluirMutation.mutate({ id });
    }
  };

  const exportarPDFMutation = trpc.prompts.exportarPDF.useMutation({
    onSuccess: (data) => {
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(data.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF exportado com sucesso!', {
        description: `Arquivo ${data.filename} baixado`
      });
    },
    onError: (error) => {
      toast.error('Erro ao exportar PDF', {
        description: error.message
      });
    }
  });

  const handleExportarPDF = (promptId: number) => {
    exportarPDFMutation.mutate({ promptId });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">PromptJur</h1>
                <p className="text-xs text-muted-foreground">Histórico</p>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              <Link href="/" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <Home className="w-4 h-4" />
                Início
              </Link>
              <Link href="/dashboard" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/templates" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <BookTemplate className="w-4 h-4" />
                Templates
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Olá, {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HistoryIcon className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Histórico de Atividades</h2>
          </div>
          <p className="text-muted-foreground">
            Visualize todas as suas análises, gerações e otimizações de prompts
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtre o histórico por tipo de ação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Busca Avançada */}
            <AdvancedSearch onSearch={handleSearch} />
          </CardContent>
        </Card>

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Prompts Encontrados ({totalResults})</CardTitle>
            <CardDescription>
              {searchQuery.isLoading
                ? "Carregando..."
                : prompts.length === 0
                ? "Nenhum prompt encontrado com os filtros selecionados"
                : `Exibindo ${prompts.length} de ${totalResults} resultados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchQuery.isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando prompts...</p>
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-12">
                <HistoryIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum prompt encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Tente ajustar os filtros para ver mais resultados.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>

                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prompts.map((prompt) => (
                      <TableRow key={prompt.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {formatDate(prompt.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prompt.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prompt.areaJuridica || "N/A"}</Badge>
                        </TableCell>

                        <TableCell>
                          {prompt.qualidade === "excelente" ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                              Excelente
                            </Badge>
                          ) : prompt.qualidade === "bom" ? (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                              Bom
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                              Ruim
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Ver Detalhes */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPrompt(prompt)}
                              title="Ver detalhes completos"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {/* Copiar */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(prompt.promptOtimizado || prompt.promptOriginal || '')}
                              title="Copiar prompt"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            
                            {/* Favoritar */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFavoritar(prompt.id, prompt.favorito)}
                              title={prompt.favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                              className={prompt.favorito ? "text-yellow-500" : ""}
                            >
                              <Star className={`w-4 h-4 ${prompt.favorito ? 'fill-current' : ''}`} />
                            </Button>
                            
                            {/* Reutilizar */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReutilizar(prompt)}
                              title="Reutilizar no Dashboard"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            
                            {/* Exportar PDF */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportarPDF(prompt.id)}
                              title="Exportar como PDF"
                              className="text-blue-500 hover:text-blue-600"
                            >
                              <FileDown className="w-4 h-4" />
                            </Button>
                            
                            {/* Excluir */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExcluir(prompt.id)}
                              title="Excluir prompt"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog de Detalhes */}
      <Dialog open={selectedPrompt !== null} onOpenChange={() => setSelectedPrompt(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Detalhes do Registro
              {selectedPrompt && getTipoBadge(selectedPrompt.acao)}
            </DialogTitle>
            <DialogDescription>
              {selectedPrompt && formatDate(selectedPrompt.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedPrompt && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tipo de Ação</h4>
                {getTipoBadge(selectedPrompt.acao)}
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                {selectedPrompt.sucesso ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                    Sucesso
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                    Erro
                  </Badge>
                )}
              </div>

              {selectedPrompt.duracaoMs && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Duração</h4>
                  <p className="text-sm">{selectedPrompt.duracaoMs}ms</p>
                </div>
              )}

              {selectedPrompt.detalhes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Detalhes</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedPrompt.detalhes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedPrompt.mensagemErro && (
                <div>
                  <h4 className="text-sm font-medium text-destructive mb-2">Mensagem de Erro</h4>
                  <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg">
                    <p className="text-sm text-destructive">{selectedPrompt.mensagemErro}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
