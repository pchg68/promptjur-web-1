/**
 * TabMensagens — Aba de mensagens de contato no AdminTools
 * Exibe, filtra, responde e gerencia mensagens recebidas pelo formulário de contato.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Mail,
  Trash2,
  CheckCheck,
  Reply,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Filter,
  Download,
} from "lucide-react";

type Assunto = "duvida" | "feedback" | "suporte" | "parceria" | "outro" | "todos";
type FiltroLida = "todos" | "nao_lidas" | "lidas";

const ASSUNTO_LABELS: Record<string, string> = {
  duvida: "Dúvida",
  feedback: "Feedback",
  suporte: "Suporte",
  parceria: "Parceria",
  outro: "Outro",
};

const ASSUNTO_COLORS: Record<string, string> = {
  duvida: "bg-blue-900/40 text-blue-300 border-blue-700",
  feedback: "bg-green-900/40 text-green-300 border-green-700",
  suporte: "bg-orange-900/40 text-orange-300 border-orange-700",
  parceria: "bg-purple-900/40 text-purple-300 border-purple-700",
  outro: "bg-slate-800 text-slate-300 border-slate-600",
};

export default function TabMensagens() {
  const [filtroAssunto, setFiltroAssunto] = useState<Assunto>("todos");
  const [filtroLida, setFiltroLida] = useState<FiltroLida>("todos");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [respostaTexto, setRespostaTexto] = useState<Record<number, string>>({});
  const [respondendo, setRespondendo] = useState<number | null>(null);

  const mensagensQuery = trpc.contato.listar.useQuery(
    {
      apenasNaoLidas: filtroLida === "nao_lidas",
    },
    { refetchInterval: 30_000 }
  );

  const contarQuery = trpc.contato.contarNaoLidas.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const marcarLidaMutation = trpc.contato.marcarLida.useMutation({
    onSuccess: () => {
      mensagensQuery.refetch();
      contarQuery.refetch();
    },
  });

  const responderMutation = trpc.contato.responder.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Resposta enviada com sucesso!");
      setRespondendo(null);
      setRespostaTexto((prev) => ({ ...prev, [vars.id]: "" }));
      mensagensQuery.refetch();
    },
    onError: (err) => toast.error(`Erro ao enviar resposta: ${err.message}`),
  });

  const removerMutation = trpc.contato.remover.useMutation({
    onSuccess: () => {
      toast.success("Mensagem removida.");
      mensagensQuery.refetch();
      contarQuery.refetch();
    },
    onError: (err) => toast.error(`Erro ao remover: ${err.message}`),
  });

  const resultado = mensagensQuery.data;
  const todasMensagens = resultado?.mensagens ?? [];
  // Filtro local de assunto (a procedure não filtra por assunto ainda)
  const mensagens = filtroAssunto === "todos"
    ? todasMensagens
    : todasMensagens.filter((m: any) => m.assunto === filtroAssunto);
  // Filtro local de lidas (quando não é nao_lidas — já filtrado no servidor)
  const mensagensFiltradas = filtroLida === "lidas"
    ? mensagens.filter((m: any) => m.lido)
    : mensagens;
  const naoLidas = contarQuery.data?.total ?? 0;

  // Exportar CSV
  function exportarCSV() {
    if (mensagens.length === 0) return;
    const header = ["ID", "Nome", "E-mail", "Assunto", "Mensagem", "Lida", "Data"];
    const rows = mensagensFiltradas.map((m: any) => [
      m.id,
      `"${m.nome}"`,
      m.email,
      ASSUNTO_LABELS[m.assunto] ?? m.assunto,
      `"${m.mensagem.replace(/"/g, '""')}"`,
      m.lido ? "Sim" : "Não",
      new Date(m.criadoEm).toLocaleString("pt-BR"),
    ]);
    const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mensagens-contato-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Mensagens de Contato</h2>
          {naoLidas > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
              {naoLidas}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mensagensQuery.refetch()}
            disabled={mensagensQuery.isFetching}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${mensagensQuery.isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportarCSV}
            disabled={mensagens.length === 0}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500 mr-1">Assunto:</span>
          {(["todos", "duvida", "feedback", "suporte", "parceria", "outro"] as Assunto[]).map((a) => (
            <button
              key={a}
              onClick={() => setFiltroAssunto(a)}
              className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                filtroAssunto === a
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
              }`}
            >
              {a === "todos" ? "Todos" : ASSUNTO_LABELS[a]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-slate-500 mr-1">Status:</span>
          {(["todos", "nao_lidas", "lidas"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroLida(s)}
              className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                filtroLida === s
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
              }`}
            >
              {s === "todos" ? "Todos" : s === "nao_lidas" ? "Não lidas" : "Lidas"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de mensagens */}
      {mensagensQuery.isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Carregando mensagens...
        </div>
      ) : mensagens.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 text-sm">Nenhuma mensagem encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mensagensFiltradas.map((msg: any) => {
            const isExpanded = expandido === msg.id;
            const isRespondendo = respondendo === msg.id;
            return (
              <div
                key={msg.id}
                className={`rounded-xl border transition-colors ${
                  msg.lido
                    ? "bg-[#0a1628] border-[#1e293b]"
                    : "bg-[#0f1f3d] border-[#1e3a5f]"
                }`}
              >
                {/* Linha resumo */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => {
                    setExpandido(isExpanded ? null : msg.id);
                    if (!msg.lido) {
                      marcarLidaMutation.mutate({ id: msg.id });
                    }
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${msg.lido ? "bg-slate-700" : "bg-blue-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white text-sm">{msg.nome}</span>
                      <span className="text-slate-500 text-xs">{msg.email}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded border font-medium ${
                          ASSUNTO_COLORS[msg.assunto] ?? ASSUNTO_COLORS.outro
                        }`}
                      >
                        {ASSUNTO_LABELS[msg.assunto] ?? msg.assunto}
                      </span>
                      {!!msg.respostaAdmin && (
                        <span className="text-xs px-2 py-0.5 rounded border bg-green-900/30 text-green-400 border-green-800">
                          Respondida
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm truncate">{msg.mensagem}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span className="text-slate-600 text-xs">
                        {new Date(msg.criadoEm).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Conteúdo expandido */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#1e293b] pt-4">
                    <div className="bg-[#060d1a] rounded-lg p-4 mb-4">
                      <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.mensagem}
                      </p>
                    </div>

                    {/* Resposta anterior */}
                      {msg.respostaAdmin && (
                      <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-3 mb-4">
                        <p className="text-green-400 text-xs font-semibold mb-1 flex items-center gap-1">
                          <Reply className="w-3 h-3" /> Resposta enviada:
                        </p>
                        <p className="text-green-300 text-sm whitespace-pre-wrap">
                          {msg.respostaAdmin}
                        </p>
                        {msg.respondidoEm && (
                          <p className="text-green-700 text-xs mt-1">
                            {new Date(msg.respondidoEm).toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isRespondendo && (
                        <Button
                          size="sm"
                          onClick={() => setRespondendo(msg.id)}
                          className="bg-blue-700 hover:bg-blue-600 text-white"
                        >
                          <Reply className="w-4 h-4 mr-1" />
                          {msg.respostaAdmin ? "Responder novamente" : "Responder"}
                        </Button>
                      )}
                      {!msg.lido && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => marcarLidaMutation.mutate({ id: msg.id })}
                          disabled={marcarLidaMutation.isPending}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          <CheckCheck className="w-4 h-4 mr-1" />
                          Marcar como lida
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Remover esta mensagem permanentemente?")) {
                            removerMutation.mutate({ id: msg.id });
                          }
                        }}
                        disabled={removerMutation.isPending}
                        className="border-red-900 text-red-400 hover:bg-red-900/20 ml-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remover
                      </Button>
                    </div>

                    {/* Formulário de resposta */}
                    {isRespondendo && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Mail className="w-4 h-4" />
                          Respondendo para: <strong className="text-white">{msg.email}</strong>
                        </div>
                        <Textarea
                          placeholder="Digite sua resposta aqui..."
                          value={respostaTexto[msg.id] ?? ""}
                          onChange={(e) =>
                            setRespostaTexto((prev) => ({ ...prev, [msg.id]: e.target.value }))
                          }
                          rows={5}
                          className="bg-[#060d1a] border-[#1e3a5f] text-white placeholder:text-slate-600 resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              responderMutation.mutate({
                                id: msg.id,
                                resposta: respostaTexto[msg.id] ?? "",
                              })
                            }
                            disabled={
                              responderMutation.isPending ||
                              !respostaTexto[msg.id]?.trim()
                            }
                            className="bg-blue-700 hover:bg-blue-600 text-white"
                          >
                            {responderMutation.isPending ? (
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4 mr-1" />
                            )}
                            Enviar resposta
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRespondendo(null)}
                            className="border-slate-700 text-slate-400 hover:bg-slate-800"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resumo */}
      {mensagensFiltradas.length > 0 && (
        <p className="text-slate-600 text-xs mt-4 text-right">
          {mensagensFiltradas.length} mensagem(ns) exibida(s)
          {naoLidas > 0 && ` · ${naoLidas} não lida(s)`}
        </p>
      )}
    </div>
  );
}
