/**
 * DashboardHome — Área principal do dashboard com cards de resumo e ações rápidas.
 * Segue o padrão visual navy + gold do PromptJur.
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, FileText, BookTemplate, History, TrendingUp,
  Zap, Star, Clock, CheckCircle2, ArrowRight, Scale,
  Search, FileDown, Wand2, BarChart3, Target, Activity
} from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardHomeProps {
  onNavigate?: (tab: string) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const statsQuery = trpc.historico.stats.useQuery(undefined, {
    staleTime: 60_000,
    retry: 1,
  });

  const stats = statsQuery.data;
  const loading = statsQuery.isLoading;

  // Saudação dinâmica por horário
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const primeiroNome = user?.name?.split(" ")[0] ?? "Advogado";

  // Última atividade formatada
  const ultimaAtividade = stats?.ultimaAtividade
    ? formatDistanceToNow(new Date(stats.ultimaAtividade), { addSuffix: true, locale: ptBR })
    : null;

  // Área jurídica mais usada
  const areaMaisUsada = stats?.porArea
    ? Object.entries(stats.porArea).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  // Modelo mais usado
  const modeloMaisUsado = stats?.porModelo
    ? Object.entries(stats.porModelo).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  const cards = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Prompts Gerados",
      value: stats?.totalPrompts ?? 0,
      sub: stats?.porAcao?.geracao ? `${stats.porAcao.geracao} gerações` : "nenhuma geração ainda",
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20",
    },
    {
      icon: <Search className="w-5 h-5" />,
      label: "Análises Realizadas",
      value: stats?.porAcao?.analise ?? 0,
      sub: stats?.taxaSucesso ? `${stats.taxaSucesso}% de sucesso` : "nenhuma análise ainda",
      color: "text-blue-400",
      bg: "bg-blue-400/10 border-blue-400/20",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      label: "Otimizações",
      value: stats?.porAcao?.otimizacao ?? 0,
      sub: stats?.tempoMedio ? `~${Math.round(stats.tempoMedio / 1000)}s por operação` : "nenhuma otimização ainda",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20",
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: "Favoritos",
      value: stats?.totalFavoritos ?? 0,
      sub: areaMaisUsada ? `Área: ${areaMaisUsada}` : "nenhum favorito ainda",
      color: "text-purple-400",
      bg: "bg-purple-400/10 border-purple-400/20",
    },
  ];

  const acoes = [
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Nova Peça Jurídica",
      desc: "Gere petições, contratos e documentos com IA",
      tab: "gerar",
      primary: true,
    },
    {
      icon: <Search className="w-4 h-4" />,
      label: "Analisar Prompt",
      desc: "Avalie qualidade e área jurídica automaticamente",
      tab: "revisar",
      primary: false,
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "Otimizar Prompt",
      desc: "Melhore prompts existentes com sugestões de IA",
      tab: "revisar",
      primary: false,
    },
    {
      icon: <BookTemplate className="w-4 h-4" />,
      label: "Meus Modelos",
      desc: "Acesse templates salvos e reutilizáveis",
      tab: "modelos",
      primary: false,
    },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">

        {/* ── Saudação ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {saudacao}, <span className="text-amber-400">{primeiroNome}</span> 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ultimaAtividade
                ? `Última atividade ${ultimaAtividade}`
                : "Bem-vindo ao PromptJur — comece gerando sua primeira peça jurídica"}
            </p>
          </div>
          {modeloMaisUsado && (
            <Badge variant="outline" className="text-xs border-amber-400/30 text-amber-400 hidden sm:flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Modelo favorito: {modeloMaisUsado.replace("manus-", "Manus ").replace("gpt-", "GPT-")}
            </Badge>
          )}
        </div>

        {/* ── Cards de Resumo ───────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Resumo de Atividades
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map((card, i) => (
              <div
                key={i}
                className={`rounded-lg border p-4 ${card.bg} transition-all hover:scale-[1.02]`}
              >
                <div className={`${card.color} mb-2`}>{card.icon}</div>
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-16 mb-1 bg-white/10" />
                    <Skeleton className="h-3 w-24 bg-white/5" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground tabular-nums">
                      {card.value.toLocaleString("pt-BR")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
                    <div className={`text-xs mt-1 ${card.color} opacity-80`}>{card.sub}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Ações Rápidas ─────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {acoes.map((acao, i) => (
              <button
                key={i}
                onClick={() => onNavigate?.(acao.tab)}
                className={`
                  group flex items-center gap-4 rounded-lg border p-4 text-left
                  transition-all hover:scale-[1.01] cursor-pointer
                  ${acao.primary
                    ? "bg-amber-400/15 border-amber-400/40 hover:bg-amber-400/20"
                    : "bg-card/50 border-border hover:border-amber-400/30 hover:bg-card/80"
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center
                  ${acao.primary ? "bg-amber-400 text-background" : "bg-muted text-muted-foreground group-hover:text-amber-400 group-hover:bg-amber-400/10"}
                  transition-colors
                `}>
                  {acao.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${acao.primary ? "text-amber-400" : "text-foreground"}`}>
                    {acao.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{acao.desc}</div>
                </div>
                <ArrowRight className={`
                  w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1
                  ${acao.primary ? "text-amber-400" : "text-muted-foreground"}
                `} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Dica do dia ───────────────────────────────────────── */}
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Wand2 className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-400 mb-1">💡 Dica profissional</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use o <strong className="text-foreground">botão de Sugestão Inteligente</strong> na aba "Gerar Prompt" para preencher automaticamente os campos de contexto e objetivo com base no tipo de documento selecionado — economize tempo e melhore a qualidade das peças geradas.
            </p>
          </div>
        </div>

        {/* ── Atividade recente ─────────────────────────────────── */}
        {stats && stats.totalAcoes > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Distribuição de Uso
            </h2>
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <div className="space-y-2">
                {Object.entries(stats.porAcao)
                  .sort((a, b) => b[1] - a[1])
                  .map(([acao, total]) => {
                    const pct = stats.totalAcoes > 0 ? Math.round((total / stats.totalAcoes) * 100) : 0;
                    const labels: Record<string, string> = {
                      geracao: "Geração de Peças",
                      analise: "Análise de Prompts",
                      otimizacao: "Otimização",
                      verificacao: "Verificação",
                      exportacao_docx: "Exportação DOCX",
                      exportacao_pdf: "Exportação PDF",
                      execucao_prompt: "Execução de Prompt",
                    };
                    const colors: Record<string, string> = {
                      geracao: "bg-amber-400",
                      analise: "bg-blue-400",
                      otimizacao: "bg-emerald-400",
                      verificacao: "bg-purple-400",
                      exportacao_docx: "bg-orange-400",
                      exportacao_pdf: "bg-red-400",
                      execucao_prompt: "bg-cyan-400",
                    };
                    return (
                      <div key={acao} className="flex items-center gap-3">
                        <div className="w-28 text-xs text-muted-foreground truncate flex-shrink-0">
                          {labels[acao] ?? acao}
                        </div>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[acao] ?? "bg-amber-400"} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-10 text-right text-xs text-muted-foreground flex-shrink-0">
                          {total}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Total: <strong className="text-foreground">{stats.totalAcoes}</strong> operações
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2 text-amber-400 hover:text-amber-300"
                  onClick={() => navigate("/historico")}
                >
                  Ver histórico completo <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
