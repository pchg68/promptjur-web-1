import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  History,
  ChevronDown,
  ChevronRight,
  GitCompare,
  FileText,
  Trash2,
  StickyNote,
  Clock,
  Loader2,
  Eye,
  ArrowLeftRight,
  Search,
  X,
  Filter,
  CalendarDays,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import LazyStreamdown from "@/components/LazyStreamdown";
import { AREAS_JURIDICAS } from "@shared/juridico";

const ESTRATEGIA_LABELS: Record<string, string> = {
  direct: "Resposta Direta",
  chain_of_thought: "Raciocínio Passo a Passo",
  knowledge_retrieval: "Recuperação de Conhecimento",
};

const TIPO_DOC_LABELS: Record<string, string> = {
  peticao: "Petição Inicial",
  contestacao: "Contestação",
  recurso: "Recurso",
  parecer: "Parecer Jurídico",
  contrato: "Contrato",
  memorando: "Memorando",
  procuracao: "Procuração",
  notificacao: "Notificação Extrajudicial",
};

type PeriodoFiltro = "todos" | "7dias" | "30dias" | "90dias";

const PERIODO_LABELS: Record<PeriodoFiltro, string> = {
  todos: "Todos os períodos",
  "7dias": "Últimos 7 dias",
  "30dias": "Últimos 30 dias",
  "90dias": "Últimos 90 dias",
};

interface HistoricoVersoesProps {
  /** Callback para carregar uma versão no editor */
  onCarregarVersao?: (versao: {
    documento: string;
    tipoDocumento: string;
    areaJuridica: string;
    estrategia: string;
    contexto: string;
  }) => void;
}

