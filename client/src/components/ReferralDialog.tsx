/**
 * ReferralDialog — Modal de código de indicação
 * 
 * Exibido automaticamente quando:
 * 1. A URL contém ?ref=CODIGO (link de indicação compartilhado)
 * 2. O usuário está logado e nunca aplicou um código de referral
 * 
 * O código é salvo no localStorage até o usuário fazer login,
 * momento em que é aplicado automaticamente via tRPC.
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, CheckCircle, Loader2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const REFERRAL_CODE_KEY = "promptjur-referral-code";
const REFERRAL_APPLIED_KEY = "promptjur-referral-applied";

/**
 * Captura o código de referral da URL (?ref=CODIGO) e salva no localStorage.
 * Chamado no mount do componente.
 */
function captureReferralFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get("ref");
  if (refCode) {
    localStorage.setItem(REFERRAL_CODE_KEY, refCode.toUpperCase());
    // Limpar o parâmetro da URL sem recarregar
    const url = new URL(window.location.href);
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.pathname + url.search);
    return refCode.toUpperCase();
  }
  return localStorage.getItem(REFERRAL_CODE_KEY);
}

export function ReferralDialog() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    referrerName: string | null;
    rewardCredits: number;
  } | null>(null);

  const applyMutation = trpc.referral.applyCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Código aplicado! Você ganhou ${data.creditsEarned} créditos extras.`, {
        icon: <Gift className="w-4 h-4" />,
      });
      localStorage.setItem(REFERRAL_APPLIED_KEY, "true");
      localStorage.removeItem(REFERRAL_CODE_KEY);
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const validateQuery = trpc.referral.validateCode.useQuery(
    { code },
    {
      enabled: code.length >= 3 && validating,
      retry: false,
    }
  );

  // Capturar código da URL ao montar
  useEffect(() => {
    const savedCode = captureReferralFromUrl();
    if (savedCode) {
      setCode(savedCode);
    }
  }, []);

  // Abrir dialog quando:
  // - Usuário está logado
  // - Tem código pendente no localStorage
  // - Nunca aplicou um código antes
  useEffect(() => {
    if (!isAuthenticated) return;
    const alreadyApplied = localStorage.getItem(REFERRAL_APPLIED_KEY);
    if (alreadyApplied) return;

    const pendingCode = localStorage.getItem(REFERRAL_CODE_KEY);
    if (pendingCode) {
      setCode(pendingCode);
      setOpen(true);
    }
  }, [isAuthenticated]);

  // Validar código quando muda
  useEffect(() => {
    if (code.length >= 3) {
      setValidating(true);
    } else {
      setValidating(false);
      setValidationResult(null);
    }
  }, [code]);

  // Atualizar resultado da validação
  useEffect(() => {
    if (validateQuery.data) {
      setValidationResult({
        valid: validateQuery.data.valid,
        referrerName: validateQuery.data.referrerName ?? null,
        rewardCredits: validateQuery.data.rewardCredits ?? 0,
      });
      setValidating(false);
    }
  }, [validateQuery.data]);

  const handleApply = () => {
    if (!code || !validationResult?.valid) return;
    applyMutation.mutate({ code });
  };

  const handleSkip = () => {
    localStorage.removeItem(REFERRAL_CODE_KEY);
    localStorage.setItem(REFERRAL_APPLIED_KEY, "skipped");
    setOpen(false);
  };

  // Não renderizar se não autenticado ou já aplicou
  if (!isAuthenticated) return null;
  if (localStorage.getItem(REFERRAL_APPLIED_KEY)) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Código de Indicação</DialogTitle>
              <DialogDescription>
                Ganhe créditos extras ao usar um código de indicação
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="referral-code">Código de indicação</Label>
            <Input
              id="referral-code"
              placeholder="Ex: PEDRO-ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider"
              maxLength={32}
            />
          </div>

          {/* Resultado da validação */}
          {validating && validateQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Verificando código...
            </div>
          )}

          {validationResult && validationResult.valid && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="text-sm space-y-0.5">
                <p className="text-foreground font-medium">
                  Código válido!
                </p>
                <p className="text-muted-foreground">
                  Indicado por <strong>{validationResult.referrerName}</strong>. 
                  Você receberá <strong className="text-emerald-500">{validationResult.rewardCredits} créditos extras</strong> ao aplicar.
                </p>
              </div>
            </div>
          )}

          {validationResult && !validationResult.valid && code.length >= 3 && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              Código inválido ou expirado. Verifique e tente novamente.
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Pular
          </Button>
          <Button
            onClick={handleApply}
            disabled={!validationResult?.valid || applyMutation.isPending}
            className="gap-1.5"
          >
            {applyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gift className="w-4 h-4" />
            )}
            Aplicar código
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para verificar se há código de referral pendente.
 * Útil para exibir banner ou botão em outras páginas.
 */
export function useHasPendingReferral(): boolean {
  const [hasPending, setHasPending] = useState(false);
  useEffect(() => {
    const code = localStorage.getItem(REFERRAL_CODE_KEY);
    const applied = localStorage.getItem(REFERRAL_APPLIED_KEY);
    setHasPending(!!code && !applied);
  }, []);
  return hasPending;
}
