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
  Phone,
  Mail,
  MessageSquare,
  Users,
  ChevronDown,
  Clock,
  FlaskConical,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ─── Formulário de contato Enterprise ─────────────────────────────────────────
function EnterpriseContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    escritorio: "",
    numeroAdvogados: "" as "" | "1-5" | "6-20" | "21-50" | "51-100" | "100+",
    areasPrincipais: "",
    mensagem: "",
  });

  const leadMutation = trpc.stripe.enviarLeadEnterprise.useMutation({
    onSuccess: () => {
      toast.success(
        "Solicitação enviada! Nossa equipe entrará em contato em até 24 horas."
      );
      onClose();
      setForm({
        nome: "",
        email: "",
        escritorio: "",
        numeroAdvogados: "",
        areasPrincipais: "",
        mensagem: "",
      });
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar solicitação. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numeroAdvogados) {
      toast.error("Selecione o número de advogados");
      return;
    }
    leadMutation.mutate({
      nome: form.nome,
      email: form.email,
      escritorio: form.escritorio,
      numeroAdvogados: form.numeroAdvogados as "1-5" | "6-20" | "21-50" | "51-100" | "100+",
      areasPrincipais: form.areasPrincipais || undefined,
      mensagem: form.mensagem || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Plano Escritório — Consulta Comercial</DialogTitle>
              <DialogDescription className="text-sm">
                Preencha o formulário e nossa equipe entrará em contato em até 24h.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                placeholder="Dr. João Silva"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail profissional *</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@escritorio.adv.br"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="escritorio">Nome do escritório *</Label>
            <Input
              id="escritorio"
              placeholder="Silva & Associados Advogados"
              value={form.escritorio}
              onChange={(e) => setForm((f) => ({ ...f, escritorio: e.target.value }))}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="numeroAdvogados">
              <Users className="w-3.5 h-3.5 inline mr-1" />
              Número de advogados *
            </Label>
            <div className="relative">
              <select
                id="numeroAdvogados"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.numeroAdvogados}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    numeroAdvogados: e.target.value as typeof form.numeroAdvogados,
                  }))
                }
                required
              >
                <option value="">Selecione...</option>
                <option value="1-5">1 a 5 advogados</option>
                <option value="6-20">6 a 20 advogados</option>
                <option value="21-50">21 a 50 advogados</option>
                <option value="51-100">51 a 100 advogados</option>
                <option value="100+">Mais de 100 advogados</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="areas">Áreas jurídicas principais (opcional)</Label>
            <Input
              id="areas"
              placeholder="Ex: Trabalhista, Civil, Tributário"
              value={form.areasPrincipais}
              onChange={(e) => setForm((f) => ({ ...f, areasPrincipais: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mensagem">Mensagem ou necessidades específicas (opcional)</Label>
            <Textarea
              id="mensagem"
              placeholder="Descreva brevemente como o PromptJur pode ajudar seu escritório..."
              rows={3}
              value={form.mensagem}
              onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={leadMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0"
              disabled={leadMutation.isPending}
            >
              {leadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Enviar Solicitação
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Ao enviar, você concorda que nossa equipe entre em contato pelo e-mail informado.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function Planos() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);

  // Estado do formulário de captura de interesse
  const [interesseEmail, setInteresseEmail] = useState("");
  const [interesseNome, setInteresseNome] = useState("");
  const [interessePlano, setInteressePlano] = useState<"pro" | "enterprise" | "qualquer">("qualquer");
  const [interesseEnviado, setInteresseEnviado] = useState(false);

  const registrarInteresseMutation = trpc.stripe.registrarInteresse.useMutation({
    onSuccess: (data) => {
      if (data.jaRegistrado) {
        toast.info("Seu e-mail já está na lista! Você será notificado quando os planos forem ativados.");
      } else {
        toast.success("Cadastrado com sucesso! Você será notificado quando os planos forem ativados.");
      }
      setInteresseEnviado(true);
      setInteresseEmail("");
      setInteresseNome("");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao registrar. Tente novamente.");
    },
  });

  const handleRegistrarInteresse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interesseEmail) return;
    registrarInteresseMutation.mutate({
      email: interesseEmail,
      nome: interesseNome || undefined,
      planoInteresse: interessePlano,
    });
  };

  const { data: plans, isLoading: plansLoading } = trpc.stripe.getPlans.useQuery();
  const { data: pagamentosStatus } = trpc.stripe.getPagamentosAtivos.useQuery();
  const pagamentosAtivos = pagamentosStatus?.ativo ?? false;
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

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("success") === "true") {
      toast.success(
        "Assinatura realizada com sucesso! Bem-vindo ao plano " +
          (params.get("plan") || "Pro") +
          "!"
      );
    }
    if (params.get("canceled") === "true") {
      toast.info("Checkout cancelado. Você pode tentar novamente quando quiser.");
    }
  }, [searchString]);

  const handleSubscribe = (planId: string) => {
    if (!pagamentosAtivos) {
      toast.info("Os pagamentos estão temporariamente desativados. Em breve disponível!");
      return;
    }
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
            <Link
              href="/"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">{APP_TITLE}</span>
            </Link>
          </div>
          {isAuthenticated && currentPlan && currentPlan.id !== "free" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => portalMutation.mutate()}
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
        {/* Banner: Pagamentos desativados (fase de testes) + captura de e-mail */}
        {!pagamentosAtivos && (
          <div className="max-w-5xl mx-auto mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 overflow-hidden">
            {/* Cabeçalho do banner */}
            <div className="p-4 flex items-start gap-3 border-b border-amber-500/20">
              <div className="p-2 rounded-lg bg-amber-500/20 flex-shrink-0">
                <FlaskConical className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Plataforma em fase de testes — Pagamentos temporariamente desativados
                </p>
                <p className="text-xs text-amber-200/70 mt-1">
                  Os planos pagos estarão disponíveis em breve. Enquanto isso, explore todas as
                  funcionalidades gratuitamente. Os preços exibidos são para referência.
                </p>
              </div>
            </div>

            {/* Formulário de captura */}
            <div className="p-4">
              {interesseEnviado ? (
                <div className="flex items-center gap-3 text-amber-300">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Cadastro realizado!</p>
                    <p className="text-xs text-amber-200/70">
                      Você será notificado por e-mail assim que os planos pagos forem ativados.
                    </p>
                  </div>
                  <button
                    onClick={() => setInteresseEnviado(false)}
                    className="ml-auto text-xs text-amber-400/60 hover:text-amber-400 underline"
                  >
                    Cadastrar outro
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegistrarInteresse} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-amber-300 mb-1">
                      <Bell className="w-3 h-3 inline mr-1" />
                      Seja notificado quando os planos forem ativados
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seu@email.com.br"
                      value={interesseEmail}
                      onChange={(e) => setInteresseEmail(e.target.value)}
                      className="w-full h-9 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 text-sm text-amber-100 placeholder:text-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <label className="block text-xs font-medium text-amber-300 mb-1">Plano de interesse</label>
                    <select
                      value={interessePlano}
                      onChange={(e) => setInteressePlano(e.target.value as typeof interessePlano)}
                      className="w-full h-9 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 text-sm text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    >
                      <option value="qualquer">Qualquer plano</option>
                      <option value="pro">Plano Pro</option>
                      <option value="enterprise">Plano Escritório</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={registrarInteresseMutation.isPending || !interesseEmail}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold shrink-0 h-9"
                  >
                    {registrarInteresseMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Bell className="w-4 h-4 mr-1" />
                    )}
                    Avisar-me
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

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
            Escolha o plano ideal para suas necessidades jurídicas. Todos os planos incluem
            acesso ao sistema de engenharia de prompts.
          </p>
        </div>

        {/* Billing Toggle — hidden for enterprise-only view */}
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
            const isContactOnly = (plan as typeof plan & { contactOnly?: boolean }).contactOnly;
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
                    : isContactOnly
                    ? "border-violet-500/40 shadow-lg shadow-violet-500/10"
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

                {/* Enterprise Badge */}
                {isContactOnly && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Sob Consulta
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

                {/* Price — Enterprise shows "Consulte-nos" */}
                <div className="mb-6">
                  {isContactOnly ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">Consulte-nos</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Precificação personalizada conforme o porte e as necessidades do escritório.
                      </p>
                    </div>
                  ) : (
                    <div>
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
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <Check
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isContactOnly ? "text-violet-500" : "text-green-500"
                          }`}
                        />
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
                  ) : isContactOnly ? (
                    /* Enterprise — abre modal de contato */
                    <Button
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0"
                      onClick={() => setEnterpriseModalOpen(true)}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Fale com nossa equipe
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
                      className={`w-full ${isPopular && pagamentosAtivos ? "bg-primary hover:bg-primary/90" : ""}`}
                      variant={isPopular && pagamentosAtivos ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={checkoutMutation.isPending}
                    >
                      {checkoutMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : !pagamentosAtivos ? (
                        <Clock className="w-4 h-4 mr-2" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      {pagamentosAtivos ? `Assinar ${plan.name}` : "Em breve"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise info strip */}
        <div className="mt-8 max-w-5xl mx-auto rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Plano Escritório — Precificação Personalizada
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                O valor é definido conforme o número de usuários, volume de operações e
                integrações necessárias. Entre em contato para receber uma proposta.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-violet-500/40 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 shrink-0"
            onClick={() => setEnterpriseModalOpen(true)}
          >
            <Mail className="w-4 h-4 mr-2" />
            Solicitar proposta
          </Button>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "O que é uma 'operação' no PromptJur?",
                a: "Uma operação corresponde a uma ação completa na plataforma: análise de prompt, geração de prompt jurídico, otimização de texto ou geração de documento. Cada ação consome uma operação do seu plano.",
              },
              {
                q: "Como funciona o Plano Escritório?",
                a: "O Plano Escritório é personalizado conforme o porte do escritório, número de advogados e volume de uso esperado. Entre em contato pelo formulário e nossa equipe elaborará uma proposta em até 24 horas.",
              },
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
                a: "O plano Gratuito permite que você experimente o sistema com 20 operações por mês. Não é necessário cartão de crédito para começar.",
              },
              {
                q: "Como funciona o cancelamento?",
                a: "Você pode cancelar sua assinatura a qualquer momento. O acesso ao plano continua até o final do período já pago.",
              },
              {
                q: "Os dados são seguros?",
                a: "Sim. Utilizamos criptografia em trânsito e em repouso. Seus prompts e documentos são privados e nunca compartilhados.",
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
                <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</div>
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

      {/* Enterprise Contact Modal */}
      <EnterpriseContactModal
        open={enterpriseModalOpen}
        onClose={() => setEnterpriseModalOpen(false)}
      />
    </div>
  );
}
