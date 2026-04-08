import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Download,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  UserPlus,
  Filter,
  X,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 50;

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatarUserAgent(ua: string | null) {
  if (!ua) return "—";
  // Detectar browser/SO de forma simples
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  return ua.substring(0, 30) + "…";
}

export default function TabLogAcessos() {
  const [expandido, setExpandido] = useState(false);

  // Filtros
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [apenasNegados, setApenasNegados] = useState(false);
  const [apenasPrimeiros, setApenasPrimeiros] = useState(false);
  const [page, setPage] = useState(1);

  // Filtros aplicados (só aplica ao clicar em Buscar)
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    email: "",
    nome: "",
    dataInicio: "",
    dataFim: "",
    apenasNegados: false,
    apenasPrimeiros: false,
  });

  const statsQuery = trpc.admin.statsAccessLogs.useQuery(undefined, {
    enabled: expandido,
  });

  const logsQuery = trpc.admin.listarAccessLogs.useQuery(
    {
      ...filtrosAplicados,
      page,
      limit: PAGE_SIZE,
    },
    { enabled: expandido }
  );

  const exportarQuery = trpc.admin.exportarAccessLogsCsv.useQuery(
    filtrosAplicados,
    { enabled: false }
  );

  const totalPaginas = Math.ceil((logsQuery.data?.total ?? 0) / PAGE_SIZE);
  const temFiltros =
    filtrosAplicados.email ||
    filtrosAplicados.nome ||
    filtrosAplicados.dataInicio ||
    filtrosAplicados.dataFim ||
    filtrosAplicados.apenasNegados ||
    filtrosAplicados.apenasPrimeiros;

  function aplicarFiltros() {
    setPage(1);
    setFiltrosAplicados({ email, nome, dataInicio, dataFim, apenasNegados, apenasPrimeiros });
  }

  function limparFiltros() {
    setEmail("");
    setNome("");
    setDataInicio("");
    setDataFim("");
    setApenasNegados(false);
    setApenasPrimeiros(false);
    setPage(1);
    setFiltrosAplicados({
      email: "",
      nome: "",
      dataInicio: "",
      dataFim: "",
      apenasNegados: false,
      apenasPrimeiros: false,
    });
  }

  async function handleExportar() {
    try {
      const result = await exportarQuery.refetch();
      if (!result.data?.csv) {
        toast.error("Nenhum dado para exportar");
        return;
      }
      const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `log-acessos-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado com sucesso");
    } catch {
      toast.error("Falha ao exportar CSV");
    }
  }

  const stats = statsQuery.data;

  return (
    <div>
      {/* Cabeçalho colapsável */}
      <button
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Log de Acessos</h2>
            <p className="text-sm text-gray-400">
              Monitoramento de logins e atividade dos usuários
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                {stats.ultimos7dias} em 7 dias
              </span>
              {stats.acessosNegados > 0 && (
                <span className="bg-red-900/50 text-red-300 px-2 py-1 rounded">
                  {stats.acessosNegados} negados
                </span>
              )}
            </div>
          )}
          <span className="text-gray-400 text-sm">{expandido ? "▲" : "▼"}</span>
        </div>
      </button>

      {expandido && (
        <div className="mt-4 space-y-4">
          {/* Cards de estatísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Total", value: stats.total, color: "text-white" },
                { label: "Primeiros acessos", value: stats.primeirosAcessos, color: "text-green-400" },
                { label: "Negados", value: stats.acessosNegados, color: "text-red-400" },
                { label: "Últimos 7 dias", value: stats.ultimos7dias, color: "text-blue-400" },
                { label: "Últimos 30 dias", value: stats.ultimos30dias, color: "text-purple-400" },
              ].map((s) => (
                <div key={s.label} className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filtros */}
          <div className="bg-[#0a1628] rounded-lg p-4 border border-[#1e3a5f] space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Filtrar por e-mail..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
                className="bg-[#0f1923] border-[#1e3a5f] text-white placeholder:text-gray-500 text-sm"
              />
              <Input
                placeholder="Filtrar por nome..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
                className="bg-[#0f1923] border-[#1e3a5f] text-white placeholder:text-gray-500 text-sm"
              />
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-[#0f1923] border-[#1e3a5f] text-white text-sm"
                title="Data início"
              />
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-[#0f1923] border-[#1e3a5f] text-white text-sm"
                title="Data fim"
              />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={apenasNegados}
                  onChange={(e) => setApenasNegados(e.target.checked)}
                  className="accent-red-500"
                />
                <ShieldOff className="w-3.5 h-3.5 text-red-400" />
                Apenas negados
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={apenasPrimeiros}
                  onChange={(e) => setApenasPrimeiros(e.target.checked)}
                  className="accent-green-500"
                />
                <UserPlus className="w-3.5 h-3.5 text-green-400" />
                Apenas primeiros acessos
              </label>
              <div className="flex gap-2 ml-auto">
                {temFiltros && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={limparFiltros}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Limpar
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={aplicarFiltros}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  <Search className="w-3.5 h-3.5 mr-1" />
                  Buscar
                </Button>
              </div>
            </div>
          </div>

          {/* Barra de ações */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {logsQuery.data
                ? `${logsQuery.data.total} registro${logsQuery.data.total !== 1 ? "s" : ""}${temFiltros ? " (filtrado)" : ""}`
                : "Carregando..."}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => logsQuery.refetch()}
                disabled={logsQuery.isFetching}
                className="border-[#1e3a5f] text-gray-300 hover:text-white text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${logsQuery.isFetching ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportar}
                disabled={exportarQuery.isFetching}
                className="border-[#1e3a5f] text-gray-300 hover:text-white text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto rounded-lg border border-[#1e3a5f]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0a1628] border-b border-[#1e3a5f]">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Usuário</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">E-mail</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Método</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Navegador</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">IP</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {logsQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Carregando logs...
                    </td>
                  </tr>
                ) : logsQuery.data?.logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  logsQuery.data?.logs.map((log) => (
                    <tr
                      key={log.id}
                      className={`border-b border-[#1e3a5f]/50 hover:bg-[#0a1628]/50 transition-colors ${
                        !log.acessoPermitido ? "bg-red-950/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {log.primeiroAcesso && (
                            <UserPlus className="w-3.5 h-3.5 text-green-400 flex-shrink-0" title="Primeiro acesso" />
                          )}
                          <span className="text-white font-medium truncate max-w-[150px]">
                            {log.nome || <span className="text-gray-500 italic">sem nome</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 truncate max-w-[200px]">
                        {log.email || <span className="text-gray-500 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-xs border-[#1e3a5f] text-gray-400"
                        >
                          {log.loginMethod || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        <div className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          {formatarUserAgent(log.userAgent)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                        {log.ipOrigem || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {log.acessoPermitido ? (
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400 text-xs">Permitido</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <ShieldOff className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-red-400 text-xs">Negado</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatarData(log.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Página {page} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || logsQuery.isFetching}
                  className="border-[#1e3a5f] text-gray-300 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
                  disabled={page === totalPaginas || logsQuery.isFetching}
                  className="border-[#1e3a5f] text-gray-300 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
