/**
 * Painel de Monitoramento LLM — acesso restrito a administradores.
 * Exibe métricas de uso, frequência de fallbacks, erros e tendências.
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Activity, AlertTriangle, ArrowLeft, RefreshCw, Zap, Clock, GitBranch, BarChart3, AlertCircle, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StatusLlm = "sucesso" | "erro" | "timeout" | "fallback_sucesso" | "fallback_erro";

interface LlmLogRow {
  id: number;
  userId: number | null;
  providerSolicitado: string;
  modeloSolicitado: string;
  providerEfetivo: string;
  modeloEfetivo: string;
  houveFallback: boolean;
  status: StatusLlm;
  latenciaMs: number | null;
  tokensEntrada: number | null;
  tokensSaida: number | null;
  contexto: string | null;
  erroMensagem: string | null;
  erroTipo: string | null;
  numeroTentativa: number;
  createdAt: string;
}

// ─── Helpers visuais ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusLlm, { label: string; color: string; icon: React.ReactNode }> = {
  sucesso: { label: "Sucesso", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-3 h-3" /> },
  erro: { label: "Erro", color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" /> },
  timeout: { label: "Timeout", color: "bg-orange-100 text-orange-800", icon: <Clock className="w-3 h-3" /> },
  fallback_sucesso: { label: "Fallback OK", color: "bg-blue-100 text-blue-800", icon: <GitBranch className="w-3 h-3" /> },
  fallback_erro: { label: "Fallback Falhou", color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: StatusLlm }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.erro;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function MetricCard({
  title, value, subtitle, icon, color = "text-foreground",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Gráfico de tendência ─────────────────────────────────────────────────────

function TendenciaChart({ dados }: { dados: Array<{ hora: string; chamadas: number; erros: number; fallbacks: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || dados.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = dados.map(d => {
      const date = new Date(d.hora);
      return `${date.getHours().toString().padStart(2, "0")}:00`;
    });

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Chamadas",
            data: dados.map(d => d.chamadas),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.08)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Erros",
            data: dados.map(d => d.erros),
            borderColor: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.08)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Fallbacks",
            data: dados.map(d => d.fallbacks),
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245,158,11,0.08)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [dados]);

  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhum dado disponível ainda. As chamadas LLM aparecerão aqui.
      </div>
    );
  }

  return (
    <div style={{ height: 260 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Gráfico de providers ─────────────────────────────────────────────────────

function ProviderChart({ dados }: { dados: Array<{ provider: string; chamadas: number; erros: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || dados.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: dados.map(d => d.provider),
        datasets: [
          {
            label: "Chamadas",
            data: dados.map(d => d.chamadas),
            backgroundColor: "#3b82f6",
            borderRadius: 4,
          },
          {
            label: "Erros",
            data: dados.map(d => d.erros),
            backgroundColor: "#ef4444",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [dados]);

  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhum dado de provider disponível.
      </div>
    );
  }

  return (
    <div style={{ height: 220 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Tabela de logs ───────────────────────────────────────────────────────────

function TabelaLogs({ logs }: { logs: LlmLogRow[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Activity className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Nenhum log encontrado com os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4 font-medium text-muted-foreground">Data/Hora</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Status</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Provider</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Modelo</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Latência</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Tokens</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Contexto</th>
            <th className="py-2 font-medium text-muted-foreground">Erro</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit", month: "2-digit",
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })}
              </td>
              <td className="py-2 pr-4">
                <StatusBadge status={log.status} />
              </td>
              <td className="py-2 pr-4">
                <div className="flex flex-col">
                  <span className="font-medium">{log.providerEfetivo}</span>
                  {log.houveFallback && (
                    <span className="text-xs text-amber-600">↩ de {log.providerSolicitado}</span>
                  )}
                </div>
              </td>
              <td className="py-2 pr-4 text-xs text-muted-foreground">{log.modeloEfetivo}</td>
              <td className="py-2 pr-4 text-xs">
                {log.latenciaMs != null ? (
                  <span className={log.latenciaMs > 10000 ? "text-orange-600 font-medium" : ""}>
                    {log.latenciaMs >= 1000
                      ? `${(log.latenciaMs / 1000).toFixed(1)}s`
                      : `${log.latenciaMs}ms`}
                  </span>
                ) : "—"}
              </td>
              <td className="py-2 pr-4 text-xs text-muted-foreground">
                {log.tokensEntrada != null || log.tokensSaida != null
                  ? `${log.tokensEntrada ?? 0} / ${log.tokensSaida ?? 0}`
                  : "—"}
              </td>
              <td className="py-2 pr-4 text-xs text-muted-foreground">{log.contexto ?? "—"}</td>
              <td className="py-2 text-xs max-w-xs">
                {log.erroMensagem ? (
                  <span className="text-red-600 truncate block max-w-xs" title={log.erroMensagem}>
                    {log.erroMensagem.substring(0, 60)}{log.erroMensagem.length > 60 ? "…" : ""}
                  </span>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MonitoramentoLLM() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [periodo, setPeriodo] = useState<"1" | "24" | "168">("24");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroProvider, setFiltroProvider] = useState<string>("todos");
  const [apenasErros, setApenasErros] = useState(false);
  const [apenasFallbacks, setApenasFallbacks] = useState(false);

  // Verificar se é admin
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const { data: resumo, isLoading: loadingResumo, refetch: refetchResumo } = trpc.monitoramento.resumo.useQuery(
    undefined,
    { refetchInterval: 30000 } // auto-refresh a cada 30s
  );

  const { data: metricas, isLoading: loadingMetricas, refetch: refetchMetricas } = trpc.monitoramento.metricas.useQuery(
    { horasAtras: Number(periodo) },
    { refetchInterval: 30000 }
  );

  const { data: logs, isLoading: loadingLogs, refetch: refetchLogs } = trpc.monitoramento.logs.useQuery(
    {
      limit: 100,
      status: filtroStatus !== "todos" ? filtroStatus as StatusLlm : undefined,
      provider: filtroProvider !== "todos" ? filtroProvider : undefined,
      apenasErros: apenasErros || undefined,
      apenasFallbacks: apenasFallbacks || undefined,
      horasAtras: Number(periodo),
    },
    { refetchInterval: 30000 }
  );

  const handleRefresh = () => {
    refetchResumo();
    refetchMetricas();
    refetchLogs();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const dadosAtivos = periodo === "1"
    ? resumo?.ultima1h
    : periodo === "24"
      ? resumo?.ultimas24h
      : resumo?.ultimas7d;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-tools")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Monitoramento LLM
              </h1>
              <p className="text-sm text-muted-foreground">Logs de chamadas, erros e fallbacks de IA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as "1" | "24" | "168")}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Última 1 hora</SelectItem>
                <SelectItem value="24">Últimas 24 horas</SelectItem>
                <SelectItem value="168">Últimos 7 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Cards de métricas rápidas */}
        {loadingResumo ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total de Chamadas"
              value={dadosAtivos?.totalChamadas ?? 0}
              subtitle={`Período selecionado`}
              icon={<Zap className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Taxa de Sucesso"
              value={`${dadosAtivos?.taxaSucesso ?? 0}%`}
              subtitle={`${(dadosAtivos && 'totalSucesso' in dadosAtivos ? (dadosAtivos as any).totalSucesso : 0) ?? 0} bem-sucedidas`}
              icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
              color={(dadosAtivos?.taxaSucesso ?? 100) >= 90 ? "text-green-600" : "text-orange-600"}
            />
            <MetricCard
              title="Erros"
              value={dadosAtivos?.totalErros ?? 0}
              subtitle="Inclui timeouts"
              icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
              color={(dadosAtivos?.totalErros ?? 0) > 0 ? "text-red-600" : "text-foreground"}
            />
            <MetricCard
              title="Fallbacks"
              value={dadosAtivos?.totalFallbacks ?? 0}
              subtitle="Trocas automáticas de provider"
              icon={<GitBranch className="w-5 h-5 text-amber-500" />}
              color={(dadosAtivos?.totalFallbacks ?? 0) > 0 ? "text-amber-600" : "text-foreground"}
            />
          </div>
        )}

        {/* Segunda linha de métricas */}
        {!loadingResumo && resumo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Latência Média"
              value={(() => {
                const lat = dadosAtivos && 'latenciaMediaMs' in dadosAtivos
                  ? (dadosAtivos as any).latenciaMediaMs
                  : null;
                if (lat == null) return "—";
                return lat >= 1000 ? `${(lat / 1000).toFixed(1)}s` : `${lat}ms`;
              })()}
              icon={<Clock className="w-5 h-5 text-purple-500" />}
            />
            <MetricCard
              title="Total de Tokens"
              value={dadosAtivos && "totalTokens" in dadosAtivos
                ? (dadosAtivos.totalTokens ?? 0).toLocaleString("pt-BR")
                : "—"}
              subtitle="Entrada + saída"
              icon={<BarChart3 className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Última 1h — Chamadas"
              value={resumo.ultima1h.totalChamadas}
              subtitle={`${resumo.ultima1h.totalErros} erros`}
              icon={<TrendingUp className="w-5 h-5 text-teal-500" />}
            />
            <MetricCard
              title="Última 1h — Taxa Sucesso"
              value={`${resumo.ultima1h.taxaSucesso}%`}
              subtitle={`Latência: ${resumo.ultima1h.latenciaMediaMs}ms`}
              icon={<Activity className="w-5 h-5 text-cyan-500" />}
              color={resumo.ultima1h.taxaSucesso >= 90 ? "text-green-600" : "text-orange-600"}
            />
          </div>
        )}

        {/* Gráficos e tabela */}
        <Tabs defaultValue="tendencia">
          <TabsList>
            <TabsTrigger value="tendencia">Tendência</TabsTrigger>
            <TabsTrigger value="providers">Por Provider</TabsTrigger>
            <TabsTrigger value="erros">Tipos de Erro</TabsTrigger>
            <TabsTrigger value="logs">Logs Detalhados</TabsTrigger>
          </TabsList>

          {/* Aba Tendência */}
          <TabsContent value="tendencia">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chamadas por Hora</CardTitle>
                <CardDescription>Chamadas, erros e fallbacks ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMetricas ? (
                  <div className="h-64 bg-muted animate-pulse rounded" />
                ) : (
                  <TendenciaChart dados={metricas?.tendencia24h ?? []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Por Provider */}
          <TabsContent value="providers">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chamadas por Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="h-48 bg-muted animate-pulse rounded" />
                  ) : (
                    <ProviderChart dados={metricas?.porProvider ?? []} />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalhes por Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
                    </div>
                  ) : (metricas?.porProvider ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Nenhum dado disponível.</p>
                  ) : (
                    <div className="space-y-3">
                      {(metricas?.porProvider ?? []).map(p => (
                        <div key={p.provider} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <span className="font-medium capitalize">{p.provider}</span>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{p.chamadas} chamadas</span>
                              <span className="text-red-500">{p.erros} erros</span>
                              <span className="text-amber-500">{p.fallbacks} fallbacks</span>
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>{p.latenciaMedia}ms</div>
                            <div className={p.chamadas > 0 && ((p.chamadas - p.erros) / p.chamadas) >= 0.9 ? "text-green-600" : "text-orange-600"}>
                              {p.chamadas > 0 ? Math.round(((p.chamadas - p.erros) / p.chamadas) * 100) : 0}% ok
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Tipos de Erro */}
          <TabsContent value="erros">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Erros por Tipo</CardTitle>
                <CardDescription>Categorização automática dos erros detectados</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMetricas ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
                  </div>
                ) : (metricas?.errosPorTipo ?? []).length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mb-3 text-green-500 opacity-60" />
                    <p className="text-sm">Nenhum erro registrado no período. Ótimo!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(metricas?.errosPorTipo ?? []).map(e => {
                      const TIPO_LABELS: Record<string, { label: string; color: string }> = {
                        timeout: { label: "Timeout", color: "bg-orange-100 text-orange-800" },
                        auth: { label: "Autenticação", color: "bg-red-100 text-red-800" },
                        config: { label: "Configuração", color: "bg-yellow-100 text-yellow-800" },
                        rate_limit: { label: "Rate Limit", color: "bg-purple-100 text-purple-800" },
                        upstream: { label: "Upstream (500)", color: "bg-red-100 text-red-800" },
                      };
                      const cfg = TIPO_LABELS[e.tipo] ?? { label: e.tipo, color: "bg-muted text-muted-foreground" };
                      return (
                        <div key={e.tipo} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                          <span className="font-bold text-red-600">{e.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Logs Detalhados */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base">Logs Detalhados</CardTitle>
                    <CardDescription>Histórico de chamadas com filtros</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="sucesso">Sucesso</SelectItem>
                        <SelectItem value="erro">Erro</SelectItem>
                        <SelectItem value="timeout">Timeout</SelectItem>
                        <SelectItem value="fallback_sucesso">Fallback OK</SelectItem>
                        <SelectItem value="fallback_erro">Fallback Falhou</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filtroProvider} onValueChange={setFiltroProvider}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue placeholder="Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="manus">Manus</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="perplexity">Perplexity</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant={apenasErros ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => { setApenasErros(!apenasErros); setApenasFallbacks(false); }}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Só erros
                    </Button>
                    <Button
                      variant={apenasFallbacks ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => { setApenasFallbacks(!apenasFallbacks); setApenasErros(false); }}
                    >
                      <GitBranch className="w-3 h-3 mr-1" />
                      Só fallbacks
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
                  </div>
                ) : (
                  <TabelaLogs logs={(logs ?? []) as LlmLogRow[]} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
