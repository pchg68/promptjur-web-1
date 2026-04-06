import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  MessageSquare,
  Sparkles,
  ChevronRight,
  Loader2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

        {/* Botão copiar (apenas assistente) */}
        {isAssistente && !msg.isStreaming && (
          <button
            onClick={copiar}
            className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          >
            {copiado ? (
              <CheckCheck className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
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

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function Assistente() {
  const { user } = useAuth();
  const [sessaoAtiva, setSessaoAtiva] = useState<Sessao | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [inputTexto, setInputTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [modoLivre, setModoLivre] = useState(false);
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
    },
    onError: () => toast.error("Erro ao criar sessão"),
  });

  const deletarSessaoMutation = trpc.assistente.deletarSessao.useMutation({
    onSuccess: () => {
      refetchSessoes();
      setSessaoAtiva(null);
      setMensagens([]);
    },
    onError: () => toast.error("Erro ao deletar sessão"),
  });

  const reiniciarWizardMutation = trpc.assistente.reiniciarWizard.useMutation({
    onSuccess: () => {
      if (sessaoAtiva) carregarSessao(sessaoAtiva.id);
      toast.success("Wizard reiniciado!");
    },
  });

  const utils = trpc.useUtils();

  // Carregar sessão e suas mensagens
  const carregarSessao = useCallback(async (sessionId: number) => {
    try {
      const data = await utils.assistente.buscarSessao.fetch({ sessionId });
      setSessaoAtiva(data.sessao as unknown as Sessao);
      setMensagens(
        data.mensagens.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          etapa: m.etapa,
          createdAt: m.createdAt.toString(),
        }))
      );
    } catch {
      toast.error("Erro ao carregar sessão");
    }
  }, [utils]);

  // Scroll automático para o final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

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
              setSessaoAtiva((prev) =>
                prev
                  ? {
                      ...prev,
                      etapaAtual: !modoLivre ? Math.min(novaEtapa + 1, 6) : prev.etapaAtual,
                      etapaConcluida: !modoLivre && novaEtapa >= 6,
                    }
                  : prev
              );
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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
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

              {/* Mensagens */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef as React.RefObject<HTMLDivElement>}>
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
              </ScrollArea>

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
        </div>
      </div>
    </DashboardLayout>
  );
}
