/**
 * Página "Meus Prompts" — histórico de prompts salvos pelo usuário.
 *
 * Funcionalidades:
 * - Listagem paginada com cards informativos
 * - Filtros por área jurídica, estratégia e favoritos
 * - Busca textual no título e conteúdo
 * - Ações: favoritar, copiar, editar notas, deletar
 * - Visualização expandida do conteúdo completo
 * - Contador de usos
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Search,
  Star,
  StarOff,
  Copy,
  CheckCheck,
  Trash2,
  MoreVertical,
  BookMarked,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit3,
  Loader2,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type EstrategiaPrompt = "direta" | "raciocinio" | "recuperacao" | "manual";

interface PromptSalvo {
  id: number;
  titulo: string;
  estrategia: EstrategiaPrompt;
  areaJuridica: string | null;
  tipoDocumento: string | null;
  conteudo: string;
  notas: string | null;
  isFavorito: boolean;
  usoCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTRATEGIA_INFO: Record<EstrategiaPrompt, { label: string; icone: string; cor: string }> = {
  direta: { label: "Direta", icone: "⚡", cor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  raciocinio: { label: "Raciocínio", icone: "🧠", cor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  recuperacao: { label: "Recuperação", icone: "📚", cor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  manual: { label: "Manual", icone: "✍️", cor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
};

const ITENS_POR_PAGINA = 12;

// ─── Componente de Card ───────────────────────────────────────────────────────

function PromptCard({
  prompt,
  onFavoritar,
  onCopiar,
  onEditar,
  onDeletar,
  onUsarNoDocumento,
  copiado,
}: {
  prompt: PromptSalvo;
  onFavoritar: (id: number) => void;
  onCopiar: (id: number, conteudo: string) => void;
  onEditar: (prompt: PromptSalvo) => void;
  onDeletar: (id: number) => void;
  onUsarNoDocumento: (conteudo: string) => void;
  copiado: number | null;
}) {
  const [expandido, setExpandido] = useState(false);
  const info = ESTRATEGIA_INFO[prompt.estrategia];
  const dataFormatada = format(new Date(prompt.createdAt), "d 'de' MMM 'de' yyyy", { locale: ptBR });

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        prompt.isFavorito && "border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10"
      )}
    >
      {/* Indicador de favorito */}
      {prompt.isFavorito && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
          <Star className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}

      <div className="p-4 flex-1">
        {/* Cabeçalho do card */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate leading-tight">
              {prompt.titulo}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge className={cn("text-xs px-1.5 py-0", info.cor)}>
                {info.icone} {info.label}
              </Badge>
              {prompt.areaJuridica && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {prompt.areaJuridica}
                </Badge>
              )}
              {prompt.tipoDocumento && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                  {prompt.tipoDocumento}
                </Badge>
              )}
            </div>
          </div>

          {/* Menu de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onFavoritar(prompt.id)}>
                {prompt.isFavorito ? (
                  <><StarOff className="w-3.5 h-3.5 mr-2" /> Remover favorito</>
                ) : (
                  <><Star className="w-3.5 h-3.5 mr-2" /> Favoritar</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditar(prompt)}>
                <Edit3 className="w-3.5 h-3.5 mr-2" /> Editar notas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopiar(prompt.id, prompt.conteudo)}>
                <Copy className="w-3.5 h-3.5 mr-2" /> Copiar prompt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onUsarNoDocumento(prompt.conteudo)}
                className="text-primary"
              >
                <ArrowRight className="w-3.5 h-3.5 mr-2" /> Usar no Documentos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeletar(prompt.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Preview do conteúdo */}
        <div className="mt-2">
          <p
            className={cn(
              "text-xs text-muted-foreground leading-relaxed font-mono",
              !expandido && "line-clamp-3"
            )}
          >
            {prompt.conteudo}
          </p>
          {prompt.conteudo.length > 200 && (
            <button
              onClick={() => setExpandido(!expandido)}
              className="mt-1 text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              {expandido ? (
                <><ChevronUp className="w-3 h-3" /> Recolher</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Ver completo</>
              )}
            </button>
          )}
        </div>

        {/* Notas pessoais */}
        {prompt.notas && (
          <div className="mt-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground border-l-2 border-amber-400">
            <span className="font-medium text-foreground/70">Nota: </span>
            {prompt.notas}
          </div>
        )}
      </div>

      {/* Rodapé do card */}
      <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between rounded-b-xl">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {dataFormatada}
          </span>
          {prompt.usoCount > 0 && (
            <span className="flex items-center gap-1">
              <BarChart2 className="w-3 h-3" />
              {prompt.usoCount}x usado
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => onCopiar(prompt.id, prompt.conteudo)}
          >
            {copiado === prompt.id ? (
              <CheckCheck className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            Copiar
          </Button>
          <Button
            size="sm"
            className="h-6 px-2 text-xs gap-1 bg-primary/90 hover:bg-primary"
            onClick={() => onUsarNoDocumento(prompt.conteudo)}
          >
            <ArrowRight className="w-3 h-3" />
            Usar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Edição de Notas ─────────────────────────────────────────────────

function ModalEditarNotas({
  prompt,
  onFechar,
  onSalvar,
}: {
  prompt: PromptSalvo | null;
  onFechar: () => void;
  onSalvar: (id: number, titulo: string, notas: string) => void;
}) {
  const [titulo, setTitulo] = useState(prompt?.titulo ?? "");
  const [notas, setNotas] = useState(prompt?.notas ?? "");
  const [salvando, setSalvando] = useState(false);

  if (!prompt) return null;

  const handleSalvar = async () => {
    setSalvando(true);
    await onSalvar(prompt.id, titulo, notas);
    setSalvando(false);
    onFechar();
  };

  return (
    <Dialog open={!!prompt} onOpenChange={onFechar}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Editar prompt
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título descritivo do prompt"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Notas pessoais{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Adicione observações sobre quando usar este prompt, contexto, resultados obtidos..."
              className="text-sm resize-none"
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {notas.length}/2000
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando || !titulo.trim()}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function MeusPrompts() {
  const [, navigate] = useLocation();

  // Filtros
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [areaFiltro, setAreaFiltro] = useState<string | undefined>();
  const [estrategiaFiltro, setEstrategiaFiltro] = useState<EstrategiaPrompt | undefined>();
  const [apenasFavorito, setApenasFavorito] = useState(false);
  const [pagina, setPagina] = useState(0);

  // Estado local
  const [copiado, setCopiado] = useState<number | null>(null);
  const [promptEditando, setPromptEditando] = useState<PromptSalvo | null>(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  // Debounce da busca
  const handleBusca = (valor: string) => {
    setBusca(valor);
    clearTimeout((window as unknown as { _buscaTimeout: ReturnType<typeof setTimeout> })._buscaTimeout);
    (window as unknown as { _buscaTimeout: ReturnType<typeof setTimeout> })._buscaTimeout = setTimeout(() => {
      setBuscaDebounced(valor);
      setPagina(0);
    }, 400);
  };

  // Queries tRPC
  const { data, isLoading, refetch } = trpc.promptsSalvos.listar.useQuery({
    busca: buscaDebounced || undefined,
    areaJuridica: areaFiltro,
    estrategia: estrategiaFiltro,
    apenasFavorito: apenasFavorito || undefined,
    limit: ITENS_POR_PAGINA,
    offset: pagina * ITENS_POR_PAGINA,
  });

  const { data: areas } = trpc.promptsSalvos.listarAreas.useQuery();

  const utils = trpc.useUtils();

  // Mutations
  const toggleFavoritoMutation = trpc.promptsSalvos.toggleFavorito.useMutation({
    onSuccess: () => utils.promptsSalvos.listar.invalidate(),
  });

  const atualizarMutation = trpc.promptsSalvos.atualizar.useMutation({
    onSuccess: () => {
      utils.promptsSalvos.listar.invalidate();
      toast.success("Prompt atualizado!");
    },
  });

  const deletarMutation = trpc.promptsSalvos.deletar.useMutation({
    onSuccess: () => {
      utils.promptsSalvos.listar.invalidate();
      toast.success("Prompt excluído.");
    },
    onError: () => toast.error("Erro ao excluir prompt"),
  });

  const registrarUsoMutation = trpc.promptsSalvos.registrarUso.useMutation();

  // Handlers
  const handleFavoritar = (id: number) => {
    toggleFavoritoMutation.mutate({ id });
  };

  const handleCopiar = (id: number, conteudo: string) => {
    navigator.clipboard.writeText(conteudo);
    setCopiado(id);
    registrarUsoMutation.mutate({ id });
    toast.success("Prompt copiado!");
    setTimeout(() => setCopiado(null), 2000);
  };

  const handleEditar = (prompt: PromptSalvo) => {
    setPromptEditando(prompt);
  };

  const handleSalvarEdicao = async (id: number, titulo: string, notas: string) => {
    await atualizarMutation.mutateAsync({
      id,
      titulo,
      notas: notas || null,
    });
  };

  const handleDeletar = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este prompt?")) {
      deletarMutation.mutate({ id });
    }
  };

  const handleUsarNoDocumento = (conteudo: string) => {
    sessionStorage.setItem("promptJur_promptSelecionado", conteudo);
    toast.success("Prompt carregado! Redirecionando para Documentos...", { duration: 3000 });
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  const prompts = (data?.prompts ?? []) as PromptSalvo[];
  const total = data?.total ?? 0;
  const totalPaginas = Math.ceil(total / ITENS_POR_PAGINA);

  const temFiltrosAtivos = !!(areaFiltro || estrategiaFiltro || apenasFavorito || buscaDebounced);

  const limparFiltros = () => {
    setBusca("");
    setBuscaDebounced("");
    setAreaFiltro(undefined);
    setEstrategiaFiltro(undefined);
    setApenasFavorito(false);
    setPagina(0);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b px-6 py-4 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <BookMarked className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Meus Prompts</h1>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? `${total} prompt${total !== 1 ? "s" : ""} salvos` : "Nenhum prompt salvo ainda"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/assistente")}
              className="gap-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar novo prompt
            </Button>
          </div>

          {/* Barra de busca e filtros */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => handleBusca(e.target.value)}
                placeholder="Buscar por título, conteúdo ou área jurídica..."
                className="pl-9 text-sm"
              />
            </div>
            <Button
              variant={filtrosAbertos || temFiltrosAtivos ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltrosAbertos(!filtrosAbertos)}
              className="gap-1.5 text-xs shrink-0"
            >
              <Filter className="w-3.5 h-3.5" />
              Filtros
              {temFiltrosAtivos && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-white/20 text-xs flex items-center justify-center font-bold">
                  {[areaFiltro, estrategiaFiltro, apenasFavorito].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Painel de filtros expandível */}
          {filtrosAbertos && (
            <div className="mt-3 p-3 rounded-lg bg-muted/40 border flex flex-wrap gap-3 items-center">
              {/* Filtro por área */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Área:</span>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => { setAreaFiltro(undefined); setPagina(0); }}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full border transition-colors",
                      !areaFiltro ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                    )}
                  >
                    Todas
                  </button>
                  {(areas ?? []).map((area) => (
                    <button
                      key={area}
                      onClick={() => { setAreaFiltro(area); setPagina(0); }}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border transition-colors",
                        areaFiltro === area ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                      )}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro por estratégia */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Estratégia:</span>
                <div className="flex gap-1">
                  {(["direta", "raciocinio", "recuperacao", "manual"] as EstrategiaPrompt[]).map((e) => (
                    <button
                      key={e}
                      onClick={() => { setEstrategiaFiltro(estrategiaFiltro === e ? undefined : e); setPagina(0); }}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border transition-colors",
                        estrategiaFiltro === e ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                      )}
                    >
                      {ESTRATEGIA_INFO[e].icone} {ESTRATEGIA_INFO[e].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro favoritos */}
              <button
                onClick={() => { setApenasFavorito(!apenasFavorito); setPagina(0); }}
                className={cn(
                  "text-xs px-2.5 py-0.5 rounded-full border transition-colors flex items-center gap-1",
                  apenasFavorito ? "bg-amber-500 text-white border-amber-500" : "hover:bg-muted"
                )}
              >
                <Star className="w-3 h-3" />
                Favoritos
              </button>

              {temFiltrosAtivos && (
                <button
                  onClick={limparFiltros}
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-auto"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : prompts.length === 0 ? (
            /* Estado vazio */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {temFiltrosAtivos ? (
                <>
                  <Search className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <h3 className="font-semibold text-muted-foreground">Nenhum prompt encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente ajustar os filtros ou a busca.
                  </p>
                  <Button variant="outline" size="sm" onClick={limparFiltros} className="mt-4">
                    Limpar filtros
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="font-bold text-lg">Nenhum prompt salvo ainda</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    Conclua o wizard do assistente JurIA e clique em{" "}
                    <strong>"Usar este"</strong> em uma das sugestões para salvar seu primeiro prompt.
                  </p>
                  <Button
                    onClick={() => navigate("/assistente")}
                    className="mt-5 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ir para o Assistente JurIA
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Grid de cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onFavoritar={handleFavoritar}
                    onCopiar={handleCopiar}
                    onEditar={handleEditar}
                    onDeletar={handleDeletar}
                    onUsarNoDocumento={handleUsarNoDocumento}
                    copiado={copiado}
                  />
                ))}
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina((p) => Math.max(0, p - 1))}
                    disabled={pagina === 0}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {pagina + 1} de {totalPaginas}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                    disabled={pagina >= totalPaginas - 1}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de edição */}
      <ModalEditarNotas
        prompt={promptEditando}
        onFechar={() => setPromptEditando(null)}
        onSalvar={handleSalvarEdicao}
      />
    </DashboardLayout>
  );
}
