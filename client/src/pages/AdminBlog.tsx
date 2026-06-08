import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  PenLine, Trash2, Eye, EyeOff, Star, StarOff, Plus, Search,
  ArrowLeft, BookOpen, ExternalLink, BarChart2, Clock, RefreshCw,
  Link2, Loader2,
} from "lucide-react";

const CATEGORIAS: Record<string, string> = {
  "engenharia-de-prompts": "Engenharia de Prompts",
  "ia-juridica": "IA Jurídica",
  "dicas-praticas": "Dicas Práticas",
  "legislacao-e-regulamentacao": "Legislação",
  "casos-de-uso": "Casos de Uso",
  "ferramentas": "Ferramentas",
};

const COR_CATEGORIA: Record<string, string> = {
  "engenharia-de-prompts": "bg-blue-900/40 text-blue-300 border-blue-700",
  "ia-juridica": "bg-purple-900/40 text-purple-300 border-purple-700",
  "dicas-praticas": "bg-green-900/40 text-green-300 border-green-700",
  "legislacao-e-regulamentacao": "bg-amber-900/40 text-amber-300 border-amber-700",
  "casos-de-uso": "bg-cyan-900/40 text-cyan-300 border-cyan-700",
  "ferramentas": "bg-rose-900/40 text-rose-300 border-rose-700",
};

