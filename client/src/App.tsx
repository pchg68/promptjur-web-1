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
        </TooltipProvider>
      </ThemeProvider>
    </SentryErrorBoundary>
  );
}

export default App;
