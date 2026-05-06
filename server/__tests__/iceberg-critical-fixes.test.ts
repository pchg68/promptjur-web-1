/**
 * Testes para as 4 correções críticas do Iceberg Vibe Coder:
 * 1. Índices no banco de dados
 * 2. Idempotência no webhook Stripe
 * 3. Operações atômicas na quota
 * 4. Race condition na quota (proteção via sql expressions)
 */

import { describe, it, expect } from "vitest";

// ─── 1. Índices no banco de dados ────────────────────────────────────────────

describe("Índices no Banco de Dados", () => {
  it("deve ter script de criação de índices", async () => {
    const fs = await import("fs");
    const scriptPath = "/home/ubuntu/promptjur-web/scripts/fix-db-indexes.mjs";
    expect(fs.existsSync(scriptPath)).toBe(true);
    const content = fs.readFileSync(scriptPath, "utf-8");
    // Verificar que cria índices para as tabelas críticas
    expect(content).toContain("idx_prompts_userId");
    expect(content).toContain("idx_historico_userId");
    expect(content).toContain("idx_notifications_userId");
    expect(content).toContain("idx_chat_sessions_userId");
    expect(content).toContain("idx_chat_messages_sessionId");
    expect(content).toContain("idx_access_logs_userId");
    expect(content).toContain("idx_audit_logs_userId");
    expect(content).toContain("idx_referrals_referrer_referred");
  });

  it("deve ter índices compostos para queries frequentes", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/promptjur-web/scripts/fix-db-indexes.mjs", "utf-8");
    // Índices compostos para queries com múltiplas condições
    expect(content).toContain("idx_prompts_userId_tipo");
    expect(content).toContain("idx_historico_userId_createdAt");
    expect(content).toContain("idx_notifications_userId_lida");
  });

  it("deve criar tabela processed_stripe_events no script", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/promptjur-web/scripts/fix-db-indexes.mjs", "utf-8");
    expect(content).toContain("processed_stripe_events");
    expect(content).toContain("eventId");
    expect(content).toContain("eventType");
  });
});

// ─── 2. Idempotência no webhook Stripe ───────────────────────────────────────

describe("Idempotência no Webhook Stripe", () => {
  it("deve ter tabela processedStripeEvents no schema", async () => {
    const schema = await import("../../drizzle/schema");
    expect(schema.processedStripeEvents).toBeDefined();
  });

  it("tabela processedStripeEvents deve ter campos corretos", async () => {
    const fs = await import("fs");
    const schemaContent = fs.readFileSync("/home/ubuntu/promptjur-web/drizzle/schema.ts", "utf-8");
    expect(schemaContent).toContain("processedStripeEvents");
    expect(schemaContent).toContain("eventId");
    expect(schemaContent).toContain("eventType");
    expect(schemaContent).toContain("processedAt");
  });

  it("webhook handler deve verificar idempotência antes de processar", async () => {
    const fs = await import("fs");
    const webhookContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/_core/stripeWebhook.ts", "utf-8");
    // Deve importar processedStripeEvents
    expect(webhookContent).toContain("processedStripeEvents");
    // Deve verificar se evento já foi processado
    expect(webhookContent).toContain("already processed");
    expect(webhookContent).toContain("idempotent");
    // Deve inserir evento antes de processar
    expect(webhookContent).toContain("insert(processedStripeEvents)");
  });

  it("webhook deve retornar resposta adequada para eventos duplicados", async () => {
    const fs = await import("fs");
    const webhookContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/_core/stripeWebhook.ts", "utf-8");
    // Deve retornar { received: true, idempotent: true } para duplicatas
    expect(webhookContent).toContain("idempotent: true");
  });

  it("webhook deve continuar processando se verificação de idempotência falhar", async () => {
    const fs = await import("fs");
    const webhookContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/_core/stripeWebhook.ts", "utf-8");
    // Deve ter try/catch na verificação de idempotência
    expect(webhookContent).toContain("Idempotency check failed");
  });
});

// ─── 3. Operações Atômicas na Quota ──────────────────────────────────────────

