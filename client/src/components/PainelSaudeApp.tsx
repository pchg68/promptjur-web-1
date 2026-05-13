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
 * Alertas visuais: mudança de cor nos gráficos quando thresholds são ultrapassados.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Database, Cpu, Clock, AlertTriangle, RefreshCw, Loader2,
  TrendingUp, TrendingDown, Minus, Heart, Zap, HardDrive, ShieldAlert, Bell
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

// ── Intervalo de polling ─────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000; // 30 segundos

// ── Cores por status ─────────────────────────────────────────────────────────
const STATUS_COLORS = {
  healthy: { stroke: "#10b981", fill: "#10b981", gradient: "rgba(16, 185, 129, 0.3)", gradientEnd: "rgba(16, 185, 129, 0)" },
  warning: { stroke: "#f59e0b", fill: "#f59e0b", gradient: "rgba(245, 158, 11, 0.3)", gradientEnd: "rgba(245, 158, 11, 0)" },
  critical: { stroke: "#ef4444", fill: "#ef4444", gradient: "rgba(239, 68, 68, 0.4)", gradientEnd: "rgba(239, 68, 68, 0.05)" },
};

// ── Tipos ────────────────────────────────────────────────────────────────────
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  status?: "healthy" | "warning" | "critical";
  showPulse?: boolean;
}

function MetricCard({ icon, label, value, subValue, status = "healthy", showPulse = false }: MetricCardProps) {
  const statusStyles = {
    healthy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-amber-500/5 shadow-lg",
    critical: "bg-red-500/15 text-red-500 border-red-500/40 shadow-red-500/10 shadow-lg",
  };

  return (
    <div className={`relative p-4 rounded-lg border transition-all duration-500 ${statusStyles[status]}`}>
      {/* Indicador pulsante para estado crítico */}
      {showPulse && status === "critical" && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
      )}
      {showPulse && status === "warning" && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${status === 'critical' ? 'animate-pulse' : ''}`}>{value}</p>
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
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${status !== 'healthy' ? 'animate-pulse' : ''}`} />
  );
}

