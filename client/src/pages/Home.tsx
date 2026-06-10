/**
 * PromptJur Landing Page — Editorial Jurídico Contemporâneo
 * Design: Playfair Display + Inter/Montserrat, paleta navy/amber/cream
 * Objetivo: conversão, demonstração prática, geração de leads
 * 
 * PRESERVADO do projeto original:
 * - useAuth() para detecção de login e CTAs condicionais
 * - getLoginUrl() para redirecionamento OAuth
 * - FormContato compact para seção de contato funcional
 * - Links internos (/dashboard, /planos, /tutoriais, /termos, /privacidade, /contato, /biblioteca-publica)
 * - APP_TITLE para branding dinâmico
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Gavel,
  Globe,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Scale,
  Shield,
  Sparkles,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link, useLocation } from "wouter";
import FormContato from "@/components/FormContato";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Asset URLs (CDN)
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029699712/5rA4Xp94a7aS8aQWEYfuYR/promptjur-hero-bg-Nyr3w4ZEKhGCRMmXra46K3.webp";
const DEMO_MOCKUP = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029699712/5rA4Xp94a7aS8aQWEYfuYR/promptjur-demo-mockup-MJFvmv9aym5ErVj4i7BdAL.webp";
const TRUST_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029699712/5rA4Xp94a7aS8aQWEYfuYR/promptjur-trust-section-57asGbpcXn9imV2gjB4HTc.webp";
const LIBRARY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029699712/5rA4Xp94a7aS8aQWEYfuYR/promptjur-library-section-LwcMFVQaT7iKyKfBtr2cHC.webp";

// CSS custom properties for scoped fonts (won't affect other pages)
const FONT_DISPLAY = "'Playfair Display', 'Montserrat', serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: FONT_BODY }}>
      <Navbar />
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <LibrarySection />
      <ComparisonSection />
      <TrustSection />
      <PricingSection />
      <FAQSection />
      <SocialProofBanner />
      <ContactSection />
      <CTASection />
      <Footer />
      <ExitIntentPopup />
    </div>
  );
}

/* ─── NAVBAR ─── */
function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#1a1a2e]/90 border-b border-white/5">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-[#c9a227]" />
          <span className="text-white font-bold text-lg" style={{ fontFamily: FONT_DISPLAY }}>
            {APP_TITLE}
          </span>
        </Link>
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#demo" className="text-white/70 hover:text-[#c9a227] transition-colors text-sm font-medium">Demonstração</a>
          <a href="#features" className="text-white/70 hover:text-[#c9a227] transition-colors text-sm font-medium">Recursos</a>
          <a href="#biblioteca" className="text-white/70 hover:text-[#c9a227] transition-colors text-sm font-medium">Biblioteca</a>
          <a href="#planos" className="text-white/70 hover:text-[#c9a227] transition-colors text-sm font-medium">Planos</a>
          <Link href="/tutoriais" className="text-white/70 hover:text-[#c9a227] transition-colors text-sm font-medium">Tutoriais</Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227]">
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarFallback className="text-xs font-medium bg-[#c9a227]/20 text-[#c9a227]">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white hidden lg:block">{user?.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "-"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || ""}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => setLocation('/admin-tools')} className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4 text-[#c9a227]" />
                    <span className="font-medium">Admin Tools</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setLocation('/dashboard')} className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/configuracoes')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <a href={getLoginUrl()}>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 h-9 px-4 text-sm rounded-md">
                  Entrar
                </Button>
              </a>
              <a href={getLoginUrl()}>
                <Button className="bg-[#c9a227] hover:bg-[#b89220] text-[#1a1a2e] font-semibold px-5 h-9 text-sm rounded-md transition-transform active:scale-[0.97]">
                  Testar Grátis
                </Button>
              </a>
            </div>
          )}
        </div>
        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-white transition-transform ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-white transition-transform ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>
      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#1a1a2e]/95 border-t border-white/5 px-4 pb-4 pt-2 space-y-3">
          <a href="#demo" className="block text-white/70 hover:text-[#c9a227] py-2 text-sm">Demonstração</a>
          <a href="#features" className="block text-white/70 hover:text-[#c9a227] py-2 text-sm">Recursos</a>
          <a href="#biblioteca" className="block text-white/70 hover:text-[#c9a227] py-2 text-sm">Biblioteca</a>
          <a href="#planos" className="block text-white/70 hover:text-[#c9a227] py-2 text-sm">Planos</a>
          <Link href="/tutoriais" className="block text-white/70 hover:text-[#c9a227] py-2 text-sm">Tutoriais</Link>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button className="w-full bg-[#c9a227] hover:bg-[#b89220] text-[#1a1a2e] font-semibold">Acessar Dashboard</Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button className="w-full bg-[#c9a227] hover:bg-[#b89220] text-[#1a1a2e] font-semibold">Testar Grátis</Button>
            </a>
          )}
        </div>
      )}
    </nav>
  );
}

