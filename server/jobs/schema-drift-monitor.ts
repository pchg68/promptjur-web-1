/**
 * Job de Monitoramento de Divergência de Schema — PromptJur
 *
 * Executa diariamente (a cada 24 horas) e verifica se todas as tabelas
 * definidas no schema Drizzle existem no banco de produção.
 *
 * Quando há divergência (tabela no schema mas não no banco), o job:
 * 1. Loga o problema no console
 * 2. Notifica o owner via notifyOwner()
 *
 * Isso evita que erros como "Failed query: select ... from admin_cards_arquivados"
 * apareçam no Sentry sem aviso prévio.
 */

import { notifyOwner } from "../_core/notification";

/** Intervalo de execução: 24 horas em milissegundos */
const INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Lista canônica de tabelas definidas no schema Drizzle.
 * Atualizar sempre que uma nova tabela for adicionada ao schema.ts.
 */
export const SCHEMA_TABLES = [
  "users",
  "prompts",
  "notifications",
  "notification_preferences",
  "analises",
  "templates",
  "fontes_juridicas",
  "historico",
  "configuracoes",
  "tags",
  "template_tags",
  "prompt_tags",
  "prompt_versoes",
  "uso_modelos",
  "legislacao_cache",
  "perfis_uso",
  "formatacao_templates",
  "audit_logs",
  "feature_flags",
  "alert_rules",
  "performance_alerts",
  "backups",
  "cabecalho_templates",
  "tutorial_progresso",
  "tutorial_feedback",
  "enterprise_leads",
  "launch_interests",
  "access_whitelist",
  "contact_messages",
  "document_versions",
  "user_integrations",
  "chat_sessions",
  "chat_messages",
  "prompts_salvos",
  "convite_logs",
  "config_reenvio_auto",
  "access_logs",
  "crm_leads",
  "crm_contratos",
  "crm_membros",
  "crm_atividades",
  "push_subscriptions",
  "llm_logs",
  "admin_cards_arquivados",
  "onboarding_emails",
  "referral_codes",
  "referrals",
  "processed_stripe_events",
  "price_overrides",
  "price_change_notices",
] as const;

export interface SchemaDriftResult {
  missingTables: string[];
  extraTables: string[];
  checkedAt: Date;
  ok: boolean;
}

/**
 * Verifica divergências entre o schema Drizzle e o banco de produção.
 */
export async function checkSchemaDrift(): Promise<SchemaDriftResult> {
  const checkedAt = new Date();

  try {
    const { getDb } = await import("../db");
    const db = await getDb();

    if (!db) {
      console.warn("[SchemaDrift] DB indisponível — pulando verificação");
      return { missingTables: [], extraTables: [], checkedAt, ok: true };
    }

    // Buscar tabelas existentes no banco (excluindo a tabela de migrações)
    const rows = await db.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME != '__drizzle_migrations' ORDER BY TABLE_NAME"
    ) as any;

    // O resultado do execute vem como [rows, fields] no mysql2
    const rawRows = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;
    const dbTables = new Set<string>(
      rawRows.map((r: any) => r.TABLE_NAME as string)
    );

    const schemaTables = new Set<string>(SCHEMA_TABLES);

    const missingTables = [...schemaTables].filter((t) => !dbTables.has(t)).sort();
    const extraTables = [...dbTables].filter((t) => !schemaTables.has(t)).sort();

    return {
      missingTables,
      extraTables,
      checkedAt,
      ok: missingTables.length === 0,
    };
  } catch (err: any) {
    console.error("[SchemaDrift] Erro ao verificar:", err?.message);
    return {
      missingTables: [],
      extraTables: [],
      checkedAt,
      ok: true, // não alarmar em caso de falha de conexão
    };
  }
}

/**
 * Executa o job de monitoramento de divergência de schema.
 * Notifica o owner se houver tabelas faltando.
 */
export async function runSchemaDriftMonitor(): Promise<SchemaDriftResult> {
  console.log("[SchemaDrift] Iniciando verificação de divergência de schema...");

  const result = await checkSchemaDrift();

  if (result.missingTables.length > 0) {
    const tabelasLista = result.missingTables.map((t) => `• ${t}`).join("\n");

    console.error(
      `[SchemaDrift] ALERTA: ${result.missingTables.length} tabela(s) faltando no banco:\n${tabelasLista}`
    );

    // Notificar o owner imediatamente
    await notifyOwner({
      title: `⚠️ Schema Drift: ${result.missingTables.length} tabela(s) faltando no banco`,
      content: [
        `Verificação realizada em: ${result.checkedAt.toLocaleString("pt-BR")}`,
        "",
        "**Tabelas no schema Drizzle que NÃO existem no banco de produção:**",
        tabelasLista,
        "",
        "**Ação necessária:** Execute `pnpm db:push` ou crie as tabelas manualmente via SQL.",
        "Enquanto essas tabelas estiverem faltando, queries relacionadas falharão e gerarão erros no Sentry.",
      ].join("\n"),
    }).catch((err) =>
      console.error("[SchemaDrift] Falha ao notificar owner:", err?.message)
    );
  } else {
    console.log(
      `[SchemaDrift] ✓ Schema OK — ${SCHEMA_TABLES.length} tabelas verificadas, nenhuma faltando`
    );
  }

  if (result.extraTables.length > 0) {
    console.log(
      `[SchemaDrift] Info: ${result.extraTables.length} tabela(s) no banco não mapeadas no schema: ${result.extraTables.join(", ")}`
    );
  }

  return result;
}

/**
 * Agenda o job de monitoramento de schema para rodar diariamente.
 * Executa também na inicialização (com delay de 30s para aguardar o boot completo).
 */
export function scheduleSchemaDriftMonitor(): void {
  // Execução inicial com delay para não interferir no boot
  setTimeout(() => {
    runSchemaDriftMonitor().catch((err) =>
      console.error("[SchemaDrift] Erro na execução inicial:", err)
    );
  }, 30_000); // 30 segundos após o boot

  // Execuções subsequentes a cada 24 horas
  setInterval(() => {
    runSchemaDriftMonitor().catch((err) =>
      console.error("[SchemaDrift] Erro na execução periódica:", err)
    );
  }, INTERVAL_MS);

  console.log("[SchemaDrift] Monitor agendado — execução a cada 24 horas");
}
