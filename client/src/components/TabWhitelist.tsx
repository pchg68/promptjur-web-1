import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Shield,
  Plus,
  Trash2,
  Upload,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  Info,
  Mail,
  Download,
  Clock,
  CalendarDays,
  Eye,
} from "lucide-react";

/**
 * Painel de gestão da whitelist de acesso — AdminTools
 * Funcionalidades: adicionar/remover e-mails, importação em massa,
 * data de expiração por entrada, exportação CSV e envio de e-mail de boas-vindas.
 */
export default function TabWhitelist() {
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoExpira, setNovoExpira] = useState(""); // YYYY-MM-DD
  const [emailsImportar, setEmailsImportar] = useState("");
  const [expiraImportar, setExpiraImportar] = useState(""); // YYYY-MM-DD para importação em lote
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);

  const utils = trpc.useUtils();

  const { data: whitelist, isLoading, refetch } = trpc.admin.getWhitelist.useQuery();
  const { data: csvData, refetch: fetchCsv } = trpc.admin.exportWhitelistCsv.useQuery(
    undefined,
    { enabled: false } // só busca quando o usuário clicar
  );

  const addMutation = trpc.admin.addWhitelist.useMutation({
    onSuccess: (data) => {
      if (data.emailPulado) {
        toast.success("E-mail adicionado à whitelist", {
          description: "Configure RESEND_API_KEY para enviar e-mails automáticos",
        });
      } else if (data.emailEnviado) {
        toast.success("E-mail adicionado e boas-vindas enviado!", {
          description: "O usuário receberá o link de acesso por e-mail",
        });
      } else {
        toast.warning("E-mail adicionado, mas falha ao enviar boas-vindas", {
          description: "Verifique as configurações do Resend no painel",
        });
      }
      setNovoEmail("");
      setNovoNome("");
      setNovoExpira("");
      utils.admin.getWhitelist.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const removeMutation = trpc.admin.removeWhitelist.useMutation({
    onSuccess: () => {
      toast.success("E-mail removido da whitelist");
      utils.admin.getWhitelist.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const importMutation = trpc.admin.importWhitelist.useMutation({
    onSuccess: (data) => {
      if (data.emailsEnviados > 0) {
        toast.success(`${data.adicionados} e-mail(s) importados`, {
          description: `${data.emailsEnviados} e-mail(s) de boas-vindas enviados${data.emailsFalha > 0 ? `, ${data.emailsFalha} falha(s)` : ""}`,
        });
      } else if (data.emailsFalha > 0) {
        toast.warning(`${data.adicionados} e-mail(s) importados`, {
          description: `Falha ao enviar ${data.emailsFalha} e-mail(s) de boas-vindas`,
        });
      } else {
        toast.success(`${data.adicionados} e-mail(s) importados`, {
          description: "Configure RESEND_API_KEY para enviar e-mails automáticos",
        });
      }
      setEmailsImportar("");
      setExpiraImportar("");
      setMostrarImportar(false);
      utils.admin.getWhitelist.invalidate();
    },
    onError: (err) => toast.error(`Erro na importação: ${err.message}`),
  });

  // ── helpers ──────────────────────────────────────────────────────────────

  /** Converte "YYYY-MM-DD" para ISO datetime string (fim do dia UTC) */
  function dateToIso(dateStr: string): string | null {
    if (!dateStr) return null;
    return new Date(`${dateStr}T23:59:59Z`).toISOString();
  }

  /** Formata timestamp ISO para exibição amigável */
  function formatExpiry(iso: string | Date | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    const expired = d < now;
    const formatted = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    return expired ? `Expirado em ${formatted}` : `Expira em ${formatted}`;
  }

  function isExpired(iso: string | Date | null): boolean {
    if (!iso) return false;
    return new Date(iso) < new Date();
  }

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!novoEmail.trim()) return;
    addMutation.mutate({
      email: novoEmail.trim(),
      nome: novoNome.trim() || undefined,
      enviarEmail,
      expiresAt: dateToIso(novoExpira),
    });
  };

  const handleImport = () => {
    const emails = emailsImportar
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (emails.length === 0) {
      toast.error("Nenhum e-mail válido encontrado");
      return;
    }
    importMutation.mutate({
      emails,
      enviarEmail,
      expiresAt: dateToIso(expiraImportar),
    });
  };

  const handleExportCsv = async () => {
    const result = await fetchCsv();
    const csv = result.data?.csv;
    if (!csv) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whitelist_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`CSV exportado (${result.data?.total ?? 0} registros)`);
  };

  // ── dados ─────────────────────────────────────────────────────────────────

  const ativos = whitelist?.filter((w) => w.ativo && !isExpired(w.expiresAt)) ?? [];
  const expirados = whitelist?.filter((w) => w.ativo && isExpired(w.expiresAt)) ?? [];
  const inativos = whitelist?.filter((w) => !w.ativo) ?? [];

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Whitelist de Acesso</h3>
            <p className="text-slate-400 text-xs">
              Controle quais e-mails têm acesso durante a fase de testes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMostrarPrevia(true)}
            className="text-slate-400 hover:text-blue-400 gap-1 text-xs"
            title="Visualizar e-mail de boas-vindas"
          >
            <Eye className="w-4 h-4" />
            Prévia
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCsv}
            className="text-slate-400 hover:text-emerald-400 gap-1 text-xs"
            title="Exportar whitelist como CSV"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Aviso sobre feature flag */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-300 text-xs leading-relaxed">
          A whitelist só é aplicada quando a feature flag{" "}
          <code className="bg-amber-500/10 px-1 rounded">whitelist_ativa</code>{" "}
          estiver <strong>ativa</strong>. Gerencie-a na seção{" "}
          <strong>Feature Flags</strong> acima.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-slate-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{whitelist?.length ?? 0}</p>
          <p className="text-slate-400 text-xs">Total</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 text-center">
          <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-400">{ativos.length}</p>
          <p className="text-slate-400 text-xs">Ativos</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-orange-400">{expirados.length}</p>
          <p className="text-slate-400 text-xs">Expirados</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 text-center">
          <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-400">{inativos.length}</p>
          <p className="text-slate-400 text-xs">Removidos</p>
        </div>
      </div>

      {/* Toggle envio de e-mail */}
      <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-blue-400" />
          <div>
            <Label
              className="text-slate-200 text-sm font-medium cursor-pointer"
              htmlFor="toggle-email"
            >
              Enviar e-mail de boas-vindas
            </Label>
            <p className="text-slate-500 text-xs">
              Envia automaticamente o link de acesso ao adicionar e-mails
            </p>
          </div>
        </div>
        <Switch
          id="toggle-email"
          checked={enviarEmail}
          onCheckedChange={setEnviarEmail}
        />
      </div>

      {/* Formulário de adição */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 space-y-3">
        <p className="text-slate-300 text-sm font-medium">Adicionar e-mail</p>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="nome@exemplo.com"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 flex-1 min-w-40"
          />
          <Input
            placeholder="Nome (opcional)"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 w-36"
          />
          <div className="flex items-center gap-1.5 text-slate-400 text-xs w-44">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <Input
              type="date"
              value={novoExpira}
              onChange={(e) => setNovoExpira(e.target.value)}
              title="Data de expiração (opcional)"
              className="bg-slate-900/50 border-slate-700 text-white text-xs h-9 px-2"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={!novoEmail.trim() || addMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
        <p className="text-slate-600 text-xs">
          Deixe a data em branco para acesso permanente.
        </p>

        {/* Importação em massa */}
        <div>
          <button
            onClick={() => setMostrarImportar(!mostrarImportar)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            Importar múltiplos e-mails
          </button>
          {mostrarImportar && (
            <div className="mt-3 space-y-2">
              <textarea
                placeholder={"email1@exemplo.com\nemail2@exemplo.com\nemail3@exemplo.com"}
                value={emailsImportar}
                onChange={(e) => setEmailsImportar(e.target.value)}
                rows={4}
                className="w-full bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <Input
                  type="date"
                  value={expiraImportar}
                  onChange={(e) => setExpiraImportar(e.target.value)}
                  title="Data de expiração para todos os e-mails importados (opcional)"
                  className="bg-slate-900/50 border-slate-700 text-white text-xs h-8 px-2 w-40"
                />
                <p className="text-slate-500 text-xs">
                  Expiração para todos (opcional)
                </p>
              </div>
              <p className="text-slate-500 text-xs">
                Separe os e-mails por linha, vírgula ou ponto-e-vírgula
              </p>
              <Button
                onClick={handleImport}
                disabled={!emailsImportar.trim() || importMutation.isPending}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 gap-1"
              >
                <Upload className="w-3 h-3" />
                {importMutation.isPending ? "Importando..." : "Importar"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de e-mails ativos */}
      <div className="space-y-2">
        <p className="text-slate-400 text-xs uppercase tracking-wide font-medium">
          E-mails autorizados ({ativos.length})
        </p>

        {isLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Carregando...</div>
        ) : ativos.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Nenhum e-mail ativo na whitelist. Adicione o primeiro acima.
          </div>
        ) : (
          <div className="space-y-1">
            {ativos.map((item) => {
              const expiry = formatExpiry(item.expiresAt);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-800/30 border border-slate-700/20 rounded-lg px-4 py-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{item.email}</p>
                      {item.nome && (
                        <p className="text-slate-500 text-xs truncate">{item.nome}</p>
                      )}
                      {expiry && (
                        <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {expiry}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.adicionadoPor && (
                      <span className="text-slate-600 text-xs hidden group-hover:block">
                        por {item.adicionadoPor}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className="text-emerald-400 border-emerald-500/30 text-xs"
                    >
                      {item.expiresAt ? "Com expiração" : "Permanente"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMutation.mutate({ email: item.email })}
                      disabled={removeMutation.isPending}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* E-mails expirados */}
        {expirados.length > 0 && (
          <details className="mt-4">
            <summary className="text-orange-500 text-xs cursor-pointer hover:text-orange-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {expirados.length} e-mail(s) com acesso expirado
            </summary>
            <div className="mt-2 space-y-1">
              {expirados.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-800/20 border border-orange-500/10 rounded-lg px-4 py-2 opacity-60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-slate-300 text-sm truncate">{item.email}</p>
                      <p className="text-slate-500 text-xs">
                        {formatExpiry(item.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      addMutation.mutate({
                        email: item.email,
                        nome: item.nome ?? undefined,
                        expiresAt: null,
                      })
                    }
                    disabled={addMutation.isPending}
                    className="text-slate-500 hover:text-emerald-400 text-xs h-7"
                  >
                    Renovar
                  </Button>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* E-mails removidos (colapsável) */}
        {inativos.length > 0 && (
          <details className="mt-2">
            <summary className="text-slate-500 text-xs cursor-pointer hover:text-slate-400">
              {inativos.length} e-mail(s) removido(s)
            </summary>
            <div className="mt-2 space-y-1">
              {inativos.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-800/20 border border-slate-700/10 rounded-lg px-4 py-2 opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-slate-400 text-sm">{item.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      addMutation.mutate({
                        email: item.email,
                        nome: item.nome ?? undefined,
                      })
                    }
                    disabled={addMutation.isPending}
                    className="text-slate-500 hover:text-emerald-400 text-xs h-7"
                  >
                    Reativar
                  </Button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Modal de prévia do e-mail de boas-vindas */}
      <Dialog open={mostrarPrevia} onOpenChange={setMostrarPrevia}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0a1628] border-[#1e3a5f]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Prévia do E-mail de Boas-vindas
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Este é o e-mail enviado automaticamente ao adicionar um novo usuário à whitelist.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="bg-[#060d1a] border border-[#1e3a5f] rounded-lg p-3 text-xs text-slate-400 space-y-1">
              <p><span className="text-slate-500">De:</span> <span className="text-white">PromptJur &lt;onboarding@resend.dev&gt;</span></p>
              <p><span className="text-slate-500">Para:</span> <span className="text-white">nome@exemplo.com.br</span></p>
              <p><span className="text-slate-500">Assunto:</span> <span className="text-white">✅ [Nome], seu acesso ao PromptJur foi liberado!</span></p>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#1e3a5f]">
              <iframe
                srcDoc={getEmailPreviewHtml()}
                title="Prévia do e-mail"
                className="w-full"
                style={{ height: '520px', border: 'none' }}
                sandbox="allow-same-origin"
              />
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <p className="text-amber-300 text-xs">
                ⚠️ O remetente atual é <code className="bg-amber-500/10 px-1 rounded">onboarding@resend.dev</code> (domínio de teste).
                Para usar <code className="bg-amber-500/10 px-1 rounded">noreply@promptjur.com</code>, verifique o domínio no painel do Resend.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Gera o HTML de prévia do e-mail de boas-vindas (versão simplificada para iframe)
function getEmailPreviewHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background: #0a0f1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .container { max-width: 600px; margin: 0 auto; background: #0a0f1e; }
  .hero { background: linear-gradient(135deg, #1a3a6b 0%, #0d2040 50%, #0a0f1e 100%); padding: 40px 32px 32px; text-align: center; }
  .logo { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 8px; }
  .logo span { color: #60a5fa; }
  .tagline { color: #93c5fd; font-size: 13px; }
  .badge { display: inline-block; background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4); color: #93c5fd; font-size: 11px; padding: 4px 12px; border-radius: 20px; margin-top: 16px; }
  .body { padding: 32px; }
  .greeting { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
  .text { color: #94a3b8; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }
  .steps { background: #0f1f3d; border: 1px solid #1e3a5f; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .steps h3 { color: #60a5fa; font-size: 13px; font-weight: 600; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .step { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
  .step-num { width: 24px; height: 24px; background: #1d4ed8; border-radius: 50%; color: white; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-text { color: #cbd5e1; font-size: 13px; line-height: 1.5; }
  .cta { text-align: center; margin: 24px 0; }
  .btn { display: inline-block; background: linear-gradient(135deg, #1d4ed8, #1e40af); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; }
  .tip { background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05)); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 16px; margin: 20px 0; }
  .tip-title { color: #34d399; font-size: 12px; font-weight: 600; margin-bottom: 6px; }
  .tip-text { color: #6ee7b7; font-size: 13px; line-height: 1.5; }
  .footer { background: #060d1a; padding: 24px 32px; text-align: center; border-top: 1px solid #1e293b; }
  .footer p { color: #475569; font-size: 12px; margin: 4px 0; }
  .footer a { color: #60a5fa; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
  <div class="hero">
    <div class="logo">Prompt<span>Jur</span></div>
    <div class="tagline">Engenharia de Prompts Jurídicos com IA</div>
    <div class="badge">✨ Acesso Antecipado Liberado</div>
  </div>
  <div class="body">
    <div class="greeting">Olá, [Nome]! 🙌</div>
    <p class="text">Seu acesso ao <strong style="color:#60a5fa">PromptJur</strong> foi liberado! Você agora faz parte de um grupo seleto de profissionais jurídicos que estão moldando o futuro da advocacia com inteligência artificial.</p>
    <div class="steps">
      <h3>🚀 Primeiros Passos</h3>
      <div class="step"><div class="step-num">1</div><div class="step-text"><strong style="color:#e2e8f0">Acesse o Dashboard</strong> — clique no botão abaixo e faça login com sua conta</div></div>
      <div class="step"><div class="step-num">2</div><div class="step-text"><strong style="color:#e2e8f0">Explore os Prompts</strong> — navegue pela biblioteca de prompts jurídicos prontos para usar</div></div>
      <div class="step"><div class="step-num">3</div><div class="step-text"><strong style="color:#e2e8f0">Crie seus Prompts</strong> — personalize e salve seus próprios templates jurídicos</div></div>
    </div>
    <div class="cta"><a href="https://promptjur.com/dashboard" class="btn">🔑 Acessar o PromptJur</a></div>
    <div class="tip">
      <div class="tip-title">💡 Dica de Uso</div>
      <div class="tip-text">Use os prompts de <strong>petição inicial</strong> como ponto de partida. Eles já incluem a estrutura completa exigida pelo CPC e podem ser adaptados para qualquer área do direito em segundos.</div>
    </div>
    <p class="text" style="font-size:13px">Qualquer dúvida, responda este e-mail ou acesse nossa <a href="https://promptjur.com/contato" style="color:#60a5fa">página de contato</a>. Estamos aqui para ajudar!</p>
    <p class="text" style="font-size:13px">Com gratidão,<br><strong style="color:#e2e8f0">Equipe PromptJur</strong></p>
  </div>
  <div class="footer">
    <p>PromptJur &mdash; Engenharia de Prompts Jurídicos</p>
    <p><a href="https://promptjur.com">promptjur.com</a> &bull; <a href="https://promptjur.com/contato">Contato</a> &bull; <a href="https://promptjur.com/privacidade">Privacidade</a></p>
    <p style="margin-top:12px;color:#334155">Você recebeu este e-mail porque seu endereço foi adicionado à lista de acesso do PromptJur.</p>
  </div>
</div>
</body>
</html>`;
}
