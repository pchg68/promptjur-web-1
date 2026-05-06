/**
 * Script para adicionar índices de performance nas tabelas críticas do PromptJur.
 * Também cria a tabela processed_stripe_events e o constraint UNIQUE em referrals.
 * 
 * Execução: node scripts/fix-db-indexes.mjs
 */

import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL não definida");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  console.log("Conectado ao banco de dados.\n");

  // Lista de índices a criar (IF NOT EXISTS não é suportado em todos os MySQL,
  // então usamos try/catch para ignorar duplicatas)
  const indexes = [
    // Tabela prompts — consultas por userId e por tipo
    "CREATE INDEX idx_prompts_userId ON prompts(userId)",
    "CREATE INDEX idx_prompts_createdAt ON prompts(createdAt)",
    "CREATE INDEX idx_prompts_userId_tipo ON prompts(userId, tipo)",

    // Tabela historico — consultas por userId e período
    "CREATE INDEX idx_historico_userId ON historico(userId)",
    "CREATE INDEX idx_historico_createdAt ON historico(createdAt)",
    "CREATE INDEX idx_historico_userId_createdAt ON historico(userId, createdAt)",

    // Tabela llm_logs — consultas por userId e período (tabela de crescimento rápido)
    "CREATE INDEX idx_llm_logs_userId ON llm_logs(userId)",
    "CREATE INDEX idx_llm_logs_createdAt ON llm_logs(createdAt)",

    // Tabela notifications — consultas por userId e status de leitura
    "CREATE INDEX idx_notifications_userId ON notifications(userId)",
    "CREATE INDEX idx_notifications_userId_lida ON notifications(userId, lida)",

    // Tabela chat_sessions — consultas por userId
    "CREATE INDEX idx_chat_sessions_userId ON chat_sessions(userId)",

    // Tabela chat_messages — consultas por sessionId
    "CREATE INDEX idx_chat_messages_sessionId ON chat_messages(sessionId)",

    // Tabela prompts_salvos — consultas por userId
    "CREATE INDEX idx_prompts_salvos_userId ON prompts_salvos(userId)",

    // Tabela access_logs — consultas por userId e período
    "CREATE INDEX idx_access_logs_userId ON access_logs(userId)",
    "CREATE INDEX idx_access_logs_createdAt ON access_logs(createdAt)",

    // Tabela audit_logs — consultas por userId e período
    "CREATE INDEX idx_audit_logs_userId ON audit_logs(userId)",
    "CREATE INDEX idx_audit_logs_createdAt ON audit_logs(createdAt)",

    // Tabela referrals — constraint UNIQUE para evitar duplicatas
    "CREATE UNIQUE INDEX idx_referrals_referrer_referred ON referrals(referrerId, referredId)",

    // Tabela referral_codes — consultas por userId e código
    "CREATE INDEX idx_referral_codes_userId ON referral_codes(userId)",

    // Tabela processed_stripe_events — criação da tabela
    `CREATE TABLE IF NOT EXISTS processed_stripe_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      eventId VARCHAR(255) NOT NULL UNIQUE,
      eventType VARCHAR(100) NOT NULL,
      processedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
  ];

  let created = 0;
  let skipped = 0;

  for (const sql of indexes) {
    try {
      await conn.execute(sql);
      const name = sql.includes("CREATE TABLE") ? "TABLE processed_stripe_events" : sql.match(/idx_\w+|CREATE TABLE/)?.[0] || sql.substring(0, 60);
      console.log(`✓ Criado: ${name}`);
      created++;
    } catch (err) {
      if (err.code === "ER_DUP_KEYNAME" || err.message?.includes("Duplicate key name") || err.message?.includes("already exists")) {
        const name = sql.match(/idx_\w+/)?.[0] || "tabela";
        console.log(`⊘ Já existe: ${name}`);
        skipped++;
      } else {
        console.error(`✗ Erro: ${err.message}`);
        console.error(`  SQL: ${sql.substring(0, 80)}...`);
      }
    }
  }

  console.log(`\n═══ Resumo: ${created} criados, ${skipped} já existiam ═══`);
  await conn.end();
}

main().catch(console.error);
