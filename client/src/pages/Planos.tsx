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
  Coins,
  ChevronRight,
  Package,
  TrendingDown,
  Star,
  Shield,
  Rocket,
  FileText,
  Bot,
  Infinity,
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

// ─── Modal de confirmação de pagamento ────────────────────────────────────────
function PagamentoConfirmadoModal({
  open,
  onClose,
  planName,
}: {
  open: boolean;
  onClose: () => void;
  planName: string;
}) {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; duration: number }[]>([]);

  useEffect(() => {
    if (open) {
      const colors = ["#d4af37", "#f0d060", "#4a90e2", "#ffffff", "#e8c547", "#7ab8f5"];
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 1.5,
        duration: 2 + Math.random() * 2,
      }));
      setParticles(newParticles);
    }
  }, [open]);

  const isPro = planName.toLowerCase().includes("pro") || planName.toLowerCase().includes("profissional");
  const isEnterprise = planName.toLowerCase().includes("enterprise") || planName.toLowerCase().includes("escritório");

  const beneficios = isPro
    ? [
        { icon: <Bot className="w-4 h-4" />, texto: "Geração ilimitada de prompts jurídicos" },
        { icon: <FileText className="w-4 h-4" />, texto: "Acesso a todos os templates premium" },
        { icon: <Rocket className="w-4 h-4" />, texto: "Análise avançada com IA" },
        { icon: <Shield className="w-4 h-4" />, texto: "Suporte prioritário" },
        { icon: <Infinity className="w-4 h-4" />, texto: "Sem limite de documentos" },
      ]
    : isEnterprise
    ? [
        { icon: <Bot className="w-4 h-4" />, texto: "Tudo do Plano Profissional" },
        { icon: <Users className="w-4 h-4" />, texto: "Múltiplos usuários no escritório" },
        { icon: <Shield className="w-4 h-4" />, texto: "SLA e suporte dedicado" },
        { icon: <FileText className="w-4 h-4" />, texto: "Integrações customizadas" },
        { icon: <Star className="w-4 h-4" />, texto: "Onboarding personalizado" },
      ]
    : [
        { icon: <Check className="w-4 h-4" />, texto: "Acesso completo ao plano ativado" },
        { icon: <Rocket className="w-4 h-4" />, texto: "Recursos avançados desbloqueados" },
        { icon: <Shield className="w-4 h-4" />, texto: "Suporte prioritário ativado" },
      ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md overflow-hidden border-0 p-0"
        style={{
          background: "linear-gradient(135deg, #1a2332 0%, #1e2d45 50%, #1a2332 100%)",
          boxShadow: "0 0 0 1px rgba(212,175,55,0.3), 0 25px 50px rgba(0,0,0,0.6)",
        }}
      >
        {/* Confetti particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                left: `${p.x}%`,
                top: "-8px",
                backgroundColor: p.color,
                animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        {/* Faixa dourada superior */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg, #d4af37, #f0d060, #d4af37)" }}
        />

        <div className="p-8 relative">
          {/* Ícone central animado */}
          <div className="flex justify-center mb-6">
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))",
                border: "2px solid rgba(212,175,55,0.5)",
                boxShadow: "0 0 40px rgba(212,175,55,0.25), inset 0 0 20px rgba(212,175,55,0.05)",
                animation: "pulseGold 2s ease-in-out infinite",
              }}
            >
              <Crown
                className="w-12 h-12"
                style={{ color: "#d4af37", filter: "drop-shadow(0 0 8px rgba(212,175,55,0.6))" }}
              />
              {/* Anel externo */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: "1px solid rgba(212,175,55,0.2)",
                  animation: "ringExpand 2s ease-out infinite",
                }}
              />
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold text-white mb-1">
              Bem-vindo ao{" "}
              <span style={{ color: "#d4af37" }}>Plano {planName}</span>!
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Sua assinatura foi ativada com sucesso. Todos os recursos já estão disponíveis.
            </p>
          </div>

          {/* Divisor dourado */}
          <div
            className="my-5 h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)" }}
          />

          {/* Lista de benefícios */}
          <div className="space-y-2.5 mb-6">
            {beneficios.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{
                  background: "rgba(212,175,55,0.06)",
                  border: "1px solid rgba(212,175,55,0.12)",
                  animation: `slideInBeneficio 0.4s ease-out ${0.1 + i * 0.08}s both`,
                }}
              >
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37" }}
                >
                  {b.icon}
                </div>
                <span className="text-sm text-white/85">{b.texto}</span>
                <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "#d4af37" }} />
              </div>
            ))}
          </div>

          {/* Botão de ação */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #d4af37, #f0d060)",
              color: "#1a2332",
              boxShadow: "0 4px 20px rgba(212,175,55,0.35)",
            }}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Começar a usar agora
          </button>

          <p className="text-xs text-center mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Você receberá um e-mail de confirmação em breve.
          </p>
        </div>
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
  const [pagamentoConfirmadoOpen, setPagamentoConfirmadoOpen] = useState(false);
  const [planoPago, setPlanoPago] = useState("Profissional");
  const utils = trpc.useUtils();

  // Estado do formulário de captura de interesse
  const [interesseEmail, setInteresseEmail] = useState("");
  const [interesseNome, setInteresseNome] = useState("");
  const [interessePlano, setInteressePlano] = useState<"pro" | "enterprise" | "qualquer">("qualquer");
  const [interesseEnviado, setInteresseEnviado] = useState(false);
  const [interesseJaRegistrado, setInteresseJaRegistrado] = useState(false);
  const [emailConfirmado, setEmailConfirmado] = useState("");
  const [planoConfirmado, setPlanoConfirmado] = useState<"pro" | "enterprise" | "qualquer">("qualquer");

  const registrarInteresseMutation = trpc.stripe.registrarInteresse.useMutation({
    onSuccess: (data) => {
      setInteresseJaRegistrado(data.jaRegistrado);
      setEmailConfirmado(interesseEmail);
      setPlanoConfirmado(interessePlano);
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
  const { data: interessadosData } = trpc.stripe.getInteressadosCount.useQuery();
  const interessadosCount = interessadosData?.count ?? 0;
  const { data: currentPlan } = trpc.stripe.getCurrentPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: trialStatus } = trpc.stripe.getTrialStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // ─── Créditos extras ─────────────────────────────────────────────────────────
  const { data: creditPackages } = trpc.stripe.getCreditPackages.useQuery();
  const { data: usageData } = trpc.stripe.getMyUsage.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [creditsSectionOpen, setCreditsSectionOpen] = useState(false);

  const creditCheckoutMutation = trpc.stripe.createCreditCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecionando para o checkout de créditos...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar sessão de compra de créditos");
    },
  });

  const handleBuyCredits = (packageId: string) => {
    if (!pagamentosAtivos) {
      toast.info("Os pagamentos estão temporariamente desativados. Em breve disponível!");
      return;
    }
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    creditCheckoutMutation.mutate({ packageId });
  };

  // Abrir seção de créditos se URL tem #creditos
  useEffect(() => {
    if (window.location.hash === "#creditos") {
      setCreditsSectionOpen(true);
      setTimeout(() => {
        document.getElementById("creditos")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  // Detectar sucesso de compra de créditos
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("credits_success") === "true") {
      const credits = params.get("credits");
      toast.success(
        `${credits || ""} créditos extras adicionados com sucesso! Eles já estão disponíveis na sua conta.`
      );
    }
    if (params.get("credits_canceled") === "true") {
      toast.info("Compra de créditos cancelada.");
    }
  }, [searchString]);

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
      const planParam = params.get("plan") || "pro";
      const planDisplay =
        planParam === "pro" || planParam === "profissional"
          ? "Profissional"
          : planParam === "enterprise" || planParam === "escritório"
          ? "Escritório"
          : planParam.charAt(0).toUpperCase() + planParam.slice(1);
      setPlanoPago(planDisplay);
      setPagamentoConfirmadoOpen(true);
      // Invalida cache para refletir o novo plano imediatamente
      utils.stripe.getCurrentPlan.invalidate();
      utils.stripe.getTrialStatus.invalidate();
      utils.auth.me.invalidate();
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

  const handleClosePagamentoConfirmado = () => {
    setPagamentoConfirmadoOpen(false);
    // Remove query params da URL sem recarregar a página
    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    url.searchParams.delete("plan");
    window.history.replaceState({}, "", url.toString());
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
      {/* Modal de confirmação de pagamento */}
      <PagamentoConfirmadoModal
        open={pagamentoConfirmadoOpen}
        onClose={handleClosePagamentoConfirmado}
        planName={planoPago}
      />

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
                  Plataforma em fase beta — Planos pagos em breve
                </p>
                <p className="text-xs text-amber-200/70 mt-1">
                  Estamos finalizando a precificação e os testes de pagamento. Explore todas as
                  funcionalidades gratuitamente até o lançamento oficial. Os preços são para referência.
                </p>
                {/* Contador de interessados */}
                {interessadosCount > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-amber-300/80">
                          <span className="font-bold text-amber-300">{interessadosCount}</span> {interessadosCount === 1 ? "pessoa" : "pessoas"} na lista de espera
                        </span>
                        <span className="text-xs text-amber-400/60">Meta: 100</span>
                      </div>
                      <div className="h-1.5 w-full bg-amber-900/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, (interessadosCount / 100) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Formulário de captura */}
            <div className="p-4">
              {interesseEnviado ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Ícone de confirmação */}
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      interesseJaRegistrado
                        ? "bg-blue-500/20 ring-2 ring-blue-500/40"
                        : "bg-green-500/20 ring-2 ring-green-500/40"
                    }`}>
                      <Check className={`w-6 h-6 ${interesseJaRegistrado ? "text-blue-400" : "text-green-400"}`} />
                    </div>
                  </div>

                  {/* Texto principal */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${
                      interesseJaRegistrado ? "text-blue-300" : "text-green-300"
                    }`}>
                      {interesseJaRegistrado
                        ? "📧 Você já está na lista!"
                        : "🎉 Cadastro confirmado!"}
                    </p>
                    <p className="text-xs text-amber-200/80 mt-0.5">
                      {interesseJaRegistrado ? (
                        <>
                          O e-mail <span className="font-semibold text-amber-300">{emailConfirmado}</span> já
                          estava cadastrado. Fique tranquilo — você será um dos primeiros a saber quando
                          os planos forem ativados.
                        </>
                      ) : (
                        <>
                          Enviamos uma confirmação para{" "}
                          <span className="font-semibold text-amber-300">{emailConfirmado}</span>.
                          Assim que os planos{" "}
                          <span className="font-semibold">
                            {planoConfirmado === "pro" ? "Pro" : planoConfirmado === "enterprise" ? "Escritório" : "pagos"}
                          </span>{" "}
                          forem ativados, você será notificado imediatamente.
                        </>
                      )}
                    </p>
                    {/* Itens de reação */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400/70">
                        <Bell className="w-3 h-3" />
                        Notificação por e-mail
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400/70">
                        <Sparkles className="w-3 h-3" />
                        Acesso antecipado garantido
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400/70">
                        <Zap className="w-3 h-3" />
                        Continue explorando gratuitamente
                      </span>
                    </div>
                  </div>

                  {/* Botão de reset */}
                  <button
                    onClick={() => {
                      setInteresseEnviado(false);
                      setInteresseJaRegistrado(false);
                      setEmailConfirmado("");
                    }}
                    className="flex-shrink-0 text-xs text-amber-400/50 hover:text-amber-400 underline transition-colors"
                  >
                    Cadastrar outro e-mail
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

        {/* Banner de Trial */}
        {trialStatus?.isActive && (
          <div className="max-w-5xl mx-auto mb-8 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
            <div className="flex items-center gap-3 flex-wrap justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-violet-300 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Você está no Trial Profissional — {trialStatus.daysRemaining}d {trialStatus.hoursRemaining}h restantes
                  </p>
                  <p className="text-xs text-violet-200/70 mt-0.5">
                    Aproveite todos os recursos do plano Profissional gratuitamente por {trialStatus.trialDurationDays} dias.
                    Assine antes do término para não perder acesso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner Trial Expirado */}
        {trialStatus?.trialUsed && !trialStatus?.isActive && !trialStatus?.hasPaidPlan && (
          <div className="max-w-5xl mx-auto mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  Seu trial de {trialStatus.trialDurationDays} dias expirou
                </p>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  Escolha um plano abaixo para continuar com acesso completo aos recursos profissionais.
                </p>
              </div>
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
            {trialStatus?.isActive
              ? "Seu trial está ativo! Assine um plano para garantir acesso contínuo após o período de teste."
              : "Escolha o plano ideal para suas necessidades jurídicas. Todos os planos incluem acesso ao sistema de engenharia de prompts."}
          </p>
          {!trialStatus?.trialUsed && isAuthenticated && (
            <p className="text-sm text-violet-400 mt-2">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Todos os novos usuários recebem 7 dias de trial gratuito do plano Profissional!
            </p>
          )}
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
                {isCurrentPlan && !((currentPlan as any)?.isOnTrial && plan.id === "pro") && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Plano Atual
                    </span>
                  </div>
                )}

                {/* Trial Badge */}
                {(currentPlan as any)?.isOnTrial && plan.id === "pro" && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Trial Ativo
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
                  {isCurrentPlan && !((currentPlan as any)?.isOnTrial) ? (
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

        {/* ─── Seção de Créditos Extras ──────────────────────────────────────── */}
        <div id="creditos" className="mt-12 max-w-5xl mx-auto">
          <button
            onClick={() => setCreditsSectionOpen(!creditsSectionOpen)}
            className="w-full flex items-center justify-between p-5 rounded-xl border border-border hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                <Coins className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-foreground">Créditos Extras</h2>
                <p className="text-sm text-muted-foreground">
                  Precisa de mais operações? Compre pacotes avulsos sem mudar de plano.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {usageData && usageData.bonusCredits > 0 && (
                <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  {usageData.bonusCredits} créditos disponíveis
                </span>
              )}
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  creditsSectionOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {creditsSectionOpen && creditPackages && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {creditPackages.map((pkg) => {
                const savingsPercent =
                  pkg.id === "credits_10" ? 0 :
                  pkg.id === "credits_50" ? 15 :
                  pkg.id === "credits_100" ? 25 : 35;

                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-xl border p-5 flex flex-col transition-all ${
                      pkg.popular
                        ? "border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                        : "border-border hover:border-emerald-500/30"
                    }`}
                  >
                    {/* Popular badge */}
                    {pkg.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                          Mais Vendido
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-foreground">{pkg.name}</h3>
                    </div>

                    {/* Preço */}
                    <div className="mb-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">
                          {pkg.priceFormatted}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pkg.pricePerCreditFormatted} por crédito
                      </p>
                    </div>

                    {/* Desconto */}
                    {savingsPercent > 0 && (
                      <div className="flex items-center gap-1 text-xs text-emerald-500 mb-3">
                        <TrendingDown className="w-3 h-3" />
                        <span className="font-medium">{savingsPercent}% de desconto</span>
                      </div>
                    )}

                    {/* Descrição */}
                    <p className="text-xs text-muted-foreground mb-4 flex-1">
                      {pkg.description}
                    </p>

                    {/* Botão */}
                    <Button
                      variant={pkg.popular ? "default" : "outline"}
                      size="sm"
                      className={`w-full ${
                        pkg.popular
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                          : ""
                      }`}
                      onClick={() => handleBuyCredits(pkg.id)}
                      disabled={creditCheckoutMutation.isPending}
                    >
                      {creditCheckoutMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : !pagamentosAtivos ? (
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {pagamentosAtivos ? "Comprar" : "Em breve"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {creditsSectionOpen && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <Coins className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong className="text-foreground">Como funcionam os créditos extras?</strong>{" "}
                    Créditos são consumidos automaticamente quando você atinge o limite mensal do seu plano.
                    Eles <strong>não expiram</strong> e ficam disponíveis até serem utilizados.
                  </p>
                  <p>
                    Cada crédito equivale a 1 operação (análise, geração ou otimização de prompt).
                    Ideal para meses de maior demanda sem precisar mudar de plano.
                  </p>
                </div>
              </div>
            </div>
          )}
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
                a: "Sim! Todos os novos usuários recebem automaticamente 7 dias de trial gratuito do plano Profissional, com acesso a todos os recursos premium (300 operações, GPT-4o + Claude + Gemini, templates ilimitados). Não é necessário cartão de crédito. Após o trial, você pode escolher um plano pago ou continuar com o plano Gratuito (20 operações/mês).",
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
