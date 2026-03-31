/**
 * Job de expiração automática da whitelist
 *
 * Executa a cada hora e desativa entradas da tabela `access_whitelist`
 * cujo campo `expiresAt` já passou da data/hora atual.
 *
 * Isso garante que acessos temporários sejam revogados automaticamente,
 * sem necessidade de intervenção manual do administrador.
 */

import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { accessWhitelist } from "../../drizzle/schema";

/** Intervalo de execução: 1 hora em milissegundos */
const INTERVAL_MS = 60 * 60 * 1000;

/**
 * Desativa todas as entradas ativas com expiresAt no passado.
 * Retorna o número de entradas desativadas.
 */
export async function runWhitelistExpiryJob(): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[WhitelistExpiry] Database not available — skipping");
    return 0;
  }

  const agora = new Date();

  // Buscar entradas ativas com expiresAt vencido
  const expirados = await db
    .select({ id: accessWhitelist.id, email: accessWhitelist.email })
    .from(accessWhitelist)
    .where(
      sql`${accessWhitelist.ativo} = 1
          AND ${accessWhitelist.expiresAt} IS NOT NULL
          AND ${accessWhitelist.expiresAt} < ${agora}`
    );

  if (expirados.length === 0) {
    return 0;
  }

  // Desativar em lote
  for (const entry of expirados) {
    await db
      .update(accessWhitelist)
      .set({ ativo: false })
      .where(eq(accessWhitelist.id, entry.id));
  }

  console.log(
    `[WhitelistExpiry] ${expirados.length} entrada(s) expirada(s) desativada(s): ` +
      expirados.map((e) => e.email).join(", ")
  );

  return expirados.length;
}

/**
 * Agenda o job de expiração para rodar a cada hora.
 * Executa também imediatamente ao iniciar para cobrir expirados durante downtime.
 */
export function scheduleWhitelistExpiry(): void {
  // Execução imediata ao iniciar (cobre expirados durante possível downtime)
  runWhitelistExpiryJob().catch((err) =>
    console.error("[WhitelistExpiry] Erro na execução inicial:", err)
  );

  // Execuções subsequentes a cada hora
  setInterval(() => {
    runWhitelistExpiryJob().catch((err) =>
      console.error("[WhitelistExpiry] Erro na execução periódica:", err)
    );
  }, INTERVAL_MS);

  console.log(
    `[WhitelistExpiry] Job agendado — execução a cada ${INTERVAL_MS / 60000} minutos`
  );
}