/** Banner de alerta que aparece quando há thresholds ultrapassados */
function AlertBanner({ status, metric, value, threshold }: {
  status: "warning" | "critical";
  metric: string;
  value: string;
  threshold: string;
}) {
  const isWarning = status === "warning";
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      isWarning
        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        : 'bg-red-500/15 border-red-500/40 text-red-400'
    }`}>
      {isWarning ? (
        <Bell className="w-4 h-4 flex-shrink-0" />
      ) : (
        <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-pulse" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">
          {isWarning ? '⚠️ Atenção' : '🚨 Crítico'}: {metric} em {value}
        </p>
        <p className="text-[10px] opacity-70">
          Limite {isWarning ? 'warning' : 'crítico'}: {threshold}
        </p>
      </div>
      <Badge variant={isWarning ? "secondary" : "destructive"} className="text-[10px] px-1.5 py-0 flex-shrink-0">
        {status.toUpperCase()}
      </Badge>
    </div>
  );
}

/** Dot customizado que muda de cor baseado no threshold */
function CustomDot(props: any) {
  const { cx, cy, payload, warningThreshold, criticalThreshold } = props;
  if (!cx || !cy) return null;
  
  let color = "#10b981"; // green
  if (payload.value >= criticalThreshold) {
    color = "#ef4444"; // red
  } else if (payload.value >= warningThreshold) {
    color = "#f59e0b"; // amber
  }
  
  // Só mostrar dot se ultrapassar warning
  if (payload.value < warningThreshold) return null;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload.value >= criticalThreshold ? 5 : 3.5}
      fill={color}
      stroke={color}
      strokeWidth={payload.value >= criticalThreshold ? 2 : 1}
      opacity={payload.value >= criticalThreshold ? 1 : 0.8}
    />
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

  // ── Dados para gráficos com indicação de status por ponto ──────────────────
  const dbLatencyChartData = useMemo(() => {
    if (!historyQuery.data?.dbLatency?.samples) return [];
    const warnThreshold = thresholdsQuery.data?.dbLatency?.warning ?? 500;
    const critThreshold = thresholdsQuery.data?.dbLatency?.critical ?? 2000;
    return historyQuery.data.dbLatency.samples.map((value: number, index: number) => ({
      index,
      value,
      label: `${historyQuery.data!.dbLatency.samples.length - index}min atrás`,
      status: value >= critThreshold ? 'critical' : value >= warnThreshold ? 'warning' : 'healthy',
    }));
  }, [historyQuery.data, thresholdsQuery.data]);

  const eventLoopChartData = useMemo(() => {
    if (!historyQuery.data?.eventLoop?.samples) return [];
    const warnThreshold = thresholdsQuery.data?.eventLoop?.warning ?? 50;
    const critThreshold = thresholdsQuery.data?.eventLoop?.critical ?? 200;
    return historyQuery.data.eventLoop.samples.map((value: number, index: number) => ({
      index,
      value,
      label: `${historyQuery.data!.eventLoop.samples.length - index}min atrás`,
      status: value >= critThreshold ? 'critical' : value >= warnThreshold ? 'warning' : 'healthy',
    }));
  }, [historyQuery.data, thresholdsQuery.data]);

  // ── Verificar se há pontos acima do threshold ──────────────────────────────
  const hasDbBreaches = useMemo(() => {
    return dbLatencyChartData.some((d: any) => d.status !== 'healthy');
  }, [dbLatencyChartData]);

  const hasEventLoopBreaches = useMemo(() => {
    return eventLoopChartData.some((d: any) => d.status !== 'healthy');
  }, [eventLoopChartData]);

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

  const getOverallStatus = useCallback((): "healthy" | "warning" | "critical" => {
    const statuses = [getDbStatus(), getHeapStatus(), getEventLoopStatus()];
    if (statuses.includes("critical")) return "critical";
    if (statuses.includes("warning")) return "warning";
    return "healthy";
  }, [getDbStatus, getHeapStatus, getEventLoopStatus]);

  const getTrend = (current: number, avg: number) => {
    if (current > avg * 1.2) return <TrendingUp className="w-3 h-3 text-red-400" />;
    if (current < avg * 0.8) return <TrendingDown className="w-3 h-3 text-emerald-400" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  // ── Cor dinâmica do gráfico baseada no status atual ─────────────────────────
  const getDbChartColors = useCallback(() => {
    const status = getDbStatus();
    return STATUS_COLORS[status];
  }, [getDbStatus]);

  const getEventLoopChartColors = useCallback(() => {
    const status = getEventLoopStatus();
    return STATUS_COLORS[status];
  }, [getEventLoopStatus]);

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

  const dbColors = getDbChartColors();
  const elColors = getEventLoopChartColors();
  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* Header com status geral — muda de cor conforme severidade */}
      <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-700 ${
        overallStatus === 'critical'
          ? 'bg-red-500/10 border-red-500/30'
          : overallStatus === 'warning'
          ? 'bg-amber-500/5 border-amber-500/20'
          : 'bg-emerald-500/5 border-emerald-500/10'
      }`}>
        <div className="flex items-center gap-3">
          <Heart className={`w-5 h-5 transition-colors duration-500 ${
            overallStatus === 'critical' ? 'text-red-500 animate-pulse' :
            overallStatus === 'warning' ? 'text-amber-500' :
            'text-emerald-500'
          }`} />
          <div>
            <h3 className="text-lg font-semibold">Saúde da Aplicação</h3>
            <p className="text-xs text-muted-foreground">
              Monitoramento em tempo real • Atualização a cada 30s
              {overallStatus !== 'healthy' && (
                <span className={`ml-2 font-medium ${
                  overallStatus === 'critical' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  • {overallStatus === 'critical' ? 'ATENÇÃO REQUERIDA' : 'Monitorando anomalias'}
                </span>
              )}
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

      {/* Banners de alerta individuais por métrica */}
      <div className="space-y-2">
        {getDbStatus() !== 'healthy' && thresholdsQuery.data && (
          <AlertBanner
            status={getDbStatus() as "warning" | "critical"}
            metric="DB Latency"
            value={`${metrics.dbLatency.latencyMs}ms`}
            threshold={getDbStatus() === 'critical'
              ? `${thresholdsQuery.data.dbLatency.critical}ms`
              : `${thresholdsQuery.data.dbLatency.warning}ms`
            }
          />
        )}
        {getHeapStatus() !== 'healthy' && thresholdsQuery.data && (
          <AlertBanner
            status={getHeapStatus() as "warning" | "critical"}
            metric="Heap Memory"
            value={`${metrics.heap.percentUsed}%`}
            threshold={getHeapStatus() === 'critical'
              ? `${thresholdsQuery.data.heap.critical}%`
              : `${thresholdsQuery.data.heap.warning}%`
            }
          />
        )}
        {getEventLoopStatus() !== 'healthy' && thresholdsQuery.data && (
          <AlertBanner
            status={getEventLoopStatus() as "warning" | "critical"}
            metric="Event Loop Lag"
            value={`${metrics.eventLoop.lagMs}ms`}
            threshold={getEventLoopStatus() === 'critical'
              ? `${thresholdsQuery.data.eventLoop.critical}ms`
              : `${thresholdsQuery.data.eventLoop.warning}ms`
            }
          />
        )}
      </div>

      {/* Alertas ativos do servidor */}
      {metrics.alerts.length > 0 && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
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
          showPulse={true}
        />
        <MetricCard
          icon={<HardDrive className="w-4 h-4" />}
          label="Heap Memory"
          value={`${metrics.heap.percentUsed}%`}
          subValue={`${metrics.heap.usedMB}MB / ${metrics.heap.limitMB}MB`}
          status={getHeapStatus()}
          showPulse={true}
        />
        <MetricCard
          icon={<Zap className="w-4 h-4" />}
          label="Event Loop"
          value={`${metrics.eventLoop.lagMs}ms`}
          subValue={`Média: ${metrics.eventLoop.avgLagMs}ms | Max: ${metrics.eventLoop.maxLagMs}ms`}
          status={getEventLoopStatus()}
          showPulse={true}
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
        {/* Gráfico de DB Latency — cor muda dinamicamente */}
        <Card className={`border transition-all duration-700 ${
          getDbStatus() === 'critical'
            ? 'bg-red-500/5 border-red-500/30'
            : getDbStatus() === 'warning'
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-card/50 border-border/50'
        }`}>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 transition-colors duration-500 ${
                  getDbStatus() === 'critical' ? 'text-red-400' :
                  getDbStatus() === 'warning' ? 'text-amber-400' :
                  'text-emerald-400'
                }`} />
                <CardTitle className="text-sm">Latência do Banco de Dados</CardTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot status={getDbStatus()} />
                {getTrend(metrics.dbLatency.latencyMs, metrics.dbLatency.avgLatencyMs)}
                {hasDbBreaches && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0 ml-1">
                    BREACH
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-xs">
              Últimos {historyQuery.data?.dbLatency?.count ?? 0} samples (1/min)
              {getDbStatus() !== 'healthy' && (
                <span className={`ml-2 font-medium ${
                  getDbStatus() === 'critical' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  — Limite ultrapassado!
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {dbLatencyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dbLatencyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="dbLatencyGradientDynamic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={dbColors.stroke} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={dbColors.stroke} stopOpacity={0.02} />
                    </linearGradient>
                    {/* Gradiente para zona de warning */}
                    <linearGradient id="dbWarningZone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    {/* Gradiente para zona critical */}
                    <linearGradient id="dbCriticalZone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
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
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: `1px solid ${dbColors.stroke}40`,
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => {
                      const wt = thresholdsQuery.data?.dbLatency?.warning ?? 500;
                      const ct = thresholdsQuery.data?.dbLatency?.critical ?? 2000;
                      const statusLabel = value >= ct ? ' 🚨 CRÍTICO' : value >= wt ? ' ⚠️ WARNING' : ' ✅';
                      return [`${value}ms${statusLabel}`, 'Latência'];
                    }}
                    labelFormatter={(label: number) => `${dbLatencyChartData.length - label} min atrás`}
                  />
                  {thresholdsQuery.data && (
                    <>
                      {/* Zona de warning (faixa amarela) */}
                      <ReferenceLine
                        y={thresholdsQuery.data.dbLatency.warning}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        label={{
                          value: `⚠ ${thresholdsQuery.data.dbLatency.warning}ms`,
                          position: 'right',
                          fill: '#f59e0b',
                          fontSize: 9,
                        }}
                      />
                      {/* Zona critical (faixa vermelha) */}
                      <ReferenceLine
                        y={thresholdsQuery.data.dbLatency.critical}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        strokeOpacity={0.8}
                        label={{
                          value: `🚨 ${thresholdsQuery.data.dbLatency.critical}ms`,
                          position: 'right',
                          fill: '#ef4444',
                          fontSize: 9,
                        }}
                      />
                    </>
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={dbColors.stroke}
                    strokeWidth={2}
                    fill="url(#dbLatencyGradientDynamic)"
                    dot={
                      <CustomDot
                        warningThreshold={thresholdsQuery.data?.dbLatency?.warning ?? 500}
                        criticalThreshold={thresholdsQuery.data?.dbLatency?.critical ?? 2000}
                      />
                    }
                    activeDot={{ r: 5, fill: dbColors.fill, stroke: '#fff', strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Aguardando dados... (coleta a cada 60s)
              </div>
            )}
            {/* Legenda dos thresholds */}
            {thresholdsQuery.data && (
              <div className="flex items-center gap-4 mt-2 px-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-[2px] bg-amber-500 opacity-70" />
                  <span className="text-[10px] text-muted-foreground">Warning ({thresholdsQuery.data.dbLatency.warning}ms)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-[2px] bg-red-500 opacity-80" />
                  <span className="text-[10px] text-muted-foreground">Critical ({thresholdsQuery.data.dbLatency.critical}ms)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    getDbStatus() === 'critical' ? 'bg-red-500' :
                    getDbStatus() === 'warning' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`} />
                  <span className="text-[10px] text-muted-foreground">
                    Atual: {metrics.dbLatency.latencyMs}ms
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Event Loop Lag — cor muda dinamicamente */}
        <Card className={`border transition-all duration-700 ${
          getEventLoopStatus() === 'critical'
            ? 'bg-red-500/5 border-red-500/30'
            : getEventLoopStatus() === 'warning'
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-card/50 border-border/50'
        }`}>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 transition-colors duration-500 ${
                  getEventLoopStatus() === 'critical' ? 'text-red-400' :
                  getEventLoopStatus() === 'warning' ? 'text-amber-400' :
                  'text-purple-400'
                }`} />
                <CardTitle className="text-sm">Event Loop Lag</CardTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot status={getEventLoopStatus()} />
                {getTrend(metrics.eventLoop.lagMs, metrics.eventLoop.avgLagMs)}
                {hasEventLoopBreaches && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0 ml-1">
                    BREACH
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-xs">
              Últimos {historyQuery.data?.eventLoop?.count ?? 0} samples (1/min)
              {getEventLoopStatus() !== 'healthy' && (
                <span className={`ml-2 font-medium ${
                  getEventLoopStatus() === 'critical' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  — Limite ultrapassado!
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {eventLoopChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={eventLoopChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="eventLoopGradientDynamic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={elColors.stroke} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={elColors.stroke} stopOpacity={0.02} />
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
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: `1px solid ${elColors.stroke}40`,
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => {
                      const wt = thresholdsQuery.data?.eventLoop?.warning ?? 50;
                      const ct = thresholdsQuery.data?.eventLoop?.critical ?? 200;
                      const statusLabel = value >= ct ? ' 🚨 CRÍTICO' : value >= wt ? ' ⚠️ WARNING' : ' ✅';
                      return [`${value}ms${statusLabel}`, 'Lag'];
                    }}
                    labelFormatter={(label: number) => `${eventLoopChartData.length - label} min atrás`}
                  />
                  {thresholdsQuery.data && (
                    <>
                      <ReferenceLine
                        y={thresholdsQuery.data.eventLoop.warning}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        label={{
                          value: `⚠ ${thresholdsQuery.data.eventLoop.warning}ms`,
                          position: 'right',
                          fill: '#f59e0b',
                          fontSize: 9,
                        }}
                      />
                      <ReferenceLine
                        y={thresholdsQuery.data.eventLoop.critical}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        strokeOpacity={0.8}
                        label={{
                          value: `🚨 ${thresholdsQuery.data.eventLoop.critical}ms`,
                          position: 'right',
                          fill: '#ef4444',
                          fontSize: 9,
                        }}
                      />
                    </>
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={elColors.stroke}
                    strokeWidth={2}
                    fill="url(#eventLoopGradientDynamic)"
                    dot={
                      <CustomDot
                        warningThreshold={thresholdsQuery.data?.eventLoop?.warning ?? 50}
                        criticalThreshold={thresholdsQuery.data?.eventLoop?.critical ?? 200}
                      />
                    }
                    activeDot={{ r: 5, fill: elColors.fill, stroke: '#fff', strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Aguardando dados... (coleta a cada 60s)
              </div>
            )}
            {thresholdsQuery.data && (
              <div className="flex items-center gap-4 mt-2 px-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-[2px] bg-amber-500 opacity-70" />
                  <span className="text-[10px] text-muted-foreground">Warning ({thresholdsQuery.data.eventLoop.warning}ms)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-[2px] bg-red-500 opacity-80" />
                  <span className="text-[10px] text-muted-foreground">Critical ({thresholdsQuery.data.eventLoop.critical}ms)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    getEventLoopStatus() === 'critical' ? 'bg-red-500' :
                    getEventLoopStatus() === 'warning' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`} />
                  <span className="text-[10px] text-muted-foreground">
                    Atual: {metrics.eventLoop.lagMs}ms
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalhes adicionais */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Heap Breakdown */}
        <Card className={`border transition-all duration-700 ${
          getHeapStatus() === 'critical'
            ? 'bg-red-500/5 border-red-500/30'
            : getHeapStatus() === 'warning'
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-card/50 border-border/50'
        }`}>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <HardDrive className={`w-4 h-4 transition-colors duration-500 ${
                getHeapStatus() === 'critical' ? 'text-red-400' :
                getHeapStatus() === 'warning' ? 'text-amber-400' :
                'text-emerald-400'
              }`} />
              <CardTitle className="text-sm">Memória Heap</CardTitle>
              {getHeapStatus() !== 'healthy' && (
                <Badge variant={getHeapStatus() === 'critical' ? 'destructive' : 'secondary'} className="text-[9px] px-1 py-0">
                  {getHeapStatus().toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {/* Progress bar com cor dinâmica */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Uso</span>
                  <span className={
                    getHeapStatus() === 'critical' ? 'text-red-400 font-bold animate-pulse' :
                    getHeapStatus() === 'warning' ? 'text-amber-400 font-bold' :
                    'text-emerald-400'
                  }>
                    {metrics.heap.percentUsed}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      getHeapStatus() === 'critical' ? 'bg-red-500' :
                      getHeapStatus() === 'warning' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(metrics.heap.percentUsed, 100)}%` }}
                  />
                </div>
                {/* Marcadores de threshold na barra */}
                {thresholdsQuery.data && (
                  <div className="relative w-full h-1 mt-0.5">
                    <div
                      className="absolute top-0 w-0.5 h-2 bg-amber-500/60"
                      style={{ left: `${thresholdsQuery.data.heap.warning}%` }}
                      title={`Warning: ${thresholdsQuery.data.heap.warning}%`}
                    />
                    <div
                      className="absolute top-0 w-0.5 h-2 bg-red-500/60"
                      style={{ left: `${thresholdsQuery.data.heap.critical}%` }}
                      title={`Critical: ${thresholdsQuery.data.heap.critical}%`}
                    />
                  </div>
                )}
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
        <Card className={`border transition-all duration-700 ${
          getDbStatus() === 'critical'
            ? 'bg-red-500/5 border-red-500/30'
            : getDbStatus() === 'warning'
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-card/50 border-border/50'
        }`}>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <Database className={`w-4 h-4 transition-colors duration-500 ${
                getDbStatus() === 'critical' ? 'text-red-400' :
                getDbStatus() === 'warning' ? 'text-amber-400' :
                'text-blue-400'
              }`} />
              <CardTitle className="text-sm">Conexão DB</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={metrics.dbLatency.isHealthy ? "default" : "destructive"}
                  className={`text-[10px] px-1.5 py-0 ${!metrics.dbLatency.isHealthy ? 'animate-pulse' : ''}`}
                >
                  {metrics.dbLatency.isHealthy ? "Saudável" : "Degradado"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Latência atual</span>
                <span className={`font-mono font-bold ${
                  getDbStatus() === 'critical' ? 'text-red-400' :
                  getDbStatus() === 'warning' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>{metrics.dbLatency.latencyMs}ms</span>
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
              {metrics.dbLatency.wasColdStart && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cold Start</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-400 animate-pulse">
                    Reconexão TLS
                  </Badge>
                </div>
              )}
              {historyQuery.data?.coldStarts != null && historyQuery.data.coldStarts > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cold Starts</span>
                  <span className="font-mono text-amber-400">{historyQuery.data.coldStarts}</span>
                </div>
              )}
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
      <div className={`flex items-center justify-between text-xs text-muted-foreground pt-2 border-t transition-colors duration-500 ${
        overallStatus === 'critical' ? 'border-red-500/30' :
        overallStatus === 'warning' ? 'border-amber-500/20' :
        'border-border/30'
      }`}>
        <div className="flex items-center gap-4">
          <span>Uptime: {metrics.uptime.formatted}</span>
          <span>•</span>
          <span>Samples: {metrics.dbLatency.samples} (DB) / {metrics.eventLoop.samples} (EL)</span>
          {historyQuery.data?.coldStarts ? (
            <>
              <span>•</span>
              <span className="text-amber-400">Cold Starts: {historyQuery.data.coldStarts}</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot status={overallStatus} />
          <span className={
            overallStatus === 'critical' ? 'text-red-400 font-medium' :
            overallStatus === 'warning' ? 'text-amber-400' :
            ''
          }>
            {overallStatus === 'healthy' ? 'Todos os sistemas operacionais' :
             overallStatus === 'warning' ? 'Anomalias detectadas' :
             'ATENÇÃO: Limites críticos ultrapassados'}
          </span>
        </div>
      </div>
    </div>
  );
}
