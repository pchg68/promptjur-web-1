/**
 * Painel Admin de Preços — PromptJur
 * 
 * Permite ao administrador:
 * - Visualizar preços efetivos (base + overrides)
 * - Aplicar ajustes manuais
 * - Reverter overrides para preço base
 * - Ver histórico de ajustes com paginação
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, RotateCcw, Edit2, ChevronDown, ChevronUp, History, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

function formatBRL(centavos: number) {
  return `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;
}

function formatPercent(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num > 0) return `+${num.toFixed(2)}%`;
  return `${num.toFixed(2)}%`;
}

export default function AdminPrecos() {
  const [, setLocation] = useLocation();
  const [expandedSection, setExpandedSection] = useState<"planos" | "pacotes" | "historico" | null>("planos");
  const [ajusteDialog, setAjusteDialog] = useState<{ open: boolean; entityType: "plan" | "credit_package"; entityId: string; nome: string; precoAtual: number } | null>(null);
  const [novoPreco, setNovoPreco] = useState("");
  const [motivo, setMotivo] = useState("");
  const [histPage, setHistPage] = useState(1);

  const resumo = trpc.adminPrecos.resumoPrecos.useQuery();
  const historico = trpc.adminPrecos.historico.useQuery({ page: histPage, limit: 15 });
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

  const toggleSection = (section: "planos" | "pacotes" | "historico") => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
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
              Visualize, ajuste e reverta preços de planos e pacotes de créditos
            </p>
          </div>
        </div>

        {/* Seção: Planos */}
        <Card className="mb-4">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection("planos")}
          >
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
                          <div className="flex gap-2">
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
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Ajustar
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
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection("pacotes")}
          >
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
                          <div className="flex gap-2">
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
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Ajustar
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

        {/* Seção: Histórico */}
        <Card className="mb-4">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => toggleSection("historico")}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Ajustes
                </CardTitle>
                <CardDescription>Registro completo de todas as alterações de preço</CardDescription>
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
                  <p className="text-sm">Os ajustes aparecerão aqui quando a scheduled task executar ou quando você fizer ajustes manuais.</p>
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
                              item.source === "ipca" ? "secondary" : "outline"
                            }>
                              {item.source ?? "—"}
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
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={histPage <= 1}
                          onClick={() => setHistPage(p => p - 1)}
                        >
                          Anterior
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={histPage >= (historico.data?.totalPages ?? 1)}
                          onClick={() => setHistPage(p => p + 1)}
                        >
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

      {/* Dialog de Ajuste Manual */}
      <Dialog open={!!ajusteDialog} onOpenChange={(open) => !open && setAjusteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Preço — {ajusteDialog?.nome}</DialogTitle>
            <DialogDescription>
              Preço atual: {ajusteDialog ? formatBRL(ajusteDialog.precoAtual) : ""}. 
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
                placeholder="Ex: Ajuste de mercado, correção IPCA, promoção..."
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
              {ajustarMutation.isPending ? "Aplicando..." : "Aplicar Ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
