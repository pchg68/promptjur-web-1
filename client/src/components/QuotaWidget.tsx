/**
 * QuotaWidget — Mini-card de consumo mensal para o Dashboard
 * Exibe operações usadas/restantes com barra de progresso colorida
 */
import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Crown, ArrowRight, Infinity as InfinityIcon, Coins } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  pro: "Profissional",
  enterprise: "Escritório",
};

export function QuotaWidget() {
  const { data: usage, isLoading } = trpc.stripe.getMyUsage.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  if (isLoading || !usage) {
    return (
      <div className="h-[88px] rounded-lg bg-muted/50 animate-pulse" />
    );
  }

  const planLabel = PLAN_LABELS[usage.plan] ?? usage.plan;
  const isUnlimited = usage.isUnlimited;
  const percent = isUnlimited ? 0 : usage.percentUsed;

  // Cor da barra baseada no percentual
  const barColor =
    percent >= 90 ? "bg-red-500" :
    percent >= 70 ? "bg-amber-500" :
    "bg-violet-500";

  const nextReset = usage.nextResetAt ? new Date(usage.nextResetAt) : null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-500/10 rounded-sm flex items-center justify-center">
            <Zap className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">Operações</p>
            <p className="text-xs font-medium text-foreground leading-tight mt-0.5">
              {isUnlimited ? (
                <span className="flex items-center gap-1">
                  <InfinityIcon className="w-3 h-3" /> Ilimitado
                </span>
              ) : (
                `${usage.usageCount} / ${usage.limit}`
              )}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {planLabel}
        </Badge>
      </div>

      {/* Barra de progresso */}
      {!isUnlimited && (
        <div className="space-y-1">
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              {percent >= 90 ? (
                <span className="text-red-400 font-medium">⚠ Limite quase atingido</span>
              ) : percent >= 70 ? (
                <span className="text-amber-400">Uso elevado ({percent}%)</span>
              ) : (
                <span>{usage.remaining} restantes este mês</span>
              )}
            </p>
            {nextReset && (
              <p className="text-[10px] text-muted-foreground">
                Reset: {format(nextReset, "dd/MM", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Créditos bônus */}
      {(usage as any).bonusCredits > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <Coins className="w-3 h-3" />
          <span className="font-medium">{(usage as any).bonusCredits} créditos extras disponíveis</span>
        </div>
      )}

      {/* CTA upgrade para plano free ou comprar créditos */}
      {usage.plan === "free" && percent >= 50 && (
        <Link href="/planos">
          <div className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer mt-0.5">
            <Crown className="w-3 h-3" />
            <span>Ver planos pagos</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      )}
      {!isUnlimited && percent >= 80 && (usage as any).bonusCredits === 0 && (
        <Link href="/planos#creditos">
          <div className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer">
            <Coins className="w-3 h-3" />
            <span>Comprar créditos extras</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      )}
    </div>
  );
}
