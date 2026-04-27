import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield, Database, TestTube, AlertTriangle, CheckCircle, Loader2, Trash2,
  Activity, Clock, Flag, FileText, BarChart3, Zap, Bell, Check, Package,
  Download, Upload, AlertCircle, Building2, ArrowLeft, DollarSign,
  ChevronDown, ChevronUp, Archive, ArchiveRestore
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import TabLeads from "@/components/TabLeads";
import TabInteressados from "@/components/TabInteressados";
import TabWhitelist from "@/components/TabWhitelist";
import TabMensagens from "@/components/TabMensagens";
import TabLogAcessos from "@/components/TabLogAcessos";
import { useLocation } from "wouter";

// ── Constantes de cards arquiváveis ──────────────────────────────────────────
const CARDS_ARQUIVAVEIS: Record<string, string> = {
  "auditoria-serializacao": "Auditoria de Serialização",
  "gerenciamento-cache": "Gerenciamento de Cache",
  "testes-integracao": "Testes de Integração tRPC",
  "logs-auditoria": "Logs de Auditoria",
  "monitoramento-performance": "Monitoramento de Performance",
  "monitoramento-llm": "Monitoramento LLM",
  "dashboard-custos": "Dashboard de Custos LLM",
  "feature-flags": "Feature Flags",
  "auditoria-dependencias": "Auditoria de Dependências",
  "backups": "Backups do Banco de Dados",
  "alertas-performance": "Alertas de Performance",
  "conversao-convites": "Taxa de Conversão de Convites",
};

// ── Componente CollapsibleCard ──────────────────────────────────────────────────
interface CollapsibleCardProps {
  cardId: string;
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
  expanded: boolean;
  onToggle: () => void;
  arquivavel?: boolean;
  onArquivar?: () => void;
  className?: string;
  children: React.ReactNode;
}

function CollapsibleCard({
  cardId, icon, titulo, descricao, expanded, onToggle,
  arquivavel, onArquivar, className, children
}: CollapsibleCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={onToggle}>
            {icon}
            <div className="flex-1">
              <CardTitle className="text-base">{titulo}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{descricao}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {arquivavel && onArquivar && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                title="Arquivar este card" onClick={(e) => { e.stopPropagation(); onArquivar(); }}>
                <Archive className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
              title={expanded ? "Recolher" : "Expandir"} onClick={onToggle}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && children}
    </Card>
  );
}

