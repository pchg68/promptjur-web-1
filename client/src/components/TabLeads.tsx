/**
 * TabLeads — Painel de gerenciamento de leads Enterprise
 * Exibe formulários de contato do Plano Escritório com filtros e ações de status
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Mail,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw,
  CheckCircle,
  Phone,
  Clock,
  XCircle,
  TrendingUp,
  Filter,
} from "lucide-react";

type LeadStatus = "pendente" | "contatado" | "convertido" | "descartado";
type StatusFilter = LeadStatus | "todos";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: {
    label: "Pendente",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    icon: <Clock className="w-3 h-3" />,
  },
  contatado: {
    label: "Contatado",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon: <Phone className="w-3 h-3" />,
  },
  convertido: {
    label: "Convertido",
    color: "bg-green-500/10 text-green-400 border-green-500/30",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  descartado: {
    label: "Descartado",
    color: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: <XCircle className="w-3 h-3" />,
  },
};

interface Lead {
  id: number;
  nome: string;
  email: string;
  escritorio: string;
  numeroAdvogados: string;
  areasPrincipais: string | null;
  mensagem: string | null;
  status: LeadStatus;
  notasInternas: string | null;
  contatadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

interface UpdateModalProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: (id: number, status: LeadStatus, notas?: string) => void;
  isLoading: boolean;
}

function UpdateModal({ lead, onClose, onUpdate, isLoading }: UpdateModalProps) {
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? "pendente");
  const [notas, setNotas] = useState(lead?.notasInternas ?? "");

  if (!lead) return null;

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0f1923] border-[#1e3a5f]">
        <DialogHeader>
          <DialogTitle className="text-white">Atualizar Lead</DialogTitle>
          <DialogDescription className="text-gray-400">
            {lead.escritorio} — {lead.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info do lead */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>{lead.numeroAdvogados} advogados</span>
            </div>
            {lead.areasPrincipais && (
              <div className="col-span-2 flex items-start gap-2 text-sm text-gray-300">
                <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>{lead.areasPrincipais}</span>
              </div>
            )}
            {lead.mensagem && (
              <div className="col-span-2 flex items-start gap-2 text-sm text-gray-300">
                <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="italic">{lead.mensagem}</span>
              </div>
            )}
          </div>

          {/* Novo status */}
          <div className="space-y-2">
            <Label className="text-gray-300">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger className="bg-[#1a2332] border-[#1e3a5f] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#1e3a5f]">
                <SelectItem value="pendente" className="text-yellow-400">Pendente</SelectItem>
                <SelectItem value="contatado" className="text-blue-400">Contatado</SelectItem>
                <SelectItem value="convertido" className="text-green-400">Convertido</SelectItem>
                <SelectItem value="descartado" className="text-red-400">Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas internas */}
          <div className="space-y-2">
            <Label className="text-gray-300">Notas Internas</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observações sobre o contato, negociação, etc."
              className="bg-[#1a2332] border-[#1e3a5f] text-white placeholder:text-gray-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1e3a5f] text-gray-300">
            Cancelar
          </Button>
          <Button
            onClick={() => onUpdate(lead.id, status, notas || undefined)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TabLeads() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const leadsQuery = trpc.admin.getLeads.useQuery({ status: statusFilter });
  const utils = trpc.useUtils();

  const updateStatusMutation = trpc.admin.updateLeadStatus.useMutation({
    onSuccess: () => {
      toast.success("Lead atualizado com sucesso!");
      setSelectedLead(null);
      utils.admin.getLeads.invalidate();
    },
    onError: (err) => {
      toast.error("Erro ao atualizar lead: " + err.message);
    },
  });

  const leads = (leadsQuery.data?.leads ?? []) as Lead[];
  const totalPendentes = leadsQuery.data?.totalPendentes ?? 0;

  const handleUpdate = (id: number, status: LeadStatus, notasInternas?: string) => {
    updateStatusMutation.mutate({ id, status, notasInternas });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Summary cards
  const counts = {
    pendente: leads.filter((l) => l.status === "pendente").length,
    contatado: leads.filter((l) => l.status === "contatado").length,
    convertido: leads.filter((l) => l.status === "convertido").length,
    descartado: leads.filter((l) => l.status === "descartado").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Leads Enterprise
            {totalPendentes > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ml-1">
                {totalPendentes} pendente{totalPendentes !== 1 ? "s" : ""}
              </Badge>
            )}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Formulários de contato do Plano Escritório para gestão comercial
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => leadsQuery.refetch()}
          disabled={leadsQuery.isFetching}
          className="border-[#1e3a5f] text-gray-300 hover:bg-[#1a2332]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${leadsQuery.isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary cards - only shown when filter is "todos" */}
      {statusFilter === "todos" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]).map(
            ([key, cfg]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className="p-3 rounded-lg bg-[#1a2332] border border-[#1e3a5f] hover:border-blue-500/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{counts[key]}</div>
              </button>
            )
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-48 bg-[#1a2332] border-[#1e3a5f] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2332] border-[#1e3a5f]">
            <SelectItem value="todos" className="text-white">Todos os leads</SelectItem>
            <SelectItem value="pendente" className="text-yellow-400">Pendentes</SelectItem>
            <SelectItem value="contatado" className="text-blue-400">Contatados</SelectItem>
            <SelectItem value="convertido" className="text-green-400">Convertidos</SelectItem>
            <SelectItem value="descartado" className="text-red-400">Descartados</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-400">
          {leads.length} lead{leads.length !== 1 ? "s" : ""} encontrado{leads.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Leads list */}
      {leadsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhum lead encontrado</p>
          <p className="text-sm mt-1">
            {statusFilter === "todos"
              ? "Os formulários de contato do Plano Escritório aparecerão aqui."
              : `Nenhum lead com status "${STATUS_CONFIG[statusFilter as LeadStatus]?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const cfg = STATUS_CONFIG[lead.status];
            return (
              <Card
                key={lead.id}
                className="bg-[#1a2332] border-[#1e3a5f] hover:border-blue-500/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{lead.escritorio}</span>
                        <span
                          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-500" />
                          {lead.nome}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-blue-400 hover:underline truncate"
                          >
                            {lead.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-500" />
                          {lead.numeroAdvogados} advogados
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {formatDate(lead.criadoEm)}
                        </div>
                      </div>

                      {lead.areasPrincipais && (
                        <p className="mt-2 text-xs text-gray-400">
                          <span className="font-medium text-gray-300">Áreas: </span>
                          {lead.areasPrincipais}
                        </p>
                      )}
                      {lead.mensagem && (
                        <p className="mt-1.5 text-xs text-gray-400 italic line-clamp-2">
                          "{lead.mensagem}"
                        </p>
                      )}
                      {lead.notasInternas && (
                        <p className="mt-1.5 text-xs text-blue-300 bg-blue-500/10 rounded px-2 py-1">
                          <span className="font-medium">Nota: </span>
                          {lead.notasInternas}
                        </p>
                      )}
                    </div>

                    {/* Right: action */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLead(lead)}
                      className="border-[#1e3a5f] text-gray-300 hover:bg-[#0f1923] flex-shrink-0"
                    >
                      <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                      Atualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update modal */}
      <UpdateModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleUpdate}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}
