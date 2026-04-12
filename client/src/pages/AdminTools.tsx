import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Database, TestTube, AlertTriangle, CheckCircle, Loader2, Trash2, Activity, Clock, Flag, FileText, BarChart3, Zap, Bell, Check, Package, Download, Upload, AlertCircle, Building2, ArrowLeft } from "lucide-react";
import TabLeads from "@/components/TabLeads";
import TabInteressados from "@/components/TabInteressados";
import TabWhitelist from "@/components/TabWhitelist";
import TabMensagens from "@/components/TabMensagens";
import TabLogAcessos from "@/components/TabLogAcessos";
import { useLocation } from "wouter";

export default function AdminTools() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [auditando, setAuditando] = useState(false);
  const [resultadoAuditoria, setResultadoAuditoria] = useState<any>(null);
  const [auditandoDeps, setAuditandoDeps] = useState(false);
  const [resultadoAuditoriaDeps, setResultadoAuditoriaDeps] = useState<any>(null);
  const [downloadingBackupId, setDownloadingBackupId] = useState<number | null>(null);

  // Redirect para não-admins — DEVE estar antes dos returns condicionais
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      setLocation('/dashboard');
    }
  }, [loading, user, setLocation]);

  // Todos os hooks tRPC DEVEM ser declarados aqui, antes de qualquer return condicional
  const auditarSerializacao = trpc.admin.auditarSerializacao.useMutation({
    onSuccess: (data) => {
      setResultadoAuditoria(data);
      setAuditando(false);
      if (data.problemasEncontrados === 0) {
        toast.success("✅ Nenhum problema de serialização encontrado!");
      } else {
        toast.warning(`⚠️ ${data.problemasEncontrados} problema(s) encontrado(s)`);
      }
    },
    onError: (error) => {
      setAuditando(false);
      toast.error("Erro ao auditar: " + error.message);
    }
  });

  const limparCacheMutation = trpc.admin.limparCache.useMutation({
    onSuccess: () => {
      toast.success("Cache limpo com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao limpar cache: " + error.message);
    }
  });

  const estatisticasCacheQuery = trpc.admin.estatisticasCache.useQuery();

  const executarTestesMutation = trpc.admin.executarTestes.useMutation({
    onSuccess: (data) => {
      if (data.totalFalhas === 0) {
        toast.success(`✅ Todos os ${data.totalTestes} testes passaram!`);
      } else {
        toast.error(`❌ ${data.totalFalhas} de ${data.totalTestes} testes falharam`);
      }
    },
    onError: (error) => {
      toast.error("Erro ao executar testes: " + error.message);
    }
  });

  // Logs de Auditoria
  const logsQuery = trpc.admin.listarLogs.useQuery({ limit: 50 });
  const statsAuditoriaQuery = trpc.admin.statsAuditoria.useQuery();

  // Métricas de Conversão de Convites
  const metricasConversaoQuery = trpc.admin.metricasConversao.useQuery();

  // Performance
  const metricasPorRotaQuery = trpc.admin.metricasPorRota.useQuery();
  const statsPerformanceQuery = trpc.admin.statsPerformance.useQuery();
  const limparMetricasMutation = trpc.admin.limparMetricas.useMutation({
    onSuccess: () => {
      toast.success("Métricas limpas com sucesso!");
      metricasPorRotaQuery.refetch();
      statsPerformanceQuery.refetch();
    }
  });

  // Feature Flags
  const featuresQuery = trpc.admin.listarFeatures.useQuery();
  const toggleFeatureMutation = trpc.admin.toggleFeature.useMutation({
    onSuccess: (data) => {
      toast.success(`Feature "${data.nome}" ${data.isAtivo ? 'ativada' : 'desativada'}!`);
      featuresQuery.refetch();
    }
  });
  const inicializarFeaturesMutation = trpc.admin.inicializarFeatures.useMutation({
    onSuccess: () => {
      toast.success("Features padrão inicializadas!");
      featuresQuery.refetch();
    }
  });

  // Alertas de Performance
  const alertasQuery = trpc.admin.listarAlertas.useQuery({ resolvido: false, limit: 20 });
  const statsAlertasQuery = trpc.admin.statsAlertas.useQuery();
  const resolverAlertaMutation = trpc.admin.resolverAlerta.useMutation({
    onSuccess: () => {
      toast.success("Alerta marcado como resolvido!");
      alertasQuery.refetch();
      statsAlertasQuery.refetch();
    }
  });

  // Auditoria de Dependências
  const auditarDependenciasMutation = trpc.admin.auditarDependencias.useMutation({
    onSuccess: (data) => {
      setResultadoAuditoriaDeps(data);
      setAuditandoDeps(false);
      if (data.totalVulnerabilities === 0) {
        toast.success("✅ Nenhuma vulnerabilidade encontrada!");
      } else {
        toast.warning(`⚠️ ${data.totalVulnerabilities} vulnerabilidade(s) encontrada(s)`);
      }
    },
    onError: (error) => {
      setAuditandoDeps(false);
      toast.error("Erro ao auditar: " + error.message);
    }
  });
  const atualizarDependenciasMutation = trpc.admin.atualizarDependencias.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ ${data.updated.length} pacote(s) atualizado(s)!`);
      setAuditandoDeps(true);
      auditarDependenciasMutation.mutate();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    }
  });

  // Backups
  const backupsQuery = trpc.admin.listarBackups.useQuery();
  const criarBackupMutation = trpc.admin.criarBackup.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✅ Backup criado com sucesso!");
        backupsQuery.refetch();
      } else {
        toast.error("Erro ao criar backup: " + data.error);
      }
    },
    onError: (error) => {
      toast.error("Erro ao criar backup: " + error.message);
    }
  });
  const restaurarBackupMutation = trpc.admin.restaurarBackup.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("✅ Backup restaurado com sucesso!");
      } else {
        toast.error("Erro ao restaurar: " + data.error);
      }
    },
    onError: (error) => {
      toast.error("Erro ao restaurar: " + error.message);
    }
  });
  const gerarLinkDownloadBackupMutation = trpc.admin.gerarLinkDownloadBackup.useMutation({
    onSuccess: (data) => {
      setDownloadingBackupId(null);
      // Abre o link de download em nova aba
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.filename;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`✅ Download iniciado: ${data.filename}`);
    },
    onError: (error) => {
      setDownloadingBackupId(null);
      toast.error("Erro ao gerar link de download: " + error.message);
    }
  });

  // Returns condicionais DEVEM vir depois de todos os hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Ferramentas Administrativas</h1>
              <p className="text-muted-foreground">Acesso restrito a administradores</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Mensagens de Contato */}
        <div className="mb-8 p-6 rounded-xl bg-[#0f1923] border border-[#1e3a5f]">
          <TabMensagens />
        </div>

        {/* Painel de Leads Enterprise */}
        <div className="mb-8 p-6 rounded-xl bg-[#0f1923] border border-[#1e3a5f]">
          <TabLeads />
        </div>

        {/* Painel de Interessados no Lançamento */}
        <div className="mb-8 p-6 rounded-xl bg-[#0f1923] border border-[#1e3a5f]">
          <TabInteressados />
        </div>

        {/* Whitelist de Acesso */}
        <div className="mb-8 p-6 rounded-xl bg-[#0f1923] border border-[#1e3a5f]">
          <TabWhitelist />
        </div>

        {/* Log de Acessos */}
        <div className="mb-8 p-6 rounded-xl bg-[#0f1923] border border-[#1e3a5f]">
          <TabLogAcessos />
        </div>

        {/* Card de Métricas de Conversão de Convites */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Taxa de Conversão de Convites
            </CardTitle>
            <CardDescription>
              Convites enviados vs. logins realizados — últimas 8 semanas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricasConversaoQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : metricasConversaoQuery.data ? (
              <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{metricasConversaoQuery.data.taxaConversao}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Taxa de Conversão</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{metricasConversaoQuery.data.totalEmails}</p>
                    <p className="text-xs text-muted-foreground mt-1">E-mails Convidados</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-500">{metricasConversaoQuery.data.convertidos}</p>
                    <p className="text-xs text-muted-foreground mt-1">Convertidos</p>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-500">{metricasConversaoQuery.data.pendentes}</p>
                    <p className="text-xs text-muted-foreground mt-1">Aguardando Login</p>
                  </div>
                </div>
                {/* Gráfico de barras semanal */}
                {metricasConversaoQuery.data.graficoSemanal.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium mb-3 text-muted-foreground">Atividade Semanal</p>
                    <div className="flex items-end gap-3 h-32">
                      {metricasConversaoQuery.data.graficoSemanal.map((semana: any, i: number) => {
                        const maxVal = Math.max(
                          ...metricasConversaoQuery.data!.graficoSemanal.flatMap((s: any) => [s.convites, s.logins]),
                          1
                        );
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex gap-0.5 items-end h-24">
                              <div
                                className="flex-1 bg-primary/70 rounded-t transition-all"
                                style={{ height: `${Math.round((semana.convites / maxVal) * 100)}%`, minHeight: semana.convites > 0 ? '4px' : '0' }}
                                title={`Convites: ${semana.convites}`}
                              />
                              <div
                                className="flex-1 bg-green-500/70 rounded-t transition-all"
                                style={{ height: `${Math.round((semana.logins / maxVal) * 100)}%`, minHeight: semana.logins > 0 ? '4px' : '0' }}
                                title={`Logins: ${semana.logins}`}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{semana.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-primary/70" />
                        <span className="text-xs text-muted-foreground">Convites enviados</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-green-500/70" />
                        <span className="text-xs text-muted-foreground">Logins realizados</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade nas últimas 8 semanas.</p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Grid de Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Auditoria de Serialização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Auditoria de Serialização
              </CardTitle>
              <CardDescription>
                Verifica rotas tRPC e funções do banco que podem causar erros de serialização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => {
                  setAuditando(true);
                  auditarSerializacao.mutate();
                }}
                disabled={auditando}
                className="w-full"
              >
                {auditando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Auditando...
                  </>
                ) : (
                  "Executar Auditoria"
                )}
              </Button>

              {resultadoAuditoria && (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Rotas Analisadas</span>
                    <Badge variant="outline">{resultadoAuditoria.totalRotas}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Problemas Encontrados</span>
                    <Badge variant={resultadoAuditoria.problemasEncontrados > 0 ? "destructive" : "default"}>
                      {resultadoAuditoria.problemasEncontrados}
                    </Badge>
                  </div>
                  
                  {resultadoAuditoria.problemas && resultadoAuditoria.problemas.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium">Rotas Problemáticas:</p>
                      {resultadoAuditoria.problemas.map((p: any, i: number) => (
                        <div key={i} className="p-2 bg-destructive/10 rounded text-sm">
                          <code className="text-destructive">{p.rota}</code>
                          <p className="text-muted-foreground text-xs mt-1">{p.motivo}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gerenciamento de Cache */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Gerenciamento de Cache
              </CardTitle>
              <CardDescription>
                Controle e monitore o cache em memória do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {estatisticasCacheQuery.data && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Entradas em Cache</span>
                    <Badge variant="outline">{estatisticasCacheQuery.data.totalEntradas}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Taxa de Acerto</span>
                    <Badge variant="default">{estatisticasCacheQuery.data.taxaAcerto}%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Memória Usada</span>
                    <Badge variant="outline">{estatisticasCacheQuery.data.memoriaUsada}</Badge>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => limparCacheMutation.mutate()}
                disabled={limparCacheMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                {limparCacheMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Cache
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Testes de Integração */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Testes de Integração tRPC
              </CardTitle>
              <CardDescription>
                Valida serialização e funcionamento de todas as rotas tRPC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => executarTestesMutation.mutate()}
                disabled={executarTestesMutation.isPending}
                className="w-full"
              >
                {executarTestesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executando Testes...
                  </>
                ) : (
                  "Executar Todos os Testes"
                )}
              </Button>

              {executarTestesMutation.data && (
                <div className="space-y-3 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{executarTestesMutation.data.totalTestes}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{executarTestesMutation.data.totalSucessos}</p>
                      <p className="text-xs text-muted-foreground">Sucessos</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-destructive">{executarTestesMutation.data.totalFalhas}</p>
                      <p className="text-xs text-muted-foreground">Falhas</p>
                    </div>
                  </div>

                  {executarTestesMutation.data.falhas && executarTestesMutation.data.falhas.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium">Testes Falhados:</p>
                      {executarTestesMutation.data.falhas.map((f: any, i: number) => (
                        <div key={i} className="p-3 bg-destructive/10 rounded">
                          <p className="text-sm font-medium text-destructive">{f.teste}</p>
                          <p className="text-xs text-muted-foreground mt-1">{f.erro}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs de Auditoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Logs de Auditoria
              </CardTitle>
              <CardDescription>
                Histórico de ações administrativas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsAuditoriaQuery.data && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{statsAuditoriaQuery.data.totalLogs}</p>
                    <p className="text-xs text-muted-foreground">Total de Logs</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{statsAuditoriaQuery.data.acoesUnicas}</p>
                    <p className="text-xs text-muted-foreground">Ações Únicas</p>
                  </div>
                </div>
              )}
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {logsQuery.data?.slice(0, 10).map((log: any) => (
                  <div key={log.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{log.acao}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {log.descricao && (
                      <p className="text-sm mt-2">{log.descricao}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monitoramento de Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Monitoramento de Performance
              </CardTitle>
              <CardDescription>
                Métricas de tempo de resposta das rotas tRPC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsPerformanceQuery.data && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{statsPerformanceQuery.data.totalRequisicoes}</p>
                    <p className="text-xs text-muted-foreground">Requisições</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{statsPerformanceQuery.data.p95Global}ms</p>
                    <p className="text-xs text-muted-foreground">P95 Global</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{statsPerformanceQuery.data.duracaoMedia}ms</p>
                    <p className="text-xs text-muted-foreground">Média</p>
                  </div>
                </div>
              )}
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                <p className="text-sm font-medium mb-2">Rotas Mais Lentas (P95):</p>
                {metricasPorRotaQuery.data?.slice(0, 5).map((metrica: any) => (
                  <div key={metrica.rota} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">{metrica.rota}</span>
                      <Badge variant={metrica.p95 > 1000 ? "destructive" : metrica.p95 > 500 ? "default" : "secondary"}>
                        {metrica.p95}ms
                      </Badge>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>P50: {metrica.p50}ms</span>
                      <span>P99: {metrica.p99}ms</span>
                      <span>Total: {metrica.total}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => limparMetricasMutation.mutate()}
                disabled={limparMetricasMutation.isPending}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Métricas
              </Button>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Controle de funcionalidades experimentais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => inicializarFeaturesMutation.mutate()}
                disabled={inicializarFeaturesMutation.isPending}
                variant="outline"
                size="sm"
                className="w-full mb-4"
              >
                {inicializarFeaturesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  "Inicializar Features Padrão"
                )}
              </Button>
              
              <div className="space-y-2">
                {featuresQuery.data?.map((feature: any) => (
                  <div key={feature.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{feature.nome}</p>
                        {feature.descricao && (
                          <p className="text-xs text-muted-foreground mt-1">{feature.descricao}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => toggleFeatureMutation.mutate({ nome: feature.nome })}
                        disabled={toggleFeatureMutation.isPending}
                        variant={feature.isAtivo ? "default" : "outline"}
                        size="sm"
                      >
                        {feature.isAtivo ? "Ativo" : "Inativo"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Auditoria de Dependências Vulneráveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Auditoria de Dependências
              </CardTitle>
              <CardDescription>
                Verifica vulnerabilidades conhecidas em pacotes npm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => {
                  setAuditandoDeps(true);
                  auditarDependenciasMutation.mutate();
                }}
                disabled={auditandoDeps}
                className="w-full"
              >
                {auditandoDeps ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Auditando...
                  </>
                ) : (
                  "Executar Auditoria"
                )}
              </Button>

              {resultadoAuditoriaDeps && (
                <div className="space-y-3 mt-4">
                  <div className="grid grid-cols-5 gap-2">
                    <div className="p-2 bg-muted rounded-lg text-center">
                      <p className="text-lg font-bold">{resultadoAuditoriaDeps.totalVulnerabilities}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-2 bg-red-500/10 rounded-lg text-center">
                      <p className="text-lg font-bold text-red-600">{resultadoAuditoriaDeps.critical}</p>
                      <p className="text-xs text-muted-foreground">Crítica</p>
                    </div>
                    <div className="p-2 bg-orange-500/10 rounded-lg text-center">
                      <p className="text-lg font-bold text-orange-600">{resultadoAuditoriaDeps.high}</p>
                      <p className="text-xs text-muted-foreground">Alta</p>
                    </div>
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-center">
                      <p className="text-lg font-bold text-yellow-600">{resultadoAuditoriaDeps.moderate}</p>
                      <p className="text-xs text-muted-foreground">Média</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-center">
                      <p className="text-lg font-bold text-blue-600">{resultadoAuditoriaDeps.low}</p>
                      <p className="text-xs text-muted-foreground">Baixa</p>
                    </div>
                  </div>

                  {resultadoAuditoriaDeps.vulnerabilities.length > 0 && (
                    <>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {resultadoAuditoriaDeps.vulnerabilities.slice(0, 10).map((vuln: any, idx: number) => (
                          <div key={idx} className="p-2 bg-muted rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    variant={vuln.severity === 'critical' ? 'destructive' : 'outline'}
                                    className={vuln.severity === 'high' ? 'bg-orange-500/10 text-orange-600' : ''}
                                  >
                                    {vuln.severity}
                                  </Badge>
                                  <span className="text-sm font-medium">{vuln.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{vuln.title}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => atualizarDependenciasMutation.mutate()}
                        disabled={atualizarDependenciasMutation.isPending}
                        variant="default"
                        className="w-full"
                      >
                        {atualizarDependenciasMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Atualizando...
                          </>
                        ) : (
                          "Atualizar Dependências Seguras"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backups do Banco de Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Backups do Banco de Dados
              </CardTitle>
              <CardDescription>
                Cria backups criptografados e armazena no S3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => criarBackupMutation.mutate()}
                disabled={criarBackupMutation.isPending}
                className="w-full"
              >
                {criarBackupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando Backup...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Criar Backup Manual
                  </>
                )}
              </Button>

              {backupsQuery.data && backupsQuery.data.length > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Último Backup:</p>
                    <p className="text-sm font-medium">
                      {new Date(backupsQuery.data[0].createdAt).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tamanho: {Math.round(backupsQuery.data[0].size / 1024 / 1024)}MB
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {backupsQuery.data.slice(0, 10).map((backup: any) => (
                      <div key={backup.id} className="p-2 bg-muted rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{backup.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(backup.createdAt).toLocaleString('pt-BR')} &bull; {Math.round(backup.size / 1024 / 1024)}MB
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Botão de Download */}
                            <Button
                              onClick={() => {
                                setDownloadingBackupId(backup.id);
                                gerarLinkDownloadBackupMutation.mutate({ backupId: backup.id });
                              }}
                              disabled={downloadingBackupId === backup.id || gerarLinkDownloadBackupMutation.isPending}
                              variant="outline"
                              size="sm"
                              title="Baixar backup criptografado"
                            >
                              {downloadingBackupId === backup.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            {/* Botão de Restaurar */}
                            <Button
                              onClick={() => {
                                if (confirm('Tem certeza? Esta ação substituirá todos os dados atuais!')) {
                                  restaurarBackupMutation.mutate({ backupId: backup.id });
                                }
                              }}
                              disabled={restaurarBackupMutation.isPending}
                              variant="outline"
                              size="sm"
                              title="Restaurar banco de dados a partir deste backup"
                              className="text-amber-600 hover:text-amber-700 hover:border-amber-600"
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-yellow-500/10 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Backups são criptografados com AES-256 e armazenados no S3 com retenção de 30 dias.
                    </p>
                  </div>
                </div>
              )}

              {backupsQuery.data && backupsQuery.data.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum backup disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas de Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alertas de Performance
              </CardTitle>
              <CardDescription>
                Alertas automáticos quando thresholds são excedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsAlertasQuery.data && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{statsAlertasQuery.data.totalAlertas}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-destructive">{statsAlertasQuery.data.alertasAtivos}</p>
                    <p className="text-xs text-muted-foreground">Ativos</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{statsAlertasQuery.data.alertasResolvidos}</p>
                    <p className="text-xs text-muted-foreground">Resolvidos</p>
                  </div>
                </div>
              )}
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {alertasQuery.data && alertasQuery.data.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm">Nenhum alerta ativo</p>
                  </div>
                )}
                {alertasQuery.data?.map((alerta: any) => (
                  <div key={alerta.id} className="p-3 bg-destructive/10 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive">{alerta.rota}</Badge>
                          <Badge variant="outline">{alerta.metrica.toUpperCase()}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {alerta.valorAtual}ms (threshold: {alerta.threshold}ms)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alerta.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        onClick={() => resolverAlertaMutation.mutate({ alertaId: alerta.id })}
                        disabled={resolverAlertaMutation.isPending}
                        variant="outline"
                        size="sm"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {statsAlertasQuery.data?.rotaMaisProblematica && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Rota Mais Problemática:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{statsAlertasQuery.data.rotaMaisProblematica.rota}</span>
                    <Badge variant="destructive">
                      {statsAlertasQuery.data.rotaMaisProblematica.total} alertas
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
