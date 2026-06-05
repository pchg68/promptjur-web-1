import { Link } from "wouter";
import { Scale, Brain, Zap, Shield, Users, BookOpen, ArrowRight, CheckCircle, Star } from "lucide-react";
import { APP_LOGO } from "@/const";

const funcionalidades = [
  {
    icon: Brain,
    titulo: "Inteligência Artificial Avançada",
    descricao:
      "O PromptJur utiliza modelos de linguagem de última geração para analisar, gerar e otimizar prompts jurídicos com precisão profissional, adaptados ao direito brasileiro.",
  },
  {
    icon: Scale,
    titulo: "Especializado em Direito Brasileiro",
    descricao:
      "Treinado com a legislação, jurisprudência e doutrina do ordenamento jurídico brasileiro, incluindo CPC/2015, CLT, Código Civil, Código Penal e legislação tributária.",
  },
  {
    icon: Zap,
    titulo: "Geração Rápida de Peças Jurídicas",
    descricao:
      "Crie petições iniciais, contestações, recursos, pareceres e contratos em minutos. Economize horas de trabalho com prompts otimizados para cada área do direito.",
  },
  {
    icon: Shield,
    titulo: "Segurança e Confidencialidade",
    descricao:
      "Seus dados e documentos são protegidos com criptografia de ponta a ponta. O PromptJur segue rigorosamente a LGPD (Lei 13.709/2018) e as diretrizes da OAB.",
  },
  {
    icon: Users,
    titulo: "Para Advogados e Escritórios",
    descricao:
      "Planos individuais e corporativos para advogados autônomos, escritórios de advocacia e departamentos jurídicos de empresas de todos os portes.",
  },
  {
    icon: BookOpen,
    titulo: "Biblioteca de Prompts Jurídicos",
    descricao:
      "Acesse uma biblioteca curada com centenas de prompts prontos para as principais áreas do direito: trabalhista, civil, penal, tributário, empresarial e administrativo.",
  },
];

const areasAtuacao = [
  "Direito Civil e de Família",
  "Direito Trabalhista e Previdenciário",
  "Direito Penal e Processual Penal",
  "Direito Tributário e Fiscal",
  "Direito Empresarial e Societário",
  "Direito Administrativo e Público",
  "Direito do Consumidor",
  "Direito Imobiliário",
  "Direito Digital e LGPD",
  "Direito Internacional",
];

const depoimentos = [
  {
    nome: "Dr. Carlos Mendes",
    cargo: "Advogado Trabalhista — OAB/SP",
    texto:
      "O PromptJur transformou minha rotina. Consigo elaborar petições iniciais trabalhistas em 20 minutos, com qualidade que antes levava horas. A IA entende o contexto jurídico brasileiro com precisão impressionante.",
    estrelas: 5,
  },
  {
    nome: "Dra. Ana Paula Ferreira",
    cargo: "Sócia — Escritório Ferreira & Associados",
    texto:
      "Implementamos o PromptJur em todo o escritório. A produtividade aumentou 40% e a qualidade das peças melhorou significativamente. É a ferramenta de legaltech mais completa que já utilizamos.",
    estrelas: 5,
  },
  {
    nome: "Dr. Roberto Lima",
    cargo: "Advogado Tributarista — OAB/RJ",
    texto:
      "Para pareceres tributários complexos, o PromptJur é indispensável. A capacidade de gerar análises de legislação fiscal com referências precisas ao CTN e à jurisprudência do CARF é excepcional.",
    estrelas: 5,
  },
];

