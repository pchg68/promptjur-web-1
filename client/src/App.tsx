import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { SentryErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CookieBanner from "./components/CookieBanner";

// Páginas críticas (síncronas)
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Páginas lazy (code splitting automático)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Historico = lazy(() => import("./pages/Historico"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplatePublico = lazy(() => import("./pages/TemplatePublico"));
const MeusModelos = lazy(() => import("./pages/MeusModelos"));
const BibliotecaPublica = lazy(() => import("./pages/BibliotecaPublica"));
const Tutoriais = lazy(() => import("./pages/Tutoriais"));
const BibliotecaTemplates = lazy(() => import("./pages/BibliotecaTemplates"));
const AdminTools = lazy(() => import("./pages/AdminTools"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Planos = lazy(() => import("./pages/Planos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const AcessoRestrito = lazy(() => import("./pages/AcessoRestrito"));
const Contato = lazy(() => import("./pages/Contato"));
const Assistente = lazy(() => import("./pages/Assistente"));
const MeusPrompts = lazy(() => import("./pages/MeusPrompts"));
const CRM = lazy(() => import("./pages/CRM"));
const MonitoramentoLLM = lazy(() => import("./pages/MonitoramentoLLM"));
const DashboardCustos = lazy(() => import("./pages/DashboardCustos"));
const SharedPrompt = lazy(() => import("./pages/SharedPrompt"));
const MeuPlano = lazy(() => import("./pages/MeuPlano"));
const Suporte = lazy(() => import("./pages/Suporte"));
const Referral = lazy(() => import("./pages/Referral"));
const AdminPrecos = lazy(() => import("./pages/AdminPrecos"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const AdminBlogEditor = lazy(() => import("./pages/AdminBlogEditor"));
const AdminBlogNovoLink = lazy(() => import("./pages/AdminBlogNovoLink"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArtigo = lazy(() => import("./pages/BlogArtigo"));
const Sobre = lazy(() => import("./pages/Sobre"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
      <div className="w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/historico"} component={Historico} />
      <Route path={"/templates"} component={Templates} />
      <Route path="/template/:id" component={TemplatePublico} />
      <Route path={"/meus-modelos"} component={MeusModelos} />
      <Route path={"/biblioteca-publica"} component={BibliotecaPublica} />
      <Route path={"/tutoriais"} component={Tutoriais} />
      <Route path={"/sobre"} component={Sobre} />
      <Route path={"/biblioteca-templates"} component={BibliotecaTemplates} />
      <Route path={"/admin-tools"} component={AdminTools} />
      <Route path={"/configuracoes"} component={Configuracoes} />
      <Route path={"/planos"} component={Planos} />
      <Route path={"/privacidade"} component={Privacidade} />
      <Route path={"/termos"} component={Termos} />
      <Route path={"/acesso-restrito"} component={AcessoRestrito} />
      <Route path={"/contato"} component={Contato} />
      <Route path={"/assistente"} component={Assistente} />
      <Route path={"/meus-prompts"} component={MeusPrompts} />
      <Route path={"/crm"} component={CRM} />
      <Route path="/shared/:token" component={SharedPrompt} />
      <Route path="/meu-plano" component={MeuPlano} />
      <Route path="/monitoramento-llm" component={MonitoramentoLLM} />
      <Route path="/dashboard-custos" component={DashboardCustos} />
      <Route path="/suporte" component={Suporte} />
      <Route path="/indicacoes" component={Referral} />
      <Route path="/admin-precos" component={AdminPrecos} />
      <Route path="/admin-blog" component={AdminBlog} />
      <Route path="/admin-blog/novo" component={AdminBlogEditor} />
      <Route path="/admin-blog/editar/:id" component={AdminBlogEditor} />
      <Route path="/admin-blog/novo-link" component={AdminBlogNovoLink} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogArtigo} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <SentryErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieBanner />
        </TooltipProvider>
      </ThemeProvider>
    </SentryErrorBoundary>
  );
}

export default App;
