/**
 * Componente SugestoesPrompts
 *
 * Exibe 3 cards de sugestões de prompts gerados por estratégia (Direta, Raciocínio, Recuperação).
 * Cada card faz streaming independente via SSE e permite ao usuário selecionar e usar o prompt.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type EstrategiaPrompt = "direta" | "raciocinio" | "recuperacao";

interface EstrategiaInfo {
  id: EstrategiaPrompt;
  titulo: string;
  descricao: string;
  icone: string;
  corBadge: string;
  corBorda: string;
  corFundo: string;
  corBotao: string;
}

const ESTRATEGIAS: EstrategiaInfo[] = [
  {
    id: "direta",
    titulo: "Estratégia Direta",
    descricao: "Prompt objetivo e conciso, ideal para profissionais experientes com caso bem definido.",
    icone: "⚡",
    corBadge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    corBorda: "border-blue-200 dark:border-blue-800 hover:border-blue-400",
    corFundo: "bg-blue-50/50 dark:bg-blue-950/20",
    corBotao: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  {
    id: "raciocinio",
    titulo: "Raciocínio em Cadeia",
    descricao: "Guia a IA pelo raciocínio jurídico passo a passo, ideal para casos complexos.",
    icone: "🧠",
    corBadge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    corBorda: "border-purple-200 dark:border-purple-800 hover:border-purple-400",
    corFundo: "bg-purple-50/50 dark:bg-purple-950/20",
    corBotao: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  {
    id: "recuperacao",
    titulo: "Recuperação de Fontes",
    descricao: "Instrui a IA a buscar e citar fontes verificáveis (STF, STJ, legislação vigente).",
    icone: "📚",
    corBadge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    corBorda: "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400",
    corFundo: "bg-emerald-50/50 dark:bg-emerald-950/20",
    corBotao: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
];

interface EstadoSugestao {
  status: "idle" | "streaming" | "done" | "error";
  texto: string;
  promptCompleto: string;
  erro?: string;
}

interface SugestoesPromptsProps {
  sessionId: number;
  onUsarPrompt: (prompt: string, estrategia: EstrategiaPrompt) => void;
  autoStart?: boolean;
}

export function SugestoesPrompts({ sessionId, onUsarPrompt, autoStart = true }: SugestoesPromptsProps) {
  const [sugestoes, setSugestoes] = useState<Record<EstrategiaPrompt, EstadoSugestao>>({
    direta: { status: "idle", texto: "", promptCompleto: "" },
    raciocinio: { status: "idle", texto: "", promptCompleto: "" },
    recuperacao: { status: "idle", texto: "", promptCompleto: "" },
  });
  const [copiado, setCopiado] = useState<EstrategiaPrompt | null>(null);
  const [selecionado, setSelecionado] = useState<EstrategiaPrompt | null>(null);
  const abortControllersRef = useRef<Record<EstrategiaPrompt, AbortController | null>>({
    direta: null,
    raciocinio: null,
    recuperacao: null,
  });

  const gerarSugestao = useCallback(
    async (estrategia: EstrategiaPrompt) => {
      // Cancelar stream anterior se existir
      abortControllersRef.current[estrategia]?.abort();
      const controller = new AbortController();
      abortControllersRef.current[estrategia] = controller;

      setSugestoes((prev) => ({
        ...prev,
        [estrategia]: { status: "streaming", texto: "", promptCompleto: "" },
      }));

      try {
        const url = `/api/assistente/sugestoes?sessionId=${sessionId}&estrategia=${estrategia}`;
        const response = await fetch(url, {
          signal: controller.signal,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                setSugestoes((prev) => ({
                  ...prev,
                  [estrategia]: {
                    ...prev[estrategia],
                    status: "error",
                    erro: parsed.error,
                  },
                }));
                return;
              }

              if (parsed.token) {
                setSugestoes((prev) => ({
                  ...prev,
                  [estrategia]: {
                    ...prev[estrategia],
                    texto: prev[estrategia].texto + parsed.token,
                  },
                }));
              }

              if (parsed.done && parsed.promptCompleto) {
                setSugestoes((prev) => ({
                  ...prev,
                  [estrategia]: {
                    ...prev[estrategia],
                    status: "done",
                    promptCompleto: parsed.promptCompleto,
                  },
                }));
              }
            } catch {
              // Ignorar JSON malformado
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setSugestoes((prev) => ({
          ...prev,
          [estrategia]: {
            ...prev[estrategia],
            status: "error",
            erro: (err as Error).message,
          },
        }));
      }
    },
    [sessionId]
  );

  // Auto-iniciar geração das 3 estratégias em paralelo
  useEffect(() => {
    if (!autoStart) return;
    const estrategias: EstrategiaPrompt[] = ["direta", "raciocinio", "recuperacao"];
    // Pequeno delay entre cada para não sobrecarregar
    estrategias.forEach((e, i) => {
      setTimeout(() => gerarSugestao(e), i * 300);
    });

    return () => {
      // Cancelar todos os streams ao desmontar
      Object.values(abortControllersRef.current).forEach((c) => c?.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const copiarPrompt = (estrategia: EstrategiaPrompt) => {
    const prompt = sugestoes[estrategia].promptCompleto || sugestoes[estrategia].texto;
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopiado(estrategia);
    toast.success("Prompt copiado para a área de transferência!");
    setTimeout(() => setCopiado(null), 2000);
  };

  const usarPrompt = (estrategia: EstrategiaPrompt) => {
    const prompt = sugestoes[estrategia].promptCompleto || sugestoes[estrategia].texto;
    if (!prompt) return;
    setSelecionado(estrategia);
    onUsarPrompt(prompt, estrategia);
    toast.success(`Prompt "${ESTRATEGIAS.find((e) => e.id === estrategia)?.titulo}" selecionado!`);
  };

  const regenerarTodas = () => {
    setSelecionado(null);
    const estrategias: EstrategiaPrompt[] = ["direta", "raciocinio", "recuperacao"];
    estrategias.forEach((e, i) => {
      setTimeout(() => gerarSugestao(e), i * 300);
    });
  };

  const todasConcluidas = ESTRATEGIAS.every(
    (e) => sugestoes[e.id].status === "done" || sugestoes[e.id].status === "error"
  );

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="font-semibold text-foreground">Sugestões de Prompt por Estratégia</h3>
            <p className="text-xs text-muted-foreground">
              3 variações otimizadas para diferentes abordagens jurídicas
            </p>
          </div>
        </div>
        {todasConcluidas && (
          <Button
            variant="outline"
            size="sm"
            onClick={regenerarTodas}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerar
          </Button>
        )}
      </div>

      {/* Cards das estratégias */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ESTRATEGIAS.map((estrategia) => {
          const estado = sugestoes[estrategia.id];
          const isStreaming = estado.status === "streaming";
          const isDone = estado.status === "done";
          const isError = estado.status === "error";
          const isSelected = selecionado === estrategia.id;

          return (
            <div
              key={estrategia.id}
              className={cn(
                "relative flex flex-col rounded-xl border-2 p-4 transition-all duration-200",
                estrategia.corFundo,
                estrategia.corBorda,
                isSelected && "ring-2 ring-offset-2 ring-offset-background",
                isSelected && estrategia.id === "direta" && "ring-blue-500",
                isSelected && estrategia.id === "raciocinio" && "ring-purple-500",
                isSelected && estrategia.id === "recuperacao" && "ring-emerald-500"
              )}
            >
              {/* Badge selecionado */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 rounded-full bg-green-500 p-0.5">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Cabeçalho do card */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{estrategia.icone}</span>
                  <div>
                    <h4 className="text-sm font-semibold leading-tight text-foreground">
                      {estrategia.titulo}
                    </h4>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                      {estrategia.descricao}
                    </p>
                  </div>
                </div>
                <Badge className={cn("shrink-0 text-xs", estrategia.corBadge)}>
                  {isStreaming ? "Gerando..." : isDone ? "Pronto" : isError ? "Erro" : "Aguardando"}
                </Badge>
              </div>

              {/* Conteúdo do prompt */}
              <div
                className={cn(
                  "min-h-[120px] flex-1 rounded-lg border bg-background/80 p-3 text-xs leading-relaxed text-foreground/90",
                  "font-mono overflow-y-auto max-h-[200px]",
                  isStreaming && "border-dashed"
                )}
              >
                {estado.status === "idle" && (
                  <span className="text-muted-foreground italic">Aguardando geração...</span>
                )}
                {(isStreaming || isDone) && (
                  <span>
                    {estado.texto}
                    {isStreaming && (
                      <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-foreground/60" />
                    )}
                  </span>
                )}
                {isError && (
                  <span className="text-destructive">
                    Erro ao gerar: {estado.erro || "Tente novamente"}
                  </span>
                )}
              </div>

              {/* Ações */}
              <div className="mt-3 flex gap-2">
                {isStreaming && (
                  <div className="flex w-full items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Gerando prompt...
                  </div>
                )}

                {(isDone || isError) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => copiarPrompt(estrategia.id)}
                      disabled={!isDone}
                    >
                      {copiado === estrategia.id ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copiar
                    </Button>
                    <Button
                      size="sm"
                      className={cn("flex-1 gap-1.5 text-xs", estrategia.corBotao)}
                      onClick={() => usarPrompt(estrategia.id)}
                      disabled={!isDone}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Usar este
                    </Button>
                  </>
                )}

                {isError && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => gerarSugestao(estrategia.id)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Tentar novamente
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota de rodapé */}
      <p className="text-center text-xs text-muted-foreground">
        💡 Selecione um prompt para usá-lo na aba{" "}
        <span className="font-medium text-foreground">Documentos</span> — o prompt será
        automaticamente preenchido no gerador.
      </p>
    </div>
  );
}
