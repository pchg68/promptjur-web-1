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
  return process.env.EMAIL_FROM ?? "PromptJur <noreply@promptjur.com>";
}

// ─────────────────────────────────────────────────────────────────────────────
// Template HTML de boas-vindas
// ─────────────────────────────────────────────────────────────────────────────
function buildWelcomeEmailHtml(opts: {
  nome?: string;
  email: string;
  appUrl: string;
}): string {
  const nomeExibido = opts.nome ?? opts.email.split("@")[0];
  const ano = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao PromptJur</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header com logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:12px;padding:12px 20px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">
                      ⚖️ PromptJur
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background-color:#111827;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">

              <!-- Banner superior -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e3a5f 0%,#1e40af 100%);padding:40px 40px 32px;">
                    <p style="margin:0 0 8px;color:#93c5fd;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                      Acesso Liberado
                    </p>
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.2;">
                      Bem-vindo ao PromptJur,<br/>${nomeExibido}!
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Corpo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 40px;">

                    <p style="margin:0 0 20px;color:#d1d5db;font-size:15px;line-height:1.6;">
                      Seu e-mail foi adicionado à lista de acesso autorizado do
                      <strong style="color:#ffffff;">PromptJur</strong> — a plataforma de
                      engenharia de prompts jurídicos com inteligência artificial.
                    </p>

                    <p style="margin:0 0 28px;color:#d1d5db;font-size:15px;line-height:1.6;">
                      Você já pode acessar a plataforma e começar a transformar seus
                      prompts jurídicos em peças profissionais.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:10px;">
                          <a href="${opts.appUrl}"
                             style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                            Acessar o PromptJur →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-top:1px solid #1f2937;"></td>
                      </tr>
                    </table>

                    <!-- Funcionalidades -->
                    <p style="margin:0 0 16px;color:#9ca3af;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">
                      O que você pode fazer
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #1f2937;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;vertical-align:top;padding-top:2px;">
                                <span style="color:#3b82f6;font-size:16px;">🔍</span>
                              </td>
                              <td>
                                <strong style="color:#f3f4f6;font-size:14px;">Analisar Prompts</strong>
                                <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">
                                  Avalie clareza, precisão jurídica e qualidade técnica
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #1f2937;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;vertical-align:top;padding-top:2px;">
                                <span style="color:#3b82f6;font-size:16px;">✨</span>
                              </td>
                              <td>
                                <strong style="color:#f3f4f6;font-size:14px;">Gerar Prompts Profissionais</strong>
                                <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">
                                  Crie prompts otimizados para petições, contratos e pareceres
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px;vertical-align:top;padding-top:2px;">
                                <span style="color:#3b82f6;font-size:16px;">🚀</span>
                              </td>
                              <td>
                                <strong style="color:#f3f4f6;font-size:14px;">Otimizar e Salvar Templates</strong>
                                <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">
                                  Refine prompts existentes e salve na sua biblioteca pessoal
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Nota de fase de testes -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                      <tr>
                        <td style="background-color:#1c2a1a;border:1px solid #166534;border-radius:8px;padding:14px 16px;">
                          <p style="margin:0;color:#86efac;font-size:13px;line-height:1.5;">
                            <strong>Fase de Testes:</strong> Você está entre os primeiros usuários
                            selecionados. Seu feedback é muito valioso para aprimorarmos a plataforma.
                          </p>
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
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 8px;color:#4b5563;font-size:12px;">
                Este e-mail foi enviado para <strong style="color:#6b7280;">${opts.email}</strong>
              </p>
              <p style="margin:0;color:#374151;font-size:12px;">
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
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [opts.email],
      subject: "🎉 Seu acesso ao PromptJur foi liberado!",
      html: buildWelcomeEmailHtml({
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
}): string {
  const ano = new Date().getFullYear();
  const planosUrl = `${opts.appUrl}/planos`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PromptJur — Planos pagos disponíveis!</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header com logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:12px;padding:12px 20px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">
                      ⚖️ PromptJur
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background-color:#111827;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">

              <!-- Banner superior -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#14532d 0%,#166534 100%);padding:40px 40px 32px;">
                    <p style="margin:0 0 8px;color:#86efac;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                      🎉 Novidade
                    </p>
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.2;">
                      Os planos pagos do PromptJur estão disponíveis!
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Corpo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 40px;">

                    <p style="margin:0 0 20px;color:#d1d5db;font-size:15px;line-height:1.6;">
                      Você demonstrou interesse nos planos pagos do <strong style="color:#ffffff;">PromptJur</strong>.
                      Temos o prazer de informar que os planos <strong style="color:#ffffff;">Pro</strong> e
                      <strong style="color:#ffffff;">Escritório</strong> já estão disponíveis para contratação.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#15803d,#22c55e);border-radius:10px;">
                          <a href="${planosUrl}"
                             style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                            Ver Planos e Preços →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-top:1px solid #1f2937;"></td>
                      </tr>
                    </table>

                    <!-- Planos -->
                    <p style="margin:0 0 16px;color:#9ca3af;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">
                      Planos disponíveis
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #1f2937;">
                          <strong style="color:#f3f4f6;font-size:14px;">⚡ Plano Pro</strong>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">
                            300 operações/mês, modelos profissionais, exportação DOCX/PDF
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;">
                          <strong style="color:#f3f4f6;font-size:14px;">🏢 Plano Escritório</strong>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">
                            Operações ilimitadas, múltiplos usuários, suporte dedicado
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:24px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
                      Você recebeu este e-mail porque demonstrou interesse nos planos pagos do PromptJur.
                      Se não deseja mais receber comunicações, entre em contato conosco.
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 8px;color:#4b5563;font-size:12px;">
                Este e-mail foi enviado para <strong style="color:#6b7280;">${opts.email}</strong>
              </p>
              <p style="margin:0;color:#374151;font-size:12px;">
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
