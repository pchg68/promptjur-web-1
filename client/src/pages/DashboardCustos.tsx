/**
 * Dashboard de Custo Estimado LLM
 * Visualiza gastos estimados com modelos de linguagem por modelo, provider, período e usuário.
 * Acesso restrito a administradores.
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, TrendingDown, Minus, Zap, BarChart3,
  ArrowLeft, RefreshCw, Info, ChevronDown, ChevronUp, Users,
} from "lucide-react";
import Chart from "chart.js/auto";
import { PROVIDERS_DISPONIVEIS, CORES_CATEGORIA } from "@shared/llm-pricing";

// ─── Helpers de formatação ────────────────────────────────────────────────────

function fmtUsd(v: number): string {
  if (v === 0) return "$0.0000";
  if (v < 0.001) return `$${(v * 1000).toFixed(4)}m`;
  if (v < 1) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(2)}`;
}

function fmtBrl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 });
}

function fmtNum(v: number): string {
  return v.toLocaleString("pt-BR");
}

function fmtPercent(v: number): string {
  return `${v.toFixed(1)}%`;
}

// ─── Componente de card de métrica ────────────────────────────────────────────

function MetricCard({
  title, valueUsd, valueBrl, subtitle, icon, trend, color = "text-foreground",
}: {
  title: string;
  valueUsd: string;
  valueBrl?: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "alta" | "queda" | "estavel" | null;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">{title}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{valueUsd}</p>
            {valueBrl && <p className="text-xs text-muted-foreground mt-0.5">{valueBrl}</p>}
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="ml-3 flex flex-col items-end gap-1">
            {icon}
            {trend && (
              <span className={`text-xs font-medium ${trend === "alta" ? "text-red-500" : trend === "queda" ? "text-green-500" : "text-muted-foreground"}`}>
                {trend === "alta" ? <TrendingUp className="w-3 h-3" /> : trend === "queda" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Gráfico de tendência diária ──────────────────────────────────────────────

function GraficoTendencia({ dados }: { dados: { periodo: string; custoUsd: number; chamadas: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || dados.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = dados.map(d => {
      const [, mes, dia] = d.periodo.split("-");
      return `${dia}/${mes}`;
    });

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Custo (USD)",
            data: dados.map(d => d.custoUsd),
            backgroundColor: "rgba(99, 102, 241, 0.7)",
            borderColor: "rgba(99, 102, 241, 1)",
            borderWidth: 1,
            yAxisID: "y",
          },
          {
            label: "Chamadas",
            data: dados.map(d => d.chamadas),
            type: "line",
            borderColor: "rgba(34, 197, 94, 1)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderWidth: 2,
            pointRadius: 3,
            fill: false,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "top", labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const y = ctx.parsed.y ?? 0;
                if (ctx.datasetIndex === 0) return ` Custo: ${fmtUsd(y)}`;
                return ` Chamadas: ${fmtNum(y)}`;
              },
            },
          },
        },
        scales: {
          y: {
            type: "linear",
            position: "left",
            title: { display: true, text: "Custo (USD)", font: { size: 10 } },
            ticks: { callback: (v) => fmtUsd(Number(v)), font: { size: 10 } },
          },
          y1: {
            type: "linear",
            position: "right",
            title: { display: true, text: "Chamadas", font: { size: 10 } },
            grid: { drawOnChartArea: false },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [dados]);

  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Sem dados no período selecionado
      </div>
    );
  }

  return (
    <div style={{ height: "280px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Gráfico de pizza por provider ────────────────────────────────────────────

function GraficoProviders({ dados }: { dados: { provider: string; custoUsd: number; percentualDoTotal: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || dados.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const coresProvider: Record<string, string> = {
      openai: "#10a37f",
      anthropic: "#d97706",
      google: "#4285f4",
      manus: "#6366f1",
    };

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: dados.map(d => d.provider.charAt(0).toUpperCase() + d.provider.slice(1)),
        datasets: [{
          data: dados.map(d => d.custoUsd),
          backgroundColor: dados.map(d => coresProvider[d.provider] ?? "#94a3b8"),
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const d = dados[ctx.dataIndex];
                return ` ${fmtUsd(d.custoUsd)} (${fmtPercent(d.percentualDoTotal)})`;
              },
            },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [dados]);

  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Sem dados no período selecionado
      </div>
    );
  }

  return (
    <div style={{ height: "220px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DashboardCustos() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("720");       // horas (padrão: 30 dias)
  const [taxaCambio, setTaxaCambio] = useState("5.0");
  const [tabelaPrecosAberta, setTabelaPrecosAberta] = useState(false);
  const [topUsuariosAberto, setTopUsuariosAberto] = useState(false);

  // Redirecionar se não for admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const { data: resumo, isLoading: loadingResumo, refetch } = trpc.custosLlm.resumo.useQuery({
    horasAtras: Number(periodo),
    taxaCambio: Number(taxaCambio),
  });

  const { data: comparacao, isLoading: loadingComparacao } = trpc.custosLlm.comparacaoPeriodos.useQuery();
  const { data: projecao, isLoading: loadingProjecao } = trpc.custosLlm.projecao.useQuery({
    taxaCambio: Number(taxaCambio),
  });
  const { data: tabelaPrecos } = trpc.custosLlm.tabelaPrecos.useQuery();

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const corTendencia = comparacao?.tendencia === "alta"
    ? "text-red-600"
    : comparacao?.tendencia === "queda"
    ? "text-green-600"
    : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Admin
            </Button>
            <div className="h-4 w-px bg-border" />
            <DollarSign className="w-5 h-5 text-green-500" />
            <h1 className="font-bold text-lg">Dashboard de Custos LLM</h1>
            <Badge variant="outline" className="text-xs">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select value={taxaCambio} onValueChange={setTaxaCambio}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4.8">USD/BRL 4.80</SelectItem>
                <SelectItem value="5.0">USD/BRL 5.00</SelectItem>
                <SelectItem value="5.2">USD/BRL 5.20</SelectItem>
                <SelectItem value="5.5">USD/BRL 5.50</SelectItem>
                <SelectItem value="6.0">USD/BRL 6.00</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">Últimas 24h</SelectItem>
                <SelectItem value="168">Últimos 7 dias</SelectItem>
                <SelectItem value="720">Últimos 30 dias</SelectItem>
                <SelectItem value="2160">Últimos 90 dias</SelectItem>
                <SelectItem value="8760">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8">
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Cards de métricas principais */}
        {loadingResumo ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="pt-4 pb-3"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
            ))}
          </div>
        ) : resumo ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Custo Total"
                valueUsd={fmtUsd(resumo.totalCustoUsd)}
                valueBrl={fmtBrl(resumo.totalCustoBrl)}
                subtitle={resumo.periodo}
                icon={<DollarSign className="w-5 h-5 text-green-500" />}
                color={resumo.totalCustoUsd > 0 ? "text-green-600" : "text-foreground"}
              />
              <MetricCard
                title="Custo Médio/Chamada"
                valueUsd={fmtUsd(resumo.custoMedioUsd)}
                valueBrl={fmtBrl(resumo.custoMedioBrl)}
                subtitle={`${fmtNum(resumo.totalChamadas)} chamadas`}
                icon={<Zap className="w-5 h-5 text-blue-500" />}
              />
              <MetricCard
                title="Total de Tokens"
                valueUsd={fmtNum(resumo.totalTokens)}
                subtitle={`Entrada + saída`}
                icon={<BarChart3 className="w-5 h-5 text-indigo-500" />}
              />
              <MetricCard
                title="Projeção Mensal"
                valueUsd={fmtUsd(resumo.projecaoMensalUsd)}
                valueBrl={fmtBrl(resumo.projecaoMensalBrl)}
                subtitle="Baseado no período atual"
                icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
                color={resumo.projecaoMensalUsd > 0.01 ? "text-amber-600" : "text-foreground"}
              />
            </div>

            {/* Comparação de períodos */}
            {!loadingComparacao && comparacao && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {comparacao.periodoAtual.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{fmtUsd(comparacao.periodoAtual.custoUsd)}</p>
                    <p className="text-xs text-muted-foreground">{fmtBrl(comparacao.periodoAtual.custoBrl)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fmtNum(comparacao.periodoAtual.chamadas)} chamadas · {fmtNum(comparacao.periodoAtual.tokens)} tokens</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      {comparacao.periodoAnterior.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{fmtUsd(comparacao.periodoAnterior.custoUsd)}</p>
                    <p className="text-xs text-muted-foreground">{fmtBrl(comparacao.periodoAnterior.custoBrl)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fmtNum(comparacao.periodoAnterior.chamadas)} chamadas · {fmtNum(comparacao.periodoAnterior.tokens)} tokens</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {comparacao.tendencia === "alta" ? <TrendingUp className="w-4 h-4 text-red-500" /> : comparacao.tendencia === "queda" ? <TrendingDown className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4" />}
                      Variação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${corTendencia}`}>
                      {comparacao.variacaoPercent > 0 ? "+" : ""}{fmtPercent(comparacao.variacaoPercent)}
                    </p>
                    <p className="text-xs text-muted-foreground">vs. período anterior</p>
                    <Badge variant="outline" className={`mt-2 text-xs ${corTendencia}`}>
                      {comparacao.tendencia === "alta" ? "Custo subindo" : comparacao.tendencia === "queda" ? "Custo caindo" : "Estável"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        ) : null}

        {/* Gráficos */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Custo por Dia
                </CardTitle>
                <CardDescription className="text-xs">Evolução diária de custo e volume de chamadas</CardDescription>
              </CardHeader>
              <CardContent>
                <GraficoTendencia dados={resumo.tendenciaDiaria} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Custo por Provider
                </CardTitle>
                <CardDescription className="text-xs">Distribuição percentual de gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <GraficoProviders dados={resumo.porProvider} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs: por modelo / projeção */}
        {resumo && (
          <Tabs defaultValue="modelos">
            <TabsList className="mb-4">
              <TabsTrigger value="modelos">Por Modelo</TabsTrigger>
              <TabsTrigger value="providers">Por Provider</TabsTrigger>
              <TabsTrigger value="projecao">Projeções</TabsTrigger>
            </TabsList>

            {/* Tab: Por Modelo */}
            <TabsContent value="modelos">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Custo por Modelo de IA</CardTitle>
                  <CardDescription className="text-xs">Ordenado por custo total estimado</CardDescription>
                </CardHeader>
                <CardContent>
                  {resumo.porModelo.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado no período selecionado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead className="text-right">Chamadas</TableHead>
                          <TableHead className="text-right">Tokens</TableHead>
                          <TableHead className="text-right">Custo (USD)</TableHead>
                          <TableHead className="text-right">Custo (BRL)</TableHead>
                          <TableHead className="text-right">% do Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resumo.porModelo.map((m) => (
                          <TableRow key={m.modeloId}>
                            <TableCell className="font-medium text-sm">{m.nomeExibicao}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">{m.provider}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(m.chamadas)}</TableCell>
                            <TableCell className="text-right text-sm">{fmtNum(m.totalTokens)}</TableCell>
                            <TableCell className="text-right text-sm font-mono">{fmtUsd(m.custoUsd)}</TableCell>
                            <TableCell className="text-right text-sm font-mono">{fmtBrl(m.custoBrl)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${Math.min(m.percentualDoTotal, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-10 text-right">{fmtPercent(m.percentualDoTotal)}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Por Provider */}
            <TabsContent value="providers">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Custo por Provider</CardTitle>
                  <CardDescription className="text-xs">Resumo de gastos por fornecedor de IA</CardDescription>
                </CardHeader>
                <CardContent>
                  {resumo.porProvider.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado no período selecionado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead className="text-right">Chamadas</TableHead>
                          <TableHead className="text-right">Custo (USD)</TableHead>
                          <TableHead className="text-right">Custo (BRL)</TableHead>
                          <TableHead className="text-right">% do Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resumo.porProvider.map((p) => {
                          const provInfo = PROVIDERS_DISPONIVEIS.find(x => x.id === p.provider);
                          return (
                            <TableRow key={p.provider}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: provInfo?.cor ?? "#94a3b8" }}
                                  />
                                  <span className="font-medium text-sm capitalize">{provInfo?.nome ?? p.provider}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm">{fmtNum(p.chamadas)}</TableCell>
                              <TableCell className="text-right text-sm font-mono">{fmtUsd(p.custoUsd)}</TableCell>
                              <TableCell className="text-right text-sm font-mono">{fmtBrl(p.custoBrl)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min(p.percentualDoTotal, 100)}%`,
                                        backgroundColor: provInfo?.cor ?? "#94a3b8",
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-10 text-right">{fmtPercent(p.percentualDoTotal)}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Projeções */}
            <TabsContent value="projecao">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      Projeção de Custos
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {projecao?.baseCalculo ?? "Baseado nos últimos 7 dias"} · Câmbio: R$ {taxaCambio}/USD
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingProjecao ? (
                      <div className="space-y-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
                      </div>
                    ) : projecao ? (
                      <div className="space-y-3">
                        {[
                          { label: "Custo diário estimado", usd: projecao.custoDiarioUsd, brl: projecao.custoDiarioBrl },
                          { label: "Projeção 30 dias", usd: projecao.projecao30DiasUsd, brl: projecao.projecao30DiasBrl },
                          { label: "Projeção 90 dias", usd: projecao.projecao90DiasUsd, brl: projecao.projecao90DiasBrl },
                          { label: "Projeção 1 ano", usd: projecao.projecao365DiasUsd, brl: projecao.projecao365DiasBrl },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                            <div className="text-right">
                              <p className="text-sm font-bold">{fmtUsd(item.usd)}</p>
                              <p className="text-xs text-muted-foreground">{fmtBrl(item.brl)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Dicas de Otimização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { titulo: "Use GPT-4o Mini para tarefas simples", desc: "Até 17x mais barato que o GPT-4o com qualidade suficiente para geração de rascunhos." },
                      { titulo: "Ative o cache de prompts", desc: "Prompts repetidos com prefixo idêntico podem ter desconto de até 50% na OpenAI." },
                      { titulo: "Reduza tokens de sistema", desc: "System prompts longos aumentam o custo de entrada. Mantenha-os concisos." },
                      { titulo: "Manus AI para fallback", desc: "O provider Manus AI tem custo equivalente ao GPT-4o Mini e não requer chave externa." },
                    ].map((dica) => (
                      <div key={dica.titulo} className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium">{dica.titulo}</p>
                          <p className="text-xs text-muted-foreground">{dica.desc}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Top usuários — recolhível */}
        {resumo && resumo.topUsuarios.length > 0 && (
          <Card>
            <CardHeader
              className="pb-2 cursor-pointer select-none"
              onClick={() => setTopUsuariosAberto(!topUsuariosAberto)}
            >
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Top Usuários por Custo
                </span>
                {topUsuariosAberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {topUsuariosAberto && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-right">Chamadas</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Custo (USD)</TableHead>
                      <TableHead className="text-right">% do Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumo.topUsuarios.map((u, idx) => (
                      <TableRow key={u.userId ?? "sistema"}>
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{u.userName}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(u.chamadas)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtNum(u.tokensEntrada + u.tokensSaida)}</TableCell>
                        <TableCell className="text-right text-sm font-mono">{fmtUsd(u.custoUsd)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{fmtPercent(u.percentualDoTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        )}

        {/* Tabela de preços — recolhível */}
        <Card>
          <CardHeader
            className="pb-2 cursor-pointer select-none"
            onClick={() => setTabelaPrecosAberta(!tabelaPrecosAberta)}
          >
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Tabela de Preços dos Modelos
              </span>
              {tabelaPrecosAberta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CardTitle>
            <CardDescription className="text-xs">Preços em USD por 1.000 tokens — Abril 2025</CardDescription>
          </CardHeader>
          {tabelaPrecosAberta && tabelaPrecos && (
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Entrada /1k tok</TableHead>
                    <TableHead className="text-right">Saída /1k tok</TableHead>
                    <TableHead className="text-right">Exemplo 1k tok</TableHead>
                    <TableHead className="text-right">Contexto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabelaPrecos.map((m) => (
                    <TableRow key={m.modeloId}>
                      <TableCell className="font-medium text-sm">{m.nomeExibicao}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{m.provider}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: CORES_CATEGORIA[m.categoria], color: CORES_CATEGORIA[m.categoria] }}
                        >
                          {m.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">${m.custoPorMilTokensEntrada.toFixed(5)}</TableCell>
                      <TableCell className="text-right text-xs font-mono">${m.custoPorMilTokensSaida.toFixed(5)}</TableCell>
                      <TableCell className="text-right text-xs font-mono">{fmtUsd(m.custoExemplo1kTokens)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {m.contextoMaxTokens >= 1000000
                          ? `${(m.contextoMaxTokens / 1000000).toFixed(1)}M`
                          : `${(m.contextoMaxTokens / 1000).toFixed(0)}k`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Preços aproximados. Consulte os sites oficiais dos providers para valores atualizados.
              </p>
            </CardContent>
          )}
        </Card>

      </div>
    </div>
  );
}