/* ─── HERO ─── */
function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative min-h-[90vh] flex items-center pt-16" style={{ background: "#1a1a2e" }}>
      {/* Background image */}
      <div className="absolute inset-0 opacity-40">
        <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] via-[#1a1a2e]/80 to-transparent" />
      <div className="container relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-white/5 border border-[#c9a227]/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-[#c9a227]" />
            <span className="text-[#c9a227] text-sm font-medium">IA jurídica com método e governança</span>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6" style={{ fontFamily: FONT_DISPLAY }}>
            Prompts jurídicos profissionais para{" "}
            <span className="text-[#c9a227]">advogados que produzem melhor</span> com IA
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-white/70 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
            Transforme fatos do caso em comandos claros para petições, contratos, pareceres e revisões — com modelos prontos, validação e foco na advocacia brasileira.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-[#c9a227] hover:bg-[#b89220] text-[#1a1a2e] font-bold px-8 h-12 text-base rounded-md transition-transform active:scale-[0.97] shadow-lg shadow-[#c9a227]/20">
                  Acessar Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="bg-[#c9a227] hover:bg-[#b89220] text-[#1a1a2e] font-bold px-8 h-12 text-base rounded-md transition-transform active:scale-[0.97] shadow-lg shadow-[#c9a227]/20">
                  Testar grátis por 7 dias
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
            )}
            <Link href="/biblioteca-publica">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 h-12 px-6 text-base rounded-md">
                Ver biblioteca gratuita
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="mt-8 flex items-center gap-6 text-white/50 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Sem cartão de crédito</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> 12 operações grátis/mês</span>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
          className="hidden lg:block"
        >
          <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
            <img src={DEMO_MOCKUP} alt="Interface do PromptJur mostrando geração de peça jurídica" className="w-full h-auto" />
          </div>
        </motion.div>
      </div>
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#1a2332] to-transparent" />
    </section>
  );
}