export default function Sobre() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header de navegação */}
      <header className="border-b border-white/10 bg-[#0a0f1e]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={APP_LOGO} alt="PromptJur" className="h-8 w-8" />
            <span className="font-bold text-xl text-white">PromptJur</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <Link href="/planos" className="hover:text-white transition-colors">Planos</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/tutoriais" className="hover:text-white transition-colors">Tutoriais</Link>
            <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
          </nav>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Acessar Plataforma
          </Link>
        </div>
      </header>

      {/* Hero da página Sobre */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Scale className="h-4 w-4" />
            Sobre o PromptJur
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            A Plataforma de{" "}
            <span className="text-blue-400">Engenharia de Prompts Jurídicos</span>{" "}
            do Brasil
          </h1>
          <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-8">
            O <strong className="text-white">PromptJur</strong> é a primeira plataforma brasileira especializada em engenharia de prompts jurídicos com inteligência artificial. Desenvolvida para advogados, escritórios de advocacia e departamentos jurídicos que buscam produtividade, precisão e qualidade na elaboração de peças jurídicas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/planos"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Ver Planos e Preços
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors border border-white/20"
            >
              Ler o Blog
              <BookOpen className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* O que é o PromptJur */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              O que é o <span className="text-blue-400">PromptJur</span>?
            </h2>
            <p className="text-white/70 leading-relaxed mb-4">
              O <strong className="text-white">PromptJur</strong> é um sistema de engenharia de prompts jurídicos que combina inteligência artificial avançada com o conhecimento especializado do direito brasileiro. Nossa plataforma permite que advogados e profissionais jurídicos criem, otimizem e reutilizem prompts de alta qualidade para geração de peças jurídicas.
            </p>
            <p className="text-white/70 leading-relaxed mb-4">
              Diferente de ferramentas genéricas de IA, o PromptJur foi desenvolvido especificamente para o contexto jurídico brasileiro, com compreensão profunda da legislação, jurisprudência dos tribunais superiores (STF, STJ, TST, TRF) e das melhores práticas da advocacia nacional.
            </p>
            <p className="text-white/70 leading-relaxed">
              Nossa missão é democratizar o acesso à tecnologia de IA jurídica, permitindo que advogados de todos os portes — desde autônomos até grandes escritórios — aumentem sua produtividade e a qualidade de suas peças jurídicas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { valor: "10.000+", label: "Prompts gerados" },
              { valor: "500+", label: "Advogados ativos" },
              { valor: "95%", label: "Satisfação dos usuários" },
              { valor: "40%", label: "Aumento de produtividade" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
              >
                <div className="text-3xl font-extrabold text-blue-400 mb-2">{stat.valor}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Funcionalidades do <span className="text-blue-400">PromptJur</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Tudo que você precisa para transformar sua prática jurídica com inteligência artificial
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funcionalidades.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.titulo}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.titulo}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.descricao}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Áreas de atuação */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Áreas do Direito <span className="text-blue-400">Suportadas</span>
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              O PromptJur cobre as principais áreas do direito brasileiro, com prompts especializados e otimizados para cada ramo jurídico. Nossa base de conhecimento é atualizada continuamente com as mais recentes alterações legislativas e decisões dos tribunais superiores.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {areasAtuacao.map((area) => (
                <div key={area} className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  {area}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/20 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 text-blue-300">
              Por que escolher o PromptJur?
            </h3>
            <ul className="space-y-4">
              {[
                "Especializado exclusivamente no direito brasileiro",
                "Atualizado com a legislação e jurisprudência vigente",
                "Interface intuitiva desenvolvida para advogados",
                "Suporte técnico especializado em legaltech",
                "Planos acessíveis para todos os portes de escritório",
                "Conformidade com a LGPD e diretrizes da OAB",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                  <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            O que dizem os <span className="text-blue-400">advogados</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Profissionais jurídicos de todo o Brasil já utilizam o PromptJur para transformar sua prática
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {depoimentos.map((d) => (
            <div
              key={d.nome}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: d.estrelas }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4 italic">"{d.texto}"</p>
              <div>
                <div className="font-semibold text-sm">{d.nome}</div>
                <div className="text-white/50 text-xs">{d.cargo}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Comece a usar o <span className="text-blue-400">PromptJur</span> hoje
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Junte-se a centenas de advogados e escritórios que já transformaram sua prática jurídica com inteligência artificial. Experimente gratuitamente e veja a diferença na qualidade e velocidade das suas peças jurídicas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/planos"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
            >
              Ver Planos e Preços
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors border border-white/20 text-lg"
            >
              Falar com a Equipe
            </Link>
          </div>
        </div>
      </section>

      {/* Footer simples */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <img src={APP_LOGO} alt="PromptJur" className="h-5 w-5 opacity-60" />
            <span>© 2026 PromptJur. Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/planos" className="hover:text-white/70 transition-colors">Planos</Link>
            <Link href="/blog" className="hover:text-white/70 transition-colors">Blog</Link>
            <Link href="/tutoriais" className="hover:text-white/70 transition-colors">Tutoriais</Link>
            <Link href="/contato" className="hover:text-white/70 transition-colors">Contato</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
