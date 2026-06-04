import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Eye, EyeOff, Star, StarOff, Loader2,
  BookOpen, Tag, Clock, Image, ChevronDown, ChevronUp, Wand2,
} from "lucide-react";

const CATEGORIAS = [
  { value: "engenharia-de-prompts", label: "Engenharia de Prompts" },
  { value: "ia-juridica", label: "IA Jurídica" },
  { value: "dicas-praticas", label: "Dicas Práticas" },
  { value: "legislacao-e-regulamentacao", label: "Legislação e Regulamentação" },
  { value: "casos-de-uso", label: "Casos de Uso" },
  { value: "ferramentas", label: "Ferramentas" },
];

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

interface FormData {
  slug: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: string;
  tags: string;
  imagemUrl: string;
  publicado: boolean;
  destaque: boolean;
  tempoLeituraMin: number;
}

const FORM_VAZIO: FormData = {
  slug: "",
  titulo: "",
  resumo: "",
  conteudo: "",
  categoria: "engenharia-de-prompts",
  tags: "",
  imagemUrl: "",
  publicado: false,
  destaque: false,
  tempoLeituraMin: 5,
};

export default function AdminBlogEditor() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEdicao = !!params.id;
  const artigoId = params.id ? parseInt(params.id) : undefined;

  const [form, setForm] = useState<FormData>(FORM_VAZIO);
  const [slugManual, setSlugManual] = useState(false);
  const [mostrarAvancado, setMostrarAvancado] = useState(false);
  const [previewConteudo, setPreviewConteudo] = useState(false);
  const utils = trpc.useUtils();

  // Carregar artigo para edição
  const { data: artigoExistente, isLoading: carregandoArtigo } = trpc.blog.adminPorId.useQuery(
    { id: artigoId! },
    { enabled: isEdicao && !!artigoId && !!user && user.role === "admin" }
  );

  useEffect(() => {
    if (artigoExistente) {
      const tagsStr = Array.isArray(artigoExistente.tags)
        ? (artigoExistente.tags as string[]).join(", ")
        : "";
      setForm({
        slug: artigoExistente.slug,
        titulo: artigoExistente.titulo,
        resumo: artigoExistente.resumo,
        conteudo: artigoExistente.conteudo,
        categoria: artigoExistente.categoria,
        tags: tagsStr,
        imagemUrl: artigoExistente.imagemUrl ?? "",
        publicado: artigoExistente.publicado,
        destaque: artigoExistente.destaque,
        tempoLeituraMin: artigoExistente.tempoLeituraMin,
      });
      setSlugManual(true);
    }
  }, [artigoExistente]);

  // Auto-gerar slug a partir do título
  useEffect(() => {
    if (!slugManual && form.titulo) {
      setForm(f => ({ ...f, slug: gerarSlug(f.titulo) }));
    }
  }, [form.titulo, slugManual]);

  const criarMutation = trpc.blog.criar.useMutation({
    onSuccess: () => {
      utils.blog.adminListar.invalidate();
      utils.blog.listar.invalidate();
      toast.success("Artigo criado com sucesso!");
      navigate("/admin-blog");
    },
    onError: (e) => toast.error(`Erro ao criar: ${e.message}`),
  });

  const atualizarMutation = trpc.blog.atualizar.useMutation({
    onSuccess: () => {
      utils.blog.adminListar.invalidate();
      utils.blog.listar.invalidate();
      toast.success("Artigo atualizado com sucesso!");
      navigate("/admin-blog");
    },
    onError: (e) => toast.error(`Erro ao atualizar: ${e.message}`),
  });

  function handleSubmit(publicarAgora?: boolean) {
    const tagsArray = form.tags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const payload = {
      slug: form.slug,
      titulo: form.titulo,
      resumo: form.resumo,
      conteudo: form.conteudo,
      categoria: form.categoria as any,
      tags: tagsArray,
      imagemUrl: form.imagemUrl || undefined,
      publicado: publicarAgora !== undefined ? publicarAgora : form.publicado,
      destaque: form.destaque,
      tempoLeituraMin: form.tempoLeituraMin,
    };

    if (isEdicao && artigoId) {
      atualizarMutation.mutate({ id: artigoId, ...payload });
    } else {
      criarMutation.mutate(payload);
    }
  }

  const isPending = criarMutation.isPending || atualizarMutation.isPending;

  if (loading || (isEdicao && carregandoArtigo)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => navigate("/admin-blog")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <span className="text-gray-600">/</span>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-bold text-white">
                {isEdicao ? "Editar Artigo" : "Novo Artigo"}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(false)}
              disabled={isPending}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Salvar Rascunho
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmit(true)}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
              Publicar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-5">
            {/* Título */}
            <div>
              <Label className="text-gray-300 text-sm mb-1.5 block">Título *</Label>
              <Input
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Título do artigo..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-lg h-12"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-gray-300 text-sm">Slug (URL) *</Label>
                <button
                  type="button"
                  onClick={() => {
                    setSlugManual(false);
                    setForm(f => ({ ...f, slug: gerarSlug(f.titulo) }));
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" /> Gerar automaticamente
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm whitespace-nowrap">/blog/</span>
                <Input
                  value={form.slug}
                  onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: e.target.value })); }}
                  placeholder="meu-artigo-sobre-ia"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 font-mono text-sm"
                />
              </div>
            </div>

            {/* Resumo */}
            <div>
              <Label className="text-gray-300 text-sm mb-1.5 block">Resumo *</Label>
              <Textarea
                value={form.resumo}
                onChange={e => setForm(f => ({ ...f, resumo: e.target.value }))}
                placeholder="Breve descrição do artigo (aparece na listagem e no SEO)..."
                rows={3}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{form.resumo.length} caracteres</p>
            </div>

            {/* Conteúdo */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-gray-300 text-sm">Conteúdo (Markdown) *</Label>
                <button
                  type="button"
                  onClick={() => setPreviewConteudo(p => !p)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> {previewConteudo ? "Editar" : "Pré-visualizar"}
                </button>
              </div>
              {previewConteudo ? (
                <div
                  className="bg-gray-800 border border-gray-700 rounded-md p-4 min-h-[400px] prose prose-invert prose-sm max-w-none text-gray-200"
                  dangerouslySetInnerHTML={{
                    __html: form.conteudo
                      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-200 mt-4 mb-2">$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`(.+?)`/g, '<code class="bg-gray-700 px-1 rounded text-blue-300 text-xs">$1</code>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              ) : (
                <Textarea
                  value={form.conteudo}
                  onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
                  placeholder={`# Título\n\nIntrodução do artigo...\n\n## Seção 1\n\nConteúdo da seção...\n\n## Conclusão\n\nConclusão do artigo.`}
                  rows={20}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 font-mono text-sm resize-y"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                Suporta Markdown: **negrito**, `código`, ## Título, ### Subtítulo
              </p>
            </div>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300 text-sm">Publicado</Label>
                  <p className="text-xs text-gray-500">Visível para todos os visitantes</p>
                </div>
                <Switch
                  checked={form.publicado}
                  onCheckedChange={v => setForm(f => ({ ...f, publicado: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300 text-sm flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> Destaque
                  </Label>
                  <p className="text-xs text-gray-500">Aparece em posição privilegiada</p>
                </div>
                <Switch
                  checked={form.destaque}
                  onCheckedChange={v => setForm(f => ({ ...f, destaque: v }))}
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Classificação</h3>

              <div>
                <Label className="text-gray-300 text-sm mb-1.5 block">Categoria *</Label>
                <Select
                  value={form.categoria}
                  onValueChange={v => setForm(f => ({ ...f, categoria: v }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-1.5 block flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Tags
                </Label>
                <Input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="ia, prompts, direito penal"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Separadas por vírgula</p>
              </div>

              <div>
                <Label className="text-gray-300 text-sm mb-1.5 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Tempo de leitura (min)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={form.tempoLeituraMin}
                  onChange={e => setForm(f => ({ ...f, tempoLeituraMin: parseInt(e.target.value) || 5 }))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Avançado (recolhível) */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarAvancado(p => !p)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-300 uppercase tracking-wider hover:bg-gray-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Image className="w-4 h-4" /> Avançado
                </span>
                {mostrarAvancado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {mostrarAvancado && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
                  <div>
                    <Label className="text-gray-300 text-sm mb-1.5 block">URL da Imagem de Capa</Label>
                    <Input
                      value={form.imagemUrl}
                      onChange={e => setForm(f => ({ ...f, imagemUrl: e.target.value }))}
                      placeholder="https://..."
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">URL pública de uma imagem (opcional)</p>
                  </div>
                  {form.imagemUrl && (
                    <img
                      src={form.imagemUrl}
                      alt="Preview da capa"
                      className="w-full h-32 object-cover rounded border border-gray-700"
                      onError={e => (e.currentTarget.style.display = "none")}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="space-y-2">
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                Publicar Agora
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isPending}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Save className="w-4 h-4 mr-2" /> Salvar como Rascunho
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
