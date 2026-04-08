/**
 * Queries para o histórico de envios de convite (convite_logs)
 * e configurações de reenvio automático (config_reenvio_auto).
 */
import { desc, eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  conviteLogs,
  configReenvioAuto,
  InsertConviteLog,
  ConviteLog,
  ConfigReenvioAuto,
} from "../drizzle/schema";

// ─── Convite Logs ────────────────────────────────────────────────────────────

/**
 * Registra um envio de convite no histórico.
 */
export async function registrarConviteLog(
  data: Omit<InsertConviteLog, "id" | "createdAt">
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(conviteLogs).values(data);
}

/**
 * Busca o histórico de envios para um e-mail específico.
 */
export async function buscarHistoricoConvite(
  email: string,
  limite = 20
): Promise<ConviteLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(conviteLogs)
    .where(eq(conviteLogs.email, email))
    .orderBy(desc(conviteLogs.createdAt))
    .limit(limite);
}

/**
 * Busca os últimos N envios de convite (todos os e-mails).
 */
export async function buscarUltimosConviteLogs(limite = 50): Promise<ConviteLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(conviteLogs)
    .orderBy(desc(conviteLogs.createdAt))
    .limit(limite);
}

/**
 * Conta o total de envios por resultado para um e-mail.
 */
export async function contarEnviosPorEmail(email: string): Promise<{
  enviados: number;
  falhas: number;
  pulados: number;
}> {
  const db = await getDb();
  if (!db) return { enviados: 0, falhas: 0, pulados: 0 };

  const logs = await db
    .select()
    .from(conviteLogs)
    .where(eq(conviteLogs.email, email));

  return {
    enviados: logs.filter((l) => l.resultado === "enviado").length,
    falhas: logs.filter((l) => l.resultado === "falha").length,
    pulados: logs.filter((l) => l.resultado === "pulado").length,
  };
}

// ─── Config Reenvio Automático ────────────────────────────────────────────────

/**
 * Busca a configuração atual de reenvio automático.
 * Retorna null se não existir (primeira vez).
 */
export async function buscarConfigReenvioAuto(): Promise<ConfigReenvioAuto | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(configReenvioAuto)
    .where(eq(configReenvioAuto.id, 1))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Cria ou atualiza a configuração de reenvio automático.
 */
export async function salvarConfigReenvioAuto(
  config: Partial<Omit<ConfigReenvioAuto, "id" | "updatedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existente = await buscarConfigReenvioAuto();
  if (existente) {
    await db
      .update(configReenvioAuto)
      .set(config)
      .where(eq(configReenvioAuto.id, 1));
  } else {
    await db.insert(configReenvioAuto).values({
      id: 1,
      habilitado: config.habilitado ?? false,
      diaSemana: config.diaSemana ?? 1,
      hora: config.hora ?? 9,
      apenasNaoAcessaram: config.apenasNaoAcessaram ?? true,
      ultimaExecucao: config.ultimaExecucao ?? null,
      ultimoResultado: config.ultimoResultado ?? null,
    });
  }
}

/**
 * Atualiza o resultado da última execução do job.
 */
export async function atualizarUltimaExecucao(resultado: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(configReenvioAuto)
    .set({ ultimaExecucao: new Date(), ultimoResultado: resultado })
    .where(eq(configReenvioAuto.id, 1));
}
