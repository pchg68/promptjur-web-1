import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import LazyStreamdown from "@/components/LazyStreamdown";

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

  // Dados para comparação
  const versaoA = useMemo(() => {
    if (!compareVersions[0] || !versoesQuery.data) return null;
    return versoesQuery.data.find((v) => v.id === compareVersions[0]) ?? null;
  }, [compareVersions[0], versoesQuery.data]);

  const versaoB = useMemo(() => {
    if (!compareVersions[1] || !versoesQuery.data) return null;
    return versoesQuery.data.find((v) => v.id === compareVersions[1]) ?? null;
  }, [compareVersions[1], versoesQuery.data]);

  const versaoVisualizando = useMemo(() => {
    if (!viewingVersionId || !versoesQuery.data) return null;
    return versoesQuery.data.find((v) => v.id === viewingVersionId) ?? null;
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

          {gruposQuery.data && gruposQuery.data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum documento salvo no histórico ainda. Gere um documento e ele será salvo automaticamente.
            </p>
          )}

          {/* Lista de Grupos */}
          {!selectedGroupId &&
            gruposQuery.data?.map((grupo) => (
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
                          Excluir Tudo
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {compareMode && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Selecione 2 versões para comparar lado a lado. Clique nas versões desejadas.
                </p>
              )}

              {versoesQuery.isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {versoesQuery.data?.map((versao) => {
                const isSelectedForCompare =
                  compareVersions[0] === versao.id || compareVersions[1] === versao.id;

                return (
                  <Card
                    key={versao.id}
                    className={`transition-colors ${
                      isSelectedForCompare
                        ? "border-primary bg-primary/5"
                        : compareMode
                        ? "cursor-pointer hover:border-primary/50"
                        : ""
                    }`}
                    onClick={compareMode ? () => handleToggleCompare(versao.id) : undefined}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              v{versao.versao}
                            </Badge>
                            <span className="text-sm font-medium truncate">
                              {ESTRATEGIA_LABELS[versao.estrategia] || versao.estrategia}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(versao.createdAt)}
                            </span>
                            {versao.tempoGeracaoMs && (
                              <span>{versao.tempoGeracaoMs}ms</span>
                            )}
                          </div>
                          {versao.notas && (
                            <p className="text-xs text-muted-foreground mt-1 italic flex items-center gap-1">
                              <StickyNote className="w-3 h-3" />
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingVersionId(versao.id);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Versão {versao.versao} — {ESTRATEGIA_LABELS[versao.estrategia] || versao.estrategia}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Gerado em {formatDate(versao.createdAt)}
                                    {versao.tempoGeracaoMs ? ` (${versao.tempoGeracaoMs}ms)` : ""}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="p-4 bg-card border border-border rounded-lg mt-2">
                                  <LazyStreamdown>{versao.documento}</LazyStreamdown>
                                </div>
                                <DialogFooter className="mt-4">
                                  {onCarregarVersao && (
                                    <Button
                                      onClick={() => {
                                        onCarregarVersao({
                                          documento: versao.documento,
                                          tipoDocumento: versao.tipoDocumento,
                                          areaJuridica: versao.areaJuridica,
                                          estrategia: versao.estrategia,
                                          contexto: versao.contexto,
                                        });
                                        toast.success("Versão carregada no editor");
                                      }}
                                    >
                                      Carregar no Editor
                                    </Button>
                                  )}
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Notas */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingNotesId(versao.id);
                                    setNotesText(versao.notas || "");
                                  }}
                                >
                                  <StickyNote className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Notas — Versão {versao.versao}</DialogTitle>
                                  <DialogDescription>
                                    Adicione anotações sobre esta versão do documento.
                                  </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="Ex: Versão com argumentação mais forte sobre danos morais..."
                                  className="min-h-[100px]"
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Excluir versão {versao.versao}</DialogTitle>
                                  <DialogDescription>
                                    Esta versão será excluída permanentemente.
                                  </DialogDescription>
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

              {/* Botão de comparar quando 2 versões selecionadas */}
              {compareMode && compareVersions[0] && compareVersions[1] && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <ArrowLeftRight className="w-5 h-5 mr-2" />
                      Comparar Versões Selecionadas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <GitCompare className="w-5 h-5" />
                        Comparação de Versões
                      </DialogTitle>
                      <DialogDescription>
                        Visualização lado a lado das versões selecionadas
                      </DialogDescription>
                    </DialogHeader>
                    {versaoA && versaoB && (
                      <div className="space-y-4">
                        {/* Metadados comparados */}
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
                              {versaoA.tempoGeracaoMs ? ` · ${versaoA.tempoGeracaoMs}ms` : ""}
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
                              {versaoB.tempoGeracaoMs ? ` · ${versaoB.tempoGeracaoMs}ms` : ""}
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
