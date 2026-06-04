import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { APP_TITLE, APP_LOGO } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Scale, Search, Clock, Eye, ExternalLink, Instagram, Facebook,
  Linkedin, Youtube, BookOpen, Newspaper, Wrench, ChevronRight,
  Rss, ArrowRight, Menu, X
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIAS: Record<string, { label: string; cor: string }> = {
  "engenharia-de-prompts": { label: "Engenharia de Prompts", cor: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "ia-juridica": { label: "IA Jurídica", cor: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  "dicas-praticas": { label: "Dicas Práticas", cor: "bg-green-500/10 text-green-400 border-green-500/20" },
  "legislacao-e-regulamentacao": { label: "Legislação & Regulação", cor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "casos-de-uso": { label: "Casos de Uso", cor: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  "ferramentas": { label: "Ferramentas", cor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
};

const TIPO_ICONE: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  ferramenta: Wrench,
  artigo: Newspaper,
  video: Youtube,
  outro: ExternalLink,
};

const TIPO_COR: Record<string, string> = {
  instagram: "text-pink-400",
  facebook: "text-blue-500",
  linkedin: "text-blue-400",
  youtube: "text-red-400",
  ferramenta: "text-amber-400",
  artigo: "text-green-400",
  video: "text-red-400",
  outro: "text-muted-foreground",
};

function formatarData(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Card de Artigo ───────────────────────────────────────────────────────────

function CardArtigo({ post, destaque = false }: { post: any; destaque?: boolean }) {
  const cat = CATEGORIAS[post.categoria] ?? { label: post.categoria, cor: "bg-muted text-muted-foreground" };
  return (
    <Link href={`/blog/${post.slug}`}>
      <div className={`group cursor-pointer rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all duration-200 overflow-hidden ${destaque ? "h-full" : ""}`}>
        <div className="p-5 flex flex-col gap-3 h-full">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cat.cor}`}>
              {cat.label}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.tempoLeituraMin} min
            </span>
          </div>
          <h3 className={`font-semibold text-foreground group-hover:text-primary transition-colors leading-snug ${destaque ? "text-lg" : "text-base"}`}>
            {post.titulo}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.resumo}</p>
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground">{formatarData(post.createdAt)}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.visualizacoes ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function Blog() {
  const { user, isAuthenticated } = useAuth();
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: listagem, isLoading } = trpc.blog.listar.useQuery({
    categoria: categoriaAtiva,
    busca: busca.length >= 3 ? busca : undefined,
    limite: 12,
  });

  const { data: links } = trpc.blog.linksExternos.useQuery({});

  // Agrupa links por categoria
  const linksPorCategoria = (links ?? []).reduce<Record<string, typeof links>>((acc, link) => {
    const cat = link!.categoria ?? "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(link);
    return acc;
  }, {});

  const redesSociais = (links ?? []).filter(l => ["instagram", "facebook", "linkedin", "youtube"].includes(l!.tipo));
  const linksRecursos = (links ?? []).filter(l => !["instagram", "facebook", "linkedin", "youtube"].includes(l!.tipo));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <Scale className="w-7 h-7 text-primary" />
                <span className="text-xl font-bold text-foreground">{APP_TITLE}</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              <Link href="/tutoriais">
                <Button variant="ghost" size="sm">Tutoriais</Button>
              </Link>
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="text-primary font-semibold">Blog</Button>
              </Link>
              <Link href="/contato">
                <Button variant="ghost" size="sm">Contato</Button>
              </Link>
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="sm">Entrar</Button>
                </a>
              )}
            </nav>
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
          {mobileMenuOpen && (
            <nav className="md:hidden border-t border-border pt-3 pb-2 mt-3 flex flex-col gap-1">
              <Link href="/tutoriais"><span className="block px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer" onClick={() => setMobileMenuOpen(false)}>Tutoriais</span></Link>
              <Link href="/blog"><span className="block px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer text-primary font-semibold" onClick={() => setMobileMenuOpen(false)}>Blog</span></Link>
              <Link href="/contato"><span className="block px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer" onClick={() => setMobileMenuOpen(false)}>Contato</span></Link>
              {isAuthenticated ? (
                <Link href="/dashboard"><span className="block px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer" onClick={() => setMobileMenuOpen(false)}>Dashboard</span></Link>
              ) : (
                <a href={getLoginUrl()}><span className="block px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer">Entrar</span></a>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <div className="flex items-center gap-2 mb-4">
            <Rss className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Blog PromptJur</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Engenharia de Prompts Jurídicos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Artigos, dicas e análises sobre o uso de inteligência artificial na prática jurídica brasileira.
            Conteúdo produzido para advogados, estudantes e entusiastas do Direito.
          </p>
          {/* Busca */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Coluna Principal */}
          <main className="flex-1 min-w-0">
            {/* Filtros de Categoria */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={categoriaAtiva === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoriaAtiva(undefined)}
              >
                Todos
              </Button>
              {Object.entries(CATEGORIAS).map(([key, { label }]) => (
                <Button
                  key={key}
                  variant={categoriaAtiva === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoriaAtiva(categoriaAtiva === key ? undefined : key)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Grid de Artigos */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                    <div className="h-5 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-5/6 mb-1" />
                    <div className="h-4 bg-muted rounded w-4/6" />
                  </div>
                ))}
              </div>
            ) : listagem?.posts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhum artigo encontrado</p>
                <p className="text-sm mt-1">Tente outro termo de busca ou categoria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listagem?.posts.map((post) => (
                  <CardArtigo key={post.id} post={post} destaque={post.destaque} />
                ))}
              </div>
            )}

            {listagem && listagem.total > 12 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">{listagem.total} artigos no total</p>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 space-y-6">

            {/* Redes Sociais */}
            {redesSociais.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Rss className="w-4 h-4 text-primary" />
                  Siga o PromptJur
                </h3>
                <div className="space-y-3">
                  {redesSociais.map((link) => {
                    const Icone = TIPO_ICONE[link!.tipo] ?? ExternalLink;
                    const cor = TIPO_COR[link!.tipo] ?? "text-muted-foreground";
                    return (
                      <a
                        key={link!.id}
                        href={link!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <Icone className={`w-5 h-5 flex-shrink-0 ${cor}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{link!.titulo}</p>
                          {link!.descricao && <p className="text-xs text-muted-foreground line-clamp-1">{link!.descricao}</p>}
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Links por Categoria */}
            {Object.entries(linksPorCategoria)
              .filter(([cat]) => !["Redes Sociais"].includes(cat))
              .map(([categoria, items]) => (
                <div key={categoria} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-primary" />
                    {categoria}
                  </h3>
                  <div className="space-y-2">
                    {items!.map((link) => {
                      const Icone = TIPO_ICONE[link!.tipo] ?? ExternalLink;
                      const cor = TIPO_COR[link!.tipo] ?? "text-muted-foreground";
                      return (
                        <a
                          key={link!.id}
                          href={link!.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <Icone className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cor}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">{link!.titulo}</p>
                            {link!.descricao && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{link!.descricao}</p>}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* CTA — Plataforma */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="font-semibold text-foreground mb-2">Experimente o PromptJur</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gere prompts jurídicos profissionais com IA. Plano gratuito disponível.
              </p>
              <Link href="/planos">
                <Button size="sm" className="w-full gap-2">
                  Ver Planos <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 py-8">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scale className="w-4 h-4 text-primary" />
              <span>© {new Date().getFullYear()} PromptJur — Todos os direitos reservados</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacidade"><span className="hover:text-foreground cursor-pointer transition-colors">Privacidade</span></Link>
              <Link href="/termos"><span className="hover:text-foreground cursor-pointer transition-colors">Termos</span></Link>
              <Link href="/contato"><span className="hover:text-foreground cursor-pointer transition-colors">Contato</span></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
