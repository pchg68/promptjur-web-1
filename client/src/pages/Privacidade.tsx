/**
 * Política de Privacidade — PromptJur
 * Conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Scale, ArrowLeft, Shield, Lock, Eye, UserCheck, Trash2, Mail, Clock, Globe, FileText } from "lucide-react";
import { APP_TITLE } from "@/const";

const LAST_UPDATED = "30 de março de 2026";
const CONTACT_EMAIL = "privacidade@promptjur.com";
const COMPANY_NAME = "PromptJur";

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ id, icon, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">{icon}</div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="text-gray-300 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

const TOC = [
  { id: "introducao", label: "Introdução" },
  { id: "dados-coletados", label: "Dados Coletados" },
  { id: "finalidade", label: "Finalidade do Tratamento" },
  { id: "base-legal", label: "Base Legal (LGPD)" },
  { id: "compartilhamento", label: "Compartilhamento" },
  { id: "retencao", label: "Retenção de Dados" },
  { id: "direitos", label: "Seus Direitos" },
  { id: "seguranca", label: "Segurança" },
  { id: "cookies", label: "Cookies" },
  { id: "menores", label: "Menores de Idade" },
  { id: "alteracoes", label: "Alterações" },
  { id: "contato", label: "Contato" },
];

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0f1a]/95 backdrop-blur border-b border-[#1e3a5f]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors">
              <Scale className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-lg">{APP_TITLE}</span>
            </a>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="border-[#1e3a5f] text-gray-300 hover:bg-[#1a2332]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex gap-12">
          {/* Table of Contents — sticky sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Índice</p>
              <nav className="space-y-1">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-gray-400 hover:text-blue-400 transition-colors py-1"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-10">
            {/* Title */}
            <div className="border-b border-[#1e3a5f] pb-8">
              <div className="flex items-center gap-2 text-blue-400 text-sm mb-3">
                <Shield className="w-4 h-4" />
                <span>Documento Legal</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">Política de Privacidade</h1>
              <p className="text-gray-400">
                Última atualização: <span className="text-gray-300">{LAST_UPDATED}</span>
              </p>
              <p className="text-gray-400 mt-2 text-sm">
                Esta política descreve como o {COMPANY_NAME} coleta, usa e protege seus dados pessoais,
                em conformidade com a{" "}
                <strong className="text-gray-300">Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.
              </p>
            </div>

            {/* 1. Introdução */}
            <Section id="introducao" icon={<FileText className="w-5 h-5" />} title="1. Introdução">
              <p>
                O <strong className="text-white">{COMPANY_NAME}</strong> é uma plataforma de inteligência artificial
                especializada em engenharia de prompts jurídicos, desenvolvida para auxiliar advogados, estudantes de
                direito e profissionais jurídicos na criação, análise e otimização de documentos legais.
              </p>
              <p>
                Ao utilizar nossos serviços, você concorda com as práticas descritas nesta Política de Privacidade.
                Caso não concorde com algum ponto, recomendamos que não utilize a plataforma.
              </p>
              <p>
                O controlador dos seus dados pessoais é o {COMPANY_NAME}, com canal de contato disponível em{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Section>

            {/* 2. Dados Coletados */}
            <Section id="dados-coletados" icon={<Eye className="w-5 h-5" />} title="2. Dados Coletados">
              <p>Coletamos os seguintes tipos de dados pessoais:</p>

              <div className="space-y-4 mt-2">
                <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                  <h3 className="font-semibold text-white mb-2">2.1 Dados de Cadastro e Autenticação</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Nome completo</li>
                    <li>Endereço de e-mail</li>
                    <li>Identificador único OAuth (openId)</li>
                    <li>Método de login utilizado</li>
                    <li>Data e hora do último acesso</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                  <h3 className="font-semibold text-white mb-2">2.2 Dados de Uso da Plataforma</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Prompts jurídicos inseridos, gerados e otimizados</li>
                    <li>Histórico de operações (análise, geração, otimização)</li>
                    <li>Templates salvos e personalizados</li>
                    <li>Preferências de configuração</li>
                    <li>Métricas de uso (número de operações, tempo de processamento)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                  <h3 className="font-semibold text-white mb-2">2.3 Dados Técnicos</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Endereço IP (para segurança e prevenção de fraudes)</li>
                    <li>Tipo de navegador e sistema operacional</li>
                    <li>Logs de erros e diagnósticos (via Sentry)</li>
                    <li>Cookies de sessão</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                  <h3 className="font-semibold text-white mb-2">2.4 Dados Comerciais (Plano Enterprise)</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Nome do escritório de advocacia</li>
                    <li>Número de advogados</li>
                    <li>Áreas jurídicas de atuação</li>
                    <li>Mensagem de contato</li>
                  </ul>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-400">
                <strong className="text-gray-300">Importante:</strong> Não coletamos dados sensíveis como CPF, RG,
                dados bancários ou informações de saúde. Os prompts jurídicos inseridos são processados para
                prestação do serviço e não são compartilhados com terceiros sem sua autorização.
              </p>
            </Section>

            {/* 3. Finalidade */}
            <Section id="finalidade" icon={<UserCheck className="w-5 h-5" />} title="3. Finalidade do Tratamento">
              <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                {[
                  { title: "Prestação do Serviço", desc: "Processar seus prompts, gerar análises e otimizações jurídicas com IA." },
                  { title: "Autenticação", desc: "Identificar e autenticar sua conta de forma segura via OAuth." },
                  { title: "Personalização", desc: "Salvar preferências, histórico e templates para melhorar sua experiência." },
                  { title: "Suporte", desc: "Responder dúvidas, resolver problemas técnicos e melhorar o serviço." },
                  { title: "Segurança", desc: "Detectar e prevenir fraudes, abusos e atividades maliciosas." },
                  { title: "Faturamento", desc: "Processar pagamentos de assinaturas via Stripe de forma segura." },
                  { title: "Comunicação", desc: "Enviar notificações sobre o serviço, atualizações e novidades (com seu consentimento)." },
                  { title: "Melhoria do Produto", desc: "Analisar padrões de uso agregados para aprimorar funcionalidades." },
                ].map((item) => (
                  <div key={item.title} className="p-3 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                    <p className="font-medium text-white text-sm">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 4. Base Legal */}
            <Section id="base-legal" icon={<Scale className="w-5 h-5" />} title="4. Base Legal (LGPD)">
              <p>
                O tratamento dos seus dados pessoais está fundamentado nas seguintes bases legais previstas no
                Art. 7º da LGPD:
              </p>
              <div className="space-y-3 mt-3">
                {[
                  {
                    base: "Execução de Contrato (Art. 7º, V)",
                    desc: "Dados necessários para prestação dos serviços contratados (autenticação, processamento de prompts, histórico).",
                  },
                  {
                    base: "Legítimo Interesse (Art. 7º, IX)",
                    desc: "Dados técnicos para segurança, prevenção de fraudes e melhoria do serviço.",
                  },
                  {
                    base: "Consentimento (Art. 7º, I)",
                    desc: "Comunicações de marketing e notificações opcionais, com possibilidade de revogação a qualquer momento.",
                  },
                  {
                    base: "Cumprimento de Obrigação Legal (Art. 7º, II)",
                    desc: "Retenção de logs para cumprimento de obrigações legais e regulatórias.",
                  },
                ].map((item) => (
                  <div key={item.base} className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                    <p className="font-semibold text-blue-400 text-sm">{item.base}</p>
                    <p className="text-sm text-gray-300 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 5. Compartilhamento */}
            <Section id="compartilhamento" icon={<Globe className="w-5 h-5" />} title="5. Compartilhamento de Dados">
              <p>
                Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.
                O compartilhamento ocorre apenas nas seguintes situações:
              </p>
              <div className="space-y-3 mt-3">
                {[
                  {
                    name: "Provedores de IA (Anthropic, Google, Perplexity)",
                    desc: "Os prompts são enviados às APIs de IA para processamento. Cada provedor possui sua própria política de privacidade e não retém dados além do necessário para a resposta.",
                    link: null,
                  },
                  {
                    name: "Stripe",
                    desc: "Dados de pagamento são processados exclusivamente pelo Stripe. Não armazenamos dados de cartão de crédito.",
                    link: "https://stripe.com/br/privacy",
                  },
                  {
                    name: "Sentry",
                    desc: "Logs de erros técnicos são enviados ao Sentry para diagnóstico. Dados pessoais são anonimizados antes do envio.",
                    link: "https://sentry.io/privacy/",
                  },
                  {
                    name: "Autoridades Legais",
                    desc: "Podemos divulgar dados quando exigido por lei, ordem judicial ou autoridade competente.",
                    link: null,
                  },
                ].map((item) => (
                  <div key={item.name} className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                    <p className="font-semibold text-white text-sm">{item.name}</p>
                    <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 block">
                        Ver política de privacidade →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* 6. Retenção */}
            <Section id="retencao" icon={<Clock className="w-5 h-5" />} title="6. Retenção de Dados">
              <p>Mantemos seus dados pelo tempo necessário para as finalidades descritas:</p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#1a2332]">
                      <th className="text-left p-3 text-gray-300 border border-[#1e3a5f]">Tipo de Dado</th>
                      <th className="text-left p-3 text-gray-300 border border-[#1e3a5f]">Período de Retenção</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Dados de conta", "Enquanto a conta estiver ativa + 5 anos após encerramento"],
                      ["Histórico de prompts", "Enquanto a conta estiver ativa (excluível a qualquer momento)"],
                      ["Logs de acesso", "90 dias"],
                      ["Logs de erros (Sentry)", "30 dias"],
                      ["Dados de pagamento", "Conforme exigido pela legislação fiscal (5 anos)"],
                      ["Leads Enterprise", "3 anos após o contato"],
                    ].map(([tipo, periodo]) => (
                      <tr key={tipo} className="border-b border-[#1e3a5f]">
                        <td className="p-3 text-gray-300 border border-[#1e3a5f]">{tipo}</td>
                        <td className="p-3 text-gray-400 border border-[#1e3a5f]">{periodo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* 7. Direitos */}
            <Section id="direitos" icon={<UserCheck className="w-5 h-5" />} title="7. Seus Direitos (Art. 18 LGPD)">
              <p>
                Como titular de dados pessoais, você possui os seguintes direitos garantidos pela LGPD, que podem
                ser exercidos a qualquer momento:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                {[
                  { right: "Confirmação e Acesso", desc: "Confirmar se tratamos seus dados e acessar uma cópia." },
                  { right: "Correção", desc: "Corrigir dados incompletos, inexatos ou desatualizados." },
                  { right: "Anonimização ou Eliminação", desc: "Solicitar anonimização ou eliminação de dados desnecessários." },
                  { right: "Portabilidade", desc: "Receber seus dados em formato estruturado e legível por máquina." },
                  { right: "Eliminação", desc: "Solicitar a exclusão de dados tratados com base no consentimento." },
                  { right: "Informação sobre Compartilhamento", desc: "Saber com quais entidades seus dados são compartilhados." },
                  { right: "Revogação do Consentimento", desc: "Revogar o consentimento dado anteriormente a qualquer momento." },
                  { right: "Oposição", desc: "Opor-se ao tratamento realizado com base em legítimo interesse." },
                ].map((item) => (
                  <div key={item.right} className="p-3 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                    <p className="font-medium text-blue-400 text-sm">{item.right}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">
                Para exercer seus direitos, entre em contato pelo e-mail{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
                  {CONTACT_EMAIL}
                </a>
                . Responderemos em até <strong className="text-white">15 dias úteis</strong>.
              </p>
            </Section>

            {/* 8. Segurança */}
            <Section id="seguranca" icon={<Lock className="w-5 h-5" />} title="8. Segurança dos Dados">
              <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-sm">
                <li>Transmissão de dados via <strong className="text-white">HTTPS/TLS</strong></li>
                <li>Sessões autenticadas com <strong className="text-white">JWT assinado</strong></li>
                <li>Banco de dados com acesso restrito e credenciais rotacionadas</li>
                <li>Backups criptografados com <strong className="text-white">AES-256</strong></li>
                <li>Monitoramento de erros e anomalias em tempo real (Sentry)</li>
                <li>Acesso administrativo restrito a usuários autorizados</li>
                <li>Revisões periódicas de segurança e auditoria de dependências</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                Em caso de incidente de segurança que possa afetar seus dados, notificaremos a ANPD e os titulares
                afetados conforme exigido pelo Art. 48 da LGPD.
              </p>
            </Section>

            {/* 9. Cookies */}
            <Section id="cookies" icon={<Globe className="w-5 h-5" />} title="9. Cookies">
              <p>Utilizamos cookies estritamente necessários para o funcionamento da plataforma:</p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#1a2332]">
                      <th className="text-left p-3 text-gray-300 border border-[#1e3a5f]">Cookie</th>
                      <th className="text-left p-3 text-gray-300 border border-[#1e3a5f]">Finalidade</th>
                      <th className="text-left p-3 text-gray-300 border border-[#1e3a5f]">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["session", "Autenticação e manutenção da sessão do usuário", "Sessão / 7 dias"],
                      ["theme", "Preferência de tema (claro/escuro)", "1 ano"],
                    ].map(([name, purpose, duration]) => (
                      <tr key={name} className="border-b border-[#1e3a5f]">
                        <td className="p-3 font-mono text-blue-400 border border-[#1e3a5f]">{name}</td>
                        <td className="p-3 text-gray-400 border border-[#1e3a5f]">{purpose}</td>
                        <td className="p-3 text-gray-400 border border-[#1e3a5f]">{duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.
              </p>
            </Section>

            {/* 10. Menores */}
            <Section id="menores" icon={<Shield className="w-5 h-5" />} title="10. Menores de Idade">
              <p>
                O {COMPANY_NAME} é destinado exclusivamente a profissionais e estudantes do Direito com{" "}
                <strong className="text-white">18 anos ou mais</strong>. Não coletamos intencionalmente dados
                de menores de idade. Se identificarmos que um menor forneceu dados sem autorização dos responsáveis,
                excluiremos essas informações imediatamente.
              </p>
            </Section>

            {/* 11. Alterações */}
            <Section id="alteracoes" icon={<Clock className="w-5 h-5" />} title="11. Alterações nesta Política">
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas serão
                comunicadas por e-mail ou notificação na plataforma com antecedência mínima de{" "}
                <strong className="text-white">15 dias</strong>. O uso continuado dos serviços após as alterações
                implica aceitação da nova versão.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Versões anteriores desta política podem ser solicitadas pelo e-mail de contato.
              </p>
            </Section>

            {/* 12. Contato */}
            <Section id="contato" icon={<Mail className="w-5 h-5" />} title="12. Contato e Encarregado de Dados">
              <p>
                Para exercer seus direitos, esclarecer dúvidas ou reportar incidentes relacionados à privacidade,
                entre em contato com nosso Encarregado de Proteção de Dados (DPO):
              </p>
              <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f] mt-3">
                <p className="font-semibold text-white">{COMPANY_NAME} — Encarregado de Dados</p>
                <p className="text-sm text-gray-400 mt-1">
                  E-mail:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Prazo de resposta: até <strong className="text-gray-300">15 dias úteis</strong>
                </p>
              </div>
              <p className="text-sm text-gray-400 mt-3">
                Caso não esteja satisfeito com nossa resposta, você pode apresentar reclamação à{" "}
                <a
                  href="https://www.gov.br/anpd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Autoridade Nacional de Proteção de Dados (ANPD)
                </a>
                .
              </p>
            </Section>

            {/* Footer links */}
            <div className="border-t border-[#1e3a5f] pt-6 flex flex-wrap gap-4 text-sm text-gray-400">
              <Link href="/termos">
                <a className="hover:text-blue-400 transition-colors">Termos de Uso</a>
              </Link>
              <Link href="/">
                <a className="hover:text-blue-400 transition-colors">Página Inicial</a>
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-blue-400 transition-colors">
                {CONTACT_EMAIL}
              </a>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
