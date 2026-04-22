import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE, APP_LOGO } from "@/const";
import { NotificationBell } from "@/components/NotificationBell";
import { Minimize2, Maximize2, Menu, X, Shield, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

interface DashboardHeader2Props {
  isCompactMode: boolean;
  toggleCompactMode: () => void;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/historico", label: "Histórico" },
  { href: "/templates", label: "Meus Templates" },
  { href: "/tutoriais", label: "Tutoriais" },
  { href: "/planos", label: "Planos" },
  { href: "/meu-plano", label: "Meu Plano" },
  { href: "/configuracoes", label: "Configurações" },
];

export default function DashboardHeader2({ isCompactMode, toggleCompactMode }: DashboardHeader2Props) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-8 h-8 rounded" />}
            <span className="text-lg font-bold text-foreground">{APP_TITLE}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href}>
                  <span className={`px-3 py-2 text-sm rounded-sm transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
            {user?.role === 'admin' && (
              <>
                <Link href="/crm">
                  <span className={`px-3 py-2 text-sm rounded-sm transition-colors cursor-pointer flex items-center gap-1 ${
                    location === '/crm'
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                  }`}>
                    <BarChart3 className="w-3.5 h-3.5" />
                    CRM
                  </span>
                </Link>
                <Link href="/admin-tools">
                  <span className={`px-3 py-2 text-sm rounded-sm transition-colors cursor-pointer flex items-center gap-1 ${
                    location === '/admin-tools'
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                  }`}>
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </span>
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCompactMode}
              className="hidden md:flex items-center gap-2"
              title={isCompactMode ? "Modo Completo" : "Modo Compacto"}
            >
              {isCompactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              <span className="text-sm">{isCompactMode ? "Expandir" : "Compacto"}</span>
            </Button>
            <span className="hidden md:inline text-sm text-muted-foreground border-l border-border pl-3">
              Olá, {user?.name}
            </span>
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`block px-3 py-2 text-sm rounded-sm cursor-pointer ${
                      isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
            {user?.role === 'admin' && (
              <>
                <Link href="/crm">
                  <span
                    className="block px-3 py-2 text-sm rounded-sm cursor-pointer text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 flex items-center gap-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    CRM
                  </span>
                </Link>
                <Link href="/admin-tools">
                  <span
                    className="block px-3 py-2 text-sm rounded-sm cursor-pointer text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Tools
                  </span>
                </Link>
              </>
            )}
            <div className="pt-2 px-3 text-sm text-muted-foreground">Olá, {user?.name}</div>
          </nav>
        )}
      </div>
    </header>
  );
}
