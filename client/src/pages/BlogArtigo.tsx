import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { Scale, Clock, Eye, ArrowLeft, ExternalLink, ChevronRight } from "lucide-react";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const CATEGORIAS: Record<string, { label: string; cor: string }> = {
  "engenharia-de-prompts": { label: "Engenharia de Prompts", cor: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "ia-juridica": { label: "IA Jurídica", cor: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  "dicas-praticas": { label: "Dicas Práticas", cor: "bg-green-500/10 text-green-400 border-green-500/20" },
  "legislacao-e-regulamentacao": { label: "Legislação & Regulação", cor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "casos-de-uso": { label: "Casos de Uso", cor: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  "ferramentas": { label: "Ferramentas", cor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
};

function formatarData(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function BlogArtigo() {
  const params = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  const { data: post, isLoading, error } = trpc.blog.porSlug.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );

  const { data: listagem } = trpc.blog.listar.useQuery({ limite: 4 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-foreground">Artigo não encontrado</p>
          <Link href="/blog">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const cat = CATEGORIAS[post.categoria] ?? { label: post.categoria, cor: "bg-muted text-muted-foreground" };
  const outrosArtigos = listagem?.posts.filter(p => p.slug !== post.slug).slice(0, 3) ?? [];

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
            <div className="flex items-center gap-2">
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Blog
                </Button>
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
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b border-border/30 bg-muted/20">
        <div className="container mx-auto px-6 py-2 max-w-5xl">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/"><span className="hover:text-foreground cursor-pointer transition-colors">Início</span></Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blog"><span className="hover:text-foreground cursor-pointer transition-colors">Blog</span></Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate max-w-xs">{post.titulo}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Artigo */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cat.cor}`}>
                {cat.label}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.tempoLeituraMin} min de leitura
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Eye className="w-3 h-3" /> {post.visualizacoes} visualizações
              </span>
              <span className="text-xs text-muted-foreground">
                {formatarData(post.createdAt)}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
              {post.titulo}
            </h1>

            {/* Resumo */}
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 pb-8 border-b border-border/50">
              {post.resumo}
            </p>

            {/* Conteúdo */}
            <div className="prose prose-invert prose-sm md:prose-base max-w-none
              prose-headings:text-foreground prose-headings:font-semibold
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-strong:text-foreground
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-li:text-muted-foreground
              prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground">
              <Streamdown>{post.conteudo}</Streamdown>
            </div>

            {/* Tags */}
            {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {(post.tags as string[]).map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Autor */}
            <div className="mt-8 pt-6 border-t border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{post.autorNome}</p>
                <p className="text-xs text-muted-foreground">PromptJur — Engenharia de Prompts Jurídicos</p>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 space-y-6">
            {/* Outros artigos */}
            {outrosArtigos.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Outros Artigos</h3>
                <div className="space-y-4">
                  {outrosArtigos.map(outro => {
                    const outroCat = CATEGORIAS[outro.categoria] ?? { label: outro.categoria, cor: "bg-muted text-muted-foreground" };
                    return (
                      <Link key={outro.id} href={`/blog/${outro.slug}`}>
                        <div className="group cursor-pointer space-y-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${outroCat.cor}`}>
                            {outroCat.label}
                          </span>
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                            {outro.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {outro.tempoLeituraMin} min
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <Link href="/blog">
                  <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
                    Ver todos <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            )}

            {/* CTA */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Experimente o PromptJur</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Coloque em prática o que aprendeu. Gere prompts jurídicos profissionais com IA.
              </p>
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="sm" className="w-full">Ir ao Dashboard</Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="sm" className="w-full">Criar conta grátis</Button>
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 py-6">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} PromptJur</span>
            <div className="flex gap-4">
              <Link href="/privacidade"><span className="hover:text-foreground cursor-pointer transition-colors">Privacidade</span></Link>
              <Link href="/termos"><span className="hover:text-foreground cursor-pointer transition-colors">Termos</span></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
