/**
 * Módulo de Aviso Prévio de Reajuste de Preço — PromptJur
 * 
 * Implementa o envio automático de email aos assinantes com 30 dias
 * de antecedência quando houver reajuste de preço, conforme CDC Art. 6º.
 * 
 * Fluxo:
 * 1. Quando um ajuste de preço é solicitado (manual ou scheduled), em vez de
 *    aplicar imediatamente, cria um registro em price_change_notices com
 *    effectiveDate = noticeSentAt + 30 dias.
 * 2. Envia email a todos os assinantes do plano/pacote afetado.
 * 3. Uma scheduled task diária verifica notices com status "pending" e
 *    effectiveDate <= agora, e aplica o reajuste efetivamente.
 */

import { eq, and, lte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { users, priceChangeNotices } from "../../drizzle/schema";
import { PLANS, CREDIT_PACKAGES } from "../stripe-products";
import { notifyOwner } from "../_core/notification";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface PriceChangeRequest {
  entityType: "plan" | "credit_package";
  entityId: string;
  currentPrice: number; // centavos
  newPrice: number; // centavos
  adjustmentPercent: number;
  reason?: string;
  source?: string;
  /** Sobrescreve a data de vigência (padrão: hoje + 30 dias). Útil para testes. */
  effectiveDateOverride?: Date;
}

export interface NoticeResult {
  noticeId: number;
  emailsSent: number;
  totalSubscribers: number;
  effectiveDate: Date;
  errors: string[];
}

// ─── Template de Email ───────────────────────────────────────────────────────

function buildPriceChangeEmailHtml(opts: {
  nome: string;
  planName: string;
  currentPrice: string;
  newPrice: string;
  adjustmentPercent: string;
  effectiveDate: string;
  reason: string;
  appUrl: string;
}): string {
  const ano = new Date().getFullYear();
  const isAumento = parseFloat(opts.adjustmentPercent) > 0;
  const accentColor = isAumento ? "#f59e0b" : "#22c55e";
  const icon = isAumento ? "📈" : "📉";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aviso de Reajuste de Preço — PromptJur</title>
</head>
<body style="margin:0;padding:0;background-color:#060d1a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#060d1a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
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

              <!-- Header com destaque -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f2d5c 0%,#1e40af 60%,#2563eb 100%);padding:36px 44px 28px;border-bottom:3px solid ${accentColor};">
                    <p style="margin:0 0 8px;color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">${icon} AVISO PRÉVIO DE REAJUSTE</p>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.3;">
                      Comunicado de Reajuste de Preço
                    </h1>
                    <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">
                      Conforme Art. 6º do Código de Defesa do Consumidor
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Corpo -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:36px 44px;">

                    <p style="margin:0 0 20px;color:#e2e8f0;font-size:15px;line-height:1.7;">
                      Prezado(a) <strong style="color:#ffffff;">${opts.nome}</strong>,
                    </p>

                    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
                      Informamos que haverá um reajuste no valor do seu plano <strong style="color:#e2e8f0;">${opts.planName}</strong>.
                      Este comunicado é enviado com <strong style="color:#f59e0b;">30 dias de antecedência</strong>,
                      em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/90, Art. 6º, III).
                    </p>

                    <!-- Tabela de comparação de preços -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;border-radius:12px;overflow:hidden;border:1px solid #1e3a5f;">
                      <tr>
                        <td style="background:#0a1628;padding:20px 24px;border-bottom:1px solid #1e3a5f;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:50%;">
                                <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Valor Atual</p>
                                <p style="margin:0;color:#e2e8f0;font-size:22px;font-weight:700;">${opts.currentPrice}</p>
                              </td>
                              <td style="width:50%;text-align:right;">
                                <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Novo Valor</p>
                                <p style="margin:0;color:${accentColor};font-size:22px;font-weight:700;">${opts.newPrice}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="background:#0d1b2e;padding:16px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <p style="margin:0;color:#94a3b8;font-size:13px;">
                                  <strong style="color:#e2e8f0;">Reajuste:</strong> ${opts.adjustmentPercent}%
                                </p>
                              </td>
                              <td style="text-align:right;">
                                <p style="margin:0;color:#94a3b8;font-size:13px;">
                                  <strong style="color:#e2e8f0;">Vigência:</strong> ${opts.effectiveDate}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Motivo -->
                    <div style="margin-bottom:28px;padding:16px 20px;background:#0a1628;border-radius:8px;border-left:4px solid #3b82f6;">
                      <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Motivo do Reajuste</p>
                      <p style="margin:0;color:#e2e8f0;font-size:14px;line-height:1.6;">${opts.reason}</p>
                    </div>

                    <!-- Direitos do consumidor -->
                    <p style="margin:0 0 20px;color:#94a3b8;font-size:14px;line-height:1.7;">
                      <strong style="color:#e2e8f0;">Seus direitos:</strong> Caso não concorde com o reajuste,
                      você poderá cancelar sua assinatura a qualquer momento antes da data de vigência,
                      sem qualquer ônus adicional. Basta acessar a seção "Meu Plano" no painel do PromptJur.
                    </p>

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);border-radius:12px;">
                          <a href="${opts.appUrl}/meu-plano"
                             style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                            Gerenciar Meu Plano →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Informação legal -->
                    <div style="padding:16px 20px;background:#0a1628;border-radius:8px;border:1px solid #1e3a5f;">
                      <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                        <strong style="color:#94a3b8;">Base Legal:</strong> Este comunicado atende ao disposto no
                        Art. 6º, inciso III, da Lei nº 8.078/90 (Código de Defesa do Consumidor), que garante
                        ao consumidor o direito à informação adequada e clara sobre produtos e serviços,
                        com especificação correta de preço. O aviso prévio de 30 dias segue as melhores
                        práticas de mercado para serviços de assinatura digital.
                      </p>
                    </div>

                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:20px 44px 28px;border-top:1px solid #1e293b;text-align:center;">
                    <p style="margin:0 0 8px;color:#475569;font-size:12px;">
                      © ${ano} PromptJur — Sistema de Engenharia de Prompts Jurídicos
                    </p>
                    <p style="margin:0;color:#475569;font-size:11px;">
                      <a href="${opts.appUrl}/meu-plano" style="color:#3b82f6;text-decoration:none;">Meu Plano</a> · 
                      <a href="${opts.appUrl}/contato" style="color:#3b82f6;text-decoration:none;">Contato</a> · 
                      <a href="${opts.appUrl}/termos" style="color:#3b82f6;text-decoration:none;">Termos de Uso</a>
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

