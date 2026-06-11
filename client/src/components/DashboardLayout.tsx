import { useAuth } from "@/_core/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProfPromptChat } from "@/components/ProfPromptChat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import {
  LayoutDashboard, LogOut, Users, Shield, FileText, Lock, Bot,
  History, BookOpen, Settings, BookMarked, HelpCircle, Gift,
  Coins, Crown, ChevronRight, Bell, GraduationCap
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { QuotaWidget } from "./QuotaWidget";
import { OnboardingTour, TourStep } from "./OnboardingTour";
import { TrialBanner } from "./TrialBanner";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { NotificationBell } from "./NotificationBell";

const ONBOARDING_STEPS: TourStep[] = [
  {
    title: "🌟 Bem-vindo ao PromptJur!",
    body: "O PromptJur é seu assistente de engenharia de prompts jurídicos com IA. Em 4 passos você vai conhecer as funcionalidades principais. Vamos lá?",
  },
  {
    selector: "[data-tour='assistente']",
    title: "🤖 JurIA — Assistente Inteligente",
    body: "Converse com a JurIA para gerar, analisar e otimizar prompts jurídicos. Escolha entre 8 personas especializadas e gere documentos completos com validação de alucinações.",
    placement: "right",
  },
  {
    selector: "[data-tour='meus-prompts']",
    title: "📚 Seus Prompts e Templates",
    body: "Todos os prompts gerados ficam salvos automaticamente. Organize com tags, marque favoritos, exporte como .txt/.docx/.pdf e reutilize quando precisar.",
    placement: "right",
  },
  {
    selector: "[data-tour='quota-widget']",
    title: "📊 Consumo e Créditos",
    body: "Acompanhe seu uso mensal em tempo real. Você receberá alertas ao atingir 70%, 90% e 100% da quota.",
    placement: "top",
  },
  {
    selector: "[data-tour='indicacoes']",
    title: "🎁 Indique e Ganhe",
    body: "Compartilhe seu código de indicação e ganhe 5 créditos extras para cada amigo que se cadastrar.",
    placement: "right",
  },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",     path: "/dashboard",    tour: "dashboard" },
  { icon: FileText,        label: "Nova Peça",      path: "/dashboard",    tour: "nova-peca" },
  { icon: BookMarked,      label: "Modelos",        path: "/templates",    tour: "modelos" },
  { icon: History,         label: "Histórico",      path: "/historico",    tour: "historico" },
  { icon: Bot,             label: "JurIA",          path: "/assistente",   tour: "assistente" },
  { icon: BookOpen,        label: "Tutoriais",      path: "/tutoriais",    tour: "tutoriais" },
  { icon: Settings,        label: "Configurações",  path: "/configuracoes",tour: "configuracoes" },
];

const footerMenuItems = [
  { icon: HelpCircle, label: "Suporte",    path: "/suporte" },
  { icon: Gift,       label: "Indicações", path: "/indicacoes", badge: "Novo" },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  pro: "Profissional",
  enterprise: "Escritório",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 rounded-xl object-cover shadow" />
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
            <p className="text-sm text-muted-foreground">Faça login para continuar</p>
          </div>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full">
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [profPromptOpen, setProfPromptOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar-collapsed") === "true"; } catch { return false; }
  });

  const { data: usage } = trpc.stripe.getMyUsage.useQuery(undefined, { refetchInterval: 120_000 });
  const planLabel = PLAN_LABELS[(user as any)?.subscriptionPlan ?? "free"] ?? "Gratuito";
  const isUnlimited = usage?.isUnlimited;
  const creditos = isUnlimited ? null : (usage ? usage.limit - usage.usageCount : null);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
  };

  // Active page label for header
  const activeItem = menuItems.find(i => i.path === location);
  const activeLabel = activeItem?.label ?? "Dashboard";

  const sidebarW = collapsed ? "w-16" : "w-52";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
      <aside
        className={`${sidebarW} flex-shrink-0 flex flex-col border-r border-border bg-sidebar transition-all duration-200 overflow-hidden`}
        style={{ minWidth: collapsed ? "4rem" : "13rem" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 h-14 px-3 border-b border-border flex-shrink-0">
          <img src={APP_LOGO} alt="Logo" className="h-8 w-8 rounded-md object-cover flex-shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-sm font-bold tracking-tight text-foreground truncate block">PromptJur</span>
              <span className="text-[10px] text-muted-foreground truncate block">Engenharia de Prompts</span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {menuItems.map(item => {
            const isActive = location === item.path && (item.label === "Dashboard" ? location === "/dashboard" : true);
            const isReallyActive = location === item.path;
            return (
              <button
                key={item.tour}
                data-tour={item.tour}
                onClick={() => setLocation(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors group relative
                  ${isReallyActive
                    ? "bg-accent text-foreground font-medium border-l-2 border-primary pl-[calc(0.5rem-2px)]"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${isReallyActive ? "text-primary" : ""}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}

          {user?.role === "admin" && (
            <button
              onClick={() => setLocation("/admin-tools")}
              title={collapsed ? "Admin" : undefined}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors
                ${location === "/admin-tools"
                  ? "bg-accent text-primary font-medium border-l-2 border-primary pl-[calc(0.5rem-2px)]"
                  : "text-primary/70 hover:bg-accent/60 hover:text-primary"
                }`}
            >
              <Shield className="h-4 w-4 flex-shrink-0 text-primary" />
              {!collapsed && <span className="flex-1 text-left truncate">Admin</span>}
            </button>
          )}
        </nav>

        {/* Prof. Prompt button — fixed above footer */}
        <div className="px-2 pb-1 flex-shrink-0">
          <button
            onClick={() => setProfPromptOpen(true)}
            title={collapsed ? "Prof. Prompt" : undefined}
            data-tour="prof-prompt"
            className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors bg-primary/10 hover:bg-primary/20 text-primary font-medium"
          >
            <GraduationCap className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left truncate">Prof. Prompt</span>
            )}
          </button>
        </div>

        {/* Footer items */}
        <div className="border-t border-border px-2 py-2 space-y-0.5 flex-shrink-0">
          {footerMenuItems.map(item => {
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                data-tour={item.path.replace("/", "")}
                onClick={() => setLocation(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors
                  ${isActive
                    ? "bg-accent text-foreground font-medium border-l-2 border-primary pl-[calc(0.5rem-2px)]"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}

          {/* Quota widget — only when expanded */}
          {!collapsed && (
            <div className="pt-1 pb-1" data-tour="quota-widget">
              <QuotaWidget />
            </div>
          )}

          {/* User avatar + plan */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/60 transition-colors text-left ${collapsed ? "justify-center" : ""}`}>
                <Avatar className="h-7 w-7 border border-border flex-shrink-0">
                  <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                    {user?.name?.slice(0, 2).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate leading-none">{user?.name || "—"}</p>
                    <p className="text-[10px] text-primary truncate mt-0.5">{planLabel}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "—"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.role === "admin" && (
                <DropdownMenuItem onClick={() => setLocation("/admin-tools")} className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  <span className="font-medium">Admin Tools</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setLocation("/configuracoes")} className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/termos")} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Termos de Uso</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/privacidade")} className="cursor-pointer">
                <Lock className="mr-2 h-4 w-4" />
                <span>Privacidade</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur">
          {/* Left: collapse toggle + page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleCollapsed}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            </button>
            <span className="text-sm font-semibold text-foreground">{APP_TITLE}</span>
          </div>

          {/* Right: credits + plan + notifications + avatar */}
          <div className="flex items-center gap-2">
            {usage && (
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                <Coins className="w-3.5 h-3.5" />
                {isUnlimited ? "Ilimitado" : `${creditos} créditos`}
              </div>
            )}
            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs font-medium text-muted-foreground">
              <Crown className="w-3 h-3 text-primary" />
              <span>{planLabel}</span>
            </div>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-accent/60 rounded-md px-2 py-1 transition-colors">
                  <Avatar className="h-7 w-7 border border-border">
                    <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user?.name && (
                    <span className="text-xs font-medium text-foreground hidden md:block truncate max-w-[120px]">
                      {user.name.split(" ").slice(0, 2).join(" ")}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "—"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || ""}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/configuracoes")} className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <TrialBanner />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <OnboardingTour steps={ONBOARDING_STEPS} storageKey="promptjur-onboarding-v3" />

      {/* ── Prof. Prompt Drawer ─────────────────────────────────────── */}
      <Sheet open={profPromptOpen} onOpenChange={setProfPromptOpen}>
        <SheetContent side="right" className="w-[420px] sm:w-[480px] flex flex-col p-0 bg-background border-l border-border">
          <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-5 h-5 text-primary" />
              Prof. Prompt
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-3">
            <ProfPromptChat height="calc(100vh - 120px)" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
