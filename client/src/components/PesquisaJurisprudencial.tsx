import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scale,
  Clock,
  Building2,
  FileText,
  Copy,
  Filter,
  BookOpen,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

// ============================================================================
// TIPOS
// ============================================================================

interface TeseExtraida {
  id: string;
  titulo: string;
  descricao: string;
  termosChave: string[];
  artigosRelacionados: string[];
  queryElasticsearch: string;
}

interface ProcessoEnriquecido {
  numeroProcesso: string;
  tribunal: string;
  tribunalBusca: string;
  classe: string;
  assuntos: string[];
  orgaoJulgador: string;
  grau: string;
  dataAjuizamento: string;
  dataUltimaAtualizacao: string;
  movimentoRecente?: string;
  dataMovimentoRecente?: string;
  scoreRelevancia: number;
  linkOficial: string;
  validacao: {
    temFonteOficial: boolean;
    temIdentificacaoCompleta: boolean;
    temDataRecente: boolean;
    temAderenciaFatica: boolean;
    scoreValidacao: number;
    alertas: string[];
  };
}

interface ResultadoJurisprudencial {
  tese: TeseExtraida;
  processos: ProcessoEnriquecido[];
  totalEncontrado: number;
}

interface PesquisaJurisprudencialProps {
  promptTexto: string;
  areaJuridica: string;
  tipoDocumento: string;
  onIncorporar: (citacao: string) => void;
  disabled?: boolean;
}

type TomResumo = "formal" | "tecnico" | "persuasivo";
type GrauFiltro = "todos" | "G1" | "G2" | "JE" | "TR";

// ============================================================================
// CATÁLOGO COMPLETO DE TRIBUNAIS
// ============================================================================

interface TribunalOpcao {
  value: string;
  label: string;
  uf?: string;
}

interface GrupoTribunal {
  grupo: string;
  items: TribunalOpcao[];
}

