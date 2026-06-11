import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Bot,
  User,
  Send,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  CheckCheck,
  Download,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Loader2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SugestoesPrompts, type EstrategiaPrompt } from "@/components/SugestoesPrompts";
import { useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mensagem {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  etapa?: number | null;
  createdAt?: string;
  isStreaming?: boolean;
}

interface Sessao {
  id: number;
  titulo: string | null;
  etapaAtual: number;
  etapaConcluida: boolean;
  areaJuridica: string | null;
  tipoDocumento: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Etapas do Wizard ─────────────────────────────────────────────────────────

const ETAPAS_INFO = [
  { numero: 1, titulo: "Área e Documento", icone: "⚖️" },
  { numero: 2, titulo: "Partes e Contexto", icone: "👥" },
  { numero: 3, titulo: "Pedidos e Fundamentos", icone: "📋" },
  { numero: 4, titulo: "Provas e Documentos", icone: "📁" },
  { numero: 5, titulo: "Estilo e Formalidade", icone: "✍️" },
  { numero: 6, titulo: "Revisão e Geração", icone: "🎯" },
];

// ─── Componente de Mensagem ───────────────────────────────────────────────────

function MensagemItem({ msg }: { msg: Mensagem }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const isAssistente = msg.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 group",
        isAssistente ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1",
          isAssistente
            ? "bg-gradient-to-br from-blue-600 to-indigo-700"
            : "bg-gradient-to-br from-slate-600 to-slate-700"
        )}
      >
        {isAssistente ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Balão */}
      <div
        className={cn(
          "relative max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          isAssistente
            ? "bg-card border border-border rounded-tl-sm"
            : "bg-primary text-primary-foreground rounded-tr-sm"
        )}
      >
        {msg.isStreaming ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs">Digitando...</span>
          </div>
        ) : isAssistente ? (
          <Streamdown>{msg.content}</Streamdown>
        ) : (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        )}

        {/* Botões copiar e download (apenas assistente) */}
        {isAssistente && !msg.isStreaming && (
          <div className="absolute -bottom-6 right-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={copiar}
              className="text-muted-foreground hover:text-foreground"
              title="Copiar texto"
            >
              {copiado ? (
                <CheckCheck className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => {
                const blob = new Blob([msg.content], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `promptjur-resultado-${Date.now()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Arquivo .txt baixado!");
              }}
              className="text-muted-foreground hover:text-foreground"
              title="Baixar como .txt"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Badge de etapa */}
        {msg.etapa && isAssistente && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              Etapa {msg.etapa}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Barra de Progresso do Wizard ─────────────────────────────────────────────

function WizardProgress({ etapaAtual, concluido }: { etapaAtual: number; concluido: boolean }) {
  return (
    <div className="px-4 py-3 border-b bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          {concluido ? "✅ Wizard concluído" : `Etapa ${etapaAtual} de 6`}
        </span>
        <span className="text-xs text-muted-foreground">
          {ETAPAS_INFO[Math.min(etapaAtual - 1, 5)]?.titulo}
        </span>
      </div>
      <div className="flex gap-1">
        {ETAPAS_INFO.map((etapa) => (
          <div
            key={etapa.numero}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              concluido || etapa.numero < etapaAtual
                ? "bg-primary"
                : etapa.numero === etapaAtual
                ? "bg-primary/50"
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Painel de Sugestões (exibido após conclusão do wizard) ───────────────────

function PainelSugestoes({
  sessaoId,
  onUsarPrompt,
  onVoltar,
}: {
  sessaoId: number;
  onUsarPrompt: (prompt: string, estrategia: EstrategiaPrompt) => void;
  onVoltar: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner de conclusão */}
        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">✅</span>
            </div>
            <div>
              <h2 className="font-bold text-green-800 dark:text-green-200">
                Wizard concluído com sucesso!
              </h2>
              <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                Com base nas informações coletadas, geramos 3 variações de prompt otimizadas para
                diferentes estratégias jurídicas. Escolha a que melhor se adapta ao seu caso.
              </p>
            </div>
          </div>
        </div>

        {/* Componente de sugestões */}
        <SugestoesPrompts
          sessionId={sessaoId}
          onUsarPrompt={onUsarPrompt}
          autoStart={true}
        />

        {/* Botão para voltar ao chat */}
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={onVoltar} className="gap-2 text-xs">
            <MessageSquare className="w-3.5 h-3.5" />
            Voltar ao chat para ajustes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function Assistente() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [sessaoAtiva, setSessaoAtiva] = useState<Sessao | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [inputTexto, setInputTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [modoLivre, setModoLivre] = useState(false);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [promptSelecionado, setPromptSelecionado] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // tRPC queries e mutations
  const { data: sessoes, refetch: refetchSessoes } = trpc.assistente.listarSessoes.useQuery(
    undefined,
    { enabled: !!user }
  );

  const criarSessaoMutation = trpc.assistente.criarSessao.useMutation({
    onSuccess: async (data) => {
      await refetchSessoes();
      await carregarSessao(data.sessionId);
      setMostrarSugestoes(false);
    },
    onError: () => toast.error("Erro ao criar sessão"),
  });

  const deletarSessaoMutation = trpc.assistente.deletarSessao.useMutation({
    onSuccess: () => {
      refetchSessoes();
      setSessaoAtiva(null);
      setMensagens([]);
      setMostrarSugestoes(false);
    },
    onError: () => toast.error("Erro ao deletar sessão"),
  });

  const reiniciarWizardMutation = trpc.assistente.reiniciarWizard.useMutation({
    onSuccess: () => {
      if (sessaoAtiva) carregarSessao(sessaoAtiva.id);
      setMostrarSugestoes(false);
      toast.success("Wizard reiniciado!");
    },
  });

  const utils = trpc.useUtils();

  // Carregar sessão e suas mensagens
  const carregarSessao = useCallback(async (sessionId: number) => {
    try {
      const data = await utils.assistente.buscarSessao.fetch({ sessionId });
      const sessao = data.sessao as unknown as Sessao;
      setSessaoAtiva(sessao);
      setMensagens(
        data.mensagens.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          etapa: m.etapa,
          createdAt: m.createdAt.toString(),
        }))
      );
      // Se o wizard já estava concluído, mostrar sugestões automaticamente
      if (sessao.etapaConcluida) {
        setMostrarSugestoes(true);
      }
    } catch {
      toast.error("Erro ao carregar sessão");
    }
  }, [utils]);

  // Scroll automático para o final
  useEffect(() => {
    if (scrollRef.current && !mostrarSugestoes) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens, mostrarSugestoes]);

  // Enviar mensagem com streaming SSE
  const enviarMensagem = async () => {
    if (!sessaoAtiva || !inputTexto.trim() || enviando) return;

    const texto = inputTexto.trim();
    setInputTexto("");
    setEnviando(true);

    // Adicionar mensagem do usuário imediatamente
    const msgUsuario: Mensagem = { role: "user", content: texto };
    setMensagens((prev) => [...prev, msgUsuario]);

    // Adicionar placeholder de streaming do assistente
    const msgAssistente: Mensagem = {
      role: "assistant",
      content: "",
      isStreaming: true,
    };
    setMensagens((prev) => [...prev, msgAssistente]);

    try {
      const params = new URLSearchParams({
        sessionId: sessaoAtiva.id.toString(),
        message: texto,
        etapa: (!modoLivre).toString(),
      });

      const response = await fetch(`/api/assistente/stream?${params}`, {
        headers: { Accept: "text/event-stream" },
      });

      if (!response.ok || !response.body) {
        throw new Error("Erro na conexão com o assistente");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textoCompleto = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const linhas = chunk.split("\n");

        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          const data = linha.slice(6).trim();

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.token) {
              textoCompleto += parsed.token;
              setMensagens((prev) => {
                const novas = [...prev];
                const ultima = novas[novas.length - 1];
                if (ultima?.isStreaming) {
                  novas[novas.length - 1] = {
                    ...ultima,
                    content: textoCompleto,
                  };
                }
                return novas;
              });
            }

            if (parsed.done) {
              // Atualizar sessão com nova etapa
              const novaEtapa = parsed.etapaAtual;
              const wizardConcluido = !modoLivre && novaEtapa >= 6;
              setSessaoAtiva((prev) =>
                prev
                  ? {
                      ...prev,
                      etapaAtual: !modoLivre ? Math.min(novaEtapa + 1, 6) : prev.etapaAtual,
                      etapaConcluida: wizardConcluido,
                    }
                  : prev
              );

              // Se wizard acabou de ser concluído, mostrar sugestões após breve delay
              if (wizardConcluido) {
                setTimeout(() => setMostrarSugestoes(true), 1500);
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              console.error("Erro ao processar chunk SSE:", e);
            }
          }
        }
      }

      // Finalizar streaming
      setMensagens((prev) => {
        const novas = [...prev];
        const ultima = novas[novas.length - 1];
        if (ultima?.isStreaming) {
          novas[novas.length - 1] = { ...ultima, isStreaming: false };
        }
        return novas;
      });

      refetchSessoes();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar mensagem";
      toast.error(msg);
      setMensagens((prev) => prev.filter((m) => !m.isStreaming));
    } finally {
      setEnviando(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  // Mutation para salvar prompt no banco
  const salvarPromptMutation = trpc.promptsSalvos.salvar.useMutation({
    onSuccess: () => {
      // Silencioso — o toast principal já informa o usuário
    },
    onError: () => {
      // Falha silenciosa — o prompt ainda vai para sessionStorage
    },
  });

  // Usar prompt selecionado — salvar no banco + sessionStorage e navegar para Documentos
  const handleUsarPrompt = (prompt: string, estrategia: EstrategiaPrompt) => {
    setPromptSelecionado(prompt);
    sessionStorage.setItem("promptJur_promptSelecionado", prompt);
    sessionStorage.setItem("promptJur_estrategiaSelecionada", estrategia);

    // Salvar no histórico do banco de dados
    if (sessaoAtiva) {
      const estrategiaLabel: Record<EstrategiaPrompt, string> = {
        direta: "Estratégia Direta",
        raciocinio: "Raciocínio em Cadeia",
        recuperacao: "Recuperação de Fontes",
      };
      const titulo = [
        estrategiaLabel[estrategia],
        sessaoAtiva.tipoDocumento,
        sessaoAtiva.areaJuridica,
      ]
        .filter(Boolean)
        .join(" — ");

      salvarPromptMutation.mutate({
        titulo,
        estrategia,
        areaJuridica: sessaoAtiva.areaJuridica ?? undefined,
        tipoDocumento: sessaoAtiva.tipoDocumento ?? undefined,
        conteudo: prompt,
        sessionId: sessaoAtiva.id,
      });
    }

    toast.success("Prompt salvo em Meus Prompts! Acesse a aba Documentos para gerar seu documento.", {
      duration: 5000,
      action: {
        label: "Ir para Documentos",
        onClick: () => navigate("/dashboard"),
      },
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
        {/* Sidebar de sessões */}
        <aside className="w-64 border-r flex flex-col bg-muted/20 flex-shrink-0">
          <div className="p-3 border-b">
            <Button
              onClick={() => criarSessaoMutation.mutate({})}
              disabled={criarSessaoMutation.isPending}
              className="w-full gap-2"
              size="sm"
            >
              {criarSessaoMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Nova Conversa
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {!sessoes || sessoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Nenhuma conversa ainda</p>
                  <p className="text-xs mt-1">Clique em "Nova Conversa" para começar</p>
                </div>
              ) : (
                sessoes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => carregarSessao(s.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group",
                      sessaoAtiva?.id === s.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">
                        {s.titulo ?? "Nova conversa"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletarSessaoMutation.mutate({ sessionId: s.id });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {s.areaJuridica && (
                      <span className="text-xs opacity-60 truncate block mt-0.5">
                        {s.areaJuridica}
                      </span>
                    )}
                    {s.etapaConcluida && (
                      <Badge variant="outline" className="text-xs mt-1 text-green-600 border-green-300">
                        ✅ Concluído
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Dica de uso */}
          <div className="p-3 border-t">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2.5 text-xs text-blue-700 dark:text-blue-300">
              <BookOpen className="w-3 h-3 inline mr-1" />
              <strong>JurIA</strong> guia você em 6 etapas para criar prompts jurídicos profissionais.
            </div>
          </div>
        </aside>

        {/* Área principal de chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {!sessaoAtiva ? (
            /* Tela de boas-vindas */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">JurIA — Assistente Jurídico</h2>
                <p className="text-muted-foreground mb-6">
                  Seu assistente inteligente para criar e aprimorar prompts jurídicos profissionais.
                  Sou guiado por IA e conheço o Direito brasileiro.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  {[
                    { icone: "⚖️", texto: "Elaboração de petições e peças processuais" },
                    { icone: "🔍", texto: "Análise e melhoria de prompts existentes" },
                    { icone: "📚", texto: "Sugestão de fundamentos jurídicos" },
                    { icone: "✍️", texto: "Wizard guiado em 6 etapas" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 bg-muted/50 rounded-lg p-2.5 text-sm">
                      <span>{item.icone}</span>
                      <span className="text-muted-foreground">{item.texto}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => criarSessaoMutation.mutate({})}
                  disabled={criarSessaoMutation.isPending}
                  size="lg"
                  className="gap-2"
                >
                  {criarSessaoMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Iniciar Nova Conversa
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Header da sessão */}
              <div className="border-b px-4 py-3 flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {sessaoAtiva.titulo ?? "Nova conversa"}
                    </h3>
                    {sessaoAtiva.areaJuridica && (
                      <p className="text-xs text-muted-foreground">{sessaoAtiva.areaJuridica}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Botão para alternar entre chat e sugestões quando wizard concluído */}
                  {sessaoAtiva.etapaConcluida && (
                    <Button
                      variant={mostrarSugestoes ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMostrarSugestoes(!mostrarSugestoes)}
                      className="text-xs gap-1.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      {mostrarSugestoes ? "Ver chat" : "Ver sugestões"}
                    </Button>
                  )}
                  {/* Botão para ir direto aos documentos se prompt selecionado */}
                  {promptSelecionado && (
                    <Button
                      size="sm"
                      onClick={() => navigate("/dashboard")}
                      className="text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Ir para Documentos
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setModoLivre(!modoLivre)}
                    className={cn("text-xs gap-1", modoLivre && "text-amber-600")}
                  >
                    {modoLivre ? "💬 Chat livre" : "🎯 Wizard guiado"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reiniciarWizardMutation.mutate({ sessionId: sessaoAtiva.id })}
                    disabled={reiniciarWizardMutation.isPending}
                    className="text-xs gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reiniciar
                  </Button>
                </div>
              </div>

              {/* Barra de progresso do wizard */}
              {!modoLivre && (
                <WizardProgress
                  etapaAtual={sessaoAtiva.etapaAtual}
                  concluido={sessaoAtiva.etapaConcluida}
                />
              )}

              {/* Conteúdo principal: sugestões ou chat */}
              {mostrarSugestoes && sessaoAtiva.etapaConcluida ? (
                <PainelSugestoes
                  sessaoId={sessaoAtiva.id}
                  onUsarPrompt={handleUsarPrompt}
                  onVoltar={() => setMostrarSugestoes(false)}
                />
              ) : (
                <>
                  {/* Mensagens */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4"
                  >
                    <div className="space-y-6 max-w-3xl mx-auto pb-4">
                      {mensagens.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Carregando conversa...</p>
                        </div>
                      ) : (
                        mensagens.map((msg, i) => (
                          <MensagemItem key={msg.id ?? i} msg={msg} />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Input */}
                  <div className="border-t p-4 bg-background">
                    <div className="max-w-3xl mx-auto">
                      {/* Sugestões rápidas para etapa atual */}
                      {!modoLivre && !sessaoAtiva.etapaConcluida && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {sessaoAtiva.etapaAtual === 1 && [
                            "Direito Civil — Petição Inicial",
                            "Direito Trabalhista — Recurso Ordinário",
                            "Direito Penal — Habeas Corpus",
                          ].map((sugestao) => (
                            <button
                              key={sugestao}
                              onClick={() => setInputTexto(sugestao)}
                              className="text-xs px-2.5 py-1 bg-muted rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                              <ChevronRight className="w-3 h-3" />
                              {sugestao}
                            </button>
                          ))}
                          {sessaoAtiva.etapaAtual === 6 && (
                            <button
                              onClick={() => setInputTexto("Pode gerar o prompt final!")}
                              className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              Gerar prompt final
                            </button>
                          )}
                        </div>
                      )}

                      {/* Banner de wizard concluído no chat */}
                      {sessaoAtiva.etapaConcluida && !mostrarSugestoes && (
                        <div className="mb-3 flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2">
                          <p className="text-xs text-green-700 dark:text-green-300">
                            ✅ Wizard concluído! Veja as sugestões de prompt geradas por IA.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMostrarSugestoes(true)}
                            className="text-xs gap-1 ml-2 border-green-300 text-green-700 hover:bg-green-100"
                          >
                            <Sparkles className="w-3 h-3" />
                            Ver sugestões
                          </Button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Textarea
                          ref={inputRef}
                          value={inputTexto}
                          onChange={(e) => setInputTexto(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            modoLivre
                              ? "Faça uma pergunta jurídica ou peça ajuda com seu prompt..."
                              : "Responda a pergunta do assistente... (Enter para enviar)"
                          }
                          className="resize-none min-h-[52px] max-h-[120px]"
                          rows={2}
                          disabled={enviando}
                        />
                        <Button
                          onClick={enviarMensagem}
                          disabled={!inputTexto.trim() || enviando}
                          size="icon"
                          className="h-auto w-12 self-end"
                        >
                          {enviando ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 text-center">
                        Enter para enviar · Shift+Enter para nova linha ·{" "}
                        <span className="text-amber-600">Nunca inventa jurisprudência</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
