import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldX, Mail, LogOut, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Página exibida quando o usuário faz login mas não está na whitelist de acesso
 */
export default function AcessoRestrito() {
  const { user, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Card principal */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl text-center">
          {/* Ícone */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
              <ShieldX className="w-10 h-10 text-red-400" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Acesso Restrito
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            O PromptJur está em fase de testes fechados. Seu e-mail ainda não
            foi adicionado à lista de acesso autorizado.
          </p>

          {/* E-mail do usuário */}
          {user?.email && (
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-sm font-medium truncate">{user.email}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Este e-mail não está na lista de acesso
              </p>
            </div>
          )}

          {/* Instruções */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6 text-left">
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-2">
              Como obter acesso?
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Entre em contato com o administrador da plataforma e solicite a
              inclusão do seu e-mail na lista de acesso autorizado para a fase
              de testes.
            </p>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4" />
              {logoutMutation.isPending ? "Saindo..." : "Sair da conta"}
            </Button>

            <Link href="/">
              <Button
                variant="outline"
                className="w-full gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o início
              </Button>
            </Link>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-slate-600 text-xs mt-6">
          PromptJur &copy; {new Date().getFullYear()} — Fase de Testes Fechados
        </p>
      </div>
    </div>
  );
}
