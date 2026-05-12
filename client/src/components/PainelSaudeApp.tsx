/**
 * PainelSaudeApp — Painel de Saúde da Aplicação
 * 
 * Exibe gráficos em tempo real de:
 * - Latência do banco de dados (histórico + atual)
 * - Uso de heap memory (% do limite)
 * - Event loop lag
 * - CPU usage
 * - Uptime e alertas ativos
 * 
 * Usa polling a cada 30s para atualização em tempo real.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Database, Cpu, Clock, AlertTriangle, RefreshCw, Loader2,
  TrendingUp, TrendingDown, Minus, Heart, Zap, HardDrive
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

// ── Intervalo de polling ─────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000; // 30 segundos

// ── Tipos ────────────────────────────────────────────────────────────────────
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  status?: "healthy" | "warning" | "critical";
}

function MetricCard({ icon, label, value, subValue, status = "healthy" }: MetricCardProps) {
  const statusColors = {
    healthy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subValue && <p className="text-xs opacity-70 mt-1">{subValue}</p>}
    </div>
  );
}

function StatusDot({ status }: { status: "healthy" | "warning" | "critical" }) {
  const colors = {
    healthy: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} animate-pulse`} />
  );
}

export default function PainelSaudeApp() {
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ── Queries com polling ─────────────────────────────────────────────────────
  const metricsQuery = trpc.admin.appMetrics.useQuery(undefined, {
    refetchInterval: isPolling ? POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
  });

  const historyQuery = trpc.admin.appMetricsHistory.useQuery(undefined, {
    refetchInterval: isPolling ? POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
  });

  const thresholdsQuery = trpc.admin.appThresholds.useQuery();

  // Atualizar timestamp do último refresh
  useEffect(() => {
    if (metricsQuery.data) {
      setLastUpdate(new Date());
    }
  }, [metricsQuery.data]);

  // ── Dados para gráficos ─────────────────────────────────────────────────────
  const dbLatencyChartData = useMemo(() => {
    if (!historyQuery.data?.dbLatency?.samples) return [];
    return historyQuery.data.dbLatency.samples.map((value: number, index: number) => ({
      index,
      value,
      label: `${historyQuery.data!.dbLatency.samples.length - index}min atrás`,
    }));
  }, [historyQuery.data]);

  const eventLoopChartData = useMemo(() => {
    if (!historyQuery.data?.eventLoop?.samples) return [];
    return historyQuery.data.eventLoop.samples.map((value: number, index: number) => ({
      index,
      value,
      label: `${historyQuery.data!.eventLoop.samples.length - index}min atrás`,
    }));
  }, [historyQuery.data]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getDbStatus = useCallback((): "healthy" | "warning" | "critical" => {
    if (!metricsQuery.data) return "healthy";
    const latency = metricsQuery.data.dbLatency.latencyMs;
    if (latency < 0) return "critical";
    const t = thresholdsQuery.data?.dbLatency;
    if (!t) return "healthy";
    if (latency >= t.critical) return "critical";
    if (latency >= t.warning) return "warning";
    return "healthy";
  }, [metricsQuery.data, thresholdsQuery.data]);

  const getHeapStatus = useCallback((): "healthy" | "warning" | "critical" => {
    if (!metricsQuery.data) return "healthy";
    const pct = metricsQuery.data.heap.percentUsed;
    const t = thresholdsQuery.data?.heap;
    if (!t) return "healthy";
    if (pct >= t.critical) return "critical";
    if (pct >= t.warning) return "warning";
    return "healthy";
  }, [metricsQuery.data, thresholdsQuery.data]);

  const getEventLoopStatus = useCallback((): "healthy" | "warning" | "critical" => {
    if (!metricsQuery.data) return "healthy";
    const lag = metricsQuery.data.eventLoop.lagMs;
    const t = thresholdsQuery.data?.eventLoop;
    if (!t) return "healthy";
    if (lag >= t.critical) return "critical";
    if (lag >= t.warning) return "warning";
    return "healthy";
  }, [metricsQuery.data, thresholdsQuery.data]);

  const getTrend = (current: number, avg: number) => {
    if (current > avg * 1.2) return <TrendingUp className="w-3 h-3 text-red-400" />;
    if (current < avg * 0.8) return <TrendingDown className="w-3 h-3 text-emerald-400" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (metricsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground">Carregando métricas de saúde...</span>
      </div>
    );
  }

  if (metricsQuery.error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-400">
        <AlertTriangle className="w-5 h-5 mr-2" />
        <span>Erro ao carregar métricas: {metricsQuery.error.message}</span>
      </div>
    );
  }

  const metrics = metricsQuery.data;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header com status geral */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-5 h-5 text-emerald-500" />
          <div>
            <h3 className="text-lg font-semibold">Saúde da Aplicação</h3>
            <p className="text-xs text-muted-foreground">
              Monitoramento em tempo real • Atualização a cada 30s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Último: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              metricsQuery.refetch();
              historyQuery.refetch();
            }}
            disabled={metricsQuery.isFetching}
            className="h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${metricsQuery.isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant={isPolling ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPolling(!isPolling)}
            className="h-8"
          >
            <Activity className={`w-3.5 h-3.5 mr-1.5 ${isPolling ? 'animate-pulse' : ''}`} />
            {isPolling ? "Live" : "Pausado"}
          </Button>
        </div>
      </div>

      {/* Alertas ativos */}
      {metrics.alerts.length > 0 && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-400">
              {metrics.alerts.length} alerta(s) ativo(s)
            </span>
          </div>
          <div className="space-y-1">
            {metrics.alerts.map((alert: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant={alert.level === 'critical' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                  {alert.level}
                </Badge>
                <span className="text-muted-foreground">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Database className="w-4 h-4" />}
          label="DB Latency"
          value={metrics.dbLatency.latencyMs < 0 ? "Offline" : `${metrics.dbLatency.latencyMs}ms`}
          subValue={`Média: ${metrics.dbLatency.avgLatencyMs}ms | Max: ${metrics.dbLatency.maxLatencyMs}ms`}
          status={getDbStatus()}
        />
        <MetricCard
          icon={<HardDrive className="w-4 h-4" />}
          label="Heap Memory"
          value={`${metrics.heap.percentUsed}%`}
          subValue={`${metrics.heap.usedMB}MB / ${metrics.heap.limitMB}MB`}
          status={getHeapStatus()}
        />
        <MetricCard
          icon={<Zap className="w-4 h-4" />}
          label="Event Loop"
          value={`${metrics.eventLoop.lagMs}ms`}
          subValue={`Média: ${metrics.eventLoop.avgLagMs}ms | Max: ${metrics.eventLoop.maxLagMs}ms`}
          status={getEventLoopStatus()}
        />
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Uptime"
          value={metrics.uptime.formatted}
          subValue={`CPU User: ${metrics.cpu.percentUser}% | Sys: ${metrics.cpu.percentSystem}%`}
          status="healthy"
        />
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Gráfico de DB Latency */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <CardTitle className="text-sm">Latência do Banco de Dados</CardTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot status={getDbStatus()} />
                {getTrend(metrics.dbLatency.latencyMs, metrics.dbLatency.avgLatencyMs)}
              </div>
            </div>
            <CardDescription className="text-xs">
              Últimos {historyQuery.data?.dbLatency?.count ?? 0} samples (1/min)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {dbLatencyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={dbLatencyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="dbLatencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="index"
                    tick={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    unit="ms"
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}ms`, 'Latência']}
                    labelFormatter={(label: number) => `${dbLatencyChartData.length - label} min atrás`}
                  />
                  {thresholdsQuery.data && (
                    <>
                      <ReferenceLine
                        y={thresholdsQuery.data.dbLatency.warning}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                      />
                      <ReferenceLine
                        y={thresholdsQuery.data.dbLatency.critical}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                      />
                    </>
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#dbLatencyGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                Aguardando dados... (coleta a cada 60s)
              </div>
            )}
            {/* Legenda dos thresholds */}
            {thresholdsQuery.data && (
              <div className="flex items-center gap-4 mt-2 px-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-amber-500 opacity-50" style={{ borderTop: '1px dashed' }} />
                  <span className="text-[10px] text-muted-foreground">Warning ({thresholdsQuery.data.dbLatency.warning}ms)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-red-500 opacity-50" style={{ borderTop: '1px dashed' }} />
                  <span className="text-[10px] text-muted-foreground">Critical ({thresholdsQuery.data.dbLatency.critical}ms)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Event Loop Lag */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <CardTitle className="text-sm">Event Loop Lag</CardTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot status={getEventLoopStatus()} />
                {getTrend(metrics.eventLoop.lagMs, metrics.eventLoop.avgLagMs)}
              </div>
            </div>
            <CardDescription className="text-xs">
              Últimos {historyQuery.data?.eventLoop?.count ?? 0} samples (1/min)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {eventLoopChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={eventLoopChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="eventLoopGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="index"
                    tick={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    unit="ms"
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}ms`, 'Lag']}
                    labelFormatter={(label: number) => `${eventLoopChartData.length - label} min atrás`}
                  />
                  {thresholdsQuery.data && (
                    <>
                      <ReferenceLine
                        y={thresholdsQuery.data.eventLoop.warning}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                      />
                      <ReferenceLine
                        y={thresholdsQuery.data.eventLoop.critical}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                      />
                    </>
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#eventLoopGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#a855f7' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                Aguardando dados... (coleta a cada 60s)
              </div>
            )}
            {thresholdsQuery.data && (
              <div className="flex items-center gap-4 mt-2 px-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-amber-500 opacity-50" style={{ borderTop: '1px dashed' }} />
                  <span className="text-[10px] text-muted-foreground">Warning ({thresholdsQuery.data.eventLoop.warning}ms)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-red-500 opacity-50" style={{ borderTop: '1px dashed' }} />
                  <span className="text-[10px] text-muted-foreground">Critical ({thresholdsQuery.data.eventLoop.critical}ms)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalhes adicionais */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Heap Breakdown */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm">Memória Heap</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Uso</span>
                  <span className={
                    getHeapStatus() === 'critical' ? 'text-red-400' :
                    getHeapStatus() === 'warning' ? 'text-amber-400' :
                    'text-emerald-400'
                  }>
                    {metrics.heap.percentUsed}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      getHeapStatus() === 'critical' ? 'bg-red-500' :
                      getHeapStatus() === 'warning' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(metrics.heap.percentUsed, 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Used:</span>
                  <span className="ml-1 font-mono">{metrics.heap.usedMB}MB</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-1 font-mono">{metrics.heap.totalMB}MB</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Limit:</span>
                  <span className="ml-1 font-mono">{metrics.heap.limitMB}MB</span>
                </div>
                <div>
                  <span className="text-muted-foreground">RSS:</span>
                  <span className="ml-1 font-mono">{metrics.heap.rss}MB</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CPU */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-orange-400" />
              <CardTitle className="text-sm">CPU</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">User</span>
                  <span className="text-orange-400">{metrics.cpu.percentUser}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${Math.min(metrics.cpu.percentUser, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">System</span>
                  <span className="text-sky-400">{metrics.cpu.percentSystem}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${Math.min(metrics.cpu.percentSystem, 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-muted-foreground">User:</span>
                  <span className="ml-1 font-mono">{metrics.cpu.userMs}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">System:</span>
                  <span className="ml-1 font-mono">{metrics.cpu.systemMs}ms</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DB Connection Info */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-sm">Conexão DB</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={metrics.dbLatency.isHealthy ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                  {metrics.dbLatency.isHealthy ? "Saudável" : "Degradado"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Latência atual</span>
                <span className="font-mono">{metrics.dbLatency.latencyMs}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Média</span>
                <span className="font-mono">{metrics.dbLatency.avgLatencyMs}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Máxima</span>
                <span className="font-mono">{metrics.dbLatency.maxLatencyMs}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Samples</span>
                <span className="font-mono">{metrics.dbLatency.samples}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Última verificação</span>
                <span className="font-mono text-[10px]">
                  {new Date(metrics.dbLatency.lastCheck).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
        <div className="flex items-center gap-4">
          <span>Uptime: {metrics.uptime.formatted}</span>
          <span>•</span>
          <span>Samples: {metrics.dbLatency.samples} (DB) / {metrics.eventLoop.samples} (EL)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot status={metrics.alerts.length > 0 ? (metrics.alerts.some((a: any) => a.level === 'critical') ? 'critical' : 'warning') : 'healthy'} />
          <span>
            {metrics.alerts.length === 0 ? 'Todos os sistemas operacionais' :
             `${metrics.alerts.length} alerta(s) ativo(s)`}
          </span>
        </div>
      </div>
    </div>
  );
}
