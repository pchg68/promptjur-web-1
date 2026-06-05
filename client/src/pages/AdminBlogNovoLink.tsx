import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Link2,
  Save,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  FileText,
  Video,
  Wrench,
} from "lucide-react";

const TIPOS = [
  { value: "artigo", label: "Artigo", icon: FileText },
  { value: "video", label: "Vídeo", icon: Video },
  { value: "ferramenta", label: "Ferramenta", icon: Wrench },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "outro", label: "Outro", icon: Globe },
] as const;

type TipoLink = typeof TIPOS[number]["value"];

export default function AdminBlogNovoLink() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    url: "",
    tipo: "outro" as TipoLink,
    categoria: "",
    ordem: 0,
  });

  const [urlError, setUrlError] = useState("");

  const adicionarLink = trpc.blog.adicionarLink.useMutation({
    onSuccess: () => {
      toast.success("Link adicionado com sucesso!");
      navigate("/admin-blog");
    },
    onError: (err) => {
      toast.error("Erro ao adicionar link: " + err.message);
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <p>Acesso restrito a administradores.</p>
      </div>
    );
  }

  const validarUrl = (url: string) => {
    try {
      new URL(url);
      setUrlError("");
      return true;
    } catch {
      setUrlError("URL inválida. Inclua https:// no início.");
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast.error("O título é obrigatório.");
      return;
    }
    if (!validarUrl(form.url)) return;

    adicionarLink.mutate({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || undefined,
      url: form.url.trim(),
      tipo: form.tipo,
      categoria: form.categoria.trim() || undefined,
      ordem: form.ordem,
    });
  };

  const TipoIcon = TIPOS.find(t => t.value === form.tipo)?.icon ?? Globe;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin-blog")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-semibold">Novo Link Externo</h1>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm font-medium">Tipo de Link *</Label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {TIPOS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-all ${
                    form.tipo === value
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-gray-300 text-sm font-medium">
              Título *
            </Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: PromptJur no Instagram"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
              maxLength={300}
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-gray-300 text-sm font-medium">
              URL *
            </Label>
            <div className="relative">
              <TipoIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="url"
                value={form.url}
                onChange={e => {
                  setForm(f => ({ ...f, url: e.target.value }));
                  if (urlError) validarUrl(e.target.value);
                }}
                onBlur={e => validarUrl(e.target.value)}
                placeholder="https://instagram.com/seuusuario"
                className={`bg-gray-800 border-gray-700 text-white placeholder-gray-500 pl-10 focus:border-blue-500 ${
                  urlError ? "border-red-500 focus:border-red-500" : ""
                }`}
                required
              />
            </div>
            {urlError && <p className="text-red-400 text-xs">{urlError}</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-gray-300 text-sm font-medium">
              Descrição <span className="text-gray-500 font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Breve descrição do link para exibir na sidebar..."
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 resize-none"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Categoria e Ordem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-gray-300 text-sm font-medium">
                Categoria <span className="text-gray-500 font-normal">(opcional)</span>
              </Label>
              <Input
                id="categoria"
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                placeholder="Ex: Redes Sociais, Referências..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordem" className="text-gray-300 text-sm font-medium">
                Ordem de exibição
              </Label>
              <Input
                id="ordem"
                type="number"
                min={0}
                max={999}
                value={form.ordem}
                onChange={e => setForm(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))}
                className="bg-gray-800 border-gray-700 text-white focus:border-blue-500"
              />
              <p className="text-gray-500 text-xs">Menor número = aparece primeiro</p>
            </div>
          </div>

          {/* Pré-visualização */}
          {(form.titulo || form.url) && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Pré-visualização na sidebar</p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <TipoIcon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{form.titulo || "Título do link"}</p>
                  {form.descricao && (
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{form.descricao}</p>
                  )}
                  <p className="text-blue-400 text-xs mt-1 truncate max-w-[280px]">
                    {form.url || "https://..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={adicionarLink.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {adicionarLink.isPending ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Adicionar Link
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/admin-blog")}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
