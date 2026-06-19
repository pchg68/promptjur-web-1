/**
 * AdminOntologia.tsx
 * Painel admin para gerenciar nós da ontologia jurídica (JurisOS).
 *
 * Funcionalidades:
 * - Listar tipos de peça, teses e precedentes com status
 * - Alterar status de qualquer nó (setStatus)
 * - Criar nova tese (createTese)
 * - Validar precedente (validarPrecedente)
 * - Vincular tese a precedente (linkTesePrecedente)
 *
 * Requer: usuário com role = admin
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Scale, Plus, CheckCircle2, RefreshCw, Link2 } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StatusOnt = "RASCUNHO" | "REVISAO" | "PUBLICADO";
type EntidadeOnt = "tipoPeca" | "tese" | "precedente";

const STATUS_BADGE: Record<StatusOnt, { label: string; variant: "default" | "secondary" | "outline" }> = {
  RASCUNHO:  { label: "Rascunho",   variant: "secondary" },
  REVISAO:   { label: "Em revisão", variant: "outline" },
  PUBLICADO: { label: "Publicado",  variant: "default" },
};

// ─── Sub-componente: linha de nó ──────────────────────────────────────────────

function NoRow({
  id, nome, status, extra, entidade, onStatusChange,
}: {
  id: number;
  nome: string;
  status: StatusOnt;
  extra?: string;
  entidade: EntidadeOnt;
  onStatusChange: (id: number, entidade: EntidadeOnt, novoStatus: StatusOnt) => void;
}) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.RASCUNHO;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{nome}</p>
        {extra && <p className="text-xs text-muted-foreground truncate">{extra}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(id, entidade, v as StatusOnt)}
        >
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RASCUNHO">Rascunho</SelectItem>
            <SelectItem value="REVISAO">Em revisão</SelectItem>
            <SelectItem value="PUBLICADO">Publicado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminOntologia() {
  const [expandido, setExpandido] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"tiposPeca" | "teses" | "precedentes">("tiposPeca");

  // Dialogs
  const [showCriarTese, setShowCriarTese] = useState(false);
  const [showValidarPrec, setShowValidarPrec] = useState(false);
  const [showLinkTese, setShowLinkTese] = useState(false);

  // Form: criar tese
  const [novaTeseEnunciado, setNovaTeseEnunciado] = useState("");

  // Form: validar precedente
  const [precId, setPrecId] = useState<number | "">("");
  const [precUrl, setPrecUrl] = useState("");

  // Form: link tese-precedente
  const [linkTeseId, setLinkTeseId] = useState<number | "">("");
  const [linkPrecId, setLinkPrecId] = useState<number | "">("");
  const [linkPeso, setLinkPeso] = useState<number>(1);

  const utils = trpc.useUtils();

  // ── Queries (3 separadas, pois adminListarTodos exige entidade) ──────────────
  const { data: listaTipos, isLoading: loadTipos } = trpc.ontologia.adminListarTodos.useQuery(
    { entidade: "tiposPeca" }, { enabled: expandido && abaAtiva === "tiposPeca", staleTime: 30_000 }
  );
  const { data: listaTeses, isLoading: loadTeses } = trpc.ontologia.adminListarTodos.useQuery(
    { entidade: "teses" }, { enabled: expandido && abaAtiva === "teses", staleTime: 30_000 }
  );
  const { data: listaPrecs, isLoading: loadPrecs } = trpc.ontologia.adminListarTodos.useQuery(
    { entidade: "precedentes" }, { enabled: expandido && abaAtiva === "precedentes", staleTime: 30_000 }
  );

  // Contadores para o badge do cabeçalho (carregados quando expandido)
  const { data: contTipos } = trpc.ontologia.adminListarTodos.useQuery(
    { entidade: "tiposPeca" }, { enabled: expandido, staleTime: 60_000 }
  );
  const { data: contTeses } = trpc.ontologia.adminListarTodos.useQuery(
    { entidade: "teses" }, { enabled: expandido, staleTime: 60_000 }
  );
  const { data: contPrecs } = trpc.ontologia.adminListarTodos.useQuery(
    { entidade: "precedentes" }, { enabled: expandido, staleTime: 60_000 }
  );

  const isLoading = (abaAtiva === "tiposPeca" && loadTipos)
    || (abaAtiva === "teses" && loadTeses)
    || (abaAtiva === "precedentes" && loadPrecs);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const invalidarTudo = () => {
    utils.ontologia.adminListarTodos.invalidate();
    utils.ontologia.listTiposPeca.invalidate();
  };

  const setStatusMutation = trpc.ontologia.setStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Status atualizado para ${vars.status}`);
      invalidarTudo();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const criarTeseMutation = trpc.ontologia.createTese.useMutation({
    onSuccess: () => {
      toast.success("Tese criada com sucesso");
      setShowCriarTese(false);
      setNovaTeseEnunciado("");
      invalidarTudo();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const validarPrecMutation = trpc.ontologia.validarPrecedente.useMutation({
    onSuccess: () => {
      toast.success("Precedente validado (axioma A1 liberado)");
      setShowValidarPrec(false);
      setPrecId("");
      setPrecUrl("");
      invalidarTudo();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const linkTeseMutation = trpc.ontologia.linkTesePrecedente.useMutation({
    onSuccess: (data) => {
      toast.success(data.action === "updated" ? "Vínculo atualizado" : "Vínculo criado");
      setShowLinkTese(false);
      setLinkTeseId("");
      setLinkPrecId("");
      setLinkPeso(1);
      invalidarTudo();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleStatusChange = (id: number, entidade: EntidadeOnt, novoStatus: StatusOnt) => {
    setStatusMutation.mutate({ id, entidade, status: novoStatus });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpandido((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Ontologia Jurídica (JurisOS)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {expandido && contTipos && contTeses && contPrecs && (
              <Badge variant="outline" className="text-xs">
                {(contTipos as unknown[]).length} tipos · {(contTeses as unknown[]).length} teses · {(contPrecs as unknown[]).length} precedentes
              </Badge>
            )}
            {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
        <CardDescription>
          Gerencie os nós da ontologia: tipos de peça, teses e precedentes verificados.
        </CardDescription>
      </CardHeader>

      {expandido && (
        <CardContent className="space-y-4">
          {/* Barra de ações */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowCriarTese(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova tese
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowValidarPrec(true)}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Validar precedente
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowLinkTese(true)}>
              <Link2 className="w-4 h-4 mr-1" /> Vincular tese-precedente
            </Button>
            <Button size="sm" variant="ghost" onClick={invalidarTudo}>
              <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
            </Button>
          </div>

          {/* Abas */}
          <div className="flex gap-1 border-b border-border">
            {(["tiposPeca", "teses", "precedentes"] as const).map((aba) => (
              <button
                key={aba}
                onClick={() => setAbaAtiva(aba)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  abaAtiva === aba
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {aba === "tiposPeca" ? "Tipos de Peça" : aba === "teses" ? "Teses" : "Precedentes"}
              </button>
            ))}
          </div>

          {/* Conteúdo da aba */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <RefreshCw className="w-4 h-4 animate-spin" /> Carregando…
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto pr-1">
              {abaAtiva === "tiposPeca" && (
                !listaTipos || (listaTipos as unknown[]).length === 0
                  ? <p className="text-sm text-muted-foreground py-2">Nenhum tipo de peça cadastrado.</p>
                  : (listaTipos as { id: number; nome: string; sigla: string | null; status: StatusOnt; areaId: number }[]).map((t) => (
                    <NoRow
                      key={t.id}
                      id={t.id}
                      nome={t.nome}
                      status={t.status}
                      extra={t.sigla ? `Sigla: ${t.sigla} · Área ID: ${t.areaId}` : `Área ID: ${t.areaId}`}
                      entidade="tipoPeca"
                      onStatusChange={handleStatusChange}
                    />
                  ))
              )}

              {abaAtiva === "teses" && (
                !listaTeses || (listaTeses as unknown[]).length === 0
                  ? <p className="text-sm text-muted-foreground py-2">Nenhuma tese cadastrada.</p>
                  : (listaTeses as { id: number; enunciado: string; status: StatusOnt }[]).map((t) => (
                    <NoRow
                      key={t.id}
                      id={t.id}
                      nome={t.enunciado.length > 80 ? t.enunciado.substring(0, 80) + "…" : t.enunciado}
                      status={t.status}
                      entidade="tese"
                      onStatusChange={handleStatusChange}
                    />
                  ))
              )}

              {abaAtiva === "precedentes" && (
                !listaPrecs || (listaPrecs as unknown[]).length === 0
                  ? <p className="text-sm text-muted-foreground py-2">Nenhum precedente cadastrado.</p>
                  : (listaPrecs as { id: number; identificador: string; tribunal: string; status: StatusOnt; verificadoEm: Date | null; vinculante: boolean }[]).map((p) => (
                    <NoRow
                      key={p.id}
                      id={p.id}
                      nome={`${p.tribunal} — ${p.identificador}`}
                      status={p.status}
                      extra={[
                        p.vinculante ? "VINCULANTE" : null,
                        p.verificadoEm
                          ? `Verificado em ${new Date(p.verificadoEm).toLocaleDateString("pt-BR")}`
                          : "⚠ Não verificado (axioma A1)",
                      ].filter(Boolean).join(" · ")}
                      entidade="precedente"
                      onStatusChange={handleStatusChange}
                    />
                  ))
              )}
            </div>
          )}

          {/* Resumo de publicação */}
          {contTipos && contTeses && contPrecs && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              {([
                { lista: contTipos as { status: StatusOnt }[], label: "Tipos publicados" },
                { lista: contTeses as { status: StatusOnt }[], label: "Teses publicadas" },
                { lista: contPrecs as { status: StatusOnt }[], label: "Precedentes publicados" },
              ]).map(({ lista, label }) => {
                const pub = lista.filter(n => n.status === "PUBLICADO").length;
                return (
                  <div key={label} className="text-center">
                    <p className="text-lg font-bold text-primary">{pub}/{lista.length}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}

      {/* ── Dialog: Criar Tese ────────────────────────────────────────────── */}
      <Dialog open={showCriarTese} onOpenChange={setShowCriarTese}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tese Jurídica</DialogTitle>
            <DialogDescription>
              Crie uma tese que será vinculada a tipos de peça e precedentes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Enunciado da tese *</Label>
              <Textarea
                placeholder="Ex.: É cabível o REsp quando há violação de lei federal, conforme art. 105, III, a, da CF/88."
                value={novaTeseEnunciado}
                onChange={(e) => setNovaTeseEnunciado(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCriarTese(false)}>Cancelar</Button>
            <Button
              disabled={novaTeseEnunciado.trim().length < 8 || criarTeseMutation.isPending}
              onClick={() => criarTeseMutation.mutate({ enunciado: novaTeseEnunciado.trim() })}
            >
              {criarTeseMutation.isPending ? "Criando…" : "Criar tese"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Validar Precedente ────────────────────────────────────── */}
      <Dialog open={showValidarPrec} onOpenChange={setShowValidarPrec}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validar Precedente (Axioma A1)</DialogTitle>
            <DialogDescription>
              Informe o ID do precedente e a URL oficial de verificação. Isso define <code>verificadoEm</code> e habilita o axioma A1.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ID do precedente *</Label>
              <Input
                type="number"
                placeholder="Ex.: 3"
                value={precId === "" ? "" : precId}
                onChange={(e) => setPrecId(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>URL oficial de verificação *</Label>
              <Input
                placeholder="https://stj.jus.br/…"
                value={precUrl}
                onChange={(e) => setPrecUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidarPrec(false)}>Cancelar</Button>
            <Button
              disabled={precId === "" || !precUrl.trim() || validarPrecMutation.isPending}
              onClick={() => validarPrecMutation.mutate({ precedenteId: precId as number, urlOficial: precUrl.trim() })}
            >
              {validarPrecMutation.isPending ? "Validando…" : "Validar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Vincular Tese-Precedente ─────────────────────────────── */}
      <Dialog open={showLinkTese} onOpenChange={setShowLinkTese}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Tese a Precedente</DialogTitle>
            <DialogDescription>
              Cria a aresta tese→precedente no grafo da ontologia (axioma A2).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ID da tese *</Label>
              <Input
                type="number"
                placeholder="Ex.: 1"
                value={linkTeseId === "" ? "" : linkTeseId}
                onChange={(e) => setLinkTeseId(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>ID do precedente *</Label>
              <Input
                type="number"
                placeholder="Ex.: 3"
                value={linkPrecId === "" ? "" : linkPrecId}
                onChange={(e) => setLinkPrecId(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Peso do vínculo (1–5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={linkPeso}
                onChange={(e) => setLinkPeso(Math.min(5, Math.max(1, Number(e.target.value))))}
              />
              <p className="text-xs text-muted-foreground">
                Precedentes com maior peso são priorizados no contexto do LLM (axioma A5).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkTese(false)}>Cancelar</Button>
            <Button
              disabled={linkTeseId === "" || linkPrecId === "" || linkTeseMutation.isPending}
              onClick={() =>
                linkTeseMutation.mutate({
                  teseId: linkTeseId as number,
                  precedenteId: linkPrecId as number,
                  peso: linkPeso,
                })
              }
            >
              {linkTeseMutation.isPending ? "Vinculando…" : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
