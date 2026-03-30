/**
 * Termos de Uso — PromptJur
 * Condições gerais de uso da plataforma
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Scale, ArrowLeft, Shield, AlertTriangle, CreditCard, Ban, FileText, Gavel, Clock, Mail } from "lucide-react";
import { APP_TITLE } from "@/const";

const LAST_UPDATED = "30 de março de 2026";
const CONTACT_EMAIL = "contato@promptjur.com";
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
  { id: "aceitacao", label: "Aceitação dos Termos" },
  { id: "descricao", label: "Descrição do Serviço" },
  { id: "elegibilidade", label: "Elegibilidade" },
  { id: "conta", label: "Sua Conta" },
  { id: "uso-aceitavel", label: "Uso Aceitável" },
  { id: "uso-proibido", label: "Uso Proibido" },
  { id: "planos", label: "Planos e Pagamentos" },
  { id: "propriedade-intelectual", label: "Propriedade Intelectual" },
  { id: "limitacao", label: "Limitação de Responsabilidade" },
  { id: "aviso-legal", label: "Aviso Legal Jurídico" },
  { id: "rescisao", label: "Rescisão" },
  { id: "lei-aplicavel", label: "Lei Aplicável" },
  { id: "contato", label: "Contato" },
];

export default function Termos() {
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
          {/* Table of Contents */}
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
                <Gavel className="w-4 h-4" />
                <span>Documento Legal</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">Termos de Uso</h1>
              <p className="text-gray-400">
                Última atualização: <span className="text-gray-300">{LAST_UPDATED}</span>
              </p>
              <p className="text-gray-400 mt-2 text-sm">
                Leia estes Termos de Uso com atenção antes de utilizar o {COMPANY_NAME}. Ao acessar ou usar
                a plataforma, você concorda com estes termos.
              </p>
            </div>

            {/* 1. Aceitação */}
            <Section id="aceitacao" icon={<FileText className="w-5 h-5" />} title="1. Aceitação dos Termos">
              <p>
                Ao acessar ou utilizar o <strong className="text-white">{COMPANY_NAME}</strong> ("Plataforma",
                "Serviço"), você ("Usuário") concorda em ficar vinculado a estes Termos de Uso e à nossa{" "}
                <Link href="/privacidade">
                  <a className="text-blue-400 hover:underline">Política de Privacidade</a>
                </Link>
                , que são incorporados por referência.
              </p>
              <p>
                Se você está aceitando estes termos em nome de uma organização, você declara ter autoridade para
                vincular essa organização a estes termos.
              </p>
              <p>
                Caso não concorde com algum ponto, não utilize a Plataforma.
              </p>
            </Section>

            {/* 2. Descrição */}
            <Section id="descricao" icon={<Scale className="w-5 h-5" />} title="2. Descrição do Serviço">
              <p>
                O {COMPANY_NAME} é uma plataforma de inteligência artificial que oferece ferramentas para:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2 text-sm">
                <li><strong className="text-white">Análise de prompts jurídicos</strong> — identificação de área, qualidade e sugestões de melhoria</li>
                <li><strong className="text-white">Geração de prompts profissionais</strong> — criação de prompts otimizados para peças jurídicas</li>
                <li><strong className="text-white">Otimização de prompts</strong> — aprimoramento de prompts existentes com técnicas avançadas</li>
                <li><strong className="text-white">Geração de documentos</strong> — criação de minutas e rascunhos de peças jurídicas</li>
                <li><strong className="text-white">Pesquisa jurisprudencial</strong> — busca em tribunais brasileiros</li>
                <li><strong className="text-white">Biblioteca de modelos</strong> — templates profissionais por área jurídica</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                O Serviço está sujeito a alterações, atualizações e melhorias contínuas. Podemos adicionar,
                modificar ou remover funcionalidades a qualquer momento.
              </p>
            </Section>

            {/* 3. Elegibilidade */}
            <Section id="elegibilidade" icon={<Shield className="w-5 h-5" />} title="3. Elegibilidade">
              <p>Para utilizar o {COMPANY_NAME}, você deve:</p>
              <ul className="list-disc list-inside space-y-2 mt-2 text-sm">
                <li>Ter pelo menos <strong className="text-white">18 anos</strong> de idade</li>
                <li>Ser estudante de Direito, advogado, procurador, defensor público ou outro profissional jurídico</li>
                <li>Ter capacidade legal para celebrar contratos vinculantes</li>
                <li>Não estar impedido de usar o serviço por lei aplicável</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                Reservamo-nos o direito de verificar a elegibilidade e recusar o acesso a qualquer usuário.
              </p>
            </Section>

            {/* 4. Conta */}
            <Section id="conta" icon={<Shield className="w-5 h-5" />} title="4. Sua Conta">
              <p>
                Para acessar as funcionalidades da Plataforma, você deve criar uma conta via autenticação OAuth.
                Você é responsável por:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2 text-sm">
                <li>Manter a confidencialidade das suas credenciais de acesso</li>
                <li>Todas as atividades realizadas na sua conta</li>
                <li>Notificar imediatamente o {COMPANY_NAME} sobre qualquer uso não autorizado</li>
                <li>Fornecer informações verdadeiras e atualizadas no cadastro</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                Uma conta por pessoa. É proibido criar múltiplas contas para burlar limites de uso.
              </p>
            </Section>

            {/* 5. Uso Aceitável */}
            <Section id="uso-aceitavel" icon={<FileText className="w-5 h-5" />} title="5. Uso Aceitável">
              <p>Você pode utilizar o {COMPANY_NAME} para:</p>
              <ul className="list-disc list-inside space-y-2 mt-2 text-sm">
                <li>Criar e otimizar prompts para fins jurídicos legítimos</li>
                <li>Gerar rascunhos de peças jurídicas como ponto de partida para revisão profissional</li>
                <li>Pesquisar jurisprudência e legislação para fins de estudo e trabalho</li>
                <li>Desenvolver templates e modelos para uso pessoal ou do seu escritório</li>
                <li>Fins educacionais e de pesquisa jurídica</li>
              </ul>
            </Section>

            {/* 6. Uso Proibido */}
            <Section id="uso-proibido" icon={<Ban className="w-5 h-5" />} title="6. Uso Proibido">
              <p>É expressamente proibido:</p>
              <div className="space-y-2 mt-3">
                {[
                  "Usar a Plataforma para atividades ilegais, fraudulentas ou que violem direitos de terceiros",
                  "Tentar contornar, desabilitar ou interferir nos mecanismos de segurança da Plataforma",
                  "Realizar engenharia reversa, descompilar ou tentar extrair o código-fonte",
                  "Usar bots, scrapers ou automações não autorizadas para acessar o serviço",
                  "Compartilhar credenciais de acesso com terceiros ou revender o acesso",
                  "Inserir conteúdo difamatório, discriminatório, obsceno ou que viole direitos de personalidade",
                  "Usar o serviço para criar documentos jurídicos fraudulentos ou enganosos",
                  "Sobrecarregar intencionalmente a infraestrutura da Plataforma (ataques DDoS)",
                  "Criar múltiplas contas para burlar limites de uso do plano gratuito",
                  "Usar os outputs da IA como substituto para aconselhamento jurídico profissional sem revisão",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <Ban className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* 7. Planos e Pagamentos */}
            <Section id="planos" icon={<CreditCard className="w-5 h-5" />} title="7. Planos e Pagamentos">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                  <h3 className="font-semibold text-white mb-2">7.1 Plano Gratuito</h3>
                  <p className="text-sm text-gray-400">
                    Oferecemos um plano gratuito com limite de 20 operações por mês. Sem necessidade de cartão
                    de crédito. Funcionalidades básicas disponíveis.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                  <h3 className="font-semibold text-white mb-2">7.2 Plano Profissional</h3>
                  <p className="text-sm text-gray-400">
                    Assinatura mensal ou anual processada via Stripe. O valor é cobrado no início de cada
                    período de faturamento. Cancelamento disponível a qualquer momento, com acesso mantido
                    até o final do período pago.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                  <h3 className="font-semibold text-white mb-2">7.3 Plano Escritório (Enterprise)</h3>
                  <p className="text-sm text-gray-400">
                    Preço e condições negociados individualmente. Entre em contato para uma proposta
                    personalizada.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                  <h3 className="font-semibold text-white mb-2">7.4 Reembolsos</h3>
                  <p className="text-sm text-gray-400">
                    Oferecemos reembolso integral em até <strong className="text-gray-300">7 dias</strong> após
                    a primeira assinatura, conforme o Código de Defesa do Consumidor (Art. 49 da Lei 8.078/1990).
                    Após esse prazo, não há reembolso proporcional por cancelamento antecipado.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f]">
                  <h3 className="font-semibold text-white mb-2">7.5 Alterações de Preço</h3>
                  <p className="text-sm text-gray-400">
                    Podemos alterar os preços com aviso prévio de <strong className="text-gray-300">30 dias</strong>.
                    Assinantes ativos terão o preço atual mantido até o próximo ciclo de renovação.
                  </p>
                </div>
              </div>
            </Section>

            {/* 8. Propriedade Intelectual */}
            <Section id="propriedade-intelectual" icon={<Shield className="w-5 h-5" />} title="8. Propriedade Intelectual">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">8.1 Nossa Propriedade</h3>
                  <p className="text-sm">
                    O {COMPANY_NAME}, incluindo seu código-fonte, design, marca, logotipo, algoritmos e
                    conteúdo editorial, é propriedade exclusiva do {COMPANY_NAME} e protegido por leis de
                    propriedade intelectual.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">8.2 Seus Dados e Conteúdo</h3>
                  <p className="text-sm">
                    Você mantém a propriedade dos prompts que insere e dos documentos que gera. Ao usar a
                    Plataforma, você nos concede uma licença limitada, não exclusiva e revogável para processar
                    seu conteúdo com o único propósito de prestar o serviço.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">8.3 Outputs da IA</h3>
                  <p className="text-sm">
                    Os textos gerados pela IA são fornecidos para uso do usuário. Não reivindicamos direitos
                    autorais sobre os outputs gerados. Contudo, o usuário é responsável por verificar a
                    originalidade e adequação do conteúdo gerado antes de utilizá-lo.
                  </p>
                </div>
              </div>
            </Section>

            {/* 9. Limitação de Responsabilidade */}
            <Section id="limitacao" icon={<AlertTriangle className="w-5 h-5" />} title="9. Limitação de Responsabilidade">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
                <p className="text-yellow-300 font-semibold text-sm mb-2">⚠️ Importante</p>
                <p className="text-sm text-yellow-200/80">
                  O {COMPANY_NAME} é fornecido "como está", sem garantias de qualquer tipo. Não garantimos
                  que o serviço será ininterrupto, livre de erros ou que os resultados serão precisos.
                </p>
              </div>
              <p>
                Na máxima extensão permitida pela lei aplicável, o {COMPANY_NAME} não será responsável por:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2 text-sm">
                <li>Danos indiretos, incidentais, especiais ou consequenciais</li>
                <li>Perda de dados, lucros cessantes ou danos à reputação</li>
                <li>Decisões tomadas com base nos outputs da IA sem revisão profissional</li>
                <li>Interrupções temporárias do serviço por manutenção ou falhas técnicas</li>
                <li>Imprecisões nos resultados gerados pela inteligência artificial</li>
              </ul>
              <p className="mt-3 text-sm">
                Nossa responsabilidade total, em qualquer hipótese, não excederá o valor pago pelo usuário
                nos últimos 3 meses de assinatura.
              </p>
            </Section>

            {/* 10. Aviso Legal Jurídico */}
            <Section id="aviso-legal" icon={<Gavel className="w-5 h-5" />} title="10. Aviso Legal Jurídico">
              <div className="p-5 rounded-lg bg-[#1a2332] border-2 border-blue-500/40">
                <p className="font-bold text-white mb-3">⚖️ O {COMPANY_NAME} NÃO é um escritório de advocacia</p>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>
                    O {COMPANY_NAME} é uma ferramenta de <strong className="text-white">auxílio tecnológico</strong>{" "}
                    para profissionais jurídicos. Os conteúdos gerados pela plataforma:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong className="text-white">Não constituem aconselhamento jurídico</strong> e não devem ser utilizados como tal</li>
                    <li>Devem ser <strong className="text-white">revisados por advogado habilitado</strong> antes de qualquer uso formal</li>
                    <li>Podem conter imprecisões, informações desatualizadas ou erros</li>
                    <li>Não substituem a análise caso a caso por profissional qualificado</li>
                    <li>Não criam relação advogado-cliente entre o usuário e o {COMPANY_NAME}</li>
                  </ul>
                  <p>
                    O uso dos outputs da IA é de <strong className="text-white">exclusiva responsabilidade do usuário</strong>.
                    Profissionais do Direito devem observar as normas do Código de Ética e Disciplina da OAB e
                    demais regulamentações aplicáveis.
                  </p>
                </div>
              </div>
            </Section>

            {/* 11. Rescisão */}
            <Section id="rescisao" icon={<Clock className="w-5 h-5" />} title="11. Rescisão">
              <p>
                Você pode encerrar sua conta a qualquer momento através das configurações da Plataforma ou
                entrando em contato conosco.
              </p>
              <p>
                Podemos suspender ou encerrar sua conta, com ou sem aviso prévio, se:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2 text-sm">
                <li>Você violar estes Termos de Uso</li>
                <li>Houver suspeita de atividade fraudulenta ou abusiva</li>
                <li>Exigido por lei ou autoridade competente</li>
                <li>O serviço for descontinuado (com aviso prévio de 30 dias)</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                Após o encerramento, seus dados serão tratados conforme a{" "}
                <Link href="/privacidade">
                  <a className="text-blue-400 hover:underline">Política de Privacidade</a>
                </Link>
                .
              </p>
            </Section>

            {/* 12. Lei Aplicável */}
            <Section id="lei-aplicavel" icon={<Gavel className="w-5 h-5" />} title="12. Lei Aplicável e Foro">
              <p>
                Estes Termos de Uso são regidos pelas leis da{" "}
                <strong className="text-white">República Federativa do Brasil</strong>. Fica eleito o foro da
                comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos, com
                renúncia a qualquer outro, por mais privilegiado que seja.
              </p>
              <p className="mt-3 text-sm text-gray-400">
                Aplicam-se, no que couber: o Código Civil (Lei 10.406/2002), o Código de Defesa do Consumidor
                (Lei 8.078/1990), a LGPD (Lei 13.709/2018) e o Marco Civil da Internet (Lei 12.965/2014).
              </p>
            </Section>

            {/* 13. Contato */}
            <Section id="contato" icon={<Mail className="w-5 h-5" />} title="13. Contato">
              <p>
                Para dúvidas, sugestões ou reclamações sobre estes Termos de Uso:
              </p>
              <div className="p-4 rounded-lg bg-[#1a2332] border border-[#1e3a5f] mt-3">
                <p className="font-semibold text-white">{COMPANY_NAME}</p>
                <p className="text-sm text-gray-400 mt-1">
                  E-mail:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Privacidade:{" "}
                  <a href="mailto:privacidade@promptjur.com" className="text-blue-400 hover:underline">
                    privacidade@promptjur.com
                  </a>
                </p>
              </div>
            </Section>

            {/* Footer links */}
            <div className="border-t border-[#1e3a5f] pt-6 flex flex-wrap gap-4 text-sm text-gray-400">
              <Link href="/privacidade">
                <a className="hover:text-blue-400 transition-colors">Política de Privacidade</a>
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
