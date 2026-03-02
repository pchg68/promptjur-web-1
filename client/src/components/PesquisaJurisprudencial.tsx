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
  Info,
} from "lucide-react";
import { toast } from "sonner";

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

// ============================================================================
// CONSTANTES
// ============================================================================

const TRIBUNAIS_OPCOES = [
  { grupo: "Tribunais Superiores", items: [
    { value: "STJ", label: "STJ" },
  ]},
  { grupo: "Justiça Federal", items: [
    { value: "TRF1", label: "TRF 1ª Região" },
    { value: "TRF2", label: "TRF 2ª Região" },
    { value: "TRF3", label: "TRF 3ª Região" },
    { value: "TRF4", label: "TRF 4ª Região" },
    { value: "TRF5", label: "TRF 5ª Região" },
  ]},
  { grupo: "Justiça Estadual", items: [
    { value: "TJSP", label: "TJ-SP" },
    { value: "TJRJ", label: "TJ-RJ" },
    { value: "TJMG", label: "TJ-MG" },
    { value: "TJRS", label: "TJ-RS" },
    { value: "TJPR", label: "TJ-PR" },
    { value: "TJSC", label: "TJ-SC" },
    { value: "TJBA", label: "TJ-BA" },
    { value: "TJPE", label: "TJ-PE" },
    { value: "TJCE", label: "TJ-CE" },
    { value: "TJGO", label: "TJ-GO" },
  ]},
];

const TRIBUNAIS_PADRAO = ["STJ", "TJSP", "TJPR", "TJRJ", "TJRS"];

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
  const [showFiltros, setShowFiltros] = useState(false);
  const [processosIncorporados, setProcessosIncorporados] = useState<Set<string>>(new Set());
  const [teseAberta, setTeseAberta] = useState<string | null>(null);

  const pesquisaMutation = trpc.pesquisaJurisprudencial.pesquisar.useMutation({
    onSuccess: (data) => {
      toast.success(`Pesquisa concluída: ${data.metadados.totalProcessos} processos encontrados em ${data.metadados.tempoTotal}ms`);
      // Abrir a primeira tese automaticamente
      if (data.resultados.length > 0) {
        setTeseAberta(data.resultados[0].tese.id);
      }
    },
    onError: (error) => {
      toast.error("Erro na pesquisa jurisprudencial", { description: error.message });
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
    });
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

  const hasResultados = pesquisaMutation.data && pesquisaMutation.data.resultados.length > 0;

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
              Cada processo possui link oficial para verificação. Nenhuma jurisprudência é inventada ou fabricada.
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
          </button>

          {showFiltros && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-sm">
              {/* Tribunais */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tribunais ({tribunaisSelecionados.length} selecionados)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TRIBUNAIS_OPCOES.map(grupo => (
                    grupo.items.map(t => (
                      <button
                        key={t.value}
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
                    ))
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
          disabled={pesquisaMutation.isPending || !promptTexto || promptTexto.trim().length < 20}
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
              {hasResultados ? "Pesquisar Novamente" : "Pesquisar Jurisprudência"}
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
              <span>Consultando {tribunaisSelecionados.length} tribunais via DataJud/CNJ</span>
            </div>
          </div>
        )}

        {/* Resultados */}
        {pesquisaMutation.data && (
          <div className="space-y-4">
            {/* Metadados */}
            <div className="flex items-center justify-between text-xs text-muted-foreground p-2 bg-muted/20 rounded-sm">
              <span>
                {pesquisaMutation.data.teses.length} teses identificadas •{" "}
                {pesquisaMutation.data.metadados.totalProcessos} processos encontrados
              </span>
              <span>
                {pesquisaMutation.data.metadados.tribunaisConsultados.join(", ")} •{" "}
                {pesquisaMutation.data.metadados.tempoTotal}ms
              </span>
            </div>

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
                <p className="text-sm mt-1">Tente expandir os tribunais ou o período de busca</p>
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
