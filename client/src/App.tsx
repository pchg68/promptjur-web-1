import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { SentryErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Historico from "./pages/Historico";
import Templates from "./pages/Templates";
import TemplatePublico from "./pages/TemplatePublico";
import MeusModelos from "./pages/MeusModelos";
import BibliotecaPublica from "./pages/BibliotecaPublica";
import Tutoriais from "./pages/Tutoriais";
import BibliotecaTemplates from "./pages/BibliotecaTemplates";
import AdminTools from "./pages/AdminTools";
import Configuracoes from "./pages/Configuracoes";
import Planos from "./pages/Planos";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";
import AcessoRestrito from "./pages/AcessoRestrito";
import Contato from "./pages/Contato";
import Assistente from "./pages/Assistente";
import MeusPrompts from "./pages/MeusPrompts";
import CRM from "./pages/CRM";
import MonitoramentoLLM from "./pages/MonitoramentoLLM";
import DashboardCustos from "./pages/DashboardCustos";
import SharedPrompt from "./pages/SharedPrompt";
import MeuPlano from "./pages/MeuPlano";
import CookieBanner from "./components/CookieBanner";
import Suporte from "./pages/Suporte";
import Referral from "./pages/Referral";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/historico"} component={Historico} />
      <Route path={"/templates"} component={Templates} />
      <Route path="/template/:id" component={TemplatePublico} />
      <Route path={"/meus-modelos"} component={MeusModelos} />
      <Route path={"/biblioteca-publica"} component={BibliotecaPublica} />
      <Route path={"/tutoriais"} component={Tutoriais} />
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
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