// ─── Funções Principais ──────────────────────────────────────────────────────

/**
 * Cria um aviso prévio de reajuste e envia emails a todos os assinantes afetados.
 * O preço NÃO é aplicado imediatamente — será aplicado após 30 dias.
 */
export async function createPriceChangeNotice(request: PriceChangeRequest): Promise<NoticeResult> {
  const db = await getDb();
  if (!db) {
    return { noticeId: 0, emailsSent: 0, totalSubscribers: 0, effectiveDate: new Date(), errors: ["Database not available"] };
  }

  const errors: string[] = [];
  const effectiveDate = request.effectiveDateOverride ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  })();

  // Inserir registro do aviso
  const [insertResult] = await db.insert(priceChangeNotices).values({
    entityType: request.entityType,
    entityId: request.entityId,
    currentPrice: request.currentPrice,
    newPrice: request.newPrice,
    adjustmentPercent: Math.round(request.adjustmentPercent * 100), // armazenar como inteiro
    reason: request.reason || "Reajuste periódico conforme variação de custos operacionais",
    source: request.source || "scheduled_task",
    effectiveDate,
    status: "pending",
  });

  const noticeId = (insertResult as any).insertId;

  // Buscar assinantes afetados
  let subscribers: Array<{ id: number; name: string | null; email: string | null; subscriptionPlan: string }> = [];

  if (request.entityType === "plan") {
    // Mapear entityId para o enum do banco
    const planMapping: Record<string, string> = {
      starter: "pro", // starter é o plano "pro" no banco
      professional: "enterprise",
    };
    const dbPlan = planMapping[request.entityId] || request.entityId;

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        subscriptionPlan: users.subscriptionPlan,
      })
      .from(users)
      .where(eq(users.subscriptionPlan, dbPlan as any));

    subscribers = result;
  } else {
    // Para pacotes de créditos, notificar todos os usuários pagantes (não-free)
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        subscriptionPlan: users.subscriptionPlan,
      })
      .from(users)
      .where(sql`${users.subscriptionPlan} != 'free'`);

    subscribers = result;
  }

  const totalSubscribers = subscribers.length;
  let emailsSent = 0;

  // Preparar dados do email
  const planName = request.entityType === "plan"
    ? PLANS[request.entityId]?.name ?? request.entityId
    : CREDIT_PACKAGES.find(p => p.id === request.entityId)?.name ?? request.entityId;

  const currentPriceFormatted = `R$ ${(request.currentPrice / 100).toFixed(2).replace(".", ",")}`;
  const newPriceFormatted = `R$ ${(request.newPrice / 100).toFixed(2).replace(".", ",")}`;
  const adjustmentFormatted = request.adjustmentPercent > 0
    ? `+${request.adjustmentPercent.toFixed(2)}`
    : request.adjustmentPercent.toFixed(2);
  const effectiveDateFormatted = effectiveDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const reason = request.reason || "Reajuste periódico conforme variação de custos operacionais (IPCA)";
  const appUrl = process.env.VITE_APP_URL ?? "https://promptjur.com";

  // Enviar emails em lotes (máx 10 por vez para não sobrecarregar)
  const BATCH_SIZE = 10;
  const { Resend } = await import("resend");
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    errors.push("RESEND_API_KEY não configurada — emails não enviados");
  } else {
    const resend = new Resend(resendApiKey);
    const fromAddress = process.env.EMAIL_FROM?.trim() || "PromptJur <onboarding@resend.dev>";

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      for (const subscriber of batch) {
        if (!subscriber.email) continue;

        try {
          const html = buildPriceChangeEmailHtml({
            nome: subscriber.name || subscriber.email.split("@")[0],
            planName,
            currentPrice: currentPriceFormatted,
            newPrice: newPriceFormatted,
            adjustmentPercent: adjustmentFormatted,
            effectiveDate: effectiveDateFormatted,
            reason,
            appUrl,
          });

          const { error } = await resend.emails.send({
            from: fromAddress,
            to: [subscriber.email],
            subject: `📈 Aviso de Reajuste de Preço — ${planName} — PromptJur`,
            html,
          });

          if (error) {
            errors.push(`Falha ao enviar para ${subscriber.email}: ${error.message}`);
          } else {
            emailsSent++;
          }
        } catch (err: any) {
          errors.push(`Exceção ao enviar para ${subscriber.email}: ${err?.message}`);
        }
      }

      // Pausa entre lotes para respeitar rate limits
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Atualizar registro com contagem de emails
  await db
    .update(priceChangeNotices)
    .set({
      emailsSent,
      totalSubscribers,
    })
    .where(eq(priceChangeNotices.id, noticeId));

  // Notificar owner
  await notifyOwner({
    title: `📨 Aviso de Reajuste Enviado — ${planName}`,
    content: `Aviso prévio de 30 dias enviado para ${emailsSent}/${totalSubscribers} assinantes.\n\n` +
      `• Plano/Pacote: ${planName}\n` +
      `• Preço atual: ${currentPriceFormatted}\n` +
      `• Novo preço: ${newPriceFormatted} (${adjustmentFormatted}%)\n` +
      `• Data de vigência: ${effectiveDateFormatted}\n` +
      `• Motivo: ${reason}\n\n` +
      `O novo preço será aplicado automaticamente em ${effectiveDateFormatted}.\n` +
      `Para cancelar, acesse /admin-precos.`,
  });

  console.log(`[PriceChangeNotice] Aviso #${noticeId} criado: ${emailsSent}/${totalSubscribers} emails enviados para ${planName}`);

  return { noticeId, emailsSent, totalSubscribers, effectiveDate, errors };
}

