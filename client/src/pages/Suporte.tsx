/**
 * Página de Suporte — PromptJur
 * Help Center integrado ao dashboard com FAQ, tickets e acesso ao formulário de contato.
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  HelpCircle,
  MessageSquare,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Send,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";

// ─── FAQ Data ────────────────────────────────────────────────────────────────

interface FAQItem {
  pergunta: string;
  resposta: string;
  categoria: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    categoria: "Conta e Acesso",
    pergunta: "Como faço para acessar o PromptJur?",
    resposta:
      "O acesso é feito via convite. Se você recebeu um email de convite, basta clicar no link e fazer login com sua conta Google ou email. Se ainda não tem acesso, entre em contato conosco.",
  },
  {
    categoria: "Conta e Acesso",
    pergunta: "Posso usar em mais de um dispositivo?",
    resposta:
      "Sim! Sua conta funciona em qualquer dispositivo com navegador web. Basta fazer login com a mesma conta em cada dispositivo.",
  },
  {
    categoria: "Funcionalidades",
    pergunta: "Como funciona a geração de prompts?",
    resposta:
      "Você preenche um briefing estruturado (área jurídica, tipo de documento, contexto) e o sistema gera um prompt otimizado usando IA especializada. Pode escolher entre diferentes personas jurídicas para resultados mais precisos.",
  },
  {
    categoria: "Funcionalidades",
    pergunta: "O que é o RAG Jurídico?",
    resposta:
      "RAG (Retrieval-Augmented Generation) é a busca semântica em legislação e jurisprudência. O sistema consulta bases de dados jurídicas reais para fundamentar os prompts com citações verificáveis, reduzindo alucinações.",
  },
  {
    categoria: "Funcionalidades",
    pergunta: "Como funciona a verificação de citações?",
    resposta:
      "O sistema analisa automaticamente cada citação legal no texto gerado (artigos de lei, súmulas, jurisprudência) e verifica se existem nas bases oficiais. Citações não encontradas são sinalizadas como possíveis alucinações.",
  },
  {
    categoria: "Funcionalidades",
    pergunta: "Posso exportar documentos em PDF ou DOCX?",
    resposta:
      "Sim! Todos os documentos podem ser exportados em PDF ou DOCX com formatação ABNT (Arial 12, espaçamento 1,5, tabulação 2cm). Acesse a opção de exportação no menu de cada documento gerado.",
  },
  {
    categoria: "Planos e Pagamentos",
    pergunta: "Qual é o limite do plano gratuito?",
    resposta:
      "O plano gratuito inclui 20 operações de IA por mês, acesso ao modelo econômico (GPT-4o-mini) e funcionalidades básicas de geração e análise de prompts.",
  },
  {
    categoria: "Planos e Pagamentos",
    pergunta: "O que está incluso no plano Pro?",
    resposta:
      "O plano Pro oferece 300 operações/mês, acesso a modelos premium (GPT-4o, Claude 3.5 Sonnet), RAG jurídico completo, verificação de citações, exportação ABNT, comparação de modelos e suporte prioritário.",
  },
  {
    categoria: "Planos e Pagamentos",
    pergunta: "Posso cancelar a qualquer momento?",
    resposta:
      "Sim, o cancelamento pode ser feito a qualquer momento nas Configurações. Você mantém o acesso até o final do período já pago. Não há multa ou taxa de cancelamento.",
  },
  {
    categoria: "Privacidade e Segurança",
    pergunta: "Meus dados estão seguros?",
    resposta:
      "Sim. Utilizamos criptografia TLS em todas as comunicações, os dados são armazenados em servidores seguros e seguimos a LGPD integralmente. Você pode solicitar exclusão completa dos seus dados a qualquer momento.",
  },
  {
    categoria: "Privacidade e Segurança",
    pergunta: "A IA tem acesso aos dados dos meus clientes?",
    resposta:
      "Os dados enviados ao sistema são processados apenas para gerar o resultado solicitado. Não armazenamos o conteúdo dos prompts além do necessário para o histórico do usuário, e nunca compartilhamos com terceiros.",
  },
  {
    categoria: "Privacidade e Segurança",
    pergunta: "O PromptJur está em conformidade com a OAB?",
    resposta:
      "O PromptJur é uma ferramenta de auxílio à redação e pesquisa. A responsabilidade pelo conteúdo final permanece com o advogado. Recomendamos sempre revisar os resultados antes de uso profissional, conforme orientações da OAB sobre uso de IA.",
  },
];

// ─── Componentes ─────────────────────────────────────────────────────────────

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categorias = [...new Set(items.map((i) => i.categoria))];

  return (
    <div className="space-y-6">
      {categorias.map((cat) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {cat}
          </h3>
          <div className="space-y-2">
            {items
              .filter((i) => i.categoria === cat)
              .map((item, idx) => {
                const globalIdx = items.indexOf(item);
                const isOpen = openIndex === globalIdx;
                return (
                  <div
                    key={idx}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground pr-4">
                        {item.pergunta}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                        {item.resposta}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketForm() {
  const [assunto, setAssunto] = useState<string>("suporte");
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const { user } = useAuth();

  const enviarMutation = trpc.contato.enviar.useMutation({
    onSuccess: () => {
      setEnviado(true);
      setMensagem("");
      toast.success("Mensagem enviada com sucesso! Responderemos em até 2 dias úteis.");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar mensagem. Tente novamente.");
    },
  });

  if (enviado) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Mensagem Enviada!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Recebemos sua mensagem e responderemos em até 2 dias úteis.
        </p>
        <Button variant="outline" onClick={() => setEnviado(false)}>
          Enviar outra mensagem
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!mensagem.trim()) return;
        enviarMutation.mutate({
          nome: user?.name || "Usuário",
          email: user?.email || "",
          assunto: assunto as any,
          mensagem: mensagem.trim(),
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Assunto</label>
        <Select value={assunto} onValueChange={setAssunto}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="duvida">Dúvida</SelectItem>
            <SelectItem value="suporte">Suporte Técnico</SelectItem>
            <SelectItem value="feedback">Feedback / Sugestão</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Sua mensagem</label>
        <Textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Descreva sua dúvida ou problema com o máximo de detalhes possível..."
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Mínimo 10 caracteres. Quanto mais detalhes, mais rápido podemos ajudar.
        </p>
      </div>

      <Button
        type="submit"
        disabled={enviarMutation.isPending || mensagem.trim().length < 10}
        className="w-full"
      >
        {enviarMutation.isPending ? (
          "Enviando..."
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Enviar Mensagem
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function Suporte() {
  const { loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"faq" | "ticket">("faq");

  if (loading) return <DashboardLayoutSkeleton />;

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Central de Ajuda</h1>
          <p className="text-muted-foreground">
            Encontre respostas rápidas ou envie uma mensagem para nossa equipe.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo de resposta</p>
                <p className="text-lg font-semibold text-foreground">Até 2 dias úteis</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de resolução</p>
                <p className="text-lg font-semibold text-foreground">98%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Artigos de ajuda</p>
                <p className="text-lg font-semibold text-foreground">12 perguntas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "faq" ? "default" : "outline"}
            onClick={() => setActiveTab("faq")}
            size="sm"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Perguntas Frequentes
          </Button>
          <Button
            variant={activeTab === "ticket" ? "default" : "outline"}
            onClick={() => setActiveTab("ticket")}
            size="sm"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Enviar Mensagem
          </Button>
        </div>

        {/* Content */}
        {activeTab === "faq" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perguntas Frequentes</CardTitle>
            </CardHeader>
            <CardContent>
              <FAQAccordion items={FAQ_ITEMS} />
            </CardContent>
          </Card>
        )}

        {activeTab === "ticket" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enviar Mensagem de Suporte</CardTitle>
                </CardHeader>
                <CardContent>
                  <TicketForm />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Dicas para uma boa mensagem</h3>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      Descreva o problema com detalhes
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      Informe qual funcionalidade estava usando
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      Inclua mensagens de erro, se houver
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      Mencione o navegador e dispositivo
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Outros canais</h3>
                  <div className="space-y-3">
                    <Link
                      href="/contato"
                      className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Formulário público de contato
                    </Link>
                    <a
                      href="mailto:contato@promptjur.com"
                      className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      contato@promptjur.com
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Links úteis */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/tutoriais">
            <Card className="hover:border-blue-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Tutoriais</h3>
                <p className="text-xs text-muted-foreground">
                  Guias passo a passo para todas as funcionalidades
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/privacidade">
            <Card className="hover:border-blue-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Privacidade</h3>
                <p className="text-xs text-muted-foreground">
                  Política de privacidade e proteção de dados
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/termos">
            <Card className="hover:border-blue-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6 text-center">
                <HelpCircle className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Termos de Uso</h3>
                <p className="text-xs text-muted-foreground">
                  Termos de serviço e condições de uso
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
