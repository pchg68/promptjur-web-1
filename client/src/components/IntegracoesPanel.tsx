/**
 * Painel de Integrações — gerencia API Keys e conexões OAuth
 * Exibido na página de Configurações como seção recolhível
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Key,
  Link2,
  Unlink,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  HardDrive,
  Mail,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface IntegracaoInfo {
  provider: string;
  label: string;
  descricao: string;
  icon: React.ReactNode;
  tipo: "api_key" | "oauth";
  prefixo?: string;
  placeholder?: string;
  docUrl?: string;
  badge?: string;
}

const INTEGRACOES: IntegracaoInfo[] = [
  {
    provider: "openai",
    label: "OpenAI",
    descricao: "GPT-4o, GPT-4 Turbo, o1 — modelos de linguagem da OpenAI",
    icon: <span className="text-green-400 font-bold text-sm">GPT</span>,
    tipo: "api_key",
    prefixo: "sk-",
    placeholder: "sk-proj-...",
    docUrl: "https://platform.openai.com/api-keys",
    badge: "Recomendado",
  },
  {
    provider: "anthropic",
    label: "Anthropic Claude",
    descricao: "Claude 3.5 Sonnet, Claude 3 Opus — modelos de raciocínio jurídico",
    icon: <span className="text-orange-400 font-bold text-sm">Cl.</span>,
    tipo: "api_key",
    prefixo: "sk-ant-",
    placeholder: "sk-ant-api03-...",
    docUrl: "https://console.anthropic.com/settings/keys",
    badge: "Jurídico",
  },
  {
    provider: "gemini",
    label: "Google Gemini",
    descricao: "Gemini 1.5 Pro/Flash — janela de contexto de 1M tokens",
    icon: <span className="text-blue-400 font-bold text-sm">Gem</span>,
    tipo: "api_key",
    placeholder: "AIza...",
    docUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    provider: "perplexity",
    label: "Perplexity",
    descricao: "Sonar Pro — pesquisa jurídica em tempo real com citações",
    icon: <span className="text-purple-400 font-bold text-sm">Pplx</span>,
    tipo: "api_key",
    prefixo: "pplx-",
    placeholder: "pplx-...",
    docUrl: "https://www.perplexity.ai/settings/api",
    badge: "Pesquisa",
  },
  {
    provider: "google_drive",
    label: "Google Drive",
    descricao: "Exportar documentos diretamente para sua pasta PromptJur no Drive",
    icon: <HardDrive className="w-4 h-4 text-yellow-400" />,
    tipo: "oauth",
    badge: "OAuth",
  },
  {
    provider: "gmail",
    label: "Gmail",
    descricao: "Enviar documentos gerados por e-mail diretamente do PromptJur",
    icon: <Mail className="w-4 h-4 text-red-400" />,
    tipo: "oauth",
    badge: "OAuth",
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export function IntegracoesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [removingProvider, setRemovingProvider] = useState<string | null>(null);
  const [location] = useLocation();

  const utils = trpc.useUtils();

  const { data: integracoes, isLoading } = trpc.integracoes.listar.useQuery();

  const salvarApiKey = trpc.integracoes.salvarApiKey.useMutation({
    onSuccess: () => {
      toast.success("API Key salva com sucesso!");
      setEditingProvider(null);
      setApiKeyInput("");
      utils.integracoes.listar.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const remover = trpc.integracoes.remover.useMutation({
    onSuccess: () => {
      toast.success("Integração removida.");
      setRemovingProvider(null);
      utils.integracoes.listar.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const testar = trpc.integracoes.testarApiKey.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`✓ ${data.message}`);
      } else {
        toast.error(`✗ ${data.message}`);
      }
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  // Buscar URL de autorização Google
  const googleAuthDrive = trpc.integracoes.googleAuthUrl.useQuery(
    { provider: "google_drive" },
    { enabled: false }
  );
  const googleAuthGmail = trpc.integracoes.googleAuthUrl.useQuery(
    { provider: "gmail" },
    { enabled: false }
  );

  // Processar retorno do OAuth Google (query params na URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("google_success");
    const error = params.get("google_error");
    const email = params.get("email");

    if (success) {
      const label = success === "google_drive" ? "Google Drive" : "Gmail";
      toast.success(`${label} conectado com sucesso! (${email})`);
      setIsOpen(true);
      utils.integracoes.listar.invalidate();
      // Limpar query params da URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      toast.error(`Erro ao conectar Google: ${error}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnectGoogle = async (provider: "google_drive" | "gmail") => {
    try {
      let url: string | undefined;
      if (provider === "google_drive") {
        const result = await googleAuthDrive.refetch();
        url = result.data?.url;
      } else {
        const result = await googleAuthGmail.refetch();
        url = result.data?.url;
      }
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      toast.error(`Erro ao iniciar autenticação: ${err.message}`);
    }
  };

  const getIntegracaoStatus = (provider: string) => {
    return integracoes?.find((i) => i.provider === provider);
  };

  const connectedCount = integracoes?.filter((i) => i.isConnected).length ?? 0;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer group p-4 rounded-sm border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-colors bg-[#1a2332]/50">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#d4af37]" />
              <div>
                <h3 className="text-white font-semibold text-sm">Integrações de IA e Serviços</h3>
                <p className="text-gray-400 text-xs">
                  {isLoading
                    ? "Carregando..."
                    : connectedCount > 0
                    ? `${connectedCount} integração${connectedCount > 1 ? "ões" : ""} ativa${connectedCount > 1 ? "s" : ""}`
                    : "Nenhuma integração configurada"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connectedCount > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  {connectedCount} ativa{connectedCount > 1 ? "s" : ""}
                </Badge>
              )}
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2 space-y-2 p-1">
            {/* Aviso sobre Google OAuth */}
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-sm text-xs text-blue-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Para Google Drive e Gmail, é necessário configurar{" "}
                <code className="bg-blue-500/20 px-1 rounded">GOOGLE_CLIENT_ID</code> e{" "}
                <code className="bg-blue-500/20 px-1 rounded">GOOGLE_CLIENT_SECRET</code> nas
                configurações do servidor. Para API Keys, insira sua chave abaixo.
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {INTEGRACOES.map((info) => {
                  const status = getIntegracaoStatus(info.provider);
                  const isConnected = status?.isConnected ?? false;

                  return (
                    <div
                      key={info.provider}
                      className={`flex items-center justify-between p-3 rounded-sm border transition-colors ${
                        isConnected
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-[#d4af37]/10 bg-[#1a2332]/30"
                      }`}
                    >
                      {/* Info do provedor */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-sm bg-[#0a0e1a] flex items-center justify-center shrink-0">
                          {info.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">{info.label}</span>
                            {info.badge && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 h-4 border-[#d4af37]/30 text-[#d4af37]"
                              >
                                {info.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs truncate">{info.descricao}</p>
                          {isConnected && status?.email && (
                            <p className="text-green-400 text-xs">{status.email}</p>
                          )}
                          {isConnected && status?.apiKeyPreview && (
                            <p className="text-green-400 text-xs font-mono">{status.apiKeyPreview}</p>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isConnected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            {info.tipo === "api_key" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                                onClick={() => {
                                  setEditingProvider(info.provider);
                                  setApiKeyInput("");
                                }}
                              >
                                <Key className="w-3 h-3 mr-1" />
                                Alterar
                              </Button>
                            )}
                            {info.tipo === "api_key" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                                disabled={testar.isPending}
                                onClick={() =>
                                  testar.mutate({ provider: info.provider as any })
                                }
                              >
                                {testar.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Testar"
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                              onClick={() => setRemovingProvider(info.provider)}
                            >
                              <Unlink className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {info.tipo === "api_key" ? (
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/30"
                                onClick={() => {
                                  setEditingProvider(info.provider);
                                  setApiKeyInput("");
                                }}
                              >
                                <Key className="w-3 h-3 mr-1" />
                                Configurar
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/30"
                                disabled={!status?.isGoogleAvailable}
                                onClick={() =>
                                  handleConnectGoogle(info.provider as "google_drive" | "gmail")
                                }
                              >
                                <Link2 className="w-3 h-3 mr-1" />
                                {status?.isGoogleAvailable ? "Conectar" : "Indisponível"}
                              </Button>
                            )}
                            {info.docUrl && (
                              <a
                                href={info.docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-gray-300"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Dialog para inserir API Key */}
      <Dialog open={!!editingProvider} onOpenChange={(o) => !o && setEditingProvider(null)}>
        <DialogContent className="bg-[#1a2332] border-[#d4af37]/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#d4af37]">
              Configurar API Key —{" "}
              {INTEGRACOES.find((i) => i.provider === editingProvider)?.label}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Insira sua chave de API. Ela será armazenada de forma segura e usada para
              gerar documentos com este provedor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Link para obter a key */}
            {INTEGRACOES.find((i) => i.provider === editingProvider)?.docUrl && (
              <a
                href={INTEGRACOES.find((i) => i.provider === editingProvider)?.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-3 h-3" />
                Obter API Key no painel do provedor
              </a>
            )}

            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    INTEGRACOES.find((i) => i.provider === editingProvider)?.placeholder ??
                    "Cole sua API Key aqui"
                  }
                  className="bg-[#0a0e1a] border-[#d4af37]/20 text-white pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {INTEGRACOES.find((i) => i.provider === editingProvider)?.prefixo && (
                <p className="text-xs text-gray-500">
                  Deve começar com{" "}
                  <code className="bg-[#0a0e1a] px-1 rounded text-[#d4af37]">
                    {INTEGRACOES.find((i) => i.provider === editingProvider)?.prefixo}
                  </code>
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingProvider(null)}
              className="border-[#d4af37]/20 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!editingProvider || !apiKeyInput.trim()) return;
                salvarApiKey.mutate({
                  provider: editingProvider as any,
                  apiKey: apiKeyInput.trim(),
                });
              }}
              disabled={!apiKeyInput.trim() || salvarApiKey.isPending}
              className="bg-[#d4af37] hover:bg-[#b8962e] text-black"
            >
              {salvarApiKey.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              Salvar API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de remoção */}
      <AlertDialog open={!!removingProvider} onOpenChange={(o) => !o && setRemovingProvider(null)}>
        <AlertDialogContent className="bg-[#1a2332] border-[#d4af37]/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover integração?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              A API Key ou token OAuth de{" "}
              <strong className="text-white">
                {INTEGRACOES.find((i) => i.provider === removingProvider)?.label}
              </strong>{" "}
              será removida. Você poderá reconectar a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#d4af37]/20 text-gray-300 bg-transparent">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removingProvider) {
                  remover.mutate({ provider: removingProvider as any });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {remover.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Unlink className="w-4 h-4 mr-2" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