/**
 * Verifica avisos pendentes cuja data de vigência já passou e aplica o reajuste.
 * Deve ser executada diariamente via scheduled task.
 */
export async function applyPendingPriceChanges(): Promise<{
  applied: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) {
    return { applied: 0, errors: ["Database not available"] };
  }

  const now = new Date();
  const errors: string[] = [];
  let applied = 0;

  // Buscar notices pendentes com effectiveDate <= agora
  const pendingNotices = await db
    .select()
    .from(priceChangeNotices)
    .where(
      and(
        eq(priceChangeNotices.status, "pending"),
        lte(priceChangeNotices.effectiveDate, now)
      )
    );

  if (pendingNotices.length === 0) {
    console.log("[PriceChangeNotice] Nenhum aviso pendente para aplicar");
    return { applied: 0, errors: [] };
  }

  // Importar updatePrices para aplicar o reajuste efetivamente
  const { updatePrices } = await import("./update-prices");

  for (const notice of pendingNotices) {
    try {
      const updates = notice.entityType === "plan"
        ? [{ planId: notice.entityId, newPriceMonthly: notice.newPrice }]
        : [{ packageId: notice.entityId, newPriceInCents: notice.newPrice }];

      const result = await updatePrices({
        updates,
        source: `notice_${notice.id}`,
        referenceMonth: new Date().toISOString().slice(0, 7),
      });

      if (result.applied > 0) {
        // Marcar como aplicado
        await db
          .update(priceChangeNotices)
          .set({
            status: "applied",
            appliedAt: now,
          })
          .where(eq(priceChangeNotices.id, notice.id));

        applied++;
        console.log(`[PriceChangeNotice] Aviso #${notice.id} aplicado com sucesso`);
      } else {
        errors.push(`Aviso #${notice.id}: falha ao aplicar — ${result.errors.join(", ")}`);
      }
    } catch (err: any) {
      errors.push(`Aviso #${notice.id}: exceção — ${err?.message}`);
    }
  }

  // Notificar owner sobre aplicações
  if (applied > 0) {
    const nomes = pendingNotices
      .filter(n => n.entityType === "plan")
      .map(n => PLANS[n.entityId]?.name ?? n.entityId);
    const nomesPacotes = pendingNotices
      .filter(n => n.entityType === "credit_package")
      .map(n => CREDIT_PACKAGES.find(p => p.id === n.entityId)?.name ?? n.entityId);

    await notifyOwner({
      title: `✅ Reajustes Aplicados Automaticamente`,
      content: `${applied} reajuste(s) de preço foram aplicados após período de 30 dias de aviso prévio.\n\n` +
        `Planos: ${nomes.join(", ") || "nenhum"}\n` +
        `Pacotes: ${nomesPacotes.join(", ") || "nenhum"}\n\n` +
        `Acesse /admin-precos para verificar.`,
    });
  }

  return { applied, errors };
}

/**
 * Cancela um aviso pendente (admin pode cancelar antes da vigência)
 */
export async function cancelPriceChangeNotice(noticeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [result] = await db
    .update(priceChangeNotices)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(priceChangeNotices.id, noticeId),
        eq(priceChangeNotices.status, "pending")
      )
    );

  return (result as any).affectedRows > 0;
}

/**
 * Lista todos os avisos de reajuste (para o painel admin)
 */
export async function listPriceChangeNotices(limit = 20): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(priceChangeNotices)
    .orderBy(sql`${priceChangeNotices.createdAt} DESC`)
    .limit(limit);
}
