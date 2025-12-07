import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  Users,
  FileText,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Database,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Queries para métricas administrativas
  const { data: stats, isLoading: statsLoading } = trpc.admin.getEstatisticasGerais.useQuery();
  const { data: topAreas, isLoading: areasLoading } = trpc.admin.getTopAreasJuridicas.useQuery();
  const { data: plataformas, isLoading: plataformasLoading } =
    trpc.admin.getDistribuicaoPlataformas.useQuery();
  const { data: evolucao, isLoading: evolucaoLoading } = trpc.admin.getEvolucaoUso.useQuery();
  const { data: distribuicaoTipo, isLoading: tipoLoading } =
    trpc.admin.getDistribuicaoPorTipo.useQuery();
  const { data: cacheStats, isLoading: cacheLoading } = trpc.admin.getCacheStatistics.useQuery();
  const { data: promptsRecentes, isLoading: recentesLoading } =
    trpc.admin.getPromptsRecentes.useQuery();

  // Verificar se usuário é admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-[#1a2332] border-red-500/30">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-red-500" />
              <CardTitle className="text-2xl text-white">Acesso Negado</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Esta página é exclusiva para administradores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full" variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Configurações dos gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#9ca3af",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#1f2937" },
      },
      y: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#1f2937" },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "#9ca3af",
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="bg-[#1a2332] border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Dashboard Administrativo</h1>
                  <p className="text-sm text-gray-400">Métricas e estatísticas da plataforma</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard Principal</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Cards de Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1a2332] border-blue-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Usuários Totais
              </CardTitle>
              <Users className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-gray-700" />
              ) : (
                <div className="text-3xl font-bold text-white">{stats?.totalUsuarios || 0}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Cadastrados na plataforma</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2332] border-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Usuários Ativos
              </CardTitle>
              <Activity className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-gray-700" />
              ) : (
                <div className="text-3xl font-bold text-white">{stats?.usuariosAtivos || 0}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Últimos 7 dias</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2332] border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Prompts Totais
              </CardTitle>
              <FileText className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-gray-700" />
              ) : (
                <div className="text-3xl font-bold text-white">{stats?.totalPrompts || 0}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Gerados até agora</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a2332] border-yellow-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Prompts Hoje</CardTitle>
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-gray-700" />
              ) : (
                <div className="text-3xl font-bold text-white">{stats?.promptsHoje || 0}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Últimas 24 horas</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top 10 Áreas Jurídicas */}
          <Card className="bg-[#1a2332] border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-white">Top 10 Áreas Jurídicas</CardTitle>
              </div>
              <CardDescription>Áreas mais utilizadas na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {areasLoading ? (
                <Skeleton className="h-[300px] w-full bg-gray-700" />
              ) : (
                <div className="h-[300px]">
                  <Bar
                    data={{
                      labels: topAreas?.map((a) => a.areaJuridica) || [],
                      datasets: [
                        {
                          label: "Prompts Gerados",
                          data: topAreas?.map((a) => a.total) || [],
                          backgroundColor: "rgba(59, 130, 246, 0.6)",
                          borderColor: "rgba(59, 130, 246, 1)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribuição de Plataformas de IA */}
          <Card className="bg-[#1a2332] border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-white">Plataformas de IA</CardTitle>
              </div>
              <CardDescription>Distribuição de uso por plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {plataformasLoading ? (
                <Skeleton className="h-[300px] w-full bg-gray-700" />
              ) : (
                <div className="h-[300px]">
                  <Pie
                    data={{
                      labels: plataformas?.map((p) => p.plataforma) || [],
                      datasets: [
                        {
                          data: plataformas?.map((p) => p.total) || [],
                          backgroundColor: [
                            "rgba(59, 130, 246, 0.8)", // Manus - Azul
                            "rgba(16, 185, 129, 0.8)", // ChatGPT - Verde
                            "rgba(251, 146, 60, 0.8)", // Claude - Laranja
                            "rgba(168, 85, 247, 0.8)", // Gemini - Roxo
                            "rgba(236, 72, 153, 0.8)", // Perplexity - Rosa
                          ],
                          borderColor: [
                            "rgba(59, 130, 246, 1)",
                            "rgba(16, 185, 129, 1)",
                            "rgba(251, 146, 60, 1)",
                            "rgba(168, 85, 247, 1)",
                            "rgba(236, 72, 153, 1)",
                          ],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={pieOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Evolução de Uso e Distribuição por Tipo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Evolução de Uso (30 dias) */}
          <Card className="bg-[#1a2332] border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <CardTitle className="text-white">Evolução de Uso</CardTitle>
              </div>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              {evolucaoLoading ? (
                <Skeleton className="h-[300px] w-full bg-gray-700" />
              ) : (
                <div className="h-[300px]">
                  <Line
                    data={{
                      labels: evolucao?.map((e) => {
                        const date = new Date(e.data);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }) || [],
                      datasets: [
                        {
                          label: "Prompts Gerados",
                          data: evolucao?.map((e) => e.total) || [],
                          borderColor: "rgba(34, 197, 94, 1)",
                          backgroundColor: "rgba(34, 197, 94, 0.1)",
                          tension: 0.4,
                          fill: true,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribuição por Tipo */}
          <Card className="bg-[#1a2332] border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-500" />
                <CardTitle className="text-white">Distribuição por Tipo</CardTitle>
              </div>
              <CardDescription>Análise, Geração e Otimização</CardDescription>
            </CardHeader>
            <CardContent>
              {tipoLoading ? (
                <Skeleton className="h-[300px] w-full bg-gray-700" />
              ) : (
                <div className="h-[300px]">
                  <Bar
                    data={{
                      labels: distribuicaoTipo?.map((t) => {
                        const labels: Record<string, string> = {
                          analise: "Análise",
                          geracao: "Geração",
                          otimizacao: "Otimização",
                        };
                        return labels[t.tipo] || t.tipo;
                      }) || [],
                      datasets: [
                        {
                          label: "Total",
                          data: distribuicaoTipo?.map((t) => t.total) || [],
                          backgroundColor: [
                            "rgba(59, 130, 246, 0.6)",
                            "rgba(34, 197, 94, 0.6)",
                            "rgba(251, 146, 60, 0.6)",
                          ],
                          borderColor: [
                            "rgba(59, 130, 246, 1)",
                            "rgba(34, 197, 94, 1)",
                            "rgba(251, 146, 60, 1)",
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas de Cache e Prompts Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estatísticas de Cache */}
          <Card className="bg-[#1a2332] border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-500" />
                <CardTitle className="text-white">Cache de Legislação</CardTitle>
              </div>
              <CardDescription>Desempenho do sistema de cache</CardDescription>
            </CardHeader>
            <CardContent>
              {cacheLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full bg-gray-700" />
                  <Skeleton className="h-6 w-full bg-gray-700" />
                  <Skeleton className="h-6 w-full bg-gray-700" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total de Entradas:</span>
                    <span className="text-white font-semibold">{cacheStats?.totalEntradas || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Taxa de Hits:</span>
                    <span className="text-green-400 font-semibold">
                      {cacheStats?.taxaHits || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Economia de Tempo:</span>
                    <span className="text-blue-400 font-semibold">
                      ~{cacheStats?.economiaTempoEstimada || 0}s
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-500 mb-2">Distribuição por Tipo:</p>
                    <div className="space-y-2">
                      {cacheStats?.porTipo &&
                        Object.entries(cacheStats.porTipo).map(([tipo, count]) => (
                          <div key={tipo} className="flex justify-between text-sm">
                            <span className="text-gray-400 capitalize">{tipo}:</span>
                            <span className="text-white">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompts Recentes */}
          <Card className="bg-[#1a2332] border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-white">Prompts Recentes</CardTitle>
              </div>
              <CardDescription>Últimos 10 prompts gerados</CardDescription>
            </CardHeader>
            <CardContent>
              {recentesLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-gray-700" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {promptsRecentes?.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="p-3 bg-[#0a0f1a] rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              prompt.tipo === "analise"
                                ? "bg-blue-500/20 text-blue-400"
                                : prompt.tipo === "geracao"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {prompt.tipo === "analise"
                              ? "Análise"
                              : prompt.tipo === "geracao"
                              ? "Geração"
                              : "Otimização"}
                          </span>
                          <span className="text-xs text-gray-500">{prompt.areaJuridica}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(prompt.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                        {prompt.conteudo}
                      </p>
                      <p className="text-xs text-gray-500">
                        Por: {prompt.userName || prompt.userEmail || "Usuário desconhecido"}
                      </p>
                    </div>
                  ))}
                  {(!promptsRecentes || promptsRecentes.length === 0) && (
                    <p className="text-center text-gray-500 py-8">Nenhum prompt encontrado</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas de Uso por Funcionalidade */}
        <Card className="bg-[#1a2332] border-gray-700 mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <CardTitle className="text-white">Estatísticas de Uso</CardTitle>
            </div>
            <CardDescription>Distribuição por funcionalidade</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full bg-gray-700" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-[#0a0f1a] rounded-lg border border-blue-500/30">
                  <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white mb-1">{stats?.totalAnalises || 0}</p>
                  <p className="text-sm text-gray-400">Análises Realizadas</p>
                </div>
                <div className="text-center p-6 bg-[#0a0f1a] rounded-lg border border-green-500/30">
                  <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white mb-1">{stats?.totalGeracoes || 0}</p>
                  <p className="text-sm text-gray-400">Prompts Gerados</p>
                </div>
                <div className="text-center p-6 bg-[#0a0f1a] rounded-lg border border-orange-500/30">
                  <BarChart3 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white mb-1">
                    {stats?.totalOtimizacoes || 0}
                  </p>
                  <p className="text-sm text-gray-400">Otimizações Feitas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
