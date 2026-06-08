/**
 * Página de Contato — PromptJur
 * Página dedicada com formulário de contato e informações de suporte
 */
import FormContato from "@/components/FormContato";
import { Mail, Clock, Shield, MessageSquare, Instagram, Facebook, Linkedin, Github } from "lucide-react";
import { Link } from "wouter";

export default function Contato() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* JSON-LD específico para página de contato */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "@id": "https://promptjur.com/contato",
            "name": "Contato — PromptJur",
            "url": "https://promptjur.com/contato",
            "description": "Entre em contato com a equipe PromptJur para dúvidas, sugestões ou suporte sobre engenharia de prompts jurídicos com IA.",
            "mainEntity": {
              "@type": "Organization",
              "@id": "https://promptjur.com/#organization",
              "name": "PromptJur",
              "url": "https://promptjur.com",
              "email": "contato@promptjur.com",
              "sameAs": [
                "https://www.instagram.com/promptjur/",
                "https://www.facebook.com/profile.php?id=61590492124516",
                "https://www.linkedin.com/company/promptjur",
                "https://github.com/promptjur"
              ]
            }
          })
        }}
      />
      {/* Header simples */}
      <header className="border-b border-gray-800/60 bg-[#0a0f1a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors">
            <span className="text-xl">⚖️</span>
            <span className="font-bold text-lg">PromptJur</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar ao início
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4" />
            Fale Conosco
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Como podemos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              ajudar?
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Tem uma dúvida, sugestão ou quer saber mais sobre o PromptJur?
            Envie sua mensagem e retornaremos em breve.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* Informações de contato — coluna esquerda */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Informações de contato
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">E-mail</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      contato@promptjur.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Tempo de resposta</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Respondemos em até 2 dias úteis
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Privacidade</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Seus dados são protegidos conforme a LGPD
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Redes sociais */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Siga o PromptJur
              </h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.instagram.com/promptjur/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800 text-sm text-gray-400 hover:text-pink-400 hover:border-pink-500/30 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61590492124516"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800 text-sm text-gray-400 hover:text-blue-400 hover:border-blue-500/30 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </a>
                <a
                  href="https://www.linkedin.com/company/promptjur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800 text-sm text-gray-400 hover:text-blue-500 hover:border-blue-600/30 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
                <a
                  href="https://github.com/promptjur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>

            {/* Assuntos frequentes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Assuntos frequentes
              </h3>
              <ul className="space-y-2">
                {[
                  "Como funciona o plano gratuito?",
                  "Posso cancelar a qualquer momento?",
                  "O PromptJur está em conformidade com a OAB?",
                  "Como solicitar acesso antecipado?",
                  "Integração com outros sistemas jurídicos",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Formulário — coluna direita */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-6">
                Envie sua mensagem
              </h2>
              <FormContato />
            </div>
          </div>
        </div>
      </main>

      {/* Footer simples */}
      <footer className="border-t border-gray-800/60 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PromptJur — Sistema de Engenharia de Prompts Jurídicos
        </div>
      </footer>
    </div>
  );
}