export default function HistoricoVersoes({ onCarregarVersao }: HistoricoVersoesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[number | null, number | null]>([null, null]);
  const [viewingVersionId, setViewingVersionId] = useState<number | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<string>("todos");
  const [filtroArea, setFiltroArea] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<PeriodoFiltro>("todos");
  const [showFilters, setShowFilters] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const gruposQuery = trpc.documentVersions.listarGrupos.useQuery(undefined, {
    enabled: isOpen,
  });

  const versoesQuery = trpc.documentVersions.listarVersoes.useQuery(
    { groupId: selectedGroupId! },
    { enabled: !!selectedGroupId }
  );

  // Mutations
  const atualizarNotasMutation = trpc.documentVersions.atualizarNotas.useMutation({
    onSuccess: () => {
      toast.success("Notas atualizadas");
      utils.documentVersions.listarVersoes.invalidate();
      setEditingNotesId(null);
    },
    onError: () => toast.error("Erro ao atualizar notas"),
  });

  const excluirVersaoMutation = trpc.documentVersions.excluirVersao.useMutation({
    onSuccess: () => {
      toast.success("Versão excluída");
      utils.documentVersions.listarVersoes.invalidate();
      utils.documentVersions.listarGrupos.invalidate();
    },
    onError: () => toast.error("Erro ao excluir versão"),
  });

  const excluirGrupoMutation = trpc.documentVersions.excluirGrupo.useMutation({
    onSuccess: () => {
      toast.success("Grupo excluído");
      utils.documentVersions.listarGrupos.invalidate();
      setSelectedGroupId(null);
    },
    onError: () => toast.error("Erro ao excluir grupo"),
  });

  // Verificar se há filtros ativos
  const hasActiveFilters = searchTerm !== "" || filtroTipoDoc !== "todos" || filtroArea !== "todos" || filtroPeriodo !== "todos";

  // Limpar todos os filtros
  const limparFiltros = () => {
    setSearchTerm("");
    setFiltroTipoDoc("todos");
    setFiltroArea("todos");
    setFiltroPeriodo("todos");
  };

  // Calcular data limite do período
  const getDataLimite = (periodo: PeriodoFiltro): Date | null => {
    if (periodo === "todos") return null;
    const now = new Date();
    const dias = periodo === "7dias" ? 7 : periodo === "30dias" ? 30 : 90;
    return new Date(now.getTime() - dias * 24 * 60 * 60 * 1000);
  };

  // Filtrar grupos
  const gruposFiltrados = useMemo(() => {
    if (!gruposQuery.data) return [];

    let filtered = [...gruposQuery.data];
    const dataLimite = getDataLimite(filtroPeriodo);

    filtered = filtered.filter((grupo) => {
      // Filtro de busca textual
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchTitulo = grupo.titulo?.toLowerCase().includes(term);
        const matchTipo = (TIPO_DOC_LABELS[grupo.tipoDocumento] || grupo.tipoDocumento).toLowerCase().includes(term);
        const matchArea = grupo.areaJuridica?.toLowerCase().includes(term);
        if (!matchTitulo && !matchTipo && !matchArea) return false;
      }

      // Filtro por tipo de documento
      if (filtroTipoDoc !== "todos" && grupo.tipoDocumento !== filtroTipoDoc) return false;

      // Filtro por área jurídica
      if (filtroArea !== "todos" && grupo.areaJuridica !== filtroArea) return false;

      // Filtro por período
      if (dataLimite && grupo.ultimaCriacao) {
        const dataCriacao = typeof grupo.ultimaCriacao === "string" ? new Date(grupo.ultimaCriacao) : grupo.ultimaCriacao;
        if (dataCriacao < dataLimite) return false;
      }

      return true;
    });

    return filtered;
  }, [gruposQuery.data, searchTerm, filtroTipoDoc, filtroArea, filtroPeriodo]);

  // Dados para comparação
  const versaoA = useMemo(() => {
    if (!compareVersions[0] || !versoesQuery.data) return null;
    return versoesQuery.data.find((v: any) => v.id === compareVersions[0]) ?? null;
  }, [compareVersions[0], versoesQuery.data]);

  const versaoB = useMemo(() => {
    if (!compareVersions[1] || !versoesQuery.data) return null;
    return versoesQuery.data.find((v: any) => v.id === compareVersions[1]) ?? null;
  }, [compareVersions[1], versoesQuery.data]);

  const versaoVisualizando = useMemo(() => {
    if (!viewingVersionId || !versoesQuery.data) return null;
    return versoesQuery.data.find((v: any) => v.id === viewingVersionId) ?? null;
  }, [viewingVersionId, versoesQuery.data]);

  const handleToggleCompare = (versionId: number) => {
    setCompareVersions((prev) => {
      if (prev[0] === versionId) return [null, prev[1]];
      if (prev[1] === versionId) return [prev[0], null];
      if (!prev[0]) return [versionId, prev[1]];
      if (!prev[1]) return [prev[0], versionId];
      return [versionId, prev[1]];
    });
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Tipos de documento disponíveis nos dados
  const tiposDocDisponiveis = useMemo<string[]>(() => {
    if (!gruposQuery.data) return [];
    const tipos = new Set<string>(gruposQuery.data.map((g: any) => g.tipoDocumento));
    return Array.from(tipos);
  }, [gruposQuery.data]);

  // Áreas jurídicas disponíveis nos dados
  const areasDisponiveis = useMemo(() => {
    if (!gruposQuery.data) return [];
    const areas = new Set(gruposQuery.data.map((g: any) => g.areaJuridica).filter(Boolean));
    return Array.from(areas) as string[];
  }, [gruposQuery.data]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-4 py-3 h-auto">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <span className="font-medium">Histórico de Versões</span>
            {gruposQuery.data && gruposQuery.data.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {gruposQuery.data.length} grupo{gruposQuery.data.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-1">
        <div className="space-y-3 pt-2">
          {gruposQuery.isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Barra de Busca e Filtros — visível quando há dados e não está dentro de um grupo */}
          {!selectedGroupId && gruposQuery.data && gruposQuery.data.length > 0 && (
            <div className="space-y-2 px-1">
              {/* Busca + botão filtros */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, tipo ou área..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filtros
                  {hasActiveFilters && !showFilters && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                      {[filtroTipoDoc !== "todos", filtroArea !== "todos", filtroPeriodo !== "todos"].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Painel de filtros expansível */}
              {showFilters && (
                <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Tipo de Documento */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Tipo de Documento
                      </label>
                      <Select value={filtroTipoDoc} onValueChange={setFiltroTipoDoc}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os tipos</SelectItem>
                          {tiposDocDisponiveis.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {TIPO_DOC_LABELS[tipo] || tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Área Jurídica */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Área Jurídica
                      </label>
                      <Select value={filtroArea} onValueChange={setFiltroArea}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todas as áreas</SelectItem>
                          {areasDisponiveis.map((area) => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Período */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> Período
                      </label>
                      <Select value={filtroPeriodo} onValueChange={(v) => setFiltroPeriodo(v as PeriodoFiltro)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PERIODO_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Limpar filtros */}
                  {hasActiveFilters && (
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-muted-foreground">
                        {gruposFiltrados.length} de {gruposQuery.data.length} grupo{gruposQuery.data.length !== 1 ? "s" : ""}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={limparFiltros}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Indicador de filtros ativos (quando o painel está fechado) */}
              {hasActiveFilters && !showFilters && (
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {gruposFiltrados.length} de {gruposQuery.data.length} grupo{gruposQuery.data.length !== 1 ? "s" : ""}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                    onClick={limparFiltros}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                </div>
              )}
            </div>
          )}

          {gruposQuery.data && gruposQuery.data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum documento salvo no histórico ainda. Gere um documento e ele será salvo automaticamente.
            </p>
          )}

          {/* Nenhum resultado com filtros */}
          {!selectedGroupId && gruposQuery.data && gruposQuery.data.length > 0 && gruposFiltrados.length === 0 && (
            <div className="text-center py-6 space-y-2">
              <Search className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm text-muted-foreground">
                Nenhum grupo encontrado com os filtros atuais.
              </p>
              <Button variant="outline" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </div>
          )}

          {/* Lista de Grupos */}
          {!selectedGroupId &&
            gruposFiltrados.map((grupo) => (
              <Card
                key={grupo.groupId}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedGroupId(grupo.groupId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">{grupo.titulo}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {TIPO_DOC_LABELS[grupo.tipoDocumento] || grupo.tipoDocumento}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {grupo.areaJuridica}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {grupo.ultimaCriacao ? formatDate(grupo.ultimaCriacao) : "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge className="text-xs">
                        {grupo.totalVersoes} versão{Number(grupo.totalVersoes) !== 1 ? "ões" : ""}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          {/* Versões de um grupo */}
          {selectedGroupId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedGroupId(null);
                    setCompareMode(false);
                    setCompareVersions([null, null]);
                  }}
                >
                  ← Voltar aos grupos
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant={compareMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCompareMode(!compareMode);
                      setCompareVersions([null, null]);
                    }}
                  >
                    <GitCompare className="w-4 h-4 mr-1" />
                    {compareMode ? "Cancelar" : "Comparar"}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Excluir grupo de versões</DialogTitle>
                        <DialogDescription>
                          Todas as versões deste grupo serão excluídas permanentemente. Esta ação não pode ser desfeita.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => excluirGrupoMutation.mutate({ groupId: selectedGroupId })}
                          disabled={excluirGrupoMutation.isPending}
                        >
                          {excluirGrupoMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                          )}
                          Excluir tudo
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {versoesQuery.isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Instrução do modo comparação */}
              {compareMode && (
                <p className="text-xs text-muted-foreground text-center bg-muted/30 rounded-lg py-2">
                  Selecione duas versões para comparar lado a lado
                </p>
              )}

              {versoesQuery.data?.map((versao: any) => {
                const isSelectedA = compareVersions[0] === versao.id;
                const isSelectedB = compareVersions[1] === versao.id;
                const isSelected = isSelectedA || isSelectedB;

                return (
                  <Card
                    key={versao.id}
                    className={`transition-colors ${
                      compareMode
                        ? isSelected
                          ? "border-primary ring-1 ring-primary/30"
                          : "cursor-pointer hover:border-primary/50"
                        : ""
                    }`}
                    onClick={compareMode ? () => handleToggleCompare(versao.id) : undefined}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              v{versao.versao}
                            </Badge>
                            <span className="text-sm font-medium">
                              {ESTRATEGIA_LABELS[versao.estrategia] || versao.estrategia}
                            </span>
                            {isSelectedA && <Badge className="text-[10px]">A</Badge>}
                            {isSelectedB && <Badge className="text-[10px]">B</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(versao.createdAt)}
                            {versao.tempoGeracaoMs ? ` · ${(versao.tempoGeracaoMs / 1000).toFixed(1)}s` : ""}
                          </p>
                          {versao.notas && (
                            <p className="text-xs italic mt-1 text-muted-foreground line-clamp-1">
                              <StickyNote className="w-3 h-3 inline mr-1" />
                              {versao.notas}
                            </p>
                          )}
                        </div>

                        {!compareMode && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Visualizar */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setViewingVersionId(versao.id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    {versao.titulo} — v{versao.versao}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {ESTRATEGIA_LABELS[versao.estrategia] || versao.estrategia} · {formatDate(versao.createdAt)}
                                  </DialogDescription>
                                </DialogHeader>
                                {versaoVisualizando && versaoVisualizando.id === versao.id && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline">{TIPO_DOC_LABELS[versaoVisualizando.tipoDocumento] || versaoVisualizando.tipoDocumento}</Badge>
                                      <Badge variant="secondary">{versaoVisualizando.areaJuridica}</Badge>
                                      {versaoVisualizando.tempoGeracaoMs && (
                                        <Badge variant="outline" className="text-xs">
                                          {(versaoVisualizando.tempoGeracaoMs / 1000).toFixed(1)}s
                                        </Badge>
                                      )}
                                    </div>
                                    {versaoVisualizando.contexto && (
                                      <div className="p-3 bg-muted/30 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Contexto do caso:</p>
                                        <p className="text-sm">{versaoVisualizando.contexto}</p>
                                      </div>
                                    )}
                                    <div className="p-4 bg-card border border-border rounded-lg">
                                      <LazyStreamdown>{versaoVisualizando.documento}</LazyStreamdown>
                                    </div>
                                    {onCarregarVersao && (
                                      <DialogClose asChild>
                                        <Button
                                          onClick={() =>
                                            onCarregarVersao({
                                              documento: versaoVisualizando.documento,
                                              tipoDocumento: versaoVisualizando.tipoDocumento,
                                              areaJuridica: versaoVisualizando.areaJuridica || "",
                                              estrategia: versaoVisualizando.estrategia,
                                              contexto: versaoVisualizando.contexto || "",
                                            })
                                          }
                                        >
                                          <FileText className="w-4 h-4 mr-2" />
                                          Carregar no Editor
                                        </Button>
                                      </DialogClose>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {/* Notas */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setEditingNotesId(versao.id);
                                    setNotesText(versao.notas || "");
                                  }}
                                >
                                  <StickyNote className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Notas da versão {versao.versao}</DialogTitle>
                                  <DialogDescription>
                                    Adicione anotações para identificar esta versão
                                  </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="Ex: Versão com argumentação mais forte sobre prescrição..."
                                  rows={4}
                                />
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                  </DialogClose>
                                  <Button
                                    onClick={() =>
                                      atualizarNotasMutation.mutate({
                                        versionId: versao.id,
                                        notas: notesText,
                                      })
                                    }
                                    disabled={atualizarNotasMutation.isPending}
                                  >
                                    {atualizarNotasMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                    ) : null}
                                    Salvar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Excluir */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Excluir versão {versao.versao}</DialogTitle>
                                  <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                  </DialogClose>
                                  <Button
                                    variant="destructive"
                                    onClick={() => excluirVersaoMutation.mutate({ versionId: versao.id })}
                                    disabled={excluirVersaoMutation.isPending}
                                  >
                                    Excluir
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Botão de comparar */}
              {compareMode && compareVersions[0] && compareVersions[1] && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      Comparar versões selecionadas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <GitCompare className="w-5 h-5" />
                        Comparação de Versões
                      </DialogTitle>
                      <DialogDescription>Visualize as diferenças entre as duas versões selecionadas</DialogDescription>
                    </DialogHeader>
                    {versaoA && versaoB && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>v{versaoA.versao}</Badge>
                              <span className="text-sm font-medium">
                                {ESTRATEGIA_LABELS[versaoA.estrategia] || versaoA.estrategia}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(versaoA.createdAt)}
                              {versaoA.tempoGeracaoMs ? ` · ${(versaoA.tempoGeracaoMs / 1000).toFixed(1)}s` : ""}
                            </p>
                            {versaoA.notas && (
                              <p className="text-xs italic mt-1 text-muted-foreground">{versaoA.notas}</p>
                            )}
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>v{versaoB.versao}</Badge>
                              <span className="text-sm font-medium">
                                {ESTRATEGIA_LABELS[versaoB.estrategia] || versaoB.estrategia}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(versaoB.createdAt)}
                              {versaoB.tempoGeracaoMs ? ` · ${(versaoB.tempoGeracaoMs / 1000).toFixed(1)}s` : ""}
                            </p>
                            {versaoB.notas && (
                              <p className="text-xs italic mt-1 text-muted-foreground">{versaoB.notas}</p>
                            )}
                          </div>
                        </div>

                        {/* Documentos lado a lado */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-card border border-border rounded-lg overflow-y-auto max-h-[55vh]">
                            <LazyStreamdown>{versaoA.documento}</LazyStreamdown>
                          </div>
                          <div className="p-4 bg-card border border-border rounded-lg overflow-y-auto max-h-[55vh]">
                            <LazyStreamdown>{versaoB.documento}</LazyStreamdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