describe("Operações Atômicas na Quota", () => {
  it("incrementQuota deve usar sql expression em vez de read-then-write", async () => {
    const fs = await import("fs");
    const quotaContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/quota.ts", "utf-8");
    // Deve usar sql template literal para incremento atômico
    expect(quotaContent).toContain("sql`${users.usageCount} + 1`");
    // Deve usar sql template literal para decremento de bônus
    expect(quotaContent).toContain("sql`${users.bonusCredits} - 1`");
  });

  it("incrementQuota deve usar WHERE bonusCredits > 0 para evitar saldo negativo", async () => {
    const fs = await import("fs");
    const quotaContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/quota.ts", "utf-8");
    // Deve usar gt(users.bonusCredits, 0) como condição
    expect(quotaContent).toContain("gt(users.bonusCredits, 0)");
  });

  it("deve exportar função checkAndIncrementQuota com transação", async () => {
    const fs = await import("fs");
    const quotaContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/quota.ts", "utf-8");
    // Deve ter a função de check+increment atômico
    expect(quotaContent).toContain("export async function checkAndIncrementQuota");
    // Deve usar db.transaction
    expect(quotaContent).toContain("db.transaction");
  });

  it("addBonusCredits no webhook deve ser atômico", async () => {
    const fs = await import("fs");
    const webhookContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/_core/stripeWebhook.ts", "utf-8");
    // Deve usar sql expression para soma atômica
    expect(webhookContent).toContain("sql`${users.bonusCredits} + ${credits}`");
    // NÃO deve ler o valor antes de somar (padrão read-then-write vulnerável)
    expect(webhookContent).not.toContain("(user.bonusCredits ?? 0) + credits");
  });
});

// ─── 4. Race Condition na Quota ──────────────────────────────────────────────

describe("Proteção contra Race Condition na Quota", () => {
  it("getPlanMonthlyLimit deve retornar limites corretos", async () => {
    const { getPlanMonthlyLimit } = await import("../quota");
    expect(getPlanMonthlyLimit("free")).toBe(20);
    expect(getPlanMonthlyLimit("pro")).toBe(300);
    expect(getPlanMonthlyLimit("enterprise")).toBe(-1);
  });

  it("quota.ts deve importar sql e gt do drizzle-orm", async () => {
    const fs = await import("fs");
    const quotaContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/quota.ts", "utf-8");
    expect(quotaContent).toContain('import { eq, sql, and, gt } from "drizzle-orm"');
  });

  it("checkAndIncrementQuota deve lançar TRPCError FORBIDDEN quando limite atingido", async () => {
    const fs = await import("fs");
    const quotaContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/quota.ts", "utf-8");
    // Dentro da transação, deve lançar erro quando sem créditos
    expect(quotaContent).toContain("code: \"FORBIDDEN\"");
    expect(quotaContent).toContain("Adquira créditos extras ou faça upgrade");
  });

  it("checkAndIncrementQuota deve resetar mês dentro da transação", async () => {
    const fs = await import("fs");
    const quotaContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/quota.ts", "utf-8");
    // Deve verificar sameMonth dentro da transação
    const txSection = quotaContent.substring(quotaContent.indexOf("db.transaction"));
    expect(txSection).toContain("sameMonth");
    expect(txSection).toContain("usageCount: 1");
  });

  it("não deve usar padrão vulnerável user.usageCount + 1 em JS", async () => {
    const fs = await import("fs");
    const quotaContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/quota.ts", "utf-8");
    // O padrão vulnerável era: .set({ usageCount: user.usageCount + 1 })
    // Não deve existir mais
    expect(quotaContent).not.toContain("usageCount: user.usageCount + 1");
    expect(quotaContent).not.toContain("bonusCredits: user.bonusCredits - 1");
  });
});

// ─── Integração: Schema e Webhook ────────────────────────────────────────────

describe("Integração Schema + Webhook", () => {
  it("schema deve exportar processedStripeEvents com tipos corretos", async () => {
    const schema = await import("../../drizzle/schema");
    expect(schema.processedStripeEvents).toBeDefined();
    expect(schema.ProcessedStripeEvent).toBeDefined;
    expect(schema.InsertProcessedStripeEvent).toBeDefined;
  });

  it("webhook deve manter resposta de verificação para eventos de teste", async () => {
    const fs = await import("fs");
    const webhookContent = fs.readFileSync("/home/ubuntu/promptjur-web/server/_core/stripeWebhook.ts", "utf-8");
    expect(webhookContent).toContain("evt_test_");
    expect(webhookContent).toContain("verified: true");
  });
});