export default function AdminBlog() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [filtroPublicado, setFiltroPublicado] = useState<string>("todos");
  const [pagina, setPagina] = useState(0);
  const [excluirId, setExcluirId] = useState<number | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"artigos" | "links" | "integracoes">("artigos");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSalvo, setWebhookSalvo] = useState(false);

  const LIMITE = 15;

  const { data, isLoading, refetch } = trpc.blog.adminListar.useQuery({
    busca: busca || undefined,
    categoria: categoria !== "todas" ? categoria : undefined,
    publicado: filtroPublicado === "publicados" ? true : filtroPublicado === "rascunhos" ? false : undefined,
    limite: LIMITE,
    offset: pagina * LIMITE,
  }, { enabled: !!user && user.role === "admin" });

  const { data: links, refetch: refetchLinks } = trpc.blog.adminListarLinks.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" && abaAtiva === "links" }
  );

  const { data: webhookData } = trpc.blog.obterWebhook.useQuery(undefined, {
    enabled: !!user && user.role === "admin" && abaAtiva === "integracoes",
  });

  // Preencher campo com URL salva ao carregar
  useEffect(() => {
    if (webhookData?.webhookUrl && !webhookUrl) {
      setWebhookUrl(webhookData.webhookUrl);
    }
  }, [webhookData]);

  const salvarWebhookMutation = trpc.blog.salvarWebhook.useMutation({
    onSuccess: () => { setWebhookSalvo(true); toast.success("Webhook salvo com sucesso!"); setTimeout(() => setWebhookSalvo(false), 3000); },
    onError: () => toast.error("Erro ao salvar webhook"),
  });

  const testarWebhookMutation = trpc.blog.testarWebhook.useMutation({
    onSuccess: () => toast.success("Webhook disparado! Verifique o Zapier/Make."),
    onError: () => toast.error("Erro ao testar webhook — verifique a URL"),
  });

  const togglePublicado = trpc.blog.togglePublicado.useMutation({
    onSuccess: () => { utils.blog.adminListar.invalidate(); toast.success("Status atualizado"); },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const toggleDestaque = trpc.blog.toggleDestaque.useMutation({
    onSuccess: () => { utils.blog.adminListar.invalidate(); toast.success("Destaque atualizado"); },
    onError: () => toast.error("Erro ao atualizar destaque"),
  });

  const excluirMutation = trpc.blog.excluir.useMutation({
    onSuccess: () => {
      utils.blog.adminListar.invalidate();
      toast.success("Artigo excluído com sucesso");
      setExcluirId(null);
    },
    onError: () => toast.error("Erro ao excluir artigo"),
  });

  const excluirLink = trpc.blog.excluirLink.useMutation({
    onSuccess: () => { utils.blog.adminListarLinks.invalidate(); toast.success("Link excluído"); },
    onError: () => toast.error("Erro ao excluir link"),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold">Acesso restrito a administradores.</p>
          <Button variant="ghost" className="mt-4 text-gray-400" onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const total = data?.total ?? 0;
  const totalPaginas = Math.ceil(total / LIMITE);

  function handleBuscar() {
    setBusca(buscaInput);
    setPagina(0);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => navigate("/admin-tools")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Admin
            </Button>
            <span className="text-gray-600">/</span>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-bold text-white">Gerenciar Blog</h1>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin-blog/novo")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Artigo
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Abas */}
        <div className="flex gap-1 mb-6 border-b border-gray-800">
          <button
            onClick={() => setAbaAtiva("artigos")}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              abaAtiva === "artigos"
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Artigos ({total})
          </button>
          <button
            onClick={() => setAbaAtiva("links")}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              abaAtiva === "links"
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Link2 className="w-4 h-4 inline mr-2" />
            Links Externos ({links?.length ?? 0})
          </button>
          <button
            onClick={() => setAbaAtiva("integracoes")}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              abaAtiva === "integracoes"
                ? "bg-gray-800 text-white border-b-2 border-green-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Integrações
          </button>
        </div>

        {/* ABA ARTIGOS */}
        {abaAtiva === "artigos" && (
          <>
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex gap-2 flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por título ou slug..."
                  value={buscaInput}
                  onChange={e => setBuscaInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleBuscar()}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <Button onClick={handleBuscar} variant="outline" size="icon" className="border-gray-700 text-gray-300 hover:bg-gray-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <Select value={categoria} onValueChange={v => { setCategoria(v); setPagina(0); }}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {Object.entries(CATEGORIAS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroPublicado} onValueChange={v => { setFiltroPublicado(v); setPagina(0); }}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="publicados">Publicados</SelectItem>
                  <SelectItem value="rascunhos">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => refetch()} className="text-gray-400 hover:text-white border border-gray-700">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabela */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : !data?.posts.length ? (
              <div className="text-center py-20 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum artigo encontrado.</p>
                <Button
                  onClick={() => navigate("/admin-blog/novo")}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> Criar primeiro artigo
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">Artigo</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Categoria</th>
                      <th className="text-center px-3 py-3 font-medium hidden sm:table-cell">
                        <BarChart2 className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="text-center px-3 py-3 font-medium">Status</th>
                      <th className="text-center px-3 py-3 font-medium">Destaque</th>
                      <th className="text-right px-4 py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {data.posts.map(post => (
                      <tr key={post.id} className="bg-gray-900/50 hover:bg-gray-800/60 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-white line-clamp-1">{post.titulo}</p>
                            <p className="text-gray-500 text-xs mt-0.5 font-mono">{post.slug}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${COR_CATEGORIA[post.categoria] ?? "bg-gray-800 text-gray-300 border-gray-700"}`}>
                            {CATEGORIAS[post.categoria] ?? post.categoria}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center hidden sm:table-cell">
                          <span className="text-gray-400 text-xs flex items-center justify-center gap-1">
                            <Eye className="w-3 h-3" /> {post.visualizacoes ?? 0}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => togglePublicado.mutate({ id: post.id, publicado: !post.publicado })}
                            disabled={togglePublicado.isPending}
                            title={post.publicado ? "Despublicar" : "Publicar"}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors"
                            style={{
                              background: post.publicado ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)",
                              color: post.publicado ? "#4ade80" : "#9ca3af",
                              border: `1px solid ${post.publicado ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.3)"}`,
                            }}
                          >
                            {post.publicado ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {post.publicado ? "Publicado" : "Rascunho"}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => toggleDestaque.mutate({ id: post.id, destaque: !post.destaque })}
                            disabled={toggleDestaque.isPending}
                            title={post.destaque ? "Remover destaque" : "Marcar destaque"}
                            className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                          >
                            {post.destaque
                              ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              : <StarOff className="w-4 h-4 text-gray-600" />
                            }
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-blue-400 hover:bg-gray-700"
                              onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                              title="Ver artigo"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                              onClick={() => navigate(`/admin-blog/editar/${post.id}`)}
                              title="Editar"
                            >
                              <PenLine className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                              onClick={() => setExcluirId(post.id)}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                <span>
                  Mostrando {pagina * LIMITE + 1}–{Math.min((pagina + 1) * LIMITE, total)} de {total} artigos
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagina === 0}
                    onClick={() => setPagina(p => p - 1)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-700"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagina >= totalPaginas - 1}
                    onClick={() => setPagina(p => p + 1)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-700"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ABA LINKS EXTERNOS */}
        {abaAtiva === "links" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400 text-sm">Gerencie os links externos exibidos na sidebar do blog.</p>
              <Button
                onClick={() => navigate("/admin-blog/novo-link")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Link
              </Button>
            </div>

            {!links?.length ? (
              <div className="text-center py-16 text-gray-500">
                <Link2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhum link externo cadastrado.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">Título</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Tipo</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">URL</th>
                      <th className="text-center px-3 py-3 font-medium">Ordem</th>
                      <th className="text-right px-4 py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {links.map(link => (
                      <tr key={link.id} className="bg-gray-900/50 hover:bg-gray-800/60 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{link.titulo}</p>
                          {link.descricao && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{link.descricao}</p>}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300 capitalize">
                            {link.tipo}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline text-xs truncate max-w-[200px] block"
                          >
                            {link.url}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-400">{link.ordem}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                              onClick={() => excluirLink.mutate({ id: link.id })}
                              title="Excluir link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ABA INTEGRAÇÕES */}
        {abaAtiva === "integracoes" && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-1">Publicação Automática nas Redes Sociais</h2>
              <p className="text-gray-400 text-sm">Configure um webhook do Zapier ou Make.com para publicar artigos automaticamente no Facebook e Instagram quando você clicar em "Publicar".</p>
            </div>

            {/* Card Zapier/Make */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Zapier / Make.com</h3>
                  <p className="text-gray-400 text-xs">Recebe os dados do artigo e publica nas redes sociais</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">URL do Webhook</label>
                  <div className="flex gap-2">
                    <Input
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/hooks/catch/... ou https://hook.eu1.make.com/..."
                      className="bg-gray-900 border-gray-600 text-white placeholder-gray-500 flex-1"
                    />
                    <Button
                      onClick={() => salvarWebhookMutation.mutate({ webhookUrl })}
                      disabled={!webhookUrl || salvarWebhookMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                    >
                      {salvarWebhookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : webhookSalvo ? "Salvo ✓" : "Salvar"}
                    </Button>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Cole aqui a URL do webhook gerada no Zapier ou Make.com</p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => webhookUrl && testarWebhookMutation.mutate({ webhookUrl })}
                  disabled={!webhookUrl || testarWebhookMutation.isPending}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full"
                >
                  {testarWebhookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Testar Webhook
                </Button>
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
              <h3 className="text-white font-medium mb-3">Como configurar no Zapier</h3>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2"><span className="text-blue-400 font-bold">1.</span> Acesse <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">zapier.com</a> e crie um novo Zap</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">2.</span> Escolha <strong className="text-white">Trigger: Webhooks by Zapier → Catch Hook</strong></li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">3.</span> Copie a URL gerada e cole no campo acima</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">4.</span> Clique em <strong className="text-white">Testar Webhook</strong> para enviar dados de exemplo</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">5.</span> No Zapier, clique em <strong className="text-white">Test Trigger</strong> para capturar os dados</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">6.</span> Adicione as ações: <strong className="text-white">Facebook Pages → Create Post</strong> e <strong className="text-white">Instagram for Business → Create Post</strong></li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">7.</span> Mapeie os campos: <code className="bg-gray-800 px-1 rounded text-xs">artigo.titulo</code>, <code className="bg-gray-800 px-1 rounded text-xs">artigo.resumo</code>, <code className="bg-gray-800 px-1 rounded text-xs">artigo.url</code></li>
              </ol>

              <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded">
                <p className="text-green-400 text-xs"><strong>Dados enviados pelo webhook:</strong> id, titulo, slug, resumo, categoria, autor, imagemUrl, tags, destaque, url completa do artigo, timestamp</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={excluirId !== null} onOpenChange={open => !open && setExcluirId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta ação é permanente e não pode ser desfeita. O artigo será removido do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => excluirId !== null && excluirMutation.mutate({ id: excluirId })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {excluirMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
