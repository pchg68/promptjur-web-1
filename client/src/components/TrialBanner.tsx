import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Clock, Crown, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Banner de trial exibido no dashboard quando o usuário está em período de teste.
 * Mostra contagem regressiva e CTA para assinar um plano.
 */
export function TrialBanner() {
  const { isAuthenticated } = useAuth();
  const { data: trialStatus } = trpc.stripe.getTrialStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60_000, // Atualiza a cada minuto
  });

  // Não mostrar se não está autenticado ou não tem dados
  if (!isAuthenticated || !trialStatus) return null;

  // Não mostrar se já tem plano pago
  if (trialStatus.hasPaidPlan) return null;

  // Trial ativo: mostrar contagem regressiva
  if (trialStatus.isActive) {
    const urgency = trialStatus.daysRemaining <= 2;
    return (
      <div
        className={`mx-4 mt-3 mb-1 rounded-lg border px-4 py-3 ${
          urgency
            ? "border-amber-500/40 bg-amber-500/10"
            : "border-violet-500/30 bg-violet-500/5"
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-1.5 rounded-md ${urgency ? "bg-amber-500/20" : "bg-violet-500/20"}`}>
              <Sparkles className={`w-4 h-4 ${urgency ? "text-amber-400" : "text-violet-400"}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Trial Profissional
                </span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                  urgency ? "border-amber-500/50 text-amber-400" : "border-violet-500/50 text-violet-400"
                }`}>
                  <Clock className="w-3 h-3 mr-0.5" />
                  {trialStatus.daysRemaining > 0
                    ? `${trialStatus.daysRemaining}d ${trialStatus.hoursRemaining}h`
                    : `${trialStatus.hoursRemaining}h restantes`}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {urgency
                  ? "Seu trial expira em breve. Assine para não perder acesso."
                  : "Aproveite todos os recursos do plano Profissional gratuitamente."}
              </p>
            </div>
          </div>
          <Link href="/planos">
            <Button
              size="sm"
              variant={urgency ? "default" : "outline"}
              className={`text-xs h-8 ${
                urgency
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                  : "border-violet-500/40 text-violet-400 hover:bg-violet-500/10"
              }`}
            >
              <Crown className="w-3.5 h-3.5 mr-1" />
              Escolher Plano
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Trial expirado e sem plano pago: mostrar paywall suave
  if (trialStatus.trialUsed && !trialStatus.hasPaidPlan) {
    return (
      <div className="mx-4 mt-3 mb-1 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-md bg-red-500/20">
              <Clock className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-foreground">
                Trial expirado
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seu período de teste acabou. Assine um plano para continuar com acesso completo.
              </p>
            </div>
          </div>
          <Link href="/planos">
            <Button
              size="sm"
              className="text-xs h-8 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0"
            >
              Ver Planos
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