const TRIBUNAIS_OPCOES: GrupoTribunal[] = [
  {
    grupo: "Tribunais Superiores",
    items: [
      { value: "STF", label: "STF" },
      { value: "STJ", label: "STJ" },
      { value: "TST", label: "TST" },
      { value: "TSE", label: "TSE" },
      { value: "STM", label: "STM" },
    ],
  },
  {
    grupo: "Justiça Federal (TRFs)",
    items: [
      { value: "TRF1", label: "TRF 1ª", uf: "DF/GO/MT/TO/AC/AM/AP/BA/MA/MG/PA/PI/RO/RR" },
      { value: "TRF2", label: "TRF 2ª", uf: "RJ/ES" },
      { value: "TRF3", label: "TRF 3ª", uf: "SP/MS" },
      { value: "TRF4", label: "TRF 4ª", uf: "RS/PR/SC" },
      { value: "TRF5", label: "TRF 5ª", uf: "PE/CE/AL/SE/PB/RN" },
      { value: "TRF6", label: "TRF 6ª", uf: "MG" },
    ],
  },
  {
    grupo: "Justiça do Trabalho (TRTs)",
    items: [
      { value: "TRT1", label: "TRT 1ª", uf: "RJ" },
      { value: "TRT2", label: "TRT 2ª", uf: "SP (Capital)" },
      { value: "TRT3", label: "TRT 3ª", uf: "MG" },
      { value: "TRT4", label: "TRT 4ª", uf: "RS" },
      { value: "TRT5", label: "TRT 5ª", uf: "BA" },
      { value: "TRT6", label: "TRT 6ª", uf: "PE" },
      { value: "TRT7", label: "TRT 7ª", uf: "CE" },
      { value: "TRT8", label: "TRT 8ª", uf: "PA/AP" },
      { value: "TRT9", label: "TRT 9ª", uf: "PR" },
      { value: "TRT10", label: "TRT 10ª", uf: "DF/TO" },
      { value: "TRT11", label: "TRT 11ª", uf: "AM/RR" },
      { value: "TRT12", label: "TRT 12ª", uf: "SC" },
      { value: "TRT13", label: "TRT 13ª", uf: "PB" },
      { value: "TRT14", label: "TRT 14ª", uf: "RO/AC" },
      { value: "TRT15", label: "TRT 15ª", uf: "SP (Interior)" },
      { value: "TRT16", label: "TRT 16ª", uf: "MA" },
      { value: "TRT17", label: "TRT 17ª", uf: "ES" },
      { value: "TRT18", label: "TRT 18ª", uf: "GO" },
      { value: "TRT19", label: "TRT 19ª", uf: "AL" },
      { value: "TRT20", label: "TRT 20ª", uf: "SE" },
      { value: "TRT21", label: "TRT 21ª", uf: "RN" },
      { value: "TRT22", label: "TRT 22ª", uf: "PI" },
      { value: "TRT23", label: "TRT 23ª", uf: "MT" },
      { value: "TRT24", label: "TRT 24ª", uf: "MS" },
    ],
  },
  {
    grupo: "Justiça Estadual (TJs)",
    items: [
      { value: "TJAC", label: "TJ-AC", uf: "AC" },
      { value: "TJAL", label: "TJ-AL", uf: "AL" },
      { value: "TJAM", label: "TJ-AM", uf: "AM" },
      { value: "TJAP", label: "TJ-AP", uf: "AP" },
      { value: "TJBA", label: "TJ-BA", uf: "BA" },
      { value: "TJCE", label: "TJ-CE", uf: "CE" },
      { value: "TJDF", label: "TJ-DFT", uf: "DF" },
      { value: "TJES", label: "TJ-ES", uf: "ES" },
      { value: "TJGO", label: "TJ-GO", uf: "GO" },
      { value: "TJMA", label: "TJ-MA", uf: "MA" },
      { value: "TJMG", label: "TJ-MG", uf: "MG" },
      { value: "TJMS", label: "TJ-MS", uf: "MS" },
      { value: "TJMT", label: "TJ-MT", uf: "MT" },
      { value: "TJPA", label: "TJ-PA", uf: "PA" },
      { value: "TJPB", label: "TJ-PB", uf: "PB" },
      { value: "TJPE", label: "TJ-PE", uf: "PE" },
      { value: "TJPI", label: "TJ-PI", uf: "PI" },
      { value: "TJPR", label: "TJ-PR", uf: "PR" },
      { value: "TJRJ", label: "TJ-RJ", uf: "RJ" },
      { value: "TJRN", label: "TJ-RN", uf: "RN" },
      { value: "TJRO", label: "TJ-RO", uf: "RO" },
      { value: "TJRR", label: "TJ-RR", uf: "RR" },
      { value: "TJRS", label: "TJ-RS", uf: "RS" },
      { value: "TJSC", label: "TJ-SC", uf: "SC" },
      { value: "TJSE", label: "TJ-SE", uf: "SE" },
      { value: "TJSP", label: "TJ-SP", uf: "SP" },
      { value: "TJTO", label: "TJ-TO", uf: "TO" },
    ],
  },
];

const TRIBUNAIS_PADRAO = ["STF", "STJ", "TST", "TJSP", "TJPR", "TJRJ", "TJRS"];

const GRAUS_OPCOES: { value: GrauFiltro; label: string; descricao: string }[] = [
  { value: "todos", label: "Todos os graus", descricao: "1º, 2º e 3º grau" },
  { value: "G1", label: "1º Grau", descricao: "Varas e Juízos de primeiro grau" },
  { value: "G2", label: "2º Grau", descricao: "Tribunais (Câmaras e Turmas)" },
  { value: "JE", label: "Juizados Especiais", descricao: "Turmas Recursais e JECs" },
  { value: "TR", label: "Turmas Recursais", descricao: "Turmas Recursais dos Juizados" },
];

const TONS_RESUMO: { value: TomResumo; label: string; descricao: string }[] = [
  { value: "formal", label: "Formal", descricao: "Linguagem objetiva para petições e peças processuais" },
  { value: "tecnico", label: "Técnico", descricao: "Linguagem analítica para pareceres e memorandos" },
  { value: "persuasivo", label: "Persuasivo", descricao: "Linguagem argumentativa para sustentações e recursos" },
];

