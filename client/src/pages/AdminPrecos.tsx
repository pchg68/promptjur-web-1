/**
 * Painel Admin de Preços — PromptJur
 * 
 * Permite ao administrador:
 * - Visualizar preços efetivos (base + overrides)
 * - Aplicar ajustes manuais (com aviso prévio de 30 dias — CDC Art. 6º)
 * - Reverter overrides para preço base
 * - Ver histórico de ajustes com paginação
 * - Gerenciar avisos prévios de reajuste (listar, cancelar, criar)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft, DollarSign, TrendingUp, RotateCcw, Edit2,
  ChevronDown, ChevronUp, History, AlertTriangle, Bell,
  BellOff, Clock, CheckCircle2, XCircle, Plus, Info,
} from "lucide-react";
import { useLocation } from "wouter";

function formatBRL(centavos: number) {
  return `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;
}

function formatPercent(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num > 0) return `+${num.toFixed(2)}%`;
  return `${num.toFixed(2)}%`;
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

type SectionKey = "planos" | "pacotes" | "avisos" | "historico";

export default function AdminPrecos() {
  const [, setLocation] = useLocation();
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>("planos");
  const [ajusteDialog, setAjusteDialog] = useState<{
    open: boolean;
    entityType: "plan" | "credit_package";
    entityId: string;
    nome: string;
    precoAtual: number;
  } | null>(null);
  const [novoAvisoDialog, setNovoAvisoDialog] = useState<{
    open: boolean;
    entityType: "plan" | "credit_package";
    entityId: string;
    nome: string;
    precoAtual: number;
  } | null>(null);
  const [novoPreco, setNovoPreco] = useState("");
  const [motivo, setMotivo] = useState("");
  const [novoPrecoAviso, setNovoPrecoAviso] = useState("");
  const [motivoAviso, setMotivoAviso] = useState("");
  const [histPage, setHistPage] = useState(1);

  const resumo = trpc.adminPrecos.resumoPrecos.useQuery();
  const historico = trpc.adminPrecos.historico.useQuery({ page: histPage, limit: 15 });
  const avisos = trpc.adminPrecos.listarAvisos.useQuery();
  const utils = trpc.useUtils();

  const reverterMutation = trpc.adminPrecos.reverter.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.adminPrecos.resumoPrecos.invalidate();
      utils.adminPrecos.historico.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const ajustarMutation = trpc.adminPrecos.ajustarManual.useMutation({
    onSuccess: () => {
      toast.success("Preço ajustado com sucesso!");
      setAjusteDialog(null);
      setNovoPreco("");
      setMotivo("");
      utils.adminPrecos.resumoPrecos.invalidate();
      utils.adminPrecos.historico.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelarAvisoMutation = trpc.adminPrecos.cancelarAviso.useMutation({
    onSuccess: () => {
      toast.success("Aviso cancelado. O reajuste não será aplicado.");
      utils.adminPrecos.listarAvisos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const criarAvisoMutation = trpc.adminPrecos.criarAvisoManual.useMutation({
    onSuccess: (data: any) => {
      toast.success(
        `Aviso criado! ${data.emailsSent}/${data.totalSubscribers} emails enviados. Vigência: ${formatDate(data.effectiveDate)}`
      );
      setNovoAvisoDialog(null);
      setNovoPrecoAviso("");
      setMotivoAviso("");
      utils.adminPrecos.listarAvisos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAjustar = () => {
    if (!ajusteDialog || !novoPreco || !motivo) return;
    const precoCentavos = Math.round(parseFloat(novoPreco.replace(",", ".")) * 100);
    if (isNaN(precoCentavos) || precoCentavos < 100) {
      toast.error("Preço inválido. Mínimo R$ 1,00");
      return;
    }
    ajustarMutation.mutate({
      entityType: ajusteDialog.entityType,
      entityId: ajusteDialog.entityId,
      novoPreco: precoCentavos,
      motivo,
    });
  };

  const handleCriarAviso = () => {
    if (!novoAvisoDialog || !novoPrecoAviso || !motivoAviso) return;
    const precoCentavos = Math.round(parseFloat(novoPrecoAviso.replace(",", ".")) * 100);
    if (isNaN(precoCentavos) || precoCentavos < 100) {
      toast.error("Preço inválido. Mínimo R$ 1,00");
      return;
    }
    criarAvisoMutation.mutate({
      entityType: novoAvisoDialog.entityType,
      entityId: novoAvisoDialog.entityId,
      novoPreco: precoCentavos,
      motivo: motivoAviso,
    });
  };

  const toggleSection = (section: SectionKey) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500 gap-1">
            <Clock className="h-3 w-3" /> Pendente
          </Badge>
        );
      case "applied":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Aplicado
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <XCircle className="h-3 w-3" /> Cancelado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingAvisosCount = avisos.data?.filter((a: any) => a.status === "pending").length ?? 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin-tools")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Gerenciamento de Preços
            </h1>
            <p className="text-muted-foreground text-sm">
              Visualize, ajuste e gerencie avisos prévios de reajuste (CDC Art. 6º)
            </p>
          </div>
          {pendingAvisosCount > 0 && (
            <Badge className="ml-auto bg-amber-500 text-white gap-1">
              <Bell className="h-3 w-3" />
              {pendingAvisosCount} aviso{pendingAvisosCount > 1 ? "s" : ""} pendente{pendingAvisosCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Seção: Planos */}
        <Card className="mb-4">
          <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection("planos")}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Planos de Assinatura</CardTitle>
                <CardDescription>Preços mensais e anuais dos planos pagos</CardDescription>
              </div>
              {expandedSection === "planos" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSection === "planos" && (
            <CardContent>
              {resumo.isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plano</TableHead>
                      <TableHead>Preço Base (Mensal)</TableHead>
                      <TableHead>Preço Efetivo (Mensal)</TableHead>
                      <TableHead>Preço Efetivo (Anual)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumo.data?.planos.map((plano) => (
                      <TableRow key={plano.id}>
                        <TableCell className="font-medium">{plano.nome}</TableCell>
                        <TableCell>{formatBRL(plano.precoBase)}</TableCell>
                        <TableCell className={plano.temOverride ? "text-amber-500 font-semibold" : ""}>
                          {formatBRL(plano.precoEfetivo)}
                        </TableCell>
                        <TableCell>{formatBRL(plano.precoEfetivoAnual)}</TableCell>
                        <TableCell>
                          {plano.temOverride ? (
                            <Badge variant="outline" className="text-amber-500 border-amber-500">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Override ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Preço base</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setNovoAvisoDialog({
                                open: true,
                                entityType: "plan",
                                entityId: plano.id,
                                nome: plano.nome,
                                precoAtual: plano.precoEfetivo,
                              })}
                              title="Criar aviso prévio de 30 dias (CDC Art. 6º)"
                            >
                              <Bell className="h-3 w-3 mr-1" />
                              Aviso 30d
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAjusteDialog({
                                open: true,
                                entityType: "plan",
                                entityId: plano.id,
                                nome: plano.nome,
                                precoAtual: plano.precoEfetivo,
                              })}
                              title="Ajuste imediato (sem aviso prévio)"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Imediato
                            </Button>
                            {plano.temOverride && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => reverterMutation.mutate({ entityType: "plan", entityId: plano.id })}
                                disabled={reverterMutation.isPending}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reverter
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          )}
        </Card>

        {/* Seção: Pacotes de Créditos */}
        <Card className="mb-4">
          <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection("pacotes")}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pacotes de Créditos</CardTitle>
                <CardDescription>Preços dos pacotes de créditos avulsos</CardDescription>
              </div>
              {expandedSection === "pacotes" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSection === "pacotes" && (
            <CardContent>
              {resumo.isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pacote</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Preço Base</TableHead>
                      <TableHead>Preço Efetivo</TableHead>
                      <TableHead>R$/Crédito</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumo.data?.pacotes.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.nome}</TableCell>
                        <TableCell>{pkg.creditos}</TableCell>
                        <TableCell>{formatBRL(pkg.precoBase)}</TableCell>
                        <TableCell className={pkg.temOverride ? "text-amber-500 font-semibold" : ""}>
                          {formatBRL(pkg.precoEfetivo)}
                        </TableCell>
                        <TableCell>{formatBRL(pkg.precoPorCreditoEfetivo)}</TableCell>
                        <TableCell>
                          {pkg.temOverride ? (
                            <Badge variant="outline" className="text-amber-500 border-amber-500">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Override
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Base</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setNovoAvisoDialog({
                                open: true,
                                entityType: "credit_package",
                                entityId: pkg.id,
                                nome: pkg.nome,
                                precoAtual: pkg.precoEfetivo,
                              })}
                              title="Criar aviso prévio de 30 dias (CDC Art. 6º)"
                            >
                              <Bell className="h-3 w-3 mr-1" />
                              Aviso 30d
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAjusteDialog({
                                open: true,
                                entityType: "credit_package",
                                entityId: pkg.id,
                                nome: pkg.nome,
                                precoAtual: pkg.precoEfetivo,
                              })}
                              title="Ajuste imediato (sem aviso prévio)"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Imediato
                            </Button>
                            {pkg.temOverride && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => reverterMutation.mutate({ entityType: "credit_package", entityId: pkg.id })}
                                disabled={reverterMutation.isPending}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reverter
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          )}
        </Card>

        {/* Seção: Avisos Prévios de Reajuste (CDC Art. 6º) */}
        <Card className="mb-4 border-amber-500/30">
          <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection("avisos")}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Avisos Prévios de Reajuste
                  {pendingAvisosCount > 0 && (
                    <Badge className="bg-amber-500 text-white text-xs">{pendingAvisosCount}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Avisos enviados aos assinantes com 30 dias de antecedência (CDC Art. 6º, III)
                </CardDescription>
              </div>
              {expandedSection === "avisos" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSection === "avisos" && (
            <CardContent>
              {/* Banner informativo */}
              <div className="flex items-start gap-3 p-3 mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  Avisos com status <strong>Pendente</strong> serão aplicados automaticamente na data de vigência pela scheduled task diária.
                  Você pode cancelar um aviso antes da data de vigência para impedir o reajuste.
                </p>
              </div>

              {avisos.isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : !avisos.data || avisos.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum aviso de reajuste registrado.</p>
                  <p className="text-sm mt-1">
                    Use o botão <strong>"Aviso 30d"</strong> nas tabelas acima para criar um aviso com 30 dias de antecedência.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Preço Atual</TableHead>
                      <TableHead>Novo Preço</TableHead>
                      <TableHead>Ajuste</TableHead>
                      <TableHead>Emails</TableHead>
                      <TableHead>Vigência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avisos.data.map((aviso: any) => (
                      <TableRow key={aviso.id}>
                        <TableCell className="text-muted-foreground text-xs">{aviso.id}</TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <span>{aviso.entityId}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {aviso.entityType === "plan" ? "Plano" : "Pacote"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatBRL(aviso.currentPrice)}</TableCell>
                        <TableCell className="font-semibold text-amber-500">
                          {formatBRL(aviso.newPrice)}
                        </TableCell>
                        <TableCell>
                          <span className={aviso.adjustmentPercent > 0 ? "text-red-400" : "text-green-400"}>
                            {aviso.adjustmentPercent !== null
                              ? formatPercent(aviso.adjustmentPercent / 100)
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {aviso.emailsSent}/{aviso.totalSubscribers}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={
                            aviso.status === "pending" && new Date(aviso.effectiveDate) <= new Date()
                              ? "text-red-400 font-semibold"
                              : ""
                          }>
                            {formatDate(aviso.effectiveDate)}
                          </span>
                        </TableCell>
                        <TableCell>{statusBadge(aviso.status)}</TableCell>
                        <TableCell>
                          {aviso.status === "pending" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelarAvisoMutation.mutate({ noticeId: aviso.id })}
                              disabled={cancelarAvisoMutation.isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          )}
        </Card>

        {/* Seção: Histórico */}
        <Card className="mb-4">
          <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection("historico")}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Ajustes Aplicados
                </CardTitle>
                <CardDescription>Registro completo de todas as alterações de preço efetivadas</CardDescription>
              </div>
              {expandedSection === "historico" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSection === "historico" && (
            <CardContent>
              {historico.isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : historico.data?.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum ajuste de preço registrado ainda.</p>
                  <p className="text-sm">Os ajustes aparecerão aqui quando forem aplicados (imediatos ou após 30 dias).</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ajuste</TableHead>
                        <TableHead>Fonte</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Mês Ref.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historico.data?.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">
                            {new Date(item.appliedAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.entityType === "plan" ? "Plano" : "Pacote"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={
                              (item.adjustmentPercent ?? 0) > 0
                                ? "text-red-500"
                                : (item.adjustmentPercent ?? 0) < 0
                                  ? "text-green-500"
                                  : ""
                            }>
                              {item.adjustmentPercent !== null
                                ? formatPercent(item.adjustmentPercent)
                                : "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              item.source === "manual" ? "default" :
                              item.source?.startsWith("notice_") ? "secondary" :
                              item.source === "ipca" ? "secondary" : "outline"
                            }>
                              {item.source?.startsWith("notice_") ? "aviso 30d" : (item.source ?? "—")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {item.reason ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">{item.referenceMonth ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  {(historico.data?.totalPages ?? 0) > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {historico.data?.page} de {historico.data?.totalPages} ({historico.data?.total} registros)
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={histPage <= 1} onClick={() => setHistPage(p => p - 1)}>
                          Anterior
                        </Button>
                        <Button size="sm" variant="outline" disabled={histPage >= (historico.data?.totalPages ?? 1)} onClick={() => setHistPage(p => p + 1)}>
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Dialog: Aviso Prévio de 30 dias (CDC Art. 6º) */}
      <Dialog open={!!novoAvisoDialog} onOpenChange={(open) => !open && setNovoAvisoDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Aviso Prévio de Reajuste — {novoAvisoDialog?.nome}
            </DialogTitle>
            <DialogDescription>
              Cria um aviso com <strong>30 dias de antecedência</strong> conforme CDC Art. 6º, III.
              Emails serão enviados a todos os assinantes afetados. O preço só será aplicado após 30 dias.
              <br /><br />
              Preço atual: <strong>{novoAvisoDialog ? formatBRL(novoAvisoDialog.precoAtual) : ""}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Novo Preço (R$)</label>
              <Input
                placeholder="Ex: 59,90"
                value={novoPrecoAviso}
                onChange={(e) => setNovoPrecoAviso(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Motivo do Reajuste</label>
              <Textarea
                placeholder="Ex: Reajuste anual conforme variação do IPCA (6,2% acumulado)..."
                value={motivoAviso}
                onChange={(e) => setMotivoAviso(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este texto aparecerá no email enviado aos assinantes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoAvisoDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCriarAviso}
              disabled={!novoPrecoAviso || !motivoAviso || criarAvisoMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Bell className="h-4 w-4 mr-2" />
              {criarAvisoMutation.isPending ? "Enviando emails..." : "Criar Aviso + Enviar Emails"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ajuste Imediato */}
      <Dialog open={!!ajusteDialog} onOpenChange={(open) => !open && setAjusteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Ajuste Imediato — {ajusteDialog?.nome}
            </DialogTitle>
            <DialogDescription>
              <span className="text-amber-500 font-medium">⚠️ Atenção:</span> Este ajuste é aplicado imediatamente, sem aviso prévio de 30 dias.
              Use apenas para reversões ou ajustes mínimos que não exijam notificação prévia.
              <br /><br />
              Preço atual: <strong>{ajusteDialog ? formatBRL(ajusteDialog.precoAtual) : ""}</strong>.
              Limite: máximo +30% ou -50% do preço base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Novo Preço (R$)</label>
              <Input
                placeholder="Ex: 59,90"
                value={novoPreco}
                onChange={(e) => setNovoPreco(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Motivo do Ajuste</label>
              <Textarea
                placeholder="Ex: Reversão de promoção, correção de erro..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjusteDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAjustar}
              disabled={!novoPreco || !motivo || ajustarMutation.isPending}
            >
              {ajustarMutation.isPending ? "Aplicando..." : "Aplicar Imediatamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
