import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Scale, Sparkles, Shield, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/tutoriais">
                <Button variant="ghost">Tutoriais</Button>
              </Link>
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">Olá, {user?.name}</span>
                  <Link href="/dashboard">
                    <Button variant="default">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <a href={getLoginUrl()}>
                    <Button variant="outline">Entrar</Button>
                  </a>
                  <a href={getLoginUrl()}>
                    <Button variant="default">Começar Grátis</Button>
                  </a>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Sistema de Engenharia de Prompts Jurídicos
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Transforme Prompts em
              <span className="block text-primary">Peças Jurídicas Perfeitas</span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              O PromptJur utiliza inteligência artificial avançada para analisar, gerar e otimizar 
              prompts jurídicos com precisão profissional. Economize tempo e melhore a qualidade 
              dos seus documentos legais.
            </p>
            
            <div className="flex items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Acessar Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="text-lg px-8 py-6">
                      Começar Agora
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </a>
                  <Link href="/tutoriais">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                      Ver Tutoriais
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Funcionalidades Principais
            </h3>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para criar prompts jurídicos de excelência
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-sm p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-3">
                Análise Inteligente
              </h4>
              <p className="text-muted-foreground mb-4">
                Identifica automaticamente a área jurídica, extrai palavras-chave e avalia 
                a qualidade do seu prompt com precisão.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  12 áreas jurídicas suportadas
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Extração de entidades jurídicas
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Sugestões personalizadas
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-sm p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-3">
                Geração Automática
              </h4>
              <p className="text-muted-foreground mb-4">
                Crie prompts jurídicos otimizados com templates especializados por área, 
                incluindo referências legais atualizadas.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Templates por área jurídica
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Referências legais incluídas
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Nível de detalhe ajustável
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-sm p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-3">
                Otimização Avançada
              </h4>
              <p className="text-muted-foreground mb-4">
                Melhore prompts existentes com sugestões contextualizadas e estrutura 
                profissional para resultados superiores.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Comparação antes/depois
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Melhorias explicadas
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Estrutura profissional
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-sm p-12 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pronto para Começar?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se aos advogados que já estão usando o PromptJur para criar 
              prompts jurídicos de excelência com inteligência artificial.
            </p>
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button size="lg" className="text-lg px-8 py-6">
                  Criar Conta Gratuita
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6 mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Scale className="w-5 h-5 text-primary" />
              <span className="text-sm">© 2025 {APP_TITLE}. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
