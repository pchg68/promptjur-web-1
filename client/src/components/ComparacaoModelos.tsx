import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GitCompareArrows,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Copy,
  Download,
  Trophy,
  BarChart3,
  AlertTriangle,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { copyToClipboard, exportAsMarkdown } from "@/utils/dashboardUtils";
import { ValidacaoLegislacao } from "@/components/ValidacaoLegislacao";
import { useAuth } from "@/_core/hooks/useAuth";
import type { PlanTier } from "@/components/ModelSelector";

interface ModeloDisponivel {
  provider: string;
  model: string;
  name: string;
  description: string;
  tier: string;
  badge?: string;
}

const MODELOS_COMPARACAO: ModeloDisponivel[] = [
  { provider: "manus", model: "manus-default", name: "Manus AI", description: "Otimizado para direito brasileiro", tier: "free", badge: "Padrão" },
  { provider: "openai", model: "gpt-4o-mini", name: "GPT-4o Mini", description: "Rápido e econômico", tier: "free" },
  { provider: "openai", model: "gpt-4o", name: "GPT-4o", description: "Multimodal avançado", tier: "pro" },
  { provider: "anthropic", model: "claude-sonnet", name: "Claude Sonnet", description: "Raciocínio jurídico superior", tier: "pro", badge: "Recomendado" },
  { provider: "google", model: "gemini-pro", name: "Gemini Pro", description: "Contexto de 1M tokens", tier: "pro" },
  { provider: "google", model: "gemini-flash", name: "Gemini Flash", description: "Ultra-rápido", tier: "pro" },
  { provider: "perplexity", model: "perplexity-sonar", name: "Perplexity Sonar", description: "Pesquisa com fontes", tier: "pro", badge: "Pesquisa" },
  { provider: "openai", model: "o1", name: "o1 (Raciocínio)", description: "Raciocínio profundo", tier: "enterprise" },
  { provider: "anthropic", model: "claude-opus", name: "Claude Opus", description: "Máxima qualidade", tier: "enterprise" },
];

const PLAN_HIERARCHY: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
const TIER_LABELS: Record<string, string> = { free: "Grátis", pro: "Pro", enterprise: "Escritório" };
const TIER_COLORS: Record<string, string> = {
  free: "bg-zinc-500/10 text-zinc-500",
  pro: "bg-amber-500/10 text-amber-600",
  enterprise: "bg-violet-500/10 text-violet-600",
};

const PROVIDER_COLORS: Record<string, string> = {
  manus: "bg-blue-600",
  openai: "bg-emerald-600",
  anthropic: "bg-orange-600",
  google: "bg-sky-600",
  perplexity: "bg-purple-600",
};

interface ComparacaoResultado {
  status: "success" | "error";
  provider: string;
  model: string;
  documento?: string;
  erro?: string;
  tempoGeracao: number;
  tamanhoTexto?: number;
  palavras?: number;
  paragrafos?: number;
  validacaoLegislacao?: {
    confiabilidadeGeral: string;
    totalCitacoes: number;
    citacoesValidadas: number;
    citacoes: unknown[];
  };
}

interface ComparacaoModelosProps {
  promptText: string;
  promptId?: number;
  tipoDocumento?: string;
  areaJuridica?: string;
  titulo?: string;
  onIncorporar?: (documento: string) => void;
}