/* ─── DEMO SECTION ─── */
function DemoSection() {
  return (
    <section id="demo" className="py-24" style={{ background: "#1a2332" }}>
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="text-center mb-16"
        >
          <motion.span variants={fadeUp} custom={0} className="text-[#c9a227] font-semibold text-sm uppercase tracking-wider">Demonstração prática</motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3 text-white" style={{ fontFamily: FONT_DISPLAY }}>
            Veja a diferença de um prompt profissional
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-white/60 text-lg mt-4 max-w-2xl mx-auto">
            Um comando genérico gera respostas genéricas. O PromptJur estrutura contexto, objetivo, formato e critérios para resultados jurídicos de verdade.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Before */}
          <Card className="p-6 border-red-400/30 bg-red-950/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-400" />
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-red-900/50 text-red-300 text-xs font-bold px-2.5 py-1 rounded-full">ANTES</span>
              <span className="text-sm text-white/50">Prompt genérico</span>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-red-400/20" style={{ fontFamily: FONT_MONO }}>
              <p className="text-sm text-white/80 leading-relaxed">
                "Faça uma petição inicial de danos morais por cobrança indevida"
              </p>
            </div>
            <div className="mt-4 text-sm text-white/50 space-y-1">
              <p className="flex items-center gap-1.5"><span className="text-red-400">✗</span> Sem contexto do caso</p>
              <p className="flex items-center gap-1.5"><span className="text-red-400">✗</span> Sem fundamento legal</p>
              <p className="flex items-center gap-1.5"><span className="text-red-400">✗</span> Sem formato definido</p>
              <p className="flex items-center gap-1.5"><span className="text-red-400">✗</span> Resultado genérico e impreciso</p>
            </div>
          </Card>

          {/* After */}
          <Card className="p-6 border-[#c9a227]/30 bg-amber-950/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#c9a227]" />
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-amber-900/50 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">DEPOIS</span>
              <span className="text-sm text-white/50">Prompt PromptJur</span>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-[#c9a227]/20" style={{ fontFamily: FONT_MONO }}>
              <p className="text-sm text-white/80 leading-relaxed">
                "Elabore petição inicial de danos morais por cobrança indevida com fundamento no art. 42 do CDC, em favor de consumidor pessoa física.<br /><br />
                <strong className="text-[#c9a227]">Contexto:</strong> Autor: João da Silva, CPF 123.456.789-00. Réu: Banco Exemplo S.A. Fatos: cobrança de tarifa não contratada por 6 meses. Valor: R$ 1.254,00.<br /><br />
                <strong className="text-[#c9a227]">Formato:</strong> Petição inicial completa com qualificação, fatos, direito, pedidos e valor da causa. Tom técnico e formal. Incluir jurisprudência e pedido de inversão do ônus."
              </p>
            </div>
            <div className="mt-4 text-sm text-white/50 space-y-1">
              <p className="flex items-center gap-1.5"><span className="text-[#c9a227]">✓</span> Contexto completo do caso</p>
              <p className="flex items-center gap-1.5"><span className="text-[#c9a227]">✓</span> Fundamento legal específico</p>
              <p className="flex items-center gap-1.5"><span className="text-[#c9a227]">✓</span> Formato e tom definidos</p>
              <p className="flex items-center gap-1.5"><span className="text-[#c9a227]">✓</span> Resultado preciso e aplicável</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ─── */
const features = [
  { icon: Sparkles, title: "Multi-IA Integrada", desc: "Compare respostas de GPT-4, Claude e Gemini no mesmo painel. Escolha o melhor resultado para cada caso." },
  { icon: FileText, title: "Exportação Jurídica", desc: "Exporte em DOCX, PDF e formato ABNT. Pronto para protocolar ou enviar ao cliente." },
  { icon: BookOpen, title: "Biblioteca de Prompts", desc: "Modelos por área: trabalhista, consumidor, família, penal, tributário e contratos." },
  { icon: Globe, title: "Knowledge Retrieval DataJud", desc: "Consulte jurisprudência real do DataJud diretamente nos seus prompts para fundamentação atualizada." },
  { icon: Shield, title: "Validação Planalto", desc: "Verifique automaticamente se a legislação citada está vigente com integração ao portal Planalto." },
  { icon: Zap, title: "Workflows por Área", desc: "Fluxos guiados para petições, recursos, contratos e pareceres. Do fato à peça em minutos." },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden" style={{ background: "#1a1a2e" }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a227] rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1e3a5f] rounded-full blur-[200px]" />
      </div>
      <div className="container relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="text-center mb-16"
        >
          <motion.span variants={fadeUp} custom={0} className="text-[#c9a227] font-semibold text-sm uppercase tracking-wider">Recursos</motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3 text-white" style={{ fontFamily: FONT_DISPLAY }}>
            Tudo que você precisa para produzir melhor com IA
          </motion.h2>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i}>
              <Card className="bg-white/5 border-white/10 p-6 h-full hover:bg-white/[0.08] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center mb-4 group-hover:bg-[#c9a227]/20 transition-colors">
                  <f.icon className="w-5 h-5 text-[#c9a227]" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── LIBRARY ─── */
const areas = [
  { name: "Trabalhista", icon: Gavel },
  { name: "Consumidor", icon: Users },
  { name: "Família", icon: Users },
  { name: "Penal", icon: Lock },
  { name: "Contratos", icon: FileText },
  { name: "Tributário", icon: Scale },
];

function LibrarySection() {
  return (
    <section id="biblioteca" className="py-24" style={{ background: "#1a2332" }}>
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.span variants={fadeUp} custom={0} className="text-[#c9a227] font-semibold text-sm uppercase tracking-wider">Biblioteca de Prompts</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3 text-white" style={{ fontFamily: FONT_DISPLAY }}>
              Prompts prontos por área jurídica
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 text-lg mt-4 leading-relaxed">
              Acesse modelos de prompts testados e validados para as principais áreas do Direito. Cada prompt inclui contexto, formato, critérios e exemplos de uso.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="grid grid-cols-2 gap-3 mt-8">
              {areas.map((a) => (
                <div key={a.name} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <a.icon className="w-4 h-4 text-[#c9a227]" />
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-white/50">Explorar prompts</p>
                  </div>
                </div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="mt-8">
              <Link href="/biblioteca-publica">
                <Button className="bg-[#c9a227] hover:bg-[#b89220] text-[#1a1a2e] font-semibold px-6 h-11 rounded-md transition-transform active:scale-[0.97]">
                  Acessar biblioteca gratuita
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <div className="rounded-xl overflow-hidden shadow-xl border border-white/10">
              <img src={LIBRARY_IMG} alt="Biblioteca de prompts jurídicos organizada por área" className="w-full h-auto" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── COMPARISON ─── */
function ComparisonSection() {
  return (
    <section className="py-24" style={{ background: "#1e2a3a" }}>
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="text-center mb-12"
        >
          <motion.span variants={fadeUp} custom={0} className="text-[#c9a227] font-semibold text-sm uppercase tracking-wider">Comparativo</motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3 text-white" style={{ fontFamily: FONT_DISPLAY }}>
            Por que usar o PromptJur em vez de ChatGPT genérico?
          </motion.h2>
        </motion.div>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-[1fr_auto_auto] gap-0 text-sm">
            {/* Header */}
            <div className="p-4 font-semibold text-white/60 border-b border-white/10">Recurso</div>
            <div className="p-4 font-semibold text-center border-b border-white/10 min-w-[120px] text-white/60">ChatGPT genérico</div>
            <div className="p-4 font-semibold text-center border-b border-white/10 min-w-[120px] bg-[#c9a227]/5 text-[#c9a227]">PromptJur</div>
            {/* Rows */}
            {[
              ["Prompts estruturados para Direito brasileiro", false, true],
              ["Modelos por área jurídica", false, true],
              ["Validação de legislação vigente", false, true],
              ["Jurisprudência real (DataJud)", false, true],
              ["Exportação DOCX/PDF/ABNT", false, true],
              ["Multi-IA (GPT, Claude, Gemini)", false, true],
              ["Governança e LGPD", false, true],
              ["Workflows guiados por tipo de peça", false, true],
              ["Suporte a contexto jurídico", false, true],
            ].map(([label, generic, pj], i) => (
              <div key={i} className="contents">
                <div className={`p-4 border-b border-white/5 text-white/70 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>{label as string}</div>
                <div className={`p-4 border-b border-white/5 text-center ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                  {generic ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <span className="text-red-400/60">—</span>}
                </div>
                <div className={`p-4 border-b border-white/5 text-center bg-[#c9a227]/5 ${i % 2 === 0 ? "bg-[#c9a227]/[0.07]" : ""}`}>
                  {pj ? <CheckCircle2 className="w-4 h-4 text-[#c9a227] mx-auto" /> : <span className="text-red-400/60">—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TRUST ─── */
function TrustSection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "#1a1a2e" }}>
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <img src={TRUST_IMG} alt="Balança da justiça com elementos digitais representando IA responsável" className="w-full max-w-md mx-auto" />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.span variants={fadeUp} custom={0} className="text-[#c9a227] font-semibold text-sm uppercase tracking-wider">Confiança e Governança</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3 text-white" style={{ fontFamily: FONT_DISPLAY }}>
              IA jurídica responsável e alinhada à OAB
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/70 text-lg mt-4 leading-relaxed">
              O PromptJur segue as recomendações da OAB e do CNJ para uso de IA na prática jurídica. Cada resultado inclui aviso de revisão humana, rastreabilidade e limites claros.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 space-y-4">
              {[
                "Supervisão humana obrigatória em todos os outputs",
                "Conformidade com LGPD e sigilo profissional",
                "Fontes rastreáveis e legislação verificável",
                "Aviso de limitações da IA em cada resultado",
                "Sem armazenamento de dados sensíveis do caso",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#c9a227] mt-0.5 shrink-0" />
                  <span className="text-white/80 text-sm">{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
function PricingSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section id="planos" className="py-24" style={{ background: "#1a2332" }}>
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="text-center mb-16"
        >
          <motion.span variants={fadeUp} custom={0} className="text-[#c9a227] font-semibold text-sm uppercase tracking-wider">Planos</motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3 text-white" style={{ fontFamily: FONT_DISPLAY }}>
            Escolha o plano ideal para sua prática
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free */}
          <Card className="p-6 border-white/10 bg-white/5 relative">
            <h3 className="text-lg font-bold text-white">Gratuito</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-white" style={{ fontFamily: FONT_DISPLAY }}>R$ 0</span>
              <span className="text-white/50 text-sm">/mês</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-white/60">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> 12 operações/mês</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> 10 prompts públicos</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Exportação básica</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> 1 modelo de IA</li>
            </ul>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline" className="w-full h-11 font-semibold border-white/20 text-white hover:bg-white/5">Acessar Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline" className="w-full h-11 font-semibold border-white/20 text-white hover:bg-white/5">Começar grátis</Button>
              </a>
            )}
          </Card>

          {/* Pro */}
          <Card className="p-6 border-[#c9a227]/50 bg-[#c9a227]/5 relative shadow-lg shadow-[#c9a227]/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a227] text-[#1a1a2e] text-xs font-bold px-3 py-1 rounded-full">
              MAIS POPULAR
            </div>
            <h3 className="text-lg font-bold text-white">Profissional</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-white" style={{ fontFamily: FONT_DISPLAY }}>R$ 49,90</span>
              <span className="text-white/50 text-sm">/mês</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-white/60">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> 300 operações/mês</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Biblioteca completa</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Multi-IA (GPT, Claude, Gemini)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Exportação DOCX/PDF/ABNT</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Knowledge Retrieval DataJud</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Validação Planalto</li>
            </ul>
            <Link href="/planos">
              <Button className="w-full h-11 bg-[#c9a227] hover:bg-[#b89220] text-[#1a1a2e] font-bold transition-transform active:scale-[0.97]">
                Assinar Profissional
              </Button>
            </Link>
          </Card>

          {/* Enterprise */}
          <Card className="p-6 border-white/10 bg-white/5 relative">
            <h3 className="text-lg font-bold text-white">Escritório</h3>
            <div className="mt-4 mb-6">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: FONT_DISPLAY }}>Sob consulta</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-white/60">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Multiusuário</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Workflows personalizados</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Onboarding e treinamento</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> API e integrações</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> SLA e gerente de conta</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c9a227]" /> Biblioteca interna do escritório</li>
            </ul>
            <Link href="/planos">
              <Button variant="outline" className="w-full h-11 font-semibold border-white/20 text-white hover:bg-white/5">Falar com consultor</Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ─── CONTACT SECTION (reaproveitando FormContato existente) ─── */
function ContactSection() {
  return (
    <section className="py-24" style={{ background: "#1a1a2e" }} id="contato">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Texto */}
          <div>
            <span className="text-[#c9a227] font-semibold text-sm uppercase tracking-wider">Fale Conosco</span>
            <h3 className="text-3xl md:text-4xl font-bold text-white mt-3" style={{ fontFamily: FONT_DISPLAY }}>
              Tem alguma dúvida ou sugestão?
            </h3>
            <p className="text-white/60 text-lg mt-4 leading-relaxed">
              Nossa equipe está pronta para ajudar. Envie sua mensagem e retornaremos em até 2 dias úteis.
            </p>
            <ul className="space-y-3 mt-6">
              {[
                "Dúvidas sobre planos e funcionalidades",
                "Suporte técnico e resolução de problemas",
                "Propostas de parceria e integração",
                "Feedback e sugestões de melhoria",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle2 className="w-4 h-4 text-[#c9a227] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* Formulário existente */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8">
            <FormContato compact />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA FINAL ─── */
function CTASection() {
  const [email, setEmail] = useState("");
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "#0f0f1a" }}>
      <div className="absolute inset-0 opacity-20">
        <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="container relative z-10 text-center max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: FONT_DISPLAY }}>
            Comece agora: receba <span className="text-[#c9a227]">25 prompts jurídicos gratuitos</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-white/70 text-lg mt-4">
            Cadastre seu e-mail e receba imediatamente uma seleção de prompts profissionais para petições, contratos e pareceres.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="seu@email.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 px-4 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 text-sm"
            />
            <Button className="bg-[#c9a227] hover:bg-[#b89220] text-[#1a1a2e] font-bold h-12 px-6 rounded-md transition-transform active:scale-[0.97] whitespace-nowrap">
              Receber prompts grátis
            </Button>
          </motion.div>
          <motion.p variants={fadeUp} custom={3} className="text-white/40 text-xs mt-4">
            Sem spam. Você pode cancelar a qualquer momento. Respeitamos a LGPD.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const faqItems = [
  {
    q: "O PromptJur substitui o advogado?",
    a: "Não. O PromptJur é uma ferramenta de produtividade que auxilia o profissional a estruturar comandos para IA. Todo resultado gerado exige revisão humana obrigatória. A responsabilidade técnica permanece com o advogado, conforme recomendações da OAB.",
  },
  {
    q: "Meus dados e os dados dos clientes ficam seguros?",
    a: "Sim. O PromptJur não armazena dados sensíveis dos casos. As interações são processadas com criptografia em trânsito e em repouso. Seguimos as diretrizes da LGPD e do sigilo profissional advocatício.",
  },
  {
    q: "Posso usar o PromptJur em conformidade com a OAB?",
    a: "Sim. O PromptJur foi projetado seguindo as recomendações da OAB e do CNJ para uso de IA na prática jurídica. Cada resultado inclui aviso de limitações e necessidade de supervisão humana.",
  },
  {
    q: "Qual a diferença entre o plano gratuito e o profissional?",
    a: "O plano gratuito oferece 12 operações/mês com 1 modelo de IA e exportação básica. O profissional oferece 300 operações, acesso a múltiplos modelos (GPT-4, Claude, Gemini), exportação DOCX/PDF/ABNT, Knowledge Retrieval do DataJud e validação de legislação via Planalto.",
  },
  {
    q: "Preciso de cartão de crédito para testar?",
    a: "Não. O plano gratuito não exige cartão. Você pode experimentar o PromptJur imediatamente com 12 operações por mês, sem compromisso.",
  },
  {
    q: "O que são 'operações' no PromptJur?",
    a: "Cada operação corresponde a uma interação completa com a IA: gerar uma peça, analisar um documento, consultar jurisprudência ou executar um workflow. Cada envio de prompt conta como 1 operação.",
  },
  {
    q: "Posso cancelar a assinatura a qualquer momento?",
    a: "Sim. Não há fidelidade. Você pode cancelar pelo portal de assinatura a qualquer momento e continuará com acesso até o fim do período pago.",
  },
];

function FAQSection() {
  return (
    <section id="faq" className="py-24" style={{ background: "#1a1a2e" }}>
      <div className="container max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="text-center mb-12"
        >
          <motion.span variants={fadeUp} custom={0} className="text-[#c9a227] font-semibold text-sm uppercase tracking-wider">Perguntas Frequentes</motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mt-3 text-white" style={{ fontFamily: FONT_DISPLAY }}>
            Tire suas dúvidas
          </motion.h2>
        </motion.div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-white/10 rounded-lg px-6 bg-white/[0.02] data-[state=open]:bg-white/[0.05] transition-colors">
              <AccordionTrigger className="text-white text-left font-medium text-sm md:text-base py-4 hover:no-underline hover:text-[#c9a227] transition-colors">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-white/60 text-sm leading-relaxed pb-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─── SOCIAL PROOF BANNER ─── */
function SocialProofBanner() {
  const { data: countData } = trpc.stripe.getInteressadosCount.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const totalInteressados = countData?.count ?? 0;

  // Só exibe se houver pelo menos 5 interessados
  if (totalInteressados < 5) return null;

  return (
    <section className="py-8" style={{ background: "#151525" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#c9a227]" />
            <span className="text-white/80 text-sm">
              <strong className="text-[#c9a227]">{totalInteressados}+</strong> profissionais do Direito já se cadastraram
            </span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/40" />
            <span className="text-white/50 text-sm">Advogados em todo o Brasil</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── EXIT INTENT POPUP ─── */
function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Não mostrar para usuários logados
    if (isAuthenticated) return;
    // Não mostrar se já foi exibido nesta sessão
    if (sessionStorage.getItem("exitIntentShown")) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        setShow(true);
        sessionStorage.setItem("exitIntentShown", "true");
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };

    // Delay para não disparar imediatamente
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 8000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isAuthenticated]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShow(false)} />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-[#1a1a2e] border border-[#c9a227]/30 rounded-xl p-8 max-w-md w-full shadow-2xl"
          >
            <button
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {!submitted ? (
              <>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#c9a227]/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-[#c9a227]" />
                  </div>
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: FONT_DISPLAY }}>
                    Antes de sair...
                  </h3>
                  <p className="text-white/60 text-sm mt-2 leading-relaxed">
                    Receba <strong className="text-[#c9a227]">25 prompts jurídicos gratuitos</strong> no seu e-mail. Modelos prontos para petições, contratos e pareceres.
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <input
                    type="email"
                    placeholder="seu@email.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 text-sm"
                  />
                  <Button
                    onClick={() => {
                      if (email.includes("@")) setSubmitted(true);
                    }}
                    className="w-full bg-[#c9a227] hover:bg-[#b89220] text-[#1a1a2e] font-bold h-11 rounded-md transition-transform active:scale-[0.97]"
                  >
                    Receber prompts grátis
                  </Button>
                </div>
                <p className="text-white/30 text-xs text-center mt-3">Sem spam. Respeitamos a LGPD.</p>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: FONT_DISPLAY }}>Pronto!</h3>
                <p className="text-white/60 text-sm mt-2">Verifique sua caixa de entrada. Os prompts estão a caminho.</p>
                <Button
                  onClick={() => setShow(false)}
                  variant="outline"
                  className="mt-4 border-white/20 text-white hover:bg-white/5"
                >
                  Fechar
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-12" style={{ background: "#0a0a14" }}>
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-[#c9a227]" />
              <span className="text-white font-bold" style={{ fontFamily: FONT_DISPLAY }}>{APP_TITLE}</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Inteligência artificial aplicada ao universo jurídico com método, governança e foco na advocacia brasileira.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Produto</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><a href="#features" className="hover:text-[#c9a227] transition-colors">Recursos</a></li>
              <li><Link href="/biblioteca-publica" className="hover:text-[#c9a227] transition-colors">Biblioteca</Link></li>
              <li><Link href="/planos" className="hover:text-[#c9a227] transition-colors">Planos</Link></li>
              <li><Link href="/tutoriais" className="hover:text-[#c9a227] transition-colors">Tutoriais</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Jurídico</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><Link href="/termos" className="hover:text-[#c9a227] transition-colors">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-[#c9a227] transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/privacidade" className="hover:text-[#c9a227] transition-colors">LGPD</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contato</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><a href="mailto:contato@promptjur.com" className="hover:text-[#c9a227] transition-colors">contato@promptjur.com</a></li>
              <li><Link href="/contato" className="hover:text-[#c9a227] transition-colors">Formulário de contato</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs">© 2025 {APP_TITLE}. Todos os direitos reservados.</p>
          <p className="text-white/30 text-xs">Feito para advogados que querem produzir melhor com IA.</p>
        </div>
      </div>
    </footer>
  );
}
