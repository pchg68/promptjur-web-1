/**
 * Página de Indicações (Referral)
 * Permite ao usuário ver seu código de indicação, compartilhar e acompanhar indicações.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import {
  Users,
  Copy,
  Gift,
  Share2,
  CheckCircle,
  Clock,
  Coins,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function Referral() {
  const { user, isAuthenticated, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: myCode, isLoading: loadingCode } = trpc.referral.getMyCode.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myReferrals, isLoading: loadingReferrals } = trpc.referral.getMyReferrals.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const shareUrl = myCode
    ? `${window.location.origin}?ref=${myCode.code}`
    : "";

  const handleCopy = () => {
    if (!myCode) return;
    navigator.clipboard.writeText(myCode.code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link de indicação copiado!");
  };

  const handleNativeShare = () => {
    if (!shareUrl || !navigator.share) return;
    navigator.share({
      title: `Convite ${APP_TITLE}`,
      text: `Use meu código ${myCode?.code} para ganhar ${myCode?.referredRewardCredits} créditos extras no ${APP_TITLE}!`,
      url: shareUrl,
    }).catch(() => {});
  };

  if (loading || loadingCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Programa de Indicações</h1>
          <p className="text-muted-foreground mb-4">Faça login para acessar seu código de indicação.</p>
          <Link href="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <div className="h-5 w-px bg-border" />
          <h1 className="text-sm font-semibold text-foreground">Programa de Indicações</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white mb-2">
            <Gift className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Indique e Ganhe</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Compartilhe seu código com colegas advogados. Vocês dois ganham{" "}
            <strong className="text-emerald-500">{myCode?.rewardCredits || 5} créditos extras</strong>{" "}
            quando eles se cadastrarem!
          </p>
        </div>

        {/* Código de Referral */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Share2 className="w-4 h-4" />
            Seu código de indicação
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] bg-muted/50 rounded-lg px-4 py-3 font-mono text-lg font-bold text-foreground tracking-wider text-center">
              {myCode?.code || "..."}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>

          {/* Compartilhar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Copiar link
            </Button>
            {typeof navigator.share === "function" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNativeShare}
                className="gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                Compartilhar
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-start gap-2.5">
            <Coins className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                <strong className="text-foreground">Você ganha:</strong>{" "}
                {myCode?.rewardCredits || 5} créditos extras por cada indicação convertida.
              </p>
              <p>
                <strong className="text-foreground">Seu indicado ganha:</strong>{" "}
                {myCode?.referredRewardCredits || 5} créditos extras ao se cadastrar com seu código.
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{myCode?.totalReferrals || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Indicações feitas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{myCode?.convertedReferrals || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Convertidas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-violet-500">{myReferrals?.totalEarned || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Créditos ganhos</p>
          </div>
        </div>

        {/* Lista de indicações */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Suas indicações</h3>
          </div>

          {loadingReferrals ? (
            <div className="p-8 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !myReferrals?.referrals.length ? (
            <div className="p-8 text-center">
              <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma indicação ainda. Compartilhe seu código!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {myReferrals.referrals.map((ref: any) => (
                <div key={ref.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{ref.referredName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ref.status === "convertido" ? (
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Convertido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente
                      </Badge>
                    )}
                    {ref.rewarded && (
                      <span className="text-[10px] text-emerald-500 font-medium">
                        +{myCode?.rewardCredits || 5} créditos
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Como funciona */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Como funciona?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Compartilhe",
                desc: "Envie seu código ou link para colegas advogados.",
              },
              {
                step: "2",
                title: "Cadastro",
                desc: "Seu colega se cadastra usando seu código de indicação.",
              },
              {
                step: "3",
                title: "Ganhem juntos",
                desc: `Ambos recebem ${myCode?.rewardCredits || 5} créditos extras imediatamente.`,
              },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