// Helper para obter todos os tribunais de um grupo
function getTribunaisDoGrupo(grupo: string): string[] {
  const g = TRIBUNAIS_OPCOES.find(g => g.grupo === grupo);
  return g ? g.items.map(i => i.value) : [];
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function PesquisaJurisprudencial({
  promptTexto,
  areaJuridica,
  tipoDocumento,
  onIncorporar,
  disabled = false,
}: PesquisaJurisprudencialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tribunaisSelecionados, setTribunaisSelecionados] = useState<string[]>(TRIBUNAIS_PADRAO);
  const [periodoInicio, setPeriodoInicio] = useState("2022-01-01");
  const [grauFiltro, setGrauFiltro] = useState<GrauFiltro>("todos");
  const [showFiltros, setShowFiltros] = useState(false);
  const [processosIncorporados, setProcessosIncorporados] = useState<Set<string>>(new Set());
  const [teseAberta, setTeseAberta] = useState<string | null>(null);
  const [tomResumo, setTomResumo] = useState<TomResumo>("formal");
  const [resumoIncorporado, setResumoIncorporado] = useState(false);
  const [grupoExpandido, setGrupoExpandido] = useState<string | null>(null);

  // Contagem de tribunais por grupo
  const contagemPorGrupo = useMemo(() => {
    const contagem: Record<string, { total: number; selecionados: number }> = {};
    TRIBUNAIS_OPCOES.forEach(grupo => {
      const total = grupo.items.length;
      const selecionados = grupo.items.filter(i => tribunaisSelecionados.includes(i.value)).length;
      contagem[grupo.grupo] = { total, selecionados };
    });
    return contagem;
  }, [tribunaisSelecionados]);

  const pesquisaMutation = trpc.pesquisaJurisprudencial.pesquisar.useMutation({
    onSuccess: (data) => {
      toast.success(`Pesquisa concluída: ${data.metadados.totalProcessos} processos encontrados em ${data.metadados.tempoTotal}ms`);
      if (data.resultados.length > 0) {
        setTeseAberta(data.resultados[0].tese.id);
      }
      setResumoIncorporado(false);
    },
    onError: (error) => {
      toast.error("Erro na pesquisa jurisprudencial", { description: error.message });
    },
  });

  const resumoMutation = trpc.pesquisaJurisprudencial.gerarResumo.useMutation({
    onSuccess: (data) => {
      toast.success(`Resumo gerado em ${data.tempoGeracao}ms com ${data.processosUtilizados.length} processos`);
    },
    onError: (error) => {
      toast.error("Erro ao gerar resumo", { description: error.message });
    },
  });

  const handlePesquisar = () => {
    if (!promptTexto || promptTexto.trim().length < 20) {
      toast.error("O documento precisa ter pelo menos 20 caracteres para pesquisar jurisprudência");
      return;
    }

    pesquisaMutation.mutate({
      promptTexto,
      areaJuridica,
      tipoDocumento,
      tribunais: tribunaisSelecionados,
      limitePorTese: 5,
      periodoInicio,
      grau: grauFiltro,
    });
  };

  const handleGerarResumo = () => {
    if (!pesquisaMutation.data) return;

    resumoMutation.mutate({
      resultados: pesquisaMutation.data.resultados,
      contextoDocumento: promptTexto,
      areaJuridica,
      tipoDocumento,
      tom: tomResumo,
    });
  };

  const handleIncorporarResumo = () => {
    if (!resumoMutation.data) return;

    const bloco = `\n\n---\n## Fundamentação Jurisprudencial\n\n${resumoMutation.data.resumo}\n\n---\n`;
    onIncorporar(bloco);
    setResumoIncorporado(true);
    toast.success("Fundamentação jurisprudencial incorporada ao documento");
  };

  const handleCopiarResumo = () => {
    if (!resumoMutation.data) return;
    navigator.clipboard.writeText(resumoMutation.data.resumo);
    toast.success("Resumo copiado para a área de transferência");
  };

  const handleIncorporar = (processo: ProcessoEnriquecido, tese: TeseExtraida) => {
    const data = new Date(processo.dataAjuizamento).toLocaleDateString("pt-BR");
    const citacao = `\n\n---\n**Jurisprudência — ${tese.titulo}**\n\n> **Processo:** ${processo.numeroProcesso}\n> **Tribunal:** ${processo.tribunal} — ${processo.orgaoJulgador}\n> **Classe:** ${processo.classe}\n> **Assuntos:** ${processo.assuntos.join(", ")}\n> **Data:** ${data} | **Grau:** ${processo.grau}\n> **Fonte:** DataJud/CNJ — [Link oficial](${processo.linkOficial})\n\n_Validação: Score ${processo.validacao.scoreValidacao}/100 — Fonte oficial DataJud/CNJ_\n---\n`;

    onIncorporar(citacao);
    setProcessosIncorporados(prev => new Set(prev).add(processo.numeroProcesso));
    toast.success("Jurisprudência incorporada ao documento");
  };

  const handleCopiarCitacao = (processo: ProcessoEnriquecido) => {
    const data = new Date(processo.dataAjuizamento).toLocaleDateString("pt-BR");
    const citacao = `(${processo.tribunal}, ${processo.classe} nº ${processo.numeroProcesso}, ${processo.orgaoJulgador}, j. ${data})`;
    navigator.clipboard.writeText(citacao);
    toast.success("Citação copiada para a área de transferência");
  };

  const toggleTribunal = (tribunal: string) => {
    setTribunaisSelecionados(prev =>
      prev.includes(tribunal)
        ? prev.filter(t => t !== tribunal)
        : [...prev, tribunal]
    );
  };

  const toggleGrupo = (grupo: string) => {
    const tribunaisDoGrupo = getTribunaisDoGrupo(grupo);
    const todosJaSelecionados = tribunaisDoGrupo.every(t => tribunaisSelecionados.includes(t));

    if (todosJaSelecionados) {
      // Desmarcar todos do grupo
      setTribunaisSelecionados(prev => prev.filter(t => !tribunaisDoGrupo.includes(t)));
    } else {
      // Selecionar todos do grupo
      setTribunaisSelecionados(prev => {
        const novos = new Set([...prev, ...tribunaisDoGrupo]);
        return Array.from(novos);
      });
    }
  };

  const selecionarTodos = () => {
    const todos = TRIBUNAIS_OPCOES.flatMap(g => g.items.map(i => i.value));
    setTribunaisSelecionados(todos);
  };

  const limparSelecao = () => {
    setTribunaisSelecionados([]);
  };

  const hasResultados = pesquisaMutation.data && pesquisaMutation.data.resultados.length > 0;
  const hasProcessos = pesquisaMutation.data && pesquisaMutation.data.metadados.totalProcessos > 0;
  const totalTribunaisDisponiveis = TRIBUNAIS_OPCOES.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2 h-auto py-3"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <span className="font-medium">Pesquisa Jurisprudencial</span>
            {pesquisaMutation.data && (
              <Badge variant="secondary" className="text-xs">
                {pesquisaMutation.data.metadados.totalProcessos} processos
              </Badge>
            )}
            {resumoMutation.data && (
              <Badge variant="default" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Resumo IA
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-4">
        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm text-sm">
          <ShieldCheck className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-600 dark:text-amber-400">Jurisprudência Real e Auditável</p>
            <p className="text-muted-foreground mt-0.5">
              Todos os resultados são obtidos diretamente da API pública do DataJud (CNJ).
              Cobertura completa: STF, STJ, TST, todos os 6 TRFs, 24 TRTs e 27 TJs estaduais.
              Cada processo possui link oficial para verificação.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowFiltros(!showFiltros)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            {showFiltros ? "Ocultar filtros" : "Configurar filtros de pesquisa"}
            <Badge variant="outline" className="text-xs ml-1">
              {tribunaisSelecionados.length}/{totalTribunaisDisponiveis} tribunais
            </Badge>
          </button>

          {showFiltros && (
            <div className="space-y-4 p-3 bg-muted/30 rounded-sm">
              {/* Ações rápidas */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seleção rápida:</span>
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={selecionarTodos}>
                  Todos ({totalTribunaisDisponiveis})
                </Button>
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => setTribunaisSelecionados(TRIBUNAIS_PADRAO)}>
                  Padrão ({TRIBUNAIS_PADRAO.length})
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={limparSelecao}>
                  Limpar
                </Button>
              </div>

              {/* Tribunais por grupo */}
              {TRIBUNAIS_OPCOES.map(grupo => {
                const { total, selecionados } = contagemPorGrupo[grupo.grupo] || { total: 0, selecionados: 0 };
                const todosDoGrupo = selecionados === total;
                const isExpanded = grupoExpandido === grupo.grupo;

                return (
                  <div key={grupo.grupo} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setGrupoExpandido(isExpanded ? null : grupo.grupo)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {grupo.grupo}
                        <Badge variant={selecionados > 0 ? "default" : "outline"} className="text-xs ml-1">
                          {selecionados}/{total}
                        </Badge>
                      </button>
                      <Button
                        variant={todosDoGrupo ? "secondary" : "outline"}
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => toggleGrupo(grupo.grupo)}
                      >
                        {todosDoGrupo ? "Desmarcar todos" : "Selecionar todos"}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="flex flex-wrap gap-1.5 pl-4">
                        {grupo.items.map(t => (
                          <Tooltip key={t.value}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => toggleTribunal(t.value)}
                                className={`px-2 py-1 text-xs rounded-sm border transition-colors ${
                                  tribunaisSelecionados.includes(t.value)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background border-border hover:border-primary/50"
                                }`}
                              >
                                {t.label}
                              </button>
                            </TooltipTrigger>
                            {t.uf && (
                              <TooltipContent side="bottom" className="text-xs">
                                {t.uf}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ))}
                      </div>
                    )}

                    {/* Mostrar chips resumidos quando grupo está colapsado */}
                    {!isExpanded && selecionados > 0 && (
                      <div className="flex flex-wrap gap-1 pl-4">
                        {grupo.items
                          .filter(t => tribunaisSelecionados.includes(t.value))
                          .slice(0, 8)
                          .map(t => (
                            <span key={t.value} className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-sm">
                              {t.label}
                            </span>
                          ))}
                        {selecionados > 8 && (
                          <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                            +{selecionados - 8} mais
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Grau de Jurisdição */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Grau de Jurisdição
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GRAUS_OPCOES.map(g => (
                    <Tooltip key={g.value}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setGrauFiltro(g.value)}
                          className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
                            grauFiltro === g.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:border-primary/50"
                          }`}
                        >
                          {g.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {g.descricao}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Período */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Período inicial
                </label>
                <Select value={periodoInicio} onValueChange={setPeriodoInicio}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2018-01-01">A partir de 2018</SelectItem>
                    <SelectItem value="2020-01-01">A partir de 2020</SelectItem>
                    <SelectItem value="2022-01-01">A partir de 2022</SelectItem>
                    <SelectItem value="2023-01-01">A partir de 2023</SelectItem>
                    <SelectItem value="2024-01-01">A partir de 2024</SelectItem>
                    <SelectItem value="2025-01-01">A partir de 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Botão de Pesquisa */}
        <Button
          onClick={handlePesquisar}
          disabled={pesquisaMutation.isPending || !promptTexto || promptTexto.trim().length < 20 || tribunaisSelecionados.length === 0}
          className="w-full"
        >
          {pesquisaMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Pesquisando jurisprudência...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              {hasResultados ? "Pesquisar Novamente" : `Pesquisar em ${tribunaisSelecionados.length} Tribunais`}
            </>
          )}
        </Button>

        {/* Indicador de progresso */}
        {pesquisaMutation.isPending && (
          <div className="space-y-2 p-3 bg-muted/20 rounded-sm">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Extraindo teses jurídicas do documento...</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Consultando {tribunaisSelecionados.length} tribunais via DataJud/CNJ{grauFiltro !== "todos" ? ` (${GRAUS_OPCOES.find(g => g.value === grauFiltro)?.label})` : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>Processando em lotes de 8 tribunais simultâneos...</span>
            </div>
          </div>
        )}

        {/* Resultados */}
        {pesquisaMutation.data && (
          <div className="space-y-4">
            {/* Metadados */}
            <div className="flex items-center justify-between text-xs text-muted-foreground p-2 bg-muted/20 rounded-sm flex-wrap gap-1">
              <span>
                {pesquisaMutation.data.teses.length} teses identificadas •{" "}
                {pesquisaMutation.data.metadados.totalProcessos} processos encontrados
              </span>
              <span>
                {pesquisaMutation.data.metadados.tribunaisConsultados.length} tribunais •{" "}
                {pesquisaMutation.data.metadados.tempoTotal}ms
              </span>
            </div>

            {/* ============================================================ */}
            {/* RESUMO AUTOMÁTICO VIA IA */}
            {/* ============================================================ */}
            {hasProcessos && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Resumo Automático de Fundamentação
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    A IA analisa os processos encontrados e gera um parágrafo de fundamentação jurisprudencial pronto para inserção no documento.
                  </p>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  {/* Seletor de tom + botão gerar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={tomResumo} onValueChange={(v) => setTomResumo(v as TomResumo)}>
                      <SelectTrigger className="w-44 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONS_RESUMO.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <div>
                              <span className="font-medium">{t.label}</span>
                              <span className="text-muted-foreground ml-1">— {t.descricao}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleGerarResumo}
                      disabled={resumoMutation.isPending}
                      size="sm"
                      className="gap-1.5"
                    >
                      {resumoMutation.isPending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Gerando resumo...
                        </>
                      ) : resumoMutation.data ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerar Resumo
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Gerar Resumo com IA
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Loading do resumo */}
                  {resumoMutation.isPending && (
                    <div className="p-3 bg-muted/30 rounded-sm space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>Analisando processos e gerando fundamentação...</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        A IA está redigindo parágrafos de fundamentação com base exclusivamente nos processos reais encontrados.
                      </p>
                    </div>
                  )}

                  {/* Resultado do resumo */}
                  {resumoMutation.data && (
                    <div className="space-y-3">
                      {/* Metadados do resumo */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {resumoMutation.data.processosUtilizados.length} processos citados
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {resumoMutation.data.tesesAbordadas.length} teses abordadas
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {resumoMutation.data.tempoGeracao}ms
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          Tom: {resumoMutation.data.tom}
                        </Badge>
                      </div>

                      {/* Texto do resumo */}
                      <div className="p-4 bg-card border border-border rounded-sm prose prose-sm max-w-none dark:prose-invert">
                        <Streamdown>{resumoMutation.data.resumo}</Streamdown>
                      </div>

                      {/* Ações do resumo */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          onClick={handleIncorporarResumo}
                          disabled={resumoIncorporado}
                          size="sm"
                          className="gap-1.5"
                        >
                          {resumoIncorporado ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Incorporado ao Documento
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              Incorporar ao Documento
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={handleCopiarResumo}
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copiar Resumo
                        </Button>
                      </div>

                      {/* Disclaimer do resumo */}
                      <div className="flex items-start gap-2 p-2 bg-amber-500/5 border border-amber-500/10 rounded-sm text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>
                          Este resumo foi gerado com base exclusivamente nos processos reais identificados via DataJud/CNJ.
                          Recomenda-se a verificação do inteiro teor dos acórdãos nos links oficiais antes da utilização em peça processual.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Erro do resumo */}
                  {resumoMutation.error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-sm text-destructive">
                      <p className="font-medium">Erro ao gerar resumo</p>
                      <p className="mt-1">{resumoMutation.error.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Teses e Resultados */}
            {pesquisaMutation.data.resultados.map((resultado) => (
              <TeseCard
                key={resultado.tese.id}
                resultado={resultado}
                isOpen={teseAberta === resultado.tese.id}
                onToggle={() => setTeseAberta(teseAberta === resultado.tese.id ? null : resultado.tese.id)}
                onIncorporar={handleIncorporar}
                onCopiarCitacao={handleCopiarCitacao}
                processosIncorporados={processosIncorporados}
              />
            ))}

            {/* Sem resultados */}
            {pesquisaMutation.data.resultados.every(r => r.processos.length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Nenhum processo encontrado</p>
                <p className="text-sm mt-1">Tente expandir os tribunais, o período de busca ou alterar o grau de jurisdição</p>
              </div>
            )}
          </div>
        )}

        {/* Erro */}
        {pesquisaMutation.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-sm text-destructive">
            <p className="font-medium">Erro na pesquisa</p>
            <p className="mt-1">{pesquisaMutation.error.message}</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// COMPONENTE DE CARD DE TESE
// ============================================================================

function TeseCard({
  resultado,
  isOpen,
  onToggle,
  onIncorporar,
  onCopiarCitacao,
  processosIncorporados,
}: {
  resultado: ResultadoJurisprudencial;
  isOpen: boolean;
  onToggle: () => void;
  onIncorporar: (processo: ProcessoEnriquecido, tese: TeseExtraida) => void;
  onCopiarCitacao: (processo: ProcessoEnriquecido) => void;
  processosIncorporados: Set<string>;
}) {
  const { tese, processos, totalEncontrado } = resultado;

  return (
    <Card className="border-l-2 border-l-primary/40">
      <CardHeader className="p-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">{tese.titulo}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{tese.descricao}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-xs">
                {processos.length} processo{processos.length !== 1 ? "s" : ""}
              </Badge>
              {tese.artigosRelacionados.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {tese.artigosRelacionados.slice(0, 2).join(", ")}
                </Badge>
              )}
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-3 pt-0 space-y-2">
          {/* Termos-chave */}
          <div className="flex flex-wrap gap-1">
            {tese.termosChave.slice(0, 6).map((termo, idx) => (
              <span key={idx} className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-sm">
                {termo}
              </span>
            ))}
          </div>

          {/* Lista de processos */}
          {processos.length > 0 ? (
            <div className="space-y-2 mt-3">
              {processos.map((processo) => (
                <ProcessoCard
                  key={processo.numeroProcesso}
                  processo={processo}
                  tese={tese}
                  onIncorporar={onIncorporar}
                  onCopiarCitacao={onCopiarCitacao}
                  jaIncorporado={processosIncorporados.has(processo.numeroProcesso)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">
              Nenhum processo encontrado para esta tese nos tribunais selecionados
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// COMPONENTE DE CARD DE PROCESSO
// ============================================================================

function ProcessoCard({
  processo,
  tese,
  onIncorporar,
  onCopiarCitacao,
  jaIncorporado,
}: {
  processo: ProcessoEnriquecido;
  tese: TeseExtraida;
  onIncorporar: (processo: ProcessoEnriquecido, tese: TeseExtraida) => void;
  onCopiarCitacao: (processo: ProcessoEnriquecido) => void;
  jaIncorporado: boolean;
}) {
  const data = new Date(processo.dataAjuizamento).toLocaleDateString("pt-BR");
  const { validacao } = processo;

  const scoreColor = validacao.scoreValidacao >= 70
    ? "text-green-500"
    : validacao.scoreValidacao >= 40
    ? "text-amber-500"
    : "text-red-400";

  const ScoreIcon = validacao.scoreValidacao >= 70
    ? CheckCircle2
    : validacao.scoreValidacao >= 40
    ? AlertTriangle
    : XCircle;

  return (
    <div className={`p-3 rounded-sm border transition-colors ${
      jaIncorporado ? "bg-green-500/5 border-green-500/30" : "bg-muted/20 border-border hover:border-primary/30"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Número e tribunal */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-medium">{processo.numeroProcesso}</span>
            <Badge variant="outline" className="text-xs">
              {processo.tribunal}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {processo.grau}
            </Badge>
          </div>

          {/* Classe e órgão */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{processo.classe} — {processo.orgaoJulgador}</span>
          </div>

          {/* Assuntos */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span className="truncate">{processo.assuntos.slice(0, 2).join(", ")}</span>
          </div>

          {/* Data e movimento */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {data}
            </span>
            {processo.movimentoRecente && (
              <span className="truncate text-xs italic">
                Último: {processo.movimentoRecente}
              </span>
            )}
          </div>

          {/* Validação */}
          <div className="flex items-center gap-2 mt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`flex items-center gap-1 text-xs ${scoreColor}`}>
                  <ScoreIcon className="h-3 w-3" />
                  {validacao.scoreValidacao}/100
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Checklist de Validação</p>
                  <p>{validacao.temFonteOficial ? "✅" : "❌"} Fonte oficial (DataJud/CNJ)</p>
                  <p>{validacao.temIdentificacaoCompleta ? "✅" : "❌"} Identificação completa</p>
                  <p>{validacao.temDataRecente ? "✅" : "❌"} Data recente (2022+)</p>
                  <p>{validacao.temAderenciaFatica ? "✅" : "❌"} Aderência fática à tese</p>
                  {validacao.alertas.length > 0 && (
                    <div className="mt-1 pt-1 border-t">
                      {validacao.alertas.map((a, i) => (
                        <p key={i} className="text-amber-500">⚠️ {a}</p>
                      ))}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
            {validacao.alertas.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>{validacao.alertas[0]}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={jaIncorporado ? "secondary" : "default"}
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => onIncorporar(processo, tese)}
                disabled={jaIncorporado}
              >
                {jaIncorporado ? (
                  <><CheckCircle2 className="h-3 w-3" />Incorporado</>
                ) : (
                  <><Plus className="h-3 w-3" />Incorporar</>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {jaIncorporado ? "Já incorporado ao documento" : "Adicionar ao documento"}
            </TooltipContent>
          </Tooltip>

          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onCopiarCitacao(processo)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar citação</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                  <a href={processo.linkOficial} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Abrir no tribunal</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
