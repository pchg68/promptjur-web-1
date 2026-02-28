import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation, useSearch, Link } from "wouter";
import {
  Check,
  X,
  Zap,
  Crown,
  Building2,
  ArrowLeft,
  Loader2,
  CreditCard,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function Planos() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  const { data: plans, isLoading: plansLoading } = trpc.stripe.getPlans.useQuery();
  const { data: currentPlan } = trpc.stripe.getCurrentPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecionando para o checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar sessão de checkout");
    },
  });

  const portalMutation = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.portalUrl) {
        toast.info("Abrindo portal de gerenciamento...");
        window.open(data.portalUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao abrir portal de gerenciamento");
    },
  });

  // Handle success/cancel query params
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("success") === "true") {
      toast.success("Assinatura realizada com sucesso! Bem-vindo ao plano " + (params.get("plan") || "Pro") + "!");
    }
    if (params.get("canceled") === "true") {
      toast.info("Checkout cancelado. Você pode tentar novamente quando quiser.");
    }
  }, [searchString]);

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (planId === "free") return;
    checkoutMutation.mutate({
      planId: planId as "pro" | "enterprise",
      billingPeriod,
    });
  };

  const handleManageSubscription = () => {
    portalMutation.mutate();
  };

  const planIcons: Record<string, React.ReactNode> = {
    free: <Zap className="w-6 h-6" />,
    pro: <Crown className="w-6 h-6" />,
    enterprise: <Building2 className="w-6 h-6" />,
  };

  const planColors: Record<string, string> = {
    free: "from-zinc-500 to-zinc-600",
    pro: "from-amber-500 to-orange-600",
    enterprise: "from-violet-500 to-purple-600",
  };

  if (plansLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">{APP_TITLE}</span>
            </Link>
          </div>
          {isAuthenticated && currentPlan && currentPlan.id !== "free" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Gerenciar Assinatura
            </Button>
          )}
        </div>
      </header>

      <main className="container py-12">
        {/* Title Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Escolha seu plano
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Planos e Preços
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para suas necessidades jurídicas. 
            Todos os planos incluem acesso ao sistema de engenharia de prompts.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingPeriod === "monthly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingPeriod === "yearly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            <span className="ml-1.5 text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans?.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPopular = plan.popular;
            const price =
              billingPeriod === "monthly"
                ? plan.priceMonthlyFormatted
                : plan.priceYearlyMonthlyFormatted;
            const totalYearly = plan.priceYearlyFormatted;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-6 flex flex-col transition-all ${
                  isPopular
                    ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border hover:border-primary/30"
                } ${isCurrentPlan ? "ring-2 ring-primary/50" : ""}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Plano Atual
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-5">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${
                      planColors[plan.id] || "from-zinc-500 to-zinc-600"
                    } text-white mb-3`}
                  >
                    {planIcons[plan.id]}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.priceMonthly === 0 ? "R$ 0" : price}
                    </span>
                    {plan.priceMonthly > 0 && (
                      <span className="text-muted-foreground text-sm">/mês</span>
                    )}
                  </div>
                  {billingPeriod === "yearly" && plan.priceYearly > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalYearly} cobrado anualmente
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground/60 line-through"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="mt-auto">
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano Atual
                    </Button>
                  ) : plan.id === "free" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation("/dashboard")}
                    >
                      Começar Grátis
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${
                        isPopular
                          ? "bg-primary hover:bg-primary/90"
                          : ""
                      }`}
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={checkoutMutation.isPending}
                    >
                      {checkoutMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Assinar {plan.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Posso trocar de plano a qualquer momento?",
                a: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. O valor será ajustado proporcionalmente.",
              },
              {
                q: "Quais formas de pagamento são aceitas?",
                a: "Aceitamos cartões de crédito (Visa, Mastercard, American Express) e débito via Stripe. Pagamentos são processados de forma segura.",
              },
              {
                q: "Existe período de teste?",
                a: "O plano Gratuito permite que você experimente o sistema com 50 prompts por mês. Não é necessário cartão de crédito para começar.",
              },
              {
                q: "Como funciona o cancelamento?",
                a: "Você pode cancelar sua assinatura a qualquer momento. O acesso ao plano continua até o final do período já pago.",
              },
              {
                q: "Os dados são seguros?",
                a: "Sim. Utilizamos criptografia em trânsito e em repouso. Seus prompts e documentos são privados e nunca compartilhados.",
              },
              {
                q: "Para testar pagamentos, qual cartão usar?",
                a: "Use o cartão de teste: 4242 4242 4242 4242, com qualquer data futura e qualquer CVC.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group border border-border rounded-lg overflow-hidden"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-foreground">{faq.q}</span>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Pagamentos processados com segurança pelo{" "}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Stripe
            </a>
            . Preços em Reais (BRL).
          </p>
        </div>
      </main>
    </div>
  );
}