export default function AdminTools() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [auditando, setAuditando] = useState(false);
  const [resultadoAuditoria, setResultadoAuditoria] = useState<any>(null);
  const [auditandoDeps, setAuditandoDeps] = useState(false);
  const [resultadoAuditoriaDeps, setResultadoAuditoriaDeps] = useState<any>(null);
  const [downloadingBackupId, setDownloadingBackupId] = useState<number | null>(null);

  // ── Estado de colapso dos cards (true = expandido) ────────────────────────
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const toggleCard = useCallback((cardId: string) => {
    setExpandidos(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  }, []);
  const isExpanded = useCallback((cardId: string, defaultExpanded = true) => {
    return cardId in expandidos ? expandidos[cardId] : defaultExpanded;
  }, [expandidos]);

  // ── Estado do diálogo de arquivamento ──────────────────────────────────
  const [arquivandoCard, setArquivandoCard] = useState<{ id: string; titulo: string } | null>(null);
  const [motivoArquivamento, setMotivoArquivamento] = useState("");
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

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

  // ── Arquivamento de Cards ──────────────────────────────────────────────────
  const cardsArquivadosQuery = trpc.admin.listarCardsArquivados.useQuery();
  const arquivarCardMutation = trpc.admin.arquivarCard.useMutation({
    onSuccess: () => {
      toast.success("Card arquivado com sucesso! Os dados foram preservados.");
      cardsArquivadosQuery.refetch();
      setArquivandoCard(null);
      setMotivoArquivamento("");
    },
    onError: (error) => {
      toast.error("Erro ao arquivar: " + error.message);
    }
  });
  const desarquivarCardMutation = trpc.admin.desarquivarCard.useMutation({
    onSuccess: () => {
      toast.success("Card restaurado com sucesso!");
      cardsArquivadosQuery.refetch();
    },
    onError: (error) => {
      toast.error("Erro ao restaurar: " + error.message);
    }
  });

  // IDs dos cards arquivados (para ocultar da interface)
  const idsArquivados = new Set((cardsArquivadosQuery.data ?? []).map((c: any) => c.cardId));

  // Helpers de header de card com colapso + arquivamento
  const renderCardHeader = (
    cardId: string,
    icon: React.ReactNode,
    titulo: string,
    descricao: string,
    defaultExpanded = true
  ) => (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCard(cardId)}>
          {icon}
          <div className="flex-1">
            <CardTitle className="text-base">{titulo}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{descricao}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {cardId in CARDS_ARQUIVAVEIS && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-amber-600"
              title="Arquivar este card"
              onClick={(e) => { e.stopPropagation(); setArquivandoCard({ id: cardId, titulo: CARDS_ARQUIVAVEIS[cardId] }); }}
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            title={isExpanded(cardId, defaultExpanded) ? "Recolher" : "Expandir"}
            onClick={() => toggleCard(cardId)}
          >
            {isExpanded(cardId, defaultExpanded)
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </CardHeader>
  );

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarArquivados(!mostrarArquivados)}
              className="flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              {mostrarArquivados ? "Ocultar Arquivados" : `Arquivados (${(cardsArquivadosQuery.data ?? []).length})`}
            </Button>
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
        </div>

        {/* Diálogo de Arquivamento */}
        <Dialog open={!!arquivandoCard} onOpenChange={(open) => { if (!open) { setArquivandoCard(null); setMotivoArquivamento(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-600" />
                Arquivar Card
              </DialogTitle>
              <DialogDescription>
                O card <strong>"{arquivandoCard?.titulo}"</strong> será ocultado do painel, mas todos os dados serão preservados no banco.
                Você pode restaurá-lo a qualquer momento.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <label className="text-sm font-medium mb-1 block">Motivo do arquivamento (opcional)</label>
              <Textarea
                placeholder="Ex: Informações desatualizadas, não utilizado mais..."
                value={motivoArquivamento}
                onChange={(e) => setMotivoArquivamento(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setArquivandoCard(null); setMotivoArquivamento(""); }}>Cancelar</Button>
              <Button
                variant="default"
                className="bg-amber-600 hover:bg-amber-700"
                disabled={arquivarCardMutation.isPending}
                onClick={() => {
                  if (arquivandoCard) {
                    arquivarCardMutation.mutate({
                      cardId: arquivandoCard.id,
                      cardTitulo: arquivandoCard.titulo,
                      motivo: motivoArquivamento || undefined,
                    });
                  }
                }}
              >
                {arquivarCardMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                Arquivar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Painel de Cards Arquivados */}
        {mostrarArquivados && (
          <Card className="mb-6 border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Archive className="w-5 h-5" />
                Cards Arquivados
              </CardTitle>
              <CardDescription>Cards ocultados do painel principal. Os dados foram preservados.</CardDescription>
            </CardHeader>
            <CardContent>
              {(cardsArquivadosQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum card arquivado.</p>
              ) : (
                <div className="space-y-2">
                  {(cardsArquivadosQuery.data ?? []).map((card: any) => (
                    <div key={card.cardId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{card.cardTitulo}</p>
                        {card.motivo && <p className="text-xs text-muted-foreground mt-0.5">{card.motivo}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">Arquivado em: {new Date(card.archivedAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        disabled={desarquivarCardMutation.isPending}
                        onClick={() => desarquivarCardMutation.mutate({ cardId: card.cardId })}
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        Restaurar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
        {!idsArquivados.has("conversao-convites") && (
        <CollapsibleCard
          cardId="conversao-convites"
          icon={<BarChart3 className="w-5 h-5 text-primary" />}
          titulo="Taxa de Conversão de Convites"
          descricao="Convites enviados vs. logins realizados — últimas 8 semanas"
          expanded={isExpanded("conversao-convites")}
          onToggle={() => toggleCard("conversao-convites")}
          arquivavel
          onArquivar={() => setArquivandoCard({ id: "conversao-convites", titulo: "Taxa de Conversão de Convites" })}
          className="mb-6"
        >
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
        </CollapsibleCard>
        )}

        {/* Grid de Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Auditoria de Serialização */}
          {!idsArquivados.has("auditoria-serializacao") && (
          <CollapsibleCard
            cardId="auditoria-serializacao"
            icon={<AlertTriangle className="w-5 h-5" />}
            titulo="Auditoria de Serialização"
            descricao="Verifica rotas tRPC e funções do banco que podem causar erros de serialização"
            expanded={isExpanded("auditoria-serializacao")}
            onToggle={() => toggleCard("auditoria-serializacao")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "auditoria-serializacao", titulo: CARDS_ARQUIVAVEIS["auditoria-serializacao"] })}
          >
            <CardContent className="space-y-4">
              <Button onClick={() => { setAuditando(true); auditarSerializacao.mutate(); }} disabled={auditando} className="w-full">
                {auditando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Auditando...</> : "Executar Auditoria"}
              </Button>
              {resultadoAuditoria && (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Rotas Analisadas</span>
                    <Badge variant="outline">{resultadoAuditoria.totalRotas}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Problemas Encontrados</span>
                    <Badge variant={resultadoAuditoria.problemasEncontrados > 0 ? "destructive" : "default"}>{resultadoAuditoria.problemasEncontrados}</Badge>
                  </div>
                  {resultadoAuditoria.problemas?.length > 0 && (
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
          </CollapsibleCard>
          )}

          {/* Gerenciamento de Cache */}
          {!idsArquivados.has("gerenciamento-cache") && (
          <CollapsibleCard
            cardId="gerenciamento-cache"
            icon={<Database className="w-5 h-5" />}
            titulo="Gerenciamento de Cache"
            descricao="Controle e monitore o cache em memória do sistema"
            expanded={isExpanded("gerenciamento-cache")}
            onToggle={() => toggleCard("gerenciamento-cache")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "gerenciamento-cache", titulo: CARDS_ARQUIVAVEIS["gerenciamento-cache"] })}
          >
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
              <Button onClick={() => limparCacheMutation.mutate()} disabled={limparCacheMutation.isPending} variant="destructive" className="w-full">
                {limparCacheMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Limpando...</> : <><Trash2 className="w-4 h-4 mr-2" />Limpar Cache</>}
              </Button>
            </CardContent>
          </CollapsibleCard>
          )}

          {/* Testes de Integração */}
          {!idsArquivados.has("testes-integracao") && (
          <CollapsibleCard
            cardId="testes-integracao"
            icon={<TestTube className="w-5 h-5" />}
            titulo="Testes de Integração tRPC"
            descricao="Valida serialização e funcionamento de todas as rotas tRPC"
            expanded={isExpanded("testes-integracao")}
            onToggle={() => toggleCard("testes-integracao")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "testes-integracao", titulo: CARDS_ARQUIVAVEIS["testes-integracao"] })}
            className="md:col-span-2"
          >
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
          </CollapsibleCard>
          )}

          {/* Logs de Auditoria */}
          {!idsArquivados.has("logs-auditoria") && (
          <CollapsibleCard
            cardId="logs-auditoria"
            icon={<FileText className="w-5 h-5" />}
            titulo="Logs de Auditoria"
            descricao="Histórico de ações administrativas"
            expanded={isExpanded("logs-auditoria")}
            onToggle={() => toggleCard("logs-auditoria")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "logs-auditoria", titulo: CARDS_ARQUIVAVEIS["logs-auditoria"] })}
          >
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
          </CollapsibleCard>
          )}

          {/* Monitoramento de Performance */}
          {!idsArquivados.has("monitoramento-performance") && (
          <CollapsibleCard
            cardId="monitoramento-performance"
            icon={<Activity className="w-5 h-5" />}
            titulo="Monitoramento de Performance"
            descricao="Métricas de tempo de resposta das rotas tRPC"
            expanded={isExpanded("monitoramento-performance")}
            onToggle={() => toggleCard("monitoramento-performance")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "monitoramento-performance", titulo: CARDS_ARQUIVAVEIS["monitoramento-performance"] })}
          >
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
          </CollapsibleCard>
          )}

          {/* Monitoramento LLM */}
          {!idsArquivados.has("monitoramento-llm") && (
          <CollapsibleCard
            cardId="monitoramento-llm"
            icon={<Zap className="w-5 h-5 text-blue-500" />}
            titulo="Monitoramento LLM"
            descricao="Logs de chamadas, erros, fallbacks e latência dos providers de IA"
            expanded={isExpanded("monitoramento-llm")}
            onToggle={() => toggleCard("monitoramento-llm")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "monitoramento-llm", titulo: CARDS_ARQUIVAVEIS["monitoramento-llm"] })}
            className="border-blue-200 dark:border-blue-900"
          >
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Visualize em tempo real quais providers estão sendo usados, frequência de fallbacks automáticos,
                tipos de erro e tendências de latência.
              </p>
              <Button
                onClick={() => setLocation('/monitoramento-llm')}
                className="w-full"
                variant="default"
              >
                <Activity className="w-4 h-4 mr-2" />
                Abrir Painel de Monitoramento
              </Button>
            </CardContent>
          </CollapsibleCard>
          )}

          {/* Dashboard de Custos LLM */}
          {!idsArquivados.has("dashboard-custos") && (
          <CollapsibleCard
            cardId="dashboard-custos"
            icon={<DollarSign className="w-5 h-5 text-green-500" />}
            titulo="Dashboard de Custos LLM"
            descricao="Custo estimado por modelo, provider, período e usuário com projeções"
            expanded={isExpanded("dashboard-custos")}
            onToggle={() => toggleCard("dashboard-custos")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "dashboard-custos", titulo: CARDS_ARQUIVAVEIS["dashboard-custos"] })}
            className="border-green-200 dark:border-green-900"
          >
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Visualize o custo estimado de cada chamada aos providers de IA (OpenAI, Anthropic, Google, Manus),
                compare períodos e projete gastos futuros.
              </p>
              <Button
                onClick={() => setLocation('/dashboard-custos')}
                className="w-full"
                variant="default"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Abrir Dashboard de Custos
              </Button>
            </CardContent>
          </CollapsibleCard>
          )}

          {/* Feature Flags */}
          {!idsArquivados.has("feature-flags") && (
          <CollapsibleCard
            cardId="feature-flags"
            icon={<Flag className="w-5 h-5" />}
            titulo="Feature Flags"
            descricao="Controle de funcionalidades experimentais"
            expanded={isExpanded("feature-flags")}
            onToggle={() => toggleCard("feature-flags")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "feature-flags", titulo: CARDS_ARQUIVAVEIS["feature-flags"] })}
          >
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
          </CollapsibleCard>
          )}

          {/* Auditoria de Dependências Vulneráveis */}
          {!idsArquivados.has("auditoria-dependencias") && (
          <CollapsibleCard
            cardId="auditoria-dependencias"
            icon={<Package className="w-5 h-5" />}
            titulo="Auditoria de Dependências"
            descricao="Verifica vulnerabilidades conhecidas em pacotes npm"
            expanded={isExpanded("auditoria-dependencias")}
            onToggle={() => toggleCard("auditoria-dependencias")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "auditoria-dependencias", titulo: CARDS_ARQUIVAVEIS["auditoria-dependencias"] })}
          >
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
          </CollapsibleCard>
          )}

          {/* Backups do Banco de Dados */}
          {!idsArquivados.has("backups") && (
          <CollapsibleCard
            cardId="backups"
            icon={<Database className="w-5 h-5" />}
            titulo="Backups do Banco de Dados"
            descricao="Cria backups criptografados e armazena no S3"
            expanded={isExpanded("backups")}
            onToggle={() => toggleCard("backups")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "backups", titulo: CARDS_ARQUIVAVEIS["backups"] })}
          >
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
          </CollapsibleCard>
          )}

          {/* Alertas de Performance */}
          {!idsArquivados.has("alertas-performance") && (
          <CollapsibleCard
            cardId="alertas-performance"
            icon={<Bell className="w-5 h-5" />}
            titulo="Alertas de Performance"
            descricao="Alertas automáticos quando thresholds são excedidos"
            expanded={isExpanded("alertas-performance")}
            onToggle={() => toggleCard("alertas-performance")}
            arquivavel
            onArquivar={() => setArquivandoCard({ id: "alertas-performance", titulo: CARDS_ARQUIVAVEIS["alertas-performance"] })}
          >
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
          </CollapsibleCard>
          )}

        </div>
      </div>
    </div>
  );
}
