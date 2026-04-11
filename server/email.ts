/**
 * Módulo de envio de e-mails — PromptJur
 * Usa Resend (https://resend.com) para envio transacional
 * Requer variável de ambiente RESEND_API_KEY
 */
import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY não configurada — e-mails não serão enviados");
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/** URL base da aplicação em produção */
function getAppUrl(): string {
  return process.env.VITE_APP_URL ?? "https://promptjur.com";
}

/** Remetente padrão — deve ser um domínio verificado no Resend */
function getFromAddress(): string {
  // Usa EMAIL_FROM se configurado (qualquer domínio, inclusive promptjur.com).
  // Fallback para onboarding@resend.dev apenas quando EMAIL_FROM não está definido.
  const configured = process.env.EMAIL_FROM;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }
  // Fallback seguro: domínio padrão do Resend (não requer verificação de domínio)
  return "PromptJur <onboarding@resend.dev>";
}

// ─────────────────────────────────────────────────────────────────────────────
// Template HTML de boas-vindas (versão personalizada)
// ─────────────────────────────────────────────────────────────────────────────
function buildWelcomeEmailHtml(opts: {
  nome?: string;
  email: string;
  appUrl: string;
}): string {
  const nomeExibido = opts.nome ?? opts.email.split("@")[0];
  const primeiroNome = nomeExibido.split(" ")[0];
  const ano = new Date().getFullYear();
  const dashboardUrl = `${opts.appUrl}/dashboard`;
  const contatoUrl = `${opts.appUrl}/contato`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>Bem-vindo ao PromptJur</title>
</head>
<body style="margin:0;padding:0;background-color:#060d1a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#060d1a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- ── Logo ── -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);border-radius:14px;padding:13px 22px;">
                    <span style="color:#ffffff;font-size:21px;font-weight:800;letter-spacing:-0.5px;">⚖️&nbsp; PromptJur</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Card principal ── -->
          <tr>
            <td style="background-color:#0f172a;border-radius:20px;border:1px solid #1e293b;overflow:hidden;">

              <!-- Banner hero -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f2d5c 0%,#1e40af 60%,#2563eb 100%);padding:44px 44px 36px;">
                    <p style="margin:0 0 10px;color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">✅ Acesso Liberado</p>
                    <h1 style="margin:0 0 14px;color:#ffffff;font-size:30px;font-weight:800;line-height:1.25;">
                      Olá, ${primeiroNome}!<br/>
                      <span style="color:#93c5fd;">Seu acesso ao PromptJur</span><br/>
                      está liberado.
                    </h1>
                    <p style="margin:0;color:#bfdbfe;font-size:14px;line-height:1.6;">
                      Você foi selecionado(a) para acessar a plataforma de engenharia
                      de prompts jurídicos com inteligência artificial.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Corpo -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 44px;">

                    <!-- Saudação personalizada -->
                    <p style="margin:0 0 10px;color:#e2e8f0;font-size:15px;line-height:1.7;">
                      Caro(a) <strong style="color:#ffffff;">${nomeExibido}</strong>,
                    </p>
                    <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;line-height:1.7;">
                      É com satisfação que informamos que seu e-mail
                      <strong style="color:#cbd5e1;">${opts.email}</strong>
                      foi adicionado à lista de acesso autorizado do PromptJur.
                      A partir de agora, você pode acessar todos os recursos da plataforma
                      e começar a transformar seus prompts jurídicos em peças profissionais
                      com precisão e agilidade.
                    </p>

                    <!-- CTA principal -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);border-radius:12px;box-shadow:0 4px 14px rgba(59,130,246,0.4);">
                          <a href="${dashboardUrl}"
                             style="display:inline-block;padding:15px 36px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">
                            Acessar o Dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr><td style="border-top:1px solid #1e293b;"></td></tr>
                    </table>

                    <!-- Primeiros passos -->
                    <p style="margin:0 0 20px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Primeiros Passos</p>

                    <!-- Passo 1 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:14px;">
                      <tr>
                        <td style="background-color:#0f1f3d;border:1px solid #1e3a5f;border-radius:12px;padding:16px 20px;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width:36px;vertical-align:top;padding-top:1px;">
                                <span style="display:inline-block;width:26px;height:26px;background:#1d4ed8;border-radius:50%;text-align:center;line-height:26px;color:#ffffff;font-size:12px;font-weight:700;">1</span>
                              </td>
                              <td style="padding-left:12px;">
                                <strong style="color:#e2e8f0;font-size:14px;">Faça login com sua conta Manus</strong>
                                <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                                  Acesse <a href="${opts.appUrl}" style="color:#60a5fa;text-decoration:none;">promptjur.com</a> e clique em <em>"Acessar Dashboard"</em>. Use o mesmo e-mail deste convite.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Passo 2 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:14px;">
                      <tr>
                        <td style="background-color:#0f1f3d;border:1px solid #1e3a5f;border-radius:12px;padding:16px 20px;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width:36px;vertical-align:top;padding-top:1px;">
                                <span style="display:inline-block;width:26px;height:26px;background:#1d4ed8;border-radius:50%;text-align:center;line-height:26px;color:#ffffff;font-size:12px;font-weight:700;">2</span>
                              </td>
                              <td style="padding-left:12px;">
                                <strong style="color:#e2e8f0;font-size:14px;">Explore o Gerador de Prompts</strong>
                                <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                                  No menu lateral, clique em <em>"Gerar Prompt"</em>. Selecione o tipo de peça jurídica, preencha os dados e gere seu primeiro prompt profissional.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Passo 3 -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:#0f1f3d;border:1px solid #1e3a5f;border-radius:12px;padding:16px 20px;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width:36px;vertical-align:top;padding-top:1px;">
                                <span style="display:inline-block;width:26px;height:26px;background:#1d4ed8;border-radius:50%;text-align:center;line-height:26px;color:#ffffff;font-size:12px;font-weight:700;">3</span>
                              </td>
                              <td style="padding-left:12px;">
                                <strong style="color:#e2e8f0;font-size:14px;">Salve seus Templates Favoritos</strong>
                                <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                                  Após gerar um prompt, clique em <em>"Salvar"</em> para adicioná-lo à sua biblioteca pessoal e reutilizá-lo a qualquer momento.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                      <tr><td style="border-top:1px solid #1e293b;"></td></tr>
                    </table>

                    <!-- Dica em destaque -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:1px solid #2563eb;border-left:4px solid #3b82f6;border-radius:12px;padding:18px 20px;">
                          <p style="margin:0 0 6px;color:#60a5fa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">💡 Dica de Uso</p>
                          <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.6;">
                            Para melhores resultados, seja específico ao descrever o contexto da peça jurídica:
                            informe a <strong style="color:#e2e8f0;">área do direito</strong>, o
                            <strong style="color:#e2e8f0;">tipo de documento</strong> e os
                            <strong style="color:#e2e8f0;">pontos principais</strong> que devem constar.
                            Quanto mais detalhes, mais preciso será o prompt gerado.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Fase de testes -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:#0d2218;border:1px solid #166534;border-radius:12px;padding:16px 20px;">
                          <p style="margin:0 0 4px;color:#4ade80;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">🧪 Fase de Acesso Antecipado</p>
                          <p style="margin:0;color:#86efac;font-size:13px;line-height:1.6;">
                            Você está entre os primeiros usuários selecionados do PromptJur.
                            Sua experiência e feedback são fundamentais para aprimorarmos a plataforma.
                            Encontrou algo a melhorar?
                            <a href="${contatoUrl}" style="color:#4ade80;text-decoration:underline;">Envie sua sugestão aqui</a>.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Assinatura -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="border-top:1px solid #1e293b;padding-top:24px;">
                          <p style="margin:0 0 4px;color:#94a3b8;font-size:14px;line-height:1.6;">
                            Atenciosamente,
                          </p>
                          <p style="margin:0 0 2px;color:#e2e8f0;font-size:15px;font-weight:700;">Equipe PromptJur</p>
                          <p style="margin:0;color:#475569;font-size:13px;">Sistema de Engenharia de Prompts Jurídicos</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 10px;">
                <a href="${opts.appUrl}" style="color:#3b82f6;text-decoration:none;font-size:13px;margin:0 10px;">Site</a>
                <span style="color:#334155;">·</span>
                <a href="${dashboardUrl}" style="color:#3b82f6;text-decoration:none;font-size:13px;margin:0 10px;">Dashboard</a>
                <span style="color:#334155;">·</span>
                <a href="${contatoUrl}" style="color:#3b82f6;text-decoration:none;font-size:13px;margin:0 10px;">Contato</a>
              </p>
              <p style="margin:0 0 6px;color:#334155;font-size:12px;">
                Este e-mail foi enviado para <strong style="color:#475569;">${opts.email}</strong> porque seu endereço foi adicionado à lista de acesso do PromptJur.
              </p>
              <p style="margin:0;color:#1e293b;font-size:12px;">
                © ${ano} PromptJur — Sistema de Engenharia de Prompts Jurídicos
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Versão texto simples do e-mail de boas-vindas (melhora entregabilidade)
// ─────────────────────────────────────────────────────────────────────────────
function buildWelcomeEmailText(opts: {
  nome?: string;
  email: string;
  appUrl: string;
}): string {
  const nomeExibido = opts.nome ?? opts.email.split("@")[0];
  const primeiroNome = nomeExibido.split(" ")[0];
  const dashboardUrl = `${opts.appUrl}/dashboard`;
  const contatoUrl = `${opts.appUrl}/contato`;
  const ano = new Date().getFullYear();

  return `Olá, ${primeiroNome}!

Seu acesso ao PromptJur foi liberado.

Caro(a) ${nomeExibido},

É com satisfação que informamos que seu e-mail (${opts.email}) foi adicionado à lista de acesso autorizado do PromptJur — a plataforma de engenharia de prompts jurídicos com inteligência artificial.

ACESSE AGORA
${dashboardUrl}

──────────────────────────────
PRIMEIROS PASSOS
──────────────────────────────

1. Faça login com sua conta Manus
   Acesse ${opts.appUrl} e clique em "Acessar Dashboard".
   Use o mesmo e-mail deste convite.

2. Explore o Gerador de Prompts
   No menu lateral, clique em "Gerar Prompt".
   Selecione o tipo de peça jurídica e gere seu primeiro prompt profissional.

3. Salve seus Templates Favoritos
   Após gerar um prompt, clique em "Salvar" para adicioná-lo à sua biblioteca pessoal.

──────────────────────────────
DICA DE USO
──────────────────────────────

Para melhores resultados, seja específico ao descrever o contexto da peça jurídica: informe a área do direito, o tipo de documento e os pontos principais que devem constar. Quanto mais detalhes, mais preciso será o prompt gerado.

──────────────────────────────
FASE DE ACESSO ANTECIPADO
──────────────────────────────

Você está entre os primeiros usuários selecionados do PromptJur. Sua experiência e feedback são fundamentais para aprimorarmos a plataforma. Encontrou algo a melhorar? Envie sua sugestão em: ${contatoUrl}

──────────────────────────────

Atenciosamente,
Equipe PromptJur
Sistema de Engenharia de Prompts Jurídicos

© ${ano} PromptJur — ${opts.appUrl}
Este e-mail foi enviado para ${opts.email} porque seu endereço foi adicionado à lista de acesso do PromptJur.
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções públicas
// ─────────────────────────────────────────────────────────────────────────────

export interface SendWelcomeEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean; // true quando RESEND_API_KEY não está configurada
}

/**
 * Envia e-mail de boas-vindas para um novo usuário adicionado à whitelist
 */
export async function sendWelcomeEmail(opts: {
  email: string;
  nome?: string;
}): Promise<SendWelcomeEmailResult> {
  const resend = getResend();

  if (!resend) {
    console.log(`[Email] Skipped welcome email to ${opts.email} — API key not set`);
    return { success: true, skipped: true };
  }

  const appUrl = getAppUrl();

  try {
    const nomeExibido = opts.nome ?? opts.email.split("@")[0];
    const primeiroNome = nomeExibido.split(" ")[0];
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [opts.email],
      subject: `✅ ${primeiroNome}, seu acesso ao PromptJur foi liberado!`,
      html: buildWelcomeEmailHtml({
        nome: opts.nome,
        email: opts.email,
        appUrl,
      }),
      text: buildWelcomeEmailText({
        nome: opts.nome,
        email: opts.email,
        appUrl,
      }),
    });

    if (error) {
      console.error(`[Email] Failed to send welcome email to ${opts.email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Welcome email sent to ${opts.email} — ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`[Email] Exception sending welcome email to ${opts.email}:`, err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Template HTML de notificação de lançamento
// ─────────────────────────────────────────────────────────────────────────────
function buildLaunchEmailHtml(opts: {
  email: string;
  appUrl: string;
  nome?: string;
}): string {
  const ano = new Date().getFullYear();
  const planosUrl = `${opts.appUrl}/planos`;
  const contatoUrl = `${opts.appUrl}/contato`;
  const nomeDisplay = opts.nome ? opts.nome.split(' ')[0] : 'Advogado(a)';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>PromptJur — Planos pagos disponíveis!</title>
</head>
<body style="margin:0;padding:0;background-color:#060d1a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#060d1a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);border-radius:14px;padding:13px 22px;">
                    <span style="color:#ffffff;font-size:21px;font-weight:800;letter-spacing:-0.5px;">⚖️&nbsp; PromptJur</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background-color:#0f172a;border-radius:20px;border:1px solid #1e293b;overflow:hidden;">

              <!-- Banner hero verde (lançamento) -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:44px 44px 36px;">
                    <p style="margin:0 0 10px;color:#86efac;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">🎉 Grande Novidade</p>
                    <h1 style="margin:0 0 14px;color:#ffffff;font-size:30px;font-weight:800;line-height:1.25;">
                      Olá, ${nomeDisplay}!<br/>
                      <span style="color:#86efac;">Os planos pagos do PromptJur</span><br/>
                      estão disponíveis!
                    </h1>
                    <p style="margin:0;color:#bbf7d0;font-size:14px;line-height:1.6;">
                      Você foi um dos primeiros a demonstrar interesse. Agora é a hora de dar o próximo passo.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Corpo -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 44px;">

                    <p style="margin:0 0 10px;color:#e2e8f0;font-size:15px;line-height:1.7;">
                      Caro(a) <strong style="color:#ffffff;">${opts.nome ?? opts.email.split('@')[0]}</strong>,
                    </p>
                    <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;line-height:1.7;">
                      Você demonstrou interesse nos planos pagos do <strong style="color:#cbd5e1;">PromptJur</strong>
                      e chegou a hora de transformar sua prática jurídica com inteligência artificial.
                      Os planos <strong style="color:#cbd5e1;">Pro</strong> e <strong style="color:#cbd5e1;">Escritório</strong>
                      já estão disponíveis para contratação.
                    </p>

                    <!-- CTA principal -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:36px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#15803d 0%,#22c55e 100%);border-radius:12px;box-shadow:0 4px 14px rgba(34,197,94,0.35);">
                          <a href="${planosUrl}"
                             style="display:inline-block;padding:15px 36px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">
                            Ver Planos e Preços →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr><td style="border-top:1px solid #1e293b;"></td></tr>
                    </table>

                    <!-- Planos disponíveis -->
                    <p style="margin:0 0 16px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Planos Disponíveis</p>

                    <!-- Plano Pro -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:12px;">
                      <tr>
                        <td style="background-color:#0f1f3d;border:1px solid #1e3a5f;border-radius:12px;padding:16px 20px;">
                          <strong style="color:#60a5fa;font-size:14px;">⚡ Plano Pro</strong>
                          <p style="margin:6px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                            300 operações/mês · Modelos profissionais · Exportação DOCX/PDF · Suporte prioritário
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Plano Escritório -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:#0f1f3d;border:1px solid #1e3a5f;border-radius:12px;padding:16px 20px;">
                          <strong style="color:#a78bfa;font-size:14px;">🏢 Plano Escritório</strong>
                          <p style="margin:6px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                            Operações ilimitadas · Múltiplos usuários · Suporte dedicado · Integração com sistemas
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                      <tr><td style="border-top:1px solid #1e293b;"></td></tr>
                    </table>

                    <!-- Dica de uso -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.04));border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px 24px;">
                          <p style="margin:0 0 6px;color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">💡 Dica de Uso</p>
                          <p style="margin:0;color:#6ee7b7;font-size:13px;line-height:1.6;">
                            Comece pelo gerador de <strong>petições iniciais</strong>: preencha os dados do caso,
                            selecione o tipo de ação e o PromptJur gera um prompt estruturado pronto para usar
                            no ChatGPT, Claude ou qualquer outro modelo de IA.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Assinatura -->
                    <p style="margin:0 0 4px;color:#94a3b8;font-size:14px;line-height:1.6;">Com gratidão,</p>
                    <p style="margin:0 0 4px;color:#ffffff;font-size:14px;font-weight:700;">Equipe PromptJur</p>
                    <p style="margin:0;color:#475569;font-size:13px;">
                      Dúvidas? <a href="${contatoUrl}" style="color:#60a5fa;text-decoration:none;">Entre em contato</a>
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;color:#334155;font-size:12px;">
                Este e-mail foi enviado para <strong style="color:#475569;">${opts.email}</strong>
              </p>
              <p style="margin:0 0 6px;color:#1e293b;font-size:12px;">
                <a href="${opts.appUrl}" style="color:#334155;text-decoration:none;">promptjur.com</a>
                &nbsp;·&nbsp;
                <a href="${contatoUrl}" style="color:#334155;text-decoration:none;">Contato</a>
              </p>
              <p style="margin:0;color:#1e293b;font-size:11px;">
                © ${ano} PromptJur — Sistema de Engenharia de Prompts Jurídicos
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Envia e-mail de notificação de lançamento para um interessado
 */
export async function sendLaunchNotificationEmail(opts: {
  email: string;
}): Promise<SendWelcomeEmailResult> {
  const resend = getResend();

  if (!resend) {
    console.log(`[Email] Skipped launch notification to ${opts.email} — API key not set`);
    return { success: true, skipped: true };
  }

  const appUrl = getAppUrl();

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [opts.email],
      subject: "🎉 PromptJur — Os planos pagos estão disponíveis!",
      html: buildLaunchEmailHtml({ email: opts.email, appUrl }),
    });

    if (error) {
      console.error(`[Email] Failed to send launch notification to ${opts.email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Launch notification sent to ${opts.email} — ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`[Email] Exception sending launch notification to ${opts.email}:`, err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}

/**
 * Envia e-mails de boas-vindas em lote (importação em massa)
 * Aguarda 200ms entre cada envio para evitar rate limiting
 */
export async function sendWelcomeEmailBatch(
  recipients: Array<{ email: string; nome?: string }>
): Promise<{ enviados: number; falhas: number; pulados: number }> {
  let enviados = 0;
  let falhas = 0;
  let pulados = 0;

  for (const recipient of recipients) {
    const result = await sendWelcomeEmail(recipient);
    if (result.skipped) {
      pulados++;
    } else if (result.success) {
      enviados++;
    } else {
      falhas++;
    }
    // Pequeno delay entre envios para evitar rate limiting
    if (recipients.length > 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return { enviados, falhas, pulados };
}

// ─────────────────────────────────────────────────────────────────────────────
// Template HTML de confirmação de contato (para o visitante)
// ─────────────────────────────────────────────────────────────────────────────
function buildContactConfirmationHtml(opts: {
  nome: string;
  assunto: string;
  mensagem: string;
  appUrl: string;
}): string {
  const ano = new Date().getFullYear();
  const assuntoLabel: Record<string, string> = {
    duvida: "Dúvida",
    feedback: "Feedback",
    suporte: "Suporte",
    parceria: "Parceria",
    outro: "Outro",
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mensagem recebida — PromptJur</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:12px;padding:12px 20px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">⚖️ PromptJur</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#111827;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e3a5f 0%,#1e40af 100%);padding:40px 40px 32px;">
                    <p style="margin:0 0 8px;color:#93c5fd;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mensagem Recebida</p>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.2;">Obrigado pelo contato, ${opts.nome}!</h1>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 40px;">
                    <p style="margin:0 0 20px;color:#d1d5db;font-size:15px;line-height:1.6;">
                      Recebemos sua mensagem e retornaremos em breve. Confira abaixo o resumo do que foi enviado:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1f2937;border-radius:10px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Assunto</p>
                          <p style="margin:0 0 16px;color:#f3f4f6;font-size:14px;">${assuntoLabel[opts.assunto] ?? opts.assunto}</p>
                          <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Sua mensagem</p>
                          <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.6;">${opts.mensagem.replace(/\n/g, "<br/>")}</p>
                        </td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:10px;">
                          <a href="${opts.appUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                            Visitar o PromptJur →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0;color:#374151;font-size:12px;">© ${ano} PromptJur — Sistema de Engenharia de Prompts Jurídicos</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template HTML de notificação ao admin sobre novo contato
// ─────────────────────────────────────────────────────────────────────────────
function buildContactAdminNotificationHtml(opts: {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  adminUrl: string;
}): string {
  const ano = new Date().getFullYear();
  const assuntoLabel: Record<string, string> = {
    duvida: "Dúvida",
    feedback: "Feedback",
    suporte: "Suporte",
    parceria: "Parceria",
    outro: "Outro",
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Novo contato — PromptJur Admin</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:12px;padding:10px 18px;color:#ffffff;font-size:18px;font-weight:700;">⚖️ PromptJur Admin</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#111827;border-radius:16px;border:1px solid #374151;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#451a03 0%,#92400e 100%);padding:32px 40px;">
                    <p style="margin:0 0 6px;color:#fcd34d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">📬 Novo Contato Recebido</p>
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Mensagem de ${opts.nome}</h1>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1f2937;border-radius:10px;margin-bottom:20px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom:12px;border-bottom:1px solid #374151;">
                                <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Nome</span><br/>
                                <span style="color:#f3f4f6;font-size:14px;font-weight:600;">${opts.nome}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #374151;">
                                <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">E-mail</span><br/>
                                <a href="mailto:${opts.email}" style="color:#60a5fa;font-size:14px;text-decoration:none;">${opts.email}</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #374151;">
                                <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Assunto</span><br/>
                                <span style="color:#f3f4f6;font-size:14px;">${assuntoLabel[opts.assunto] ?? opts.assunto}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:12px;">
                                <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.8px;">Mensagem</span><br/>
                                <p style="margin:6px 0 0;color:#d1d5db;font-size:14px;line-height:1.6;">${opts.mensagem.replace(/\n/g, "<br/>")}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#92400e,#d97706);border-radius:10px;">
                          <a href="${opts.adminUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                            Ver no AdminTools →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;color:#374151;font-size:12px;">© ${ano} PromptJur Admin</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Envia e-mail de confirmação ao visitante que enviou o formulário de contato
 */
export async function sendContactConfirmationEmail(opts: {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
}): Promise<SendWelcomeEmailResult> {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email] Skipped contact confirmation to ${opts.email} — API key not set`);
    return { success: true, skipped: true };
  }
  const appUrl = getAppUrl();
  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [opts.email],
      subject: "✅ Recebemos sua mensagem — PromptJur",
      html: buildContactConfirmationHtml({
        nome: opts.nome,
        assunto: opts.assunto,
        mensagem: opts.mensagem,
        appUrl,
      }),
    });
    if (error) {
      console.error(`[Email] Failed to send contact confirmation to ${opts.email}:`, error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Contact confirmation sent to ${opts.email} — ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`[Email] Exception sending contact confirmation to ${opts.email}:`, err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}

/**
 * Envia e-mail de notificação ao admin sobre novo contato recebido
 */
export async function sendContactAdminNotification(opts: {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  adminEmail: string;
}): Promise<SendWelcomeEmailResult> {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email] Skipped contact admin notification — API key not set`);
    return { success: true, skipped: true };
  }
  const appUrl = getAppUrl();
  const adminUrl = `${appUrl}/admin-tools?tab=mensagens`;
  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [opts.adminEmail],
      subject: `📬 Novo contato: ${opts.nome} — ${opts.assunto}`,
      html: buildContactAdminNotificationHtml({
        nome: opts.nome,
        email: opts.email,
        assunto: opts.assunto,
        mensagem: opts.mensagem,
        adminUrl,
      }),
    });
    if (error) {
      console.error(`[Email] Failed to send contact admin notification:`, error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Contact admin notification sent — ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`[Email] Exception sending contact admin notification:`, err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}
