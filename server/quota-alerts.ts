/**
 * quota-alerts.ts — Sistema de alertas de consumo por email
 * 
 * Envia notificações por email quando o usuário atinge thresholds de uso:
 * - 70%: Aviso amigável
 * - 90%: Alerta urgente
 * - 100%: Notificação de bloqueio
 * 
 * Evita spam: cada threshold só é notificado uma vez por ciclo mensal.
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { users, notifications } from "../drizzle/schema";
import { getUserQuotaSummary, getPlanMonthlyLimit } from "./quota";
import { sendNotificationEmail } from "./email";
import { logger } from "./_core/logger";

interface QuotaAlertResult {
  alertaEnviado: boolean;
  nivel?: number;
  tipo?: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  pro: "Profissional",
  enterprise: "Escritório",
};

/**
 * Verifica se o usuário atingiu um threshold de consumo e envia alerta por email.
 * Deve ser chamado após cada incremento de quota.
 */
export async function checkAndSendQuotaAlert(userId: number): Promise<QuotaAlertResult> {
  const db = await getDb();
  if (!db) return { alertaEnviado: false };

  const summary = await getUserQuotaSummary(userId);
  if (!summary || summary.isUnlimited) return { alertaEnviado: false };

  const percent = summary.percentUsed;

  // Definir thresholds
  const thresholds = [
    { nivel: 100, tipo: "bloqueio", titulo: "Limite de Operações Atingido", emoji: "🚫" },
    { nivel: 90, tipo: "urgente", titulo: "90% do Limite Mensal Utilizado", emoji: "⚠️" },
    { nivel: 70, tipo: "aviso", titulo: "70% do Limite Mensal Utilizado", emoji: "📊" },
  ];

  // Encontrar o threshold mais alto atingido
  const threshold = thresholds.find(t => percent >= t.nivel);
  if (!threshold) return { alertaEnviado: false };

  // Verificar se já notificou este threshold neste mês
  const mesAtual = new Date().toISOString().slice(0, 7); // "2026-04"
  const notifKey = `quota_alert_${threshold.nivel}_${mesAtual}`;

  const [existente] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.titulo, notifKey)
      )
    )
    .limit(1);

  if (existente) return { alertaEnviado: false }; // Já notificado neste ciclo

  // Buscar dados do usuário para email
  const [user] = await db
    .select({ name: users.name, email: users.email, subscriptionPlan: users.subscriptionPlan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { alertaEnviado: false };

  const planLabel = PLAN_LABELS[user.subscriptionPlan] ?? user.subscriptionPlan;

  // Construir mensagem
  let mensagem = "";
  switch (threshold.tipo) {
    case "aviso":
      mensagem = `Você já utilizou ${percent}% das suas ${summary.limit} operações mensais no plano ${planLabel}. Restam ${summary.remaining} operações até o próximo reset.`;
      break;
    case "urgente":
      mensagem = `Atenção! Você já utilizou ${percent}% do seu limite mensal (${summary.usageCount}/${summary.limit}). Restam apenas ${summary.remaining} operações. Considere fazer upgrade para não ser interrompido.`;
      break;
    case "bloqueio":
      mensagem = `Você atingiu o limite de ${summary.limit} operações mensais do plano ${planLabel}. Para continuar usando o PromptJur, faça upgrade do seu plano ou aguarde o reset no próximo mês.`;
      break;
  }

  // Registrar notificação no banco (marca como enviada para este ciclo)
  await db.insert(notifications).values({
    userId,
    tipo: threshold.tipo === "bloqueio" ? "erro" : "alerta",
    titulo: notifKey, // Usado como chave de deduplicação
    mensagem,
  });

  // Enviar email se o usuário tiver email configurado
  if (user.email) {
    try {
      await sendNotificationEmail({
        to: user.email,
        nome: user.name ?? "Usuário",
        titulo: `${threshold.emoji} ${threshold.titulo}`,
        mensagem,
        tipo: threshold.tipo === "bloqueio" ? "erro" : "alerta",
        link: "/planos",
      });
      logger.info("[QuotaAlert] Email de alerta enviado", { userId, nivel: threshold.nivel, percent });
    } catch (err) {
      logger.warn("[QuotaAlert] Falha ao enviar email de alerta", { userId, err });
    }
  }

  return {
    alertaEnviado: true,
    nivel: threshold.nivel,
    tipo: threshold.tipo,
  };
}
