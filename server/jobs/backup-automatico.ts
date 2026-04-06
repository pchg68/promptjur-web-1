/**
 * Job de Backup Automático Diário
 *
 * Executa às 02h00 (horário de Brasília, UTC-3) todos os dias:
 * 1. Cria backup completo do banco de dados
 * 2. Limpa backups com mais de 30 dias (S3 + banco)
 *
 * Segue o mesmo padrão dos jobs cache-cleanup e whitelist-expiry.
 */

import { criarBackup, limparBackupsAntigos } from "../backup";

// ID de sistema para backups automáticos (não vinculado a nenhum usuário real)
const SYSTEM_USER_ID = 0;

// Horário de execução: 02h00 horário de Brasília (UTC-3 = 05h00 UTC)
const HORA_EXECUCAO_BRASILIA = 2; // 02h00

/**
 * Calcula quantos milissegundos faltam para o próximo horário de execução
 * considerando o fuso horário de Brasília (UTC-3).
 */
function msAteProximaExecucao(): { ms: number; proximaExecucao: Date } {
  const agora = new Date();

  // Converte para horário de Brasília
  const agoraBrasilia = new Date(
    agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  // Próxima execução: hoje às 02h00 (Brasília)
  const proximaBrasilia = new Date(agoraBrasilia);
  proximaBrasilia.setHours(HORA_EXECUCAO_BRASILIA, 0, 0, 0);

  // Se já passou das 02h hoje, agenda para amanhã
  if (agoraBrasilia >= proximaBrasilia) {
    proximaBrasilia.setDate(proximaBrasilia.getDate() + 1);
  }

  // Converte de volta para UTC para calcular o delta
  const diffMs = proximaBrasilia.getTime() - agoraBrasilia.getTime();
  const proximaExecucaoUTC = new Date(agora.getTime() + diffMs);

  return { ms: diffMs, proximaExecucao: proximaExecucaoUTC };
}

/**
 * Executa o ciclo completo de backup:
 * 1. Cria backup do banco
 * 2. Limpa backups antigos
 */
export async function runBackupAutomatico(): Promise<void> {
  console.log("[BackupJob] Iniciando backup automático...");

  // 1. Criar backup
  const resultado = await criarBackup(SYSTEM_USER_ID);
  if (resultado.success) {
    console.log(
      `[BackupJob] Backup criado: ${resultado.filename} ` +
        `(${resultado.tablesExported} tabelas, ` +
        `${((resultado.size ?? 0) / 1024).toFixed(1)} KB)`
    );
  } else {
    console.error(`[BackupJob] Falha no backup: ${resultado.error}`);
  }

  // 2. Limpar backups antigos (independente do resultado acima)
  try {
    const limpeza = await limparBackupsAntigos(30);
    if (limpeza.removed > 0) {
      console.log(
        `[BackupJob] Limpeza: ${limpeza.removed} backup(s) antigo(s) removido(s).`
      );
    }
  } catch (err) {
    console.error("[BackupJob] Erro na limpeza de backups antigos:", err);
  }

  console.log("[BackupJob] Ciclo concluído.");
}

/**
 * Agenda o job de backup automático diário.
 * Primeira execução: próximo 02h00 (Brasília).
 * Execuções seguintes: a cada 24 horas.
 */
export function scheduleBackupAutomatico(): void {
  const { ms, proximaExecucao } = msAteProximaExecucao();

  const proximaStr = proximaExecucao.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  console.log(
    `[BackupJob] Próximo backup automático agendado para: ${proximaStr} (Brasília)`
  );

  // Primeira execução no horário calculado
  setTimeout(async () => {
    await runBackupAutomatico();

    // Execuções subsequentes a cada 24 horas
    setInterval(async () => {
      await runBackupAutomatico();
    }, 24 * 60 * 60 * 1000);
  }, ms);
}

/**
 * Executa backup imediato (útil para testes ou manutenção manual via painel admin)
 */
export async function runImmediateBackup(): Promise<void> {
  console.log("[BackupJob] Executando backup imediato...");
  await runBackupAutomatico();
}
