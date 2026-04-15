import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, Users, DollarSign, BarChart3, Plus,
  ArrowLeft, FileText, RefreshCw, Trash2, UserPlus, Shield, ChevronRight
} from "lucide-react";

type Etapa = "lead" | "contato" | "demonstracao" | "proposta" | "fechado_ganho" | "fechado_perdido";
type Origem = "indicacao" | "organico" | "redes_sociais" | "email_marketing" | "evento" | "outro";
type StatusContrato = "ativo" | "cancelado" | "suspenso" | "trial";

const ETAPAS: { key: Etapa; label: string; cor: string }[] = [
  { key: "lead", label: "Lead", cor: "bg-slate-100 border-slate-300 text-slate-700" },
  { key: "contato", label: "Contato", cor: "bg-blue-50 border-blue-300 text-blue-700" },
  { key: "demonstracao", label: "Demonstração", cor: "bg-purple-50 border-purple-300 text-purple-700" },
  { key: "proposta", label: "Proposta", cor: "bg-amber-50 border-amber-300 text-amber-700" },
  { key: "fechado_ganho", label: "Ganho", cor: "bg-green-50 border-green-300 text-green-700" },
  { key: "fechado_perdido", label: "Perdido", cor: "bg-red-50 border-red-300 text-red-700" },
];

const ORIGENS: { key: Origem; label: string }[] = [
  { key: "indicacao", label: "Indicação" },
  { key: "organico", label: "Orgânico" },
  { key: "redes_sociais", label: "Redes Sociais" },
  { key: "email_marketing", label: "E-mail Marketing" },
  { key: "evento", label: "Evento" },
  { key: "outro", label: "Outro" },
];

const STATUS_CONTRATO: { key: StatusContrato; label: string; cor: string }[] = [
  { key: "ativo", label: "Ativo", cor: "bg-green-100 text-green-700" },
  { key: "trial", label: "Trial", cor: "bg-blue-100 text-blue-700" },
  { key: "suspenso", label: "Suspenso", cor: "bg-amber-100 text-amber-700" },
  { key: "cancelado", label: "Cancelado", cor: "bg-red-100 text-red-700" },
];

