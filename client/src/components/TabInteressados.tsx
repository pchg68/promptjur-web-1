/**
 * TabInteressados — Painel de gestão de interessados no lançamento dos planos pagos
 * Exibido no AdminTools para visualizar e gerenciar a lista de e-mails capturados
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Bell,
  BellOff,
  Check,
  ChevronDown,
  Loader2,
  Mail,
  RefreshCw,
  Users,
} from "lucide-react";

const PLANO_LABELS: Record<string, string> = {
  pro: "Pro",
  enterprise: "Escritório",
  qualquer: "Qualquer",
};

const PLANO_COLORS: Record<string, string> = {
  pro: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  enterprise: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  qualquer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function TabInteressados() {
  const [filtroPlano, setFiltroPlano] = useState<"todos" | "pro" | "enterprise" | "qualquer">("todos");
  const [filtroNotificado, setFiltroNotificado] = useState<boolean | undefined>(undefined);
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const { data, isLoading, refetch } = trpc.admin.getInteressados.useQuery({
    plano: filtroPlano,
    notificado: filtroNotificado,
    limit: 100,
    offset: 0,
  });

  const marcarMutation = trpc.admin.marcarNotificados.useMutation({
    onSuccess: () => {
      toast.success(`${selecionados.length} interessado(s) marcados como notificados.`);
      setSelecionados([]);
      refetch();
    },
    onError: (err) => toast.error(err.message || "Erro ao marcar como notificados"),
  });

  const toggleSelecionado = (id: number) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTodos = () => {
    if (!data?.interessados) return;
    const naoNotificados = data.interessados.filter((i) => !i.notificado).map((i) => i.id);
    if (selecionados.length === naoNotificados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(naoNotificados);
    }
  };

  const interessados = data?.interessados ?? [];
  const naoNotificados = interessados.filter((i) => !i.notificado);

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Interessados no Lançamento</h2>
            <p className="text-xs text-slate-400">
              E-mails capturados no banner da página de Planos
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="border-[#1e3a5f] text-slate-300 hover:bg-[#1e3a5f]"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-[#0a1628] border border-[#1e3a5f] p-3 text-center">
          <p className="text-2xl font-bold text-white">{data?.total ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total cadastrados</p>
        </div>
        <div className="rounded-lg bg-[#0a1628] border border-[#1e3a5f] p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{data?.naoNotificados ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">Aguardando notificação</p>
        </div>
        <div className="rounded-lg bg-[#0a1628] border border-[#1e3a5f] p-3 text-center">
          <p className="text-2xl font-bold text-green-400">
            {(data?.total ?? 0) - (data?.naoNotificados ?? 0)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Já notificados</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <select
            value={filtroPlano}
            onChange={(e) => setFiltroPlano(e.target.value as typeof filtroPlano)}
            className="h-8 rounded-md border border-[#1e3a5f] bg-[#0a1628] px-3 pr-7 text-xs text-slate-300 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="todos">Todos os planos</option>
            <option value="pro">Plano Pro</option>
            <option value="enterprise">Plano Escritório</option>
            <option value="qualquer">Qualquer plano</option>
          </select>
          <ChevronDown className="absolute right-2 top-2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filtroNotificado === undefined ? "todos" : filtroNotificado ? "sim" : "nao"}
            onChange={(e) => {
              const v = e.target.value;
              setFiltroNotificado(v === "todos" ? undefined : v === "sim");
            }}
            className="h-8 rounded-md border border-[#1e3a5f] bg-[#0a1628] px-3 pr-7 text-xs text-slate-300 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="todos">Todos os status</option>
            <option value="nao">Aguardando notificação</option>
            <option value="sim">Já notificados</option>
          </select>
          <ChevronDown className="absolute right-2 top-2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>

        {selecionados.length > 0 && (
          <Button
            size="sm"
            className="h-8 bg-green-600 hover:bg-green-500 text-white text-xs"
            onClick={() => marcarMutation.mutate({ ids: selecionados })}
            disabled={marcarMutation.isPending}
          >
            {marcarMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Check className="w-3 h-3 mr-1" />
            )}
            Marcar {selecionados.length} como notificado(s)
          </Button>
        )}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : interessados.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum interessado encontrado com os filtros aplicados.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#1e3a5f] overflow-hidden">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[32px_1fr_120px_100px_100px] gap-2 px-4 py-2 bg-[#0a1628] border-b border-[#1e3a5f] text-xs font-medium text-slate-400">
            <div>
              <input
                type="checkbox"
                checked={selecionados.length === naoNotificados.length && naoNotificados.length > 0}
                onChange={toggleTodos}
                className="rounded"
              />
            </div>
            <div>E-mail / Nome</div>
            <div>Plano</div>
            <div>Status</div>
            <div>Cadastrado em</div>
          </div>

          {/* Linhas */}
          <div className="divide-y divide-[#1e3a5f]">
            {interessados.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[32px_1fr_120px_100px_100px] gap-2 px-4 py-3 items-center hover:bg-[#0a1628]/60 transition-colors"
              >
                <div>
                  {!item.notificado && (
                    <input
                      type="checkbox"
                      checked={selecionados.includes(item.id)}
                      onChange={() => toggleSelecionado(item.id)}
                      className="rounded"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-white truncate">{item.email}</span>
                  </div>
                  {item.nome && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{item.nome}</p>
                  )}
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${
                      PLANO_COLORS[item.planoInteresse] ?? PLANO_COLORS.qualquer
                    }`}
                  >
                    {PLANO_LABELS[item.planoInteresse] ?? item.planoInteresse}
                  </span>
                </div>
                <div>
                  {item.notificado ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-400">
                      <Check className="w-3 h-3" />
                      Notificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                      <BellOff className="w-3 h-3" />
                      Pendente
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(item.criadoEm).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
