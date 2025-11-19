import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Check, Zap, Building2, Home } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { PLANS } from "@shared/products";
import { APP_TITLE } from "@/const";

export default function Planos() {
  const { user, isAuthenticated, loading } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data: { url: string | null }) => {
      if (data.url) {
        toast.info("Redirecionando para o checkout...");
        window.open(data.url, '_blank');
      }
      setLoadingPlan(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar checkout: ${error.message}`);
      setLoadingPlan(null);
    }
  });

  const handleSubscribe = (planId: string, priceId?: string) => {
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para assinar um plano");
      return;
    }

    if (!priceId) {
      toast.error("ID de preço não configurado");
      return;
    }

    setLoadingPlan(planId);
    createCheckoutMutation.mutate({ priceId });
  };

  const planIcon = (planId: string) => {
    switch(planId) {
      case 'free': return <Home className="w-8 h-8" />;
      case 'pro': return <Zap className="w-8 h-8" />;
      case 'enterprise': return <Building2 className="w-8 h-8" />;
      default: return <Scale className="w-8 h-8" />;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return user?.subscriptionPlan === planId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold text-white">{APP_TITLE}</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-300">Olá, {user?.name}</span>
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button>Entrar</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Escolha o Plano Ideal
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            Potencialize sua prática jurídica com inteligência artificial. 
            Comece gratuitamente ou escolha um plano profissional.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="container mx-auto grid md:grid-cols-3 gap-8 max-w-6xl">
          {Object.entries(PLANS).map(([key, plan]) => {
            const planId = plan.id;
            const isCurrent = isCurrentPlan(planId);
            const isPopular = planId === 'pro';
            
            return (
              <Card 
                key={planId} 
                className={`relative ${
                  isPopular 
                    ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/20' 
                    : 'border-white/10'
                } bg-slate-900/50 backdrop-blur`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto mb-4 text-blue-400">
                    {planIcon(planId)}
                  </div>
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {planId === 'free' && 'Para começar'}
                    {planId === 'pro' && 'Para profissionais'}
                    {planId === 'enterprise' && 'Para escritórios'}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === 0 ? 'Grátis' : `R$ ${(plan.price / 100).toFixed(2)}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-400">/mês</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Plano Atual
                    </Button>
                  ) : planId === 'free' ? (
                    <Link href="/dashboard" className="w-full">
                      <Button className="w-full" variant="outline">
                        Começar Grátis
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleSubscribe(planId, plan.stripePriceId)}
                      disabled={loadingPlan === planId || !isAuthenticated}
                    >
                      {loadingPlan === planId ? 'Processando...' : 'Assinar Agora'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="container mx-auto mt-20 max-w-3xl">
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Posso cancelar a qualquer momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Sim! Você pode cancelar sua assinatura a qualquer momento. 
                  Seu acesso continuará até o final do período pago.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Como funcionam os limites do plano gratuito?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  O plano gratuito permite 10 análises, 5 gerações e 3 otimizações por mês. 
                  Os limites são renovados no primeiro dia de cada mês.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Posso mudar de plano depois?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                  O valor será ajustado proporcionalmente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
