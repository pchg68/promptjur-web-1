import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Scale, History as HistoryIcon, Home, BookTemplate, Filter, X, Eye, Copy, Search,
  Star, RotateCcw, Trash2, ArrowLeft, FileDown, Loader2, BarChart3, Clock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Sparkles, Zap, Shield, FileText, PlayCircle, Download, TrendingUp,
  Activity, Target, Calendar, Bot, RefreshCw, AlertTriangle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { AREAS_JURIDICAS } from "@/const";
import { Streamdown } from "streamdown";
import DashboardHeader2 from "@/components/DashboardHeader2";

// Mapeamento de ações para labels e ícones
const ACOES_MAP: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  analise: { label: "Análise", icon: Search, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30" },
  geracao: { label: "Geração", icon: Sparkles, color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/30" },
  otimizacao: { label: "Otimização", icon: Zap, color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/30" },
  verificacao: { label: "Verificação", icon: Shield, color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/30" },
  execucao_prompt: { label: "Execução IA", icon: PlayCircle, color: "text-cyan-400", bgColor: "bg-cyan-500/10 border-cyan-500/30" },
  exportacao_docx: { label: "Export DOCX", icon: FileDown, color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/30" },
  exportacao_pdf: { label: "Export PDF", icon: FileText, color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/30" },
};

export default function Historico() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Compact mode (shared with Dashboard)
  const [isCompactMode, setIsCompactMode] = useState(() => {
    const saved = localStorage.getItem('promptjur-compact-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const toggleCompactMode = () => {
    const newMode = !isCompactMode;
    setIsCompactMode(newMode);
    localStorage.setItem('promptjur-compact-mode', JSON.stringify(newMode));
  };

  // Filtros
  const [filtroAcao, setFiltroAcao] = useState<string>("todas");
  const [filtroArea, setFiltroArea] = useState<string>("todas");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [page, setPage] = useState(0);
  const limite = 20;

  // Dialog de detalhes
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Calcular datas de filtro
  const dataFiltros = useMemo(() => {
    const now = new Date();
    let dataInicio: Date | undefined;
    let dataFim: Date | undefined;

    switch (filtroPeriodo) {
      case "hoje":
        dataInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "semana":
        dataInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "mes":
        dataInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "trimestre":
        dataInicio = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    return { dataInicio, dataFim };
  }, [filtroPeriodo]);

  // Queries
  const statsQuery = trpc.historico.stats.useQuery();
  const unificadoQuery = trpc.historico.unificado.useQuery({
    acao: filtroAcao !== "todas" ? filtroAcao : undefined,
    area: filtroArea !== "todas" ? filtroArea : undefined,
    texto: filtroTexto || undefined,
    dataInicio: dataFiltros.dataInicio,
    dataFim: dataFiltros.dataFim,
    limite,
    offset: page * limite,
  });

  const atividadeQuery = trpc.historico.atividadePorDia.useQuery({ dias: 30 });

  const detalhesQuery = trpc.historico.detalhes.useQuery(
    { id: selectedItemId! },
    { enabled: selectedItemId !== null }
  );

  // Mutations
  const excluirMutation = trpc.historico.excluir.useMutation({
    onSuccess: () => {
      unificadoQuery.refetch();
      statsQuery.refetch();
      toast.success("Item excluído do histórico");
    },
    onError: (err) => toast.error("Erro ao excluir: " + err.message),
  });

  // Handlers
  const handleExcluir = useCallback((id: number) => {
    if (confirm("Tem certeza que deseja excluir este item do histórico?")) {
      excluirMutation.mutate({ id });
    }
  }, [excluirMutation]);

  const handleReutilizar = useCallback((item: any) => {
    if (item.promptId) {
      setLocation(`/dashboard?prompt=${item.promptId}`);
    } else {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltroAcao("todas");
    setFiltroArea("todas");
    setFiltroTexto("");
    setFiltroPeriodo("todos");
    setPage(0);
  }, []);

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(date));
  };

  const formatRelativeDate = (date: string | Date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Agora mesmo";
    if (mins < 60) return `Há ${mins} min`;
    if (hours < 24) return `Há ${hours}h`;
    if (days < 7) return `Há ${days} dia${days > 1 ? 's' : ''}`;
    return formatDate(date);
  };

  const stats = statsQuery.data;
  const items = unificadoQuery.data?.items || [];
  const totalItems = unificadoQuery.data?.total || 0;
  const totalPages = Math.ceil(totalItems / limite);
  const hasActiveFilters = filtroAcao !== "todas" || filtroArea !== "todas" || filtroTexto !== "" || filtroPeriodo !== "todos";

  // Atividade para sparkline
  const atividadeDados = atividadeQuery.data || [];
  const maxAtividade = Math.max(...atividadeDados.map(d => d.total || 0), 1);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader2 isCompactMode={isCompactMode} toggleCompactMode={toggleCompactMode} />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Título da Página */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-sm bg-primary/10">
              <HistoryIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Painel de Controle</h1>
              <p className="text-sm text-muted-foreground">
                Histórico completo de prompts, documentos e execuções
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            icon={Activity}
            label="Total de Ações"
            value={stats?.totalAcoes || 0}
            color="text-primary"
            loading={statsQuery.isLoading}
          />
          <StatsCard
            icon={FileText}
            label="Prompts Salvos"
            value={stats?.totalPrompts || 0}
            color="text-blue-400"
            loading={statsQuery.isLoading}
          />
          <StatsCard
            icon={Star}
            label="Favoritos"
            value={stats?.totalFavoritos || 0}
            color="text-yellow-400"
            loading={statsQuery.isLoading}
          />
          <StatsCard
            icon={CheckCircle2}
            label="Taxa de Sucesso"
            value={`${stats?.taxaSucesso || 0}%`}
            color="text-emerald-400"
            loading={statsQuery.isLoading}
          />
          <StatsCard
            icon={Clock}
            label="Tempo Médio"
            value={stats?.tempoMedio ? `${(stats.tempoMedio / 1000).toFixed(1)}s` : "0s"}
            color="text-cyan-400"
            loading={statsQuery.isLoading}
          />
          <StatsCard
            icon={Target}
            label="Áreas Jurídicas"
            value={stats?.porArea ? Object.keys(stats.porArea).length : 0}
            color="text-purple-400"
            loading={statsQuery.isLoading}
          />
        </div>

        {/* Gráfico de Atividade (Sparkline) */}
        {atividadeDados.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Atividade dos Últimos 30 Dias</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground">
                  {atividadeDados.reduce((acc, d) => acc + (d.total || 0), 0)} ações no período
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-[2px] h-16">
                {atividadeDados.map((d, i) => {
                  const height = Math.max(2, (d.total / maxAtividade) * 56);
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/60 hover:bg-primary transition-colors rounded-t-[1px] cursor-pointer group relative"
                      style={{ height: `${height}px` }}
                      title={`${d.date}: ${d.total} ações`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                        <div className="bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap border border-border">
                          {d.date}: {d.total}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{atividadeDados[0]?.date}</span>
                <span className="text-[10px] text-muted-foreground">{atividadeDados[atividadeDados.length - 1]?.date}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribuição por Ação */}
        {stats?.porAcao && Object.keys(stats.porAcao).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            {Object.entries(stats.porAcao)
              .sort(([, a], [, b]) => b - a)
              .map(([acao, count]) => {
                const info = ACOES_MAP[acao] || { label: acao, icon: Activity, color: "text-muted-foreground", bgColor: "bg-muted/50 border-border" };
                const Icon = info.icon;
                return (
                  <button
                    key={acao}
                    onClick={() => { setFiltroAcao(acao); setPage(0); }}
                    className={`flex items-center gap-2 p-3 rounded-sm border transition-all hover:scale-[1.02] ${
                      filtroAcao === acao ? "ring-1 ring-primary " + info.bgColor : "bg-card border-border hover:border-primary/30"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${info.color}`} />
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">{info.label}</p>
                      <p className="text-lg font-bold text-foreground">{count}</p>
                    </div>
                  </button>
                );
              })}
          </div>
        )}

        {/* Filtros Avançados */}
        <Card className="mb-6">
          <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Filtros Avançados</CardTitle>
                    {hasActiveFilters && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                        {[filtroAcao !== "todas" && "Ação", filtroArea !== "todas" && "Área", filtroTexto && "Texto", filtroPeriodo !== "todos" && "Período"].filter(Boolean).join(", ")}
                      </Badge>
                    )}
                  </div>
                  {filtrosAbertos ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Busca Textual */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Buscar no conteúdo</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar prompts..."
                        value={filtroTexto}
                        onChange={(e) => { setFiltroTexto(e.target.value); setPage(0); }}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Filtro por Ação */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo de Ação</label>
                    <Select value={filtroAcao} onValueChange={(v) => { setFiltroAcao(v); setPage(0); }}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as ações</SelectItem>
                        {Object.entries(ACOES_MAP).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <info.icon className={`w-3 h-3 ${info.color}`} />
                              {info.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Área */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Área Jurídica</label>
                    <Select value={filtroArea} onValueChange={(v) => { setFiltroArea(v); setPage(0); }}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as áreas</SelectItem>
                        {AREAS_JURIDICAS.map((area) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Período */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Período</label>
                    <Select value={filtroPeriodo} onValueChange={(v) => { setFiltroPeriodo(v); setPage(0); }}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todo o período</SelectItem>
                        <SelectItem value="hoje">Hoje</SelectItem>
                        <SelectItem value="semana">Última semana</SelectItem>
                        <SelectItem value="mes">Último mês</SelectItem>
                        <SelectItem value="trimestre">Último trimestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={limparFiltros} className="text-xs">
                      <X className="w-3 h-3 mr-1" />
                      Limpar Filtros
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {totalItems} resultado{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Timeline de Atividades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-medium">
                  Histórico de Atividades
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {totalItems} registro{totalItems !== 1 ? 's' : ''}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { unificadoQuery.refetch(); statsQuery.refetch(); }}
                disabled={unificadoQuery.isFetching}
                className="text-xs"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${unificadoQuery.isFetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {unificadoQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando histórico...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="p-4 rounded-full bg-muted/50">
                  <HistoryIcon className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum registro encontrado</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {hasActiveFilters
                      ? "Tente ajustar os filtros para ver mais resultados."
                      : "Comece a usar o PromptJur para ver seu histórico de atividades aqui."}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={limparFiltros} className="mt-4">
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item: any) => (
                  <HistoricoItem
                    key={item.id}
                    item={item}
                    isExpanded={expandedItems.has(item.id)}
                    onToggleExpand={() => toggleExpand(item.id)}
                    onViewDetails={() => setSelectedItemId(item.id)}
                    onReutilizar={() => handleReutilizar(item)}
                    onExcluir={() => handleExcluir(item.id)}
                    onCopy={copyToClipboard}
                    formatDate={formatDate}
                    formatRelativeDate={formatRelativeDate}
                  />
                ))}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="text-xs"
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    Anterior
                  </Button>
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (page < 3) {
                        pageNum = i;
                      } else if (page > totalPages - 4) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-8 h-8 p-0 text-xs"
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="text-xs"
                  >
                    Próxima
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog de Detalhes Completos */}
      <Dialog open={selectedItemId !== null} onOpenChange={() => setSelectedItemId(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {detalhesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : detalhesQuery.data ? (
            <DetalhesModal
              data={detalhesQuery.data}
              formatDate={formatDate}
              onCopy={copyToClipboard}
              onReutilizar={() => {
                if (detalhesQuery.data?.promptId) {
                  setLocation(`/dashboard?prompt=${detalhesQuery.data.promptId}`);
                }
                setSelectedItemId(null);
              }}
              onClose={() => setSelectedItemId(null)}
            />
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Detalhes não encontrados</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Componente: Card de Estatística =====
function StatsCard({ icon: Icon, label, value, color, loading }: {
  icon: any; label: string; value: string | number; color: string; loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-12">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className={`p-1.5 rounded-sm bg-muted/50`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Componente: Item do Histórico =====
function HistoricoItem({ item, isExpanded, onToggleExpand, onViewDetails, onReutilizar, onExcluir, onCopy, formatDate, formatRelativeDate }: {
  item: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  onReutilizar: () => void;
  onExcluir: () => void;
  onCopy: (text: string) => void;
  formatDate: (d: string | Date) => string;
  formatRelativeDate: (d: string | Date) => string;
}) {
  const info = ACOES_MAP[item.acao] || { label: item.acao, icon: Activity, color: "text-muted-foreground", bgColor: "bg-muted/50 border-border" };
  const Icon = info.icon;

  const previewText = item.prompt?.promptOriginal || item.prompt?.promptOtimizado || "";
  const detalhes = item.detalhes as any;
  const modelo = detalhes?.modelo || detalhes?.model || detalhes?.modeloId || null;

  return (
    <div className={`border rounded-sm transition-all ${isExpanded ? 'border-primary/30 bg-card/80' : 'border-border hover:border-primary/20'}`}>
      {/* Linha Principal */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Ícone de Ação */}
        <div className={`p-1.5 rounded-sm shrink-0 ${info.bgColor} border`}>
          <Icon className={`w-3.5 h-3.5 ${info.color}`} />
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Badge variant="outline" className={`text-[10px] ${info.bgColor} ${info.color}`}>
              {info.label}
            </Badge>
            {item.prompt?.areaJuridica && (
              <Badge variant="outline" className="text-[10px]">
                {item.prompt.areaJuridica}
              </Badge>
            )}
            {item.prompt?.qualidade && (
              <Badge variant="outline" className={`text-[10px] ${
                item.prompt.qualidade === "excelente" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                item.prompt.qualidade === "bom" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                "bg-red-500/10 text-red-400 border-red-500/30"
              }`}>
                {item.prompt.qualidade}
              </Badge>
            )}
            {item.prompt?.isFavorito && (
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            )}
            {modelo && (
              <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                <Bot className="w-2.5 h-2.5 mr-0.5" />
                {modelo}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate max-w-2xl">
            {previewText || (detalhes ? JSON.stringify(detalhes).substring(0, 100) : "Sem detalhes")}
          </p>
        </div>

        {/* Metadados */}
        <div className="flex items-center gap-3 shrink-0">
          {item.duracaoMs && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.duracaoMs > 1000 ? `${(item.duracaoMs / 1000).toFixed(1)}s` : `${item.duracaoMs}ms`}
            </span>
          )}
          <span className={`flex items-center gap-1 ${item.sucesso ? 'text-emerald-400' : 'text-red-400'}`}>
            {item.sucesso ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatRelativeDate(item.createdAt)}
          </span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border/50">
          {/* Preview do Prompt */}
          {previewText && (
            <div className="mt-3 p-3 bg-muted/30 rounded-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Preview do Prompt</p>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-6">
                {previewText}
              </p>
            </div>
          )}

          {/* Detalhes JSON (se houver) */}
          {detalhes && Object.keys(detalhes).length > 0 && (
            <div className="mt-2 p-3 bg-muted/20 rounded-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Detalhes da Operação</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(detalhes).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-muted-foreground">{key}: </span>
                    <span className="text-foreground">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Erro (se houver) */}
          {item.mensagemErro && (
            <div className="mt-2 p-3 bg-red-500/5 border border-red-500/20 rounded-sm">
              <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Erro</p>
              <p className="text-xs text-red-300">{item.mensagemErro}</p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetails} className="text-xs h-7">
              <Eye className="w-3 h-3 mr-1" />
              Ver Completo
            </Button>
            {item.promptId && (
              <Button variant="outline" size="sm" onClick={onReutilizar} className="text-xs h-7">
                <RotateCcw className="w-3 h-3 mr-1" />
                Reutilizar
              </Button>
            )}
            {previewText && (
              <Button variant="outline" size="sm" onClick={() => onCopy(previewText)} className="text-xs h-7">
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={onExcluir} className="text-xs h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <Trash2 className="w-3 h-3 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Componente: Modal de Detalhes =====
function DetalhesModal({ data, formatDate, onCopy, onReutilizar, onClose }: {
  data: any;
  formatDate: (d: string | Date) => string;
  onCopy: (text: string) => void;
  onReutilizar: () => void;
  onClose: () => void;
}) {
  const info = ACOES_MAP[data.acao] || { label: data.acao, icon: Activity, color: "text-muted-foreground", bgColor: "bg-muted/50 border-border" };
  const Icon = info.icon;
  const detalhes = data.detalhes as any;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <div className={`p-2 rounded-sm ${info.bgColor} border`}>
            <Icon className={`w-5 h-5 ${info.color}`} />
          </div>
          <div>
            <span className="text-lg">{info.label}</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              {formatDate(data.createdAt)}
            </p>
          </div>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 mt-4">
        {/* Metadados */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/30 rounded-sm">
            <p className="text-[10px] text-muted-foreground uppercase">Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              {data.sucesso ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm text-emerald-400">Sucesso</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-red-400" /><span className="text-sm text-red-400">Erro</span></>
              )}
            </div>
          </div>
          {data.duracaoMs && (
            <div className="p-3 bg-muted/30 rounded-sm">
              <p className="text-[10px] text-muted-foreground uppercase">Duração</p>
              <p className="text-sm font-medium mt-1">
                {data.duracaoMs > 1000 ? `${(data.duracaoMs / 1000).toFixed(2)}s` : `${data.duracaoMs}ms`}
              </p>
            </div>
          )}
          {data.prompt?.areaJuridica && (
            <div className="p-3 bg-muted/30 rounded-sm">
              <p className="text-[10px] text-muted-foreground uppercase">Área Jurídica</p>
              <p className="text-sm font-medium mt-1">{data.prompt.areaJuridica}</p>
            </div>
          )}
          {data.prompt?.qualidade && (
            <div className="p-3 bg-muted/30 rounded-sm">
              <p className="text-[10px] text-muted-foreground uppercase">Qualidade</p>
              <Badge variant="outline" className={`mt-1 ${
                data.prompt.qualidade === "excelente" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                data.prompt.qualidade === "bom" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                "bg-red-500/10 text-red-400 border-red-500/30"
              }`}>
                {data.prompt.qualidade}
              </Badge>
            </div>
          )}
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map((tag: any) => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.cor, color: tag.cor }} className="text-[10px]">
                  {tag.nome}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Original */}
        {data.prompt?.promptOriginal && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt Original</p>
              <Button variant="ghost" size="sm" onClick={() => onCopy(data.prompt.promptOriginal)} className="text-[10px] h-6">
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
            </div>
            <div className="p-4 bg-muted/20 rounded-sm border border-border max-h-60 overflow-y-auto">
              <Streamdown>{data.prompt.promptOriginal}</Streamdown>
            </div>
          </div>
        )}

        {/* Prompt Otimizado */}
        {data.prompt?.promptOtimizado && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resultado / Prompt Otimizado</p>
              <Button variant="ghost" size="sm" onClick={() => onCopy(data.prompt.promptOtimizado)} className="text-[10px] h-6">
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
            </div>
            <div className="p-4 bg-muted/20 rounded-sm border border-primary/20 max-h-60 overflow-y-auto">
              <Streamdown>{data.prompt.promptOtimizado}</Streamdown>
            </div>
          </div>
        )}

        {/* Detalhes da Operação */}
        {detalhes && Object.keys(detalhes).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Detalhes da Operação</p>
            <div className="p-4 bg-muted/20 rounded-sm border border-border">
              <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80">
                {JSON.stringify(detalhes, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Erro */}
        {data.mensagemErro && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-sm">
            <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1">Mensagem de Erro</p>
            <p className="text-sm text-red-300">{data.mensagemErro}</p>
          </div>
        )}
      </div>

      <DialogFooter className="mt-6">
        {data.promptId && (
          <Button variant="default" onClick={onReutilizar} className="text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Reutilizar no Dashboard
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="text-xs">
          Fechar
        </Button>
      </DialogFooter>
    </>
  );
}
