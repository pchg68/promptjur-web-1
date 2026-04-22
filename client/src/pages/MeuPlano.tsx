import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Zap, Crown, BarChart3, Calendar, RefreshCw, TrendingUp,
  CheckCircle, ArrowRight, AlertTriangle, Infinity
} from "lucide-react";
import { Link } from "wouter";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  pro: "Profissional",
  enterprise: "Escritório",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-500",
  pro: "bg-violet-600",
  enterprise: "bg-amber-500",
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="w-5 h-5" />,
  pro: <Crown className="w-5 h-5" />,
  enterprise: <Crown className="w-5 h-5 text-amber-400" />,
};

export default function MeuPlano() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: usage, isLoading: usageLoading, refetch } = trpc.stripe.getMyUsage.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });
  const { data: currentPlan, isLoading: planLoading } = trpc.stripe.getCurrentPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: usageHistory } = trpc.prompts.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const daysUntilReset = useMemo(() => {
    if (!usage?.nextResetAt) return 0;
    return Math.max(0, differenceInDays(new Date(usage.nextResetAt), new Date()));
  }, [usage?.nextResetAt]);

  const progressColor = useMemo(() => {
    if (!usage) return "bg-violet-600";
    if (usage.percentUsed >= 90) return "bg-red-500";
    if (usage.percentUsed >= 70) return "bg-amber-500";
    return "bg-violet-600";
  }, [usage?.percentUsed]);

  if (authLoading || usageLoading || planLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-muted-foreground text-sm">Carregando seu plano...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-2">Acesso restrito</p>
            <p className="text-muted-foreground text-sm mb-4">Faça login para visualizar seu plano.</p>
            <Link href="/">
              <Button variant="default" className="w-full">Ir para o início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planId = usage?.plan || "free";
  const planLabel = PLAN_LABELS[planId] || "Gratuito";
  const isUnlimited = usage?.isUnlimited ?? false;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                ← Dashboard
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-lg font-semibold text-foreground">Meu Plano</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-muted-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Plano atual */}
        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${PLAN_COLORS[planId]} flex items-center justify-center text-white`}>
                  {PLAN_ICONS[planId]}
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">Plano {planLabel}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {user?.email || user?.name || "Usuário"}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-violet-500/40 text-violet-600 dark:text-violet-400">
                Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {planId !== "enterprise" && (
              <Link href="/planos">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Crown className="w-4 h-4 mr-2" />
                  {planId === "free" ? "Fazer upgrade" : "Gerenciar assinatura"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Consumo do mês */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-500" />
                Consumo do mês atual
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Reset em {daysUntilReset} {daysUntilReset === 1 ? "dia" : "dias"}
                {usage?.nextResetAt && (
                  <span className="text-xs">
                    ({format(new Date(usage.nextResetAt), "dd/MM", { locale: ptBR })})
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isUnlimited ? (
              <div className="flex items-center gap-3 py-4">
                <Infinity className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="font-semibold text-foreground">Operações ilimitadas</p>
                  <p className="text-sm text-muted-foreground">
                    Você usou <strong>{usage?.usageCount ?? 0}</strong> operações este mês
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Operações utilizadas</span>
                    <span className="font-semibold text-foreground">
                      {usage?.usageCount ?? 0} / {usage?.limit ?? 20}
                    </span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${usage?.percentUsed ?? 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{usage?.percentUsed ?? 0}% utilizado</span>
                    <span>
                      {usage?.remaining ?? (usage?.limit ?? 20)} restantes
                    </span>
                  </div>
                </div>

                {/* Alerta de quota */}
                {(usage?.percentUsed ?? 0) >= 80 && (
                  <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                    (usage?.percentUsed ?? 0) >= 90
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-amber-500/30 bg-amber-500/10"
                  }`}>
                    <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
                      (usage?.percentUsed ?? 0) >= 90 ? "text-red-500" : "text-amber-500"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {(usage?.percentUsed ?? 0) >= 90
                          ? "Quota quase esgotada!"
                          : "Atenção: quota alta"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Você usou {usage?.percentUsed}% das suas operações mensais.{" "}
                        {planId === "free"
                          ? "Faça upgrade para continuar usando sem interrupções."
                          : "Considere o plano Escritório para uso ilimitado."}
                      </p>
                      {planId !== "enterprise" && (
                        <Link href="/planos">
                          <Button size="sm" variant="outline" className="mt-2 h-7 text-xs border-violet-500/40">
                            Ver planos <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Funcionalidades do plano */}
        {currentPlan && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Funcionalidades incluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentPlan.features?.map((feature: { text: string; included: boolean }, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 text-sm ${
                      feature.included ? "text-foreground" : "text-muted-foreground/50 line-through"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      feature.included ? "bg-green-500/20 text-green-500" : "bg-muted"
                    }`}>
                      {feature.included ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <span className="text-xs">×</span>
                      )}
                    </div>
                    {feature.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas de uso */}
        {usageHistory && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Estatísticas de uso total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Análises", value: (usageHistory as any)?.totalAnalises ?? 0, color: "text-blue-500" },
                  { label: "Gerações", value: (usageHistory as any)?.totalGeracoes ?? 0, color: "text-violet-500" },
                  { label: "Otimizações", value: (usageHistory as any)?.totalOtimizacoes ?? 0, color: "text-green-500" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA upgrade */}
        {planId === "free" && (
          <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Desbloqueie todo o potencial do PromptJur
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Plano Profissional: 300 operações/mês, todos os modelos de IA (GPT-4o, Claude, Gemini),
                    exportação DOCX/PDF e muito mais por apenas <strong>R$ 49,90/mês</strong>.
                  </p>
                </div>
                <Link href="/planos">
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white shrink-0">
                    <Crown className="w-4 h-4 mr-2" />
                    Assinar agora
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