export function ComparacaoModelos({
  promptText,
  promptId,
  tipoDocumento,
  areaJuridica,
  titulo = "Documento",
  onIncorporar,
}: ComparacaoModelosProps) {
  const { user } = useAuth();
  const userPlan = ((user as any)?.subscriptionPlan || "free") as PlanTier;
  const [isOpen, setIsOpen] = useState(false);
  const [modelosSelecionados, setModelosSelecionados] = useState<string[]>([
    "manus:manus-default",
    "openai:gpt-4o-mini",
  ]);
  const [resultados, setResultados] = useState<ComparacaoResultado[] | null>(null);
  const [tempoTotal, setTempoTotal] = useState(0);
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});

  const compararMutation = trpc.prompts.compararModelos.useMutation({
    onSuccess: (data) => {
      setResultados(data.comparacoes as ComparacaoResultado[]);
      setTempoTotal(data.tempoTotal);
      // Expand all by default
      const expanded: Record<number, boolean> = {};
      data.comparacoes.forEach((_: unknown, i: number) => { expanded[i] = true; });
      setExpandedResults(expanded);
      toast.success(`Comparação concluída! ${data.modelosComparados} modelos analisados.`);
    },
    onError: (error) => {
      toast.error(`Erro na comparação: ${error.message}`);
    },
  });

  const canAccess = (tier: string) => PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[tier];

  const toggleModelo = (key: string, tier: string) => {
    if (!canAccess(tier)) {
      toast.error(`Modelo disponível apenas no plano ${TIER_LABELS[tier]}`);
      return;
    }
    setModelosSelecionados((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 2) {
          toast.warning("Selecione pelo menos 2 modelos para comparar");
          return prev;
        }
        return prev.filter((m) => m !== key);
      }
      if (prev.length >= 4) {
        toast.warning("Máximo de 4 modelos para comparação");
        return prev;
      }
      return [...prev, key];
    });
  };

  const handleComparar = () => {
    const modelos = modelosSelecionados.map((key) => {
      const [provider, ...modelParts] = key.split(":");
      return { provider: provider as any, model: modelParts.join(":") || undefined };
    });
    compararMutation.mutate({
      promptText,
      promptId,
      tipoDocumento,
      areaJuridica,
      modelos,
    });
  };

  // Calcular métricas comparativas
  const metricas = useMemo(() => {
    if (!resultados) return null;
    const successResults = resultados.filter((r) => r.status === "success");
    if (successResults.length < 2) return null;

    const maisRapido = successResults.reduce((a, b) => a.tempoGeracao < b.tempoGeracao ? a : b);
    const maisDetalhado = successResults.reduce((a, b) => (a.palavras || 0) > (b.palavras || 0) ? a : b);
    const melhorValidacao = successResults.reduce((a, b) => {
      const scoreA = a.validacaoLegislacao ? a.validacaoLegislacao.citacoesValidadas / Math.max(a.validacaoLegislacao.totalCitacoes, 1) : 0;
      const scoreB = b.validacaoLegislacao ? b.validacaoLegislacao.citacoesValidadas / Math.max(b.validacaoLegislacao.totalCitacoes, 1) : 0;
      return scoreA >= scoreB ? a : b;
    });

    return { maisRapido, maisDetalhado, melhorValidacao };
  }, [resultados]);

  const toggleExpanded = (index: number) => {
    setExpandedResults((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2 h-11"
        >
          <div className="flex items-center gap-2">
            <GitCompareArrows className="w-4 h-4" />
            <span className="text-sm font-semibold">Comparar Modelos de IA</span>
            <Badge variant="secondary" className="text-[10px]">
              {modelosSelecionados.length} selecionados
            </Badge>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="mt-3 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GitCompareArrows className="w-5 h-5 text-primary" />
              Comparação Lado a Lado
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Selecione 2 a 4 modelos para executar o mesmo prompt e comparar os resultados
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Seleção de Modelos */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Modelos para comparação:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {MODELOS_COMPARACAO.map((m) => {
                  const key = `${m.provider}:${m.model}`;
                  const isSelected = modelosSelecionados.includes(key);
                  const isLocked = !canAccess(m.tier);

                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center gap-2 p-2 rounded-sm border cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : isLocked
                              ? "border-muted bg-muted/30 opacity-60"
                              : "border-border hover:border-primary/40 hover:bg-primary/5"
                          }`}
                          onClick={() => toggleModelo(key, m.tier)}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={isLocked}
                            className="pointer-events-none"
                          />
                          <div
                            className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[m.provider] || "bg-gray-500"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium truncate">{m.name}</span>
                              {m.badge && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                  {m.badge}
                                </Badge>
                              )}
                              {isLocked && (
                                <Badge className={`text-[9px] px-1 py-0 ${TIER_COLORS[m.tier]}`}>
                                  {TIER_LABELS[m.tier]}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                        {isLocked && (
                          <p className="text-xs text-amber-500 mt-1">
                            Requer plano {TIER_LABELS[m.tier]}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Botão Comparar */}
            <Button
              onClick={handleComparar}
              disabled={compararMutation.isPending || modelosSelecionados.length < 2}
              className="w-full gap-2"
            >
              {compararMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Comparando {modelosSelecionados.length} modelos...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Comparar {modelosSelecionados.length} Modelos
                </>
              )}
            </Button>

            {/* Progresso */}
            {compararMutation.isPending && (
              <div className="p-3 bg-primary/10 rounded-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-medium">Executando comparação...</p>
                    <p className="text-xs text-muted-foreground">
                      Os {modelosSelecionados.length} modelos estão processando o prompt simultaneamente
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Erro */}
            {compararMutation.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                {compararMutation.error.message}
              </div>
            )}

            {/* Métricas Resumo */}
            {metricas && resultados && (
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-medium text-muted-foreground">Mais Rápido</span>
                  </div>
                  <p className="text-xs font-bold truncate">{metricas.maisRapido.model}</p>
                  <p className="text-[10px] text-muted-foreground">{(metricas.maisRapido.tempoGeracao / 1000).toFixed(1)}s</p>
                </Card>
                <Card className="p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-medium text-muted-foreground">Mais Detalhado</span>
                  </div>
                  <p className="text-xs font-bold truncate">{metricas.maisDetalhado.model}</p>
                  <p className="text-[10px] text-muted-foreground">{metricas.maisDetalhado.palavras} palavras</p>
                </Card>
                <Card className="p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-medium text-muted-foreground">Melhor Validação</span>
                  </div>
                  <p className="text-xs font-bold truncate">{metricas.melhorValidacao.model}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {metricas.melhorValidacao.validacaoLegislacao?.citacoesValidadas || 0}/
                    {metricas.melhorValidacao.validacaoLegislacao?.totalCitacoes || 0} citações
                  </p>
                </Card>
              </div>
            )}

            {/* Resultados Lado a Lado */}
            {resultados && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Resultados ({resultados.filter(r => r.status === "success").length}/{resultados.length} sucesso)
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Total: {(tempoTotal / 1000).toFixed(1)}s
                  </Badge>
                </div>

                <div className={`grid gap-3 ${
                  resultados.length === 2 ? "grid-cols-1 lg:grid-cols-2" :
                  resultados.length === 3 ? "grid-cols-1 lg:grid-cols-3" :
                  "grid-cols-1 lg:grid-cols-2"
                }`}>
                  {resultados.map((resultado, index) => (
                    <Card
                      key={index}
                      className={`overflow-hidden ${
                        resultado.status === "error"
                          ? "border-destructive/30"
                          : metricas?.maisRapido === resultado
                          ? "border-primary/40 ring-1 ring-primary/20"
                          : "border-border"
                      }`}
                    >
                      {/* Header do resultado */}
                      <div className="p-3 border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${PROVIDER_COLORS[resultado.provider] || "bg-gray-500"}`} />
                            <span className="text-sm font-semibold">{resultado.model}</span>
                            {resultado.status === "success" && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            )}
                            {resultado.status === "error" && (
                              <XCircle className="w-3.5 h-3.5 text-destructive" />
                            )}
                          </div>
                          {metricas?.maisRapido === resultado && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Trophy className="w-4 h-4 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>Mais rápido</TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {/* Métricas do resultado */}
                        {resultado.status === "success" && (
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {(resultado.tempoGeracao / 1000).toFixed(1)}s
                            </span>
                            <span>{resultado.palavras} palavras</span>
                            <span>{resultado.paragrafos} parágrafos</span>
                            {resultado.validacaoLegislacao && (
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                {resultado.validacaoLegislacao.citacoesValidadas}/{resultado.validacaoLegislacao.totalCitacoes}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Conteúdo */}
                      <CardContent className="p-0">
                        {resultado.status === "error" ? (
                          <div className="p-3 flex items-center gap-2 text-destructive text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {resultado.erro}
                          </div>
                        ) : (
                          <>
                            {/* Documento */}
                            <div
                              className={`p-3 ${expandedResults[index] ? "max-h-[500px]" : "max-h-[200px]"} overflow-y-auto transition-all`}
                            >
                              <div className="prose prose-sm max-w-none dark:prose-invert abnt-document">
                                <Streamdown>{resultado.documento || ""}</Streamdown>
                              </div>
                            </div>

                            {/* Toggle expandir */}
                            <div className="px-3 py-1 border-t bg-muted/20">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-6 text-[10px]"
                                onClick={() => toggleExpanded(index)}
                              >
                                {expandedResults[index] ? (
                                  <><ChevronUp className="w-3 h-3 mr-1" />Recolher</>
                                ) : (
                                  <><ChevronDown className="w-3 h-3 mr-1" />Expandir</>
                                )}
                              </Button>
                            </div>

                            {/* Validação */}
                            {resultado.validacaoLegislacao && expandedResults[index] && (
                              <div className="px-3 pb-2">
                                <ValidacaoLegislacao validacao={resultado.validacaoLegislacao as any} />
                              </div>
                            )}

                            {/* Ações */}
                            <div className="p-2 border-t flex items-center gap-1.5 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  copyToClipboard(resultado.documento || "");
                                  toast.success(`Documento do ${resultado.model} copiado!`);
                                }}
                              >
                                <Copy className="w-3 h-3" />
                                Copiar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => exportAsMarkdown(`${titulo} - ${resultado.model}`, resultado.documento || "")}
                              >
                                <Download className="w-3 h-3" />
                                Exportar
                              </Button>
                              {onIncorporar && resultado.documento && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => {
                                    onIncorporar(resultado.documento!);
                                    toast.success(`Resultado do ${resultado.model} selecionado!`);
                                  }}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Usar Este
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