function formatCurrency(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}
function formatCurrencyFull(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function MetricCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <Card className="border border-border/50">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-muted">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModalNovoLead({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [etapa, setEtapa] = useState<Etapa>("lead");
  const [valorMensal, setValorMensal] = useState("");
  const [origem, setOrigem] = useState<Origem>("outro");
  const [notas, setNotas] = useState("");

  const criar = trpc.crm.criarLead.useMutation({
    onSuccess: () => {
      toast.success("Lead criado com sucesso!");
      setOpen(false);
      onSuccess();
      setNome(""); setEmail(""); setTelefone(""); setEmpresa("");
      setEtapa("lead"); setValorMensal(""); setOrigem("outro"); setNotas("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Novo Lead</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" /></div>
            <div><Label>E-mail *</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" /></div>
            <div><Label>Empresa</Label><Input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Escritório" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Etapa</Label>
              <Select value={etapa} onValueChange={v => setEtapa(v as Etapa)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ETAPAS.slice(0, 4).map(e => <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={origem} onValueChange={v => setOrigem(v as Origem)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ORIGENS.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Valor Mensal (R$)</Label><Input type="number" value={valorMensal} onChange={e => setValorMensal(e.target.value)} placeholder="0,00" /></div>
          <div><Label>Notas</Label><Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} /></div>
          <Button className="w-full" disabled={criar.isPending || !nome || !email}
            onClick={() => criar.mutate({ nome, email, telefone: telefone || undefined, empresa: empresa || undefined, etapa, valorMensal: Math.round(parseFloat(valorMensal || "0") * 100), origem, notas: notas || undefined })}>
            {criar.isPending ? "Criando..." : "Criar Lead"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModalNovoContrato({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [nomeCliente, setNomeCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [plano, setPlano] = useState<"basico" | "profissional" | "enterprise">("basico");
  const [valorMensal, setValorMensal] = useState("");
  const [status, setStatus] = useState<StatusContrato>("ativo");
  const [notas, setNotas] = useState("");

  const criar = trpc.crm.criarContrato.useMutation({
    onSuccess: () => { toast.success("Contrato criado!"); setOpen(false); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2"><FileText className="w-4 h-4" /> Novo Contrato</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cliente *</Label><Input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Nome do cliente" /></div>
            <div><Label>E-mail *</Label><Input value={emailCliente} onChange={e => setEmailCliente(e.target.value)} placeholder="email@exemplo.com" /></div>
          </div>
          <div><Label>Empresa</Label><Input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Escritório / Empresa" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plano</Label>
              <Select value={plano} onValueChange={v => setPlano(v as typeof plano)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Mensal (R$) *</Label><Input type="number" value={valorMensal} onChange={e => setValorMensal(e.target.value)} placeholder="0,00" /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as StatusContrato)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_CONTRATO.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Notas</Label><Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} /></div>
          <Button className="w-full" disabled={criar.isPending || !nomeCliente || !emailCliente || !valorMensal}
            onClick={() => criar.mutate({ nomeCliente, emailCliente, empresa: empresa || undefined, plano, valorMensal: Math.round(parseFloat(valorMensal) * 100), status, notas: notas || undefined })}>
            {criar.isPending ? "Criando..." : "Criar Contrato"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FunilKanban({ leads, onRefresh }: { leads: any[]; onRefresh: () => void }) {
  const atualizar = trpc.crm.atualizarLead.useMutation({
    onSuccess: () => { toast.success("Lead atualizado!"); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {ETAPAS.map((etapa) => {
          const leadsEtapa = leads.filter((l) => l.etapa === etapa.key);
          const totalValor = leadsEtapa.reduce((s: number, l: any) => s + (l.valorMensal ?? 0), 0);
          return (
            <div key={etapa.key} className="w-52 flex-shrink-0">
              <div className={`rounded-t-lg border-t-2 border-x px-3 py-2 ${etapa.cor}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{etapa.label}</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{leadsEtapa.length}</Badge>
                </div>
                {totalValor > 0 && <p className="text-xs opacity-70 mt-0.5">{formatCurrency(totalValor)}/mês</p>}
              </div>
              <div className="border-x border-b rounded-b-lg min-h-32 p-2 space-y-2 bg-background">
                {leadsEtapa.map((lead: any) => (
                  <div key={lead.id} className="bg-card border border-border/60 rounded-md p-2.5 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-foreground truncate">{lead.nome}</p>
                    {lead.empresa && <p className="text-xs text-muted-foreground truncate">{lead.empresa}</p>}
                    {lead.valorMensal > 0 && <p className="text-xs text-green-600 font-medium mt-1">{formatCurrency(lead.valorMensal)}/mês</p>}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {ETAPAS.filter(e => e.key !== etapa.key).slice(0, 2).map(proxEtapa => (
                        <button key={proxEtapa.key}
                          className="text-xs px-1.5 py-0.5 rounded bg-muted hover:bg-accent transition-colors flex items-center gap-0.5"
                          onClick={() => atualizar.mutate({ id: lead.id, etapa: proxEtapa.key })}
                          title={`Mover para ${proxEtapa.label}`}>
                          <ChevronRight className="w-3 h-3" />{proxEtapa.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {leadsEtapa.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4 opacity-50">Nenhum lead</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabelaContratos({ contratos, onRefresh }: { contratos: any[]; onRefresh: () => void }) {
  const atualizar = trpc.crm.atualizarContrato.useMutation({
    onSuccess: () => { toast.success("Contrato atualizado!"); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });

  if (contratos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhum contrato cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground uppercase tracking-wide">
            <th className="text-left py-2 px-3 font-medium">Cliente</th>
            <th className="text-left py-2 px-3 font-medium">Plano</th>
            <th className="text-right py-2 px-3 font-medium">Valor/mês</th>
            <th className="text-left py-2 px-3 font-medium">Status</th>
            <th className="text-left py-2 px-3 font-medium">Início</th>
            <th className="text-left py-2 px-3 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {contratos.map((c: any) => {
            const statusInfo = STATUS_CONTRATO.find(s => s.key === c.status);
            return (
              <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="py-2.5 px-3">
                  <p className="font-medium text-foreground">{c.nomeCliente}</p>
                  <p className="text-xs text-muted-foreground">{c.emailCliente}</p>
                  {c.empresa && <p className="text-xs text-muted-foreground">{c.empresa}</p>}
                </td>
                <td className="py-2.5 px-3 capitalize">{c.plano}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-green-600">{formatCurrency(c.valorMensal)}</td>
                <td className="py-2.5 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo?.cor}`}>{statusInfo?.label}</span>
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {new Date(c.inicioEm).toLocaleDateString("pt-BR")}
                </td>
                <td className="py-2.5 px-3">
                  {c.status === "ativo" && (
                    <button className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      onClick={() => { if (confirm("Cancelar este contrato?")) atualizar.mutate({ id: c.id, status: "cancelado" }); }}>
                      Cancelar
                    </button>
                  )}
                  {c.status === "cancelado" && (
                    <button className="text-xs text-green-600 hover:text-green-700 transition-colors"
                      onClick={() => atualizar.mutate({ id: c.id, status: "ativo" })}>
                      Reativar
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GraficoBarras({ dados, labelMap }: { dados: { key: string; count: number }[]; labelMap: Record<string, string> }) {
  const max = Math.max(...dados.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      {dados.sort((a, b) => b.count - a.count).map(d => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-28 text-right flex-shrink-0">{labelMap[d.key] ?? d.key}</span>
          <div className="flex-1 bg-muted rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <span className="text-xs font-medium w-6 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function CRM() {
  const [, setLocation] = useLocation();
  const [aba, setAba] = useState<"funil" | "contratos" | "membros">("funil");

  const acessoQuery = trpc.crm.meuAcesso.useQuery();
  const leadsQuery = trpc.crm.listarLeads.useQuery(undefined, { enabled: acessoQuery.data?.acesso === true });
  const contratosQuery = trpc.crm.listarContratos.useQuery(undefined, { enabled: acessoQuery.data?.acesso === true });
  const metricasQuery = trpc.crm.metricas.useQuery(undefined, { enabled: acessoQuery.data?.acesso === true });
  const membrosQuery = trpc.crm.listarMembros.useQuery(undefined, { enabled: acessoQuery.data?.nivel === "admin" });
  const usuariosQuery = trpc.crm.listarUsuariosSistema.useQuery(undefined, { enabled: acessoQuery.data?.nivel === "admin" });

  const removerMembro = trpc.crm.removerMembro.useMutation({
    onSuccess: () => { toast.success("Membro removido."); membrosQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const adicionarMembro = trpc.crm.adicionarMembro.useMutation({
    onSuccess: () => { toast.success("Membro adicionado!"); membrosQuery.refetch(); setNovoMembroUserId(""); },
    onError: (e) => toast.error(e.message),
  });

  const [novoMembroUserId, setNovoMembroUserId] = useState("");
  const [novoMembroNivel, setNovoMembroNivel] = useState<"visualizador" | "editor" | "admin">("visualizador");

  if (acessoQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!acessoQuery.data?.acesso) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <Shield className="w-12 h-12 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-sm text-sm">Você não tem permissão para acessar o painel CRM. Solicite acesso ao administrador.</p>
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const metricas = metricasQuery.data;
  const leads = leadsQuery.data ?? [];
  const contratos = contratosQuery.data ?? [];
  const isAdmin = acessoQuery.data?.nivel === "admin";

  const origemLabels: Record<string, string> = { indicacao: "Indicação", organico: "Orgânico", redes_sociais: "Redes Sociais", email_marketing: "E-mail Mkt", evento: "Evento", outro: "Outro" };
  const etapaLabels: Record<string, string> = { lead: "Lead", contato: "Contato", demonstracao: "Demonstração", proposta: "Proposta", fechado_ganho: "Ganho", fechado_perdido: "Perdido" };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-semibold">CRM — Painel de Vendas</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModalNovoLead onSuccess={() => { leadsQuery.refetch(); metricasQuery.refetch(); }} />
            <ModalNovoContrato onSuccess={() => { contratosQuery.refetch(); metricasQuery.refetch(); }} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {metricas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="MRR" value={formatCurrencyFull(metricas.mrr)} sub={`${metricas.totalContratosAtivos} contratos ativos`} icon={DollarSign} color="text-green-600" />
            <MetricCard title="Churn Rate" value={`${metricas.churnRate}%`} sub="Cancelamentos no mês" icon={TrendingDown} color={metricas.churnRate > 5 ? "text-red-600" : "text-amber-600"} />
            <MetricCard title="LTV Médio" value={formatCurrencyFull(metricas.ltv)} sub="Estimativa 12 meses" icon={TrendingUp} color="text-blue-600" />
            <MetricCard title="Taxa de Conversão" value={`${metricas.taxaConversao}%`} sub={`${metricas.totalLeads} leads totais`} icon={Users} color="text-purple-600" />
          </div>
        )}

        {metricas && (metricas.leadsPorOrigem.length > 0 || metricas.leadsPorEtapa.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Leads por Origem</CardTitle></CardHeader>
              <CardContent>
                {metricas.leadsPorOrigem.length > 0
                  ? <GraficoBarras dados={metricas.leadsPorOrigem.map((l: any) => ({ key: l.origem, count: l.count }))} labelMap={origemLabels} />
                  : <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado disponível</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Distribuição por Etapa</CardTitle></CardHeader>
              <CardContent>
                {metricas.leadsPorEtapa.length > 0
                  ? <GraficoBarras dados={metricas.leadsPorEtapa.map((l: any) => ({ key: l.etapa, count: l.count }))} labelMap={etapaLabels} />
                  : <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado disponível</p>}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex gap-1 border-b">
          {[
            { key: "funil", label: "Funil de Vendas", count: leads.length },
            { key: "contratos", label: "Contratos", count: contratos.length },
            ...(isAdmin ? [{ key: "membros", label: "Membros CRM", count: undefined as number | undefined }] : []),
          ].map(tab => (
            <button key={tab.key}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${aba === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => setAba(tab.key as typeof aba)}>
              {tab.label}
              {tab.count !== undefined && <Badge variant="secondary" className="text-xs px-1.5 py-0">{tab.count}</Badge>}
            </button>
          ))}
        </div>

        {aba === "funil" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Funil de Vendas</h2>
              <Button variant="ghost" size="sm" onClick={() => leadsQuery.refetch()} className="gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> Atualizar
              </Button>
            </div>
            {leadsQuery.isLoading
              ? <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              : <FunilKanban leads={leads} onRefresh={() => { leadsQuery.refetch(); metricasQuery.refetch(); }} />}
          </div>
        )}

        {aba === "contratos" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contratos e Assinaturas</h2>
              <Button variant="ghost" size="sm" onClick={() => contratosQuery.refetch()} className="gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" /> Atualizar
              </Button>
            </div>
            <Card>
              <CardContent className="pt-4">
                {contratosQuery.isLoading
                  ? <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                  : <TabelaContratos contratos={contratos} onRefresh={() => { contratosQuery.refetch(); metricasQuery.refetch(); }} />}
              </CardContent>
            </Card>
          </div>
        )}

        {aba === "membros" && isAdmin && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Membros com Acesso ao CRM</h2>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Adicionar Membro</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-48">
                    <Label className="text-xs">Usuário do Sistema</Label>
                    <Select value={novoMembroUserId} onValueChange={setNovoMembroUserId}>
                      <SelectTrigger><SelectValue placeholder="Selecione um usuário..." /></SelectTrigger>
                      <SelectContent>
                        {(usuariosQuery.data ?? []).map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>{u.name ?? u.email} ({u.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-40">
                    <Label className="text-xs">Nível</Label>
                    <Select value={novoMembroNivel} onValueChange={v => setNovoMembroNivel(v as typeof novoMembroNivel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visualizador">Visualizador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin CRM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" className="gap-1.5" disabled={!novoMembroUserId || adicionarMembro.isPending}
                    onClick={() => adicionarMembro.mutate({ userId: parseInt(novoMembroUserId), nivel: novoMembroNivel })}>
                    <UserPlus className="w-4 h-4" /> Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                {membrosQuery.isLoading
                  ? <div className="flex justify-center py-4"><RefreshCw className="w-4 h-4 animate-spin" /></div>
                  : (membrosQuery.data ?? []).length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro adicionado ainda.</p>
                  : (
                    <div className="space-y-2">
                      {(membrosQuery.data ?? []).map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{m.usuario?.name ?? "Usuário"}</p>
                            <p className="text-xs text-muted-foreground">{m.usuario?.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize text-xs">{m.nivel}</Badge>
                            <button className="text-xs text-red-500 hover:text-red-700"
                              onClick={() => { if (confirm("Remover acesso deste membro?")) removerMembro.mutate({ id: m.id }); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
