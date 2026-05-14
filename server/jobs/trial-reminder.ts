/**
 * Job de Lembrete de Trial — PromptJur
 *
 * Executa diariamente às 09h00 (horário de Brasília, UTC-3).
 * Verifica usuários com trial expirando em 2 dias e envia e-mail de lembrete
 * com CTA de upgrade para o plano Profissional.
 *
 * Segue o mesmo padrão dos jobs backup-automatico.ts e reenvio-automatico.ts.
 */

import { Resend } from "resend";
import { and, gte, isNotNull, lte, ne, eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Configuração
// ─────────────────────────────────────────────────────────────────────────────

/** Horário de execução diária: 09h00 (Brasília) */
const HORA_EXECUCAO_BRASILIA = 9;

/** Janela de lembrete: usuários com trial expirando entre 1 e 3 dias */
const JANELA_MIN_DIAS = 1;
const JANELA_MAX_DIAS = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Template de e-mail
// ─────────────────────────────────────────────────────────────────────────────

function buildTrialReminderHtml(opts: {
  nome: string;
  email: string;
  diasRestantes: number;
  appUrl: string;
}): string {
  const primeiroNome = opts.nome.split(" ")[0];
  const planosUrl = `${opts.appUrl}/planos`;
  const dashboardUrl = `${opts.appUrl}/dashboard`;
  const ano = new Date().getFullYear();

  const urgencia =
    opts.diasRestantes <= 1
      ? "⚠️ Último dia de trial!"
      : `⏳ ${opts.diasRestantes} dias restantes no seu trial`;

  const corUrgencia = opts.diasRestantes <= 1 ? "#ef4444" : "#f59e0b";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>Seu trial do PromptJur está acabando</title>
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

              <!-- Banner de urgência -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#1c1917 0%,#292524 60%,#1c1917 100%);padding:36px 44px 28px;border-bottom:2px solid ${corUrgencia};">
                    <p style="margin:0 0 10px;color:${corUrgencia};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">${urgencia}</p>
                    <h1 style="margin:0 0 14px;color:#ffffff;font-size:28px;font-weight:800;line-height:1.25;">
                      ${primeiroNome}, seu trial Pro<br/>
                      <span style="color:#93c5fd;">está chegando ao fim.</span>
                    </h1>
                    <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">
                      Não perca o acesso aos recursos avançados que você já está usando.
                      Continue gerando prompts jurídicos profissionais com GPT-4o, Claude e Gemini.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Corpo -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 44px;">

                    <!-- O que você vai perder -->
                    <p style="margin:0 0 16px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">O que você perde ao expirar</p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                      <tr>
                        <td style="background-color:#1c0a0a;border:1px solid #450a0a;border-radius:12px;padding:20px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="padding-bottom:10px;">
                                <span style="color:#fca5a5;font-size:13px;">❌ &nbsp;GPT-4o + Claude + Gemini (volta para GPT-4o-mini)</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;">
                                <span style="color:#fca5a5;font-size:13px;">❌ &nbsp;300 operações/mês (volta para 20)</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;">
                                <span style="color:#fca5a5;font-size:13px;">❌ &nbsp;Exportação DOCX/PDF/ABNT</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;">
                                <span style="color:#fca5a5;font-size:13px;">❌ &nbsp;Templates ilimitados (volta para 3)</span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span style="color:#fca5a5;font-size:13px;">❌ &nbsp;Knowledge Retrieval (DataJud) + Validação Planalto</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA principal -->
                    <p style="margin:0 0 16px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Continue com o Plano Profissional</p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;">
                      <tr>
                        <td style="background-color:#0f1f3d;border:1px solid #1e3a5f;border-radius:12px;padding:20px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td>
                                <p style="margin:0 0 4px;color:#e2e8f0;font-size:18px;font-weight:800;">PromptJur Profissional</p>
                                <p style="margin:0 0 12px;color:#64748b;font-size:13px;">Para advogados e escritórios</p>
                                <p style="margin:0 0 16px;">
                                  <span style="color:#ffffff;font-size:28px;font-weight:800;">R$ 57,90</span>
                                  <span style="color:#64748b;font-size:14px;">/mês</span>
                                  &nbsp;&nbsp;
                                  <span style="color:#22c55e;font-size:13px;font-weight:600;">ou R$ 46,32/mês no plano anual</span>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Botão CTA -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;width:100%;">
                      <tr>
                        <td align="center" style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);border-radius:12px;box-shadow:0 4px 14px rgba(59,130,246,0.4);">
                          <a href="${planosUrl}"
                             style="display:block;padding:16px 36px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;text-align:center;letter-spacing:0.2px;">
                            Assinar Agora e Manter o Acesso →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
                      <tr><td style="border-top:1px solid #1e293b;"></td></tr>
                    </table>

                    <!-- Link secundário -->
                    <p style="margin:0;color:#64748b;font-size:13px;text-align:center;line-height:1.6;">
                      Prefere continuar no plano gratuito?
                      <a href="${dashboardUrl}" style="color:#60a5fa;text-decoration:none;">Acesse o dashboard</a>
                      e veja o que está disponível sem custo.
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Rodapé -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background-color:#0a0f1a;border-top:1px solid #1e293b;padding:24px 44px;">
                    <p style="margin:0 0 8px;color:#334155;font-size:12px;text-align:center;">
                      Você está recebendo este e-mail porque tem um trial ativo no PromptJur.
                    </p>
                    <p style="margin:0;color:#334155;font-size:12px;text-align:center;">
                      © ${ano} PromptJur. Todos os direitos reservados.
                      &nbsp;·&nbsp;
                      <a href="${opts.appUrl}" style="color:#475569;text-decoration:none;">promptjur.com</a>
                    </p>
                  </td>
                </tr>
              </table>

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
// Lógica do job
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca usuários com trial expirando nos próximos JANELA_MIN_DIAS a JANELA_MAX_DIAS dias.
 * Exclui usuários que já têm plano pago.
 */
async function buscarUsuariosTrialExpirando(): Promise<
  Array<{ id: number; name: string | null; email: string | null; trialEndsAt: Date }>
> {
  const db = await getDb();
  if (!db) return [];

  const agora = new Date();
  const minDate = new Date(agora.getTime() + JANELA_MIN_DIAS * 24 * 60 * 60 * 1000);
  const maxDate = new Date(agora.getTime() + JANELA_MAX_DIAS * 24 * 60 * 60 * 1000);

  const resultado = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(
      and(
        isNotNull(users.trialEndsAt),
        gte(users.trialEndsAt, minDate),
        lte(users.trialEndsAt, maxDate),
        eq(users.subscriptionPlan, "free") // Só usuários sem plano pago
      )
    );

  return resultado.filter((u) => u.trialEndsAt !== null) as Array<{
    id: number;
    name: string | null;
    email: string | null;
    trialEndsAt: Date;
  }>;
}

/**
 * Envia o e-mail de lembrete para um usuário.
 */
async function enviarLembreteTrialUsuario(usuario: {
  id: number;
  name: string | null;
  email: string | null;
  trialEndsAt: Date;
}): Promise<{ success: boolean; error?: string }> {
  if (!usuario.email) {
    return { success: false, error: "E-mail não disponível" };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { success: false, error: "RESEND_API_KEY não configurada" };
  }

  const resend = new Resend(resendKey);
  const appUrl = process.env.VITE_APP_URL ?? "https://promptjur.com";
  const fromAddress =
    process.env.EMAIL_FROM?.trim() || "PromptJur <onboarding@resend.dev>";

  const agora = new Date();
  const diffMs = usuario.trialEndsAt.getTime() - agora.getTime();
  const diasRestantes = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const nome = usuario.name ?? usuario.email.split("@")[0];

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: usuario.email,
      subject: `⏳ Seu trial Pro do PromptJur expira em ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""}`,
      html: buildTrialReminderHtml({ nome, email: usuario.email, diasRestantes, appUrl }),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

/**
 * Executa o ciclo completo de lembretes de trial:
 * 1. Busca usuários com trial expirando em 1-3 dias
 * 2. Envia e-mail de lembrete para cada um
 */
export async function runTrialReminderJob(): Promise<{
  total: number;
  enviados: number;
  falhas: number;
}> {
  console.log("[TrialReminder] Iniciando job de lembretes de trial...");

  const usuarios = await buscarUsuariosTrialExpirando();
  console.log(`[TrialReminder] ${usuarios.length} usuário(s) com trial expirando em ${JANELA_MIN_DIAS}-${JANELA_MAX_DIAS} dias.`);

  let enviados = 0;
  let falhas = 0;

  for (const usuario of usuarios) {
    const resultado = await enviarLembreteTrialUsuario(usuario);
    if (resultado.success) {
      enviados++;
      console.log(`[TrialReminder] E-mail enviado para ${usuario.email} (user ${usuario.id})`);
    } else {
      falhas++;
      console.error(`[TrialReminder] Falha ao enviar para ${usuario.email}: ${resultado.error}`);
    }
  }

  console.log(`[TrialReminder] Concluído: ${enviados} enviados, ${falhas} falhas.`);
  return { total: usuarios.length, enviados, falhas };
}

// ─────────────────────────────────────────────────────────────────────────────
// Agendamento
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula quantos milissegundos faltam para o próximo horário de execução
 * considerando o fuso horário de Brasília (UTC-3).
 */
function msAteProximaExecucao(): { ms: number; proximaExecucao: Date } {
  const agora = new Date();
  const agoraBrasilia = new Date(
    agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  const proximaBrasilia = new Date(agoraBrasilia);
  proximaBrasilia.setHours(HORA_EXECUCAO_BRASILIA, 0, 0, 0);

  if (agoraBrasilia >= proximaBrasilia) {
    proximaBrasilia.setDate(proximaBrasilia.getDate() + 1);
  }

  const diffMs = proximaBrasilia.getTime() - agoraBrasilia.getTime();
  const proximaExecucaoUTC = new Date(agora.getTime() + diffMs);

  return { ms: diffMs, proximaExecucao: proximaExecucaoUTC };
}

/**
 * Agenda o job de lembrete de trial.
 * Primeira execução: próximo 09h00 (Brasília).
 * Execuções seguintes: a cada 24 horas.
 */
export function scheduleTrialReminder(): void {
  const { ms, proximaExecucao } = msAteProximaExecucao();

  const proximaStr = proximaExecucao.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  console.log(
    `[TrialReminder] Próximo lembrete de trial agendado para: ${proximaStr} (Brasília)`
  );

  setTimeout(async () => {
    await runTrialReminderJob();

    setInterval(async () => {
      await runTrialReminderJob();
    }, 24 * 60 * 60 * 1000);
  }, ms);
}
