/**
 * Alerta Proativo de Erros de Query — PromptJur
 *
 * Monitora erros do tipo "Failed query" (geralmente causados por tabelas faltando
 * no banco de produção) e notifica o owner quando o threshold for atingido.
 *
 * Threshold padrão: 3 erros do mesmo tipo em 1 hora → notificação imediata.
 *
 * Isso complementa o Sentry (que registra cada erro individualmente) com
 * notificações proativas via sistema de notificações do PromptJur.
 */

import { notifyOwner } from "./notification";

/** Threshold: número de erros antes de notificar */
const ERROR_THRESHOLD = 3;

/** Janela de tempo para contar erros (1 hora em ms) */
const TIME_WINDOW_MS = 60 * 60 * 1000;

/** Cooldown entre notificações do mesmo erro (2 horas em ms) */
const NOTIFICATION_COOLDOWN_MS = 2 * 60 * 60 * 1000;

interface ErrorEntry {
  message: string;
  path: string;
  timestamp: number;
}

interface AlertState {
  errors: ErrorEntry[];
  lastNotifiedAt: number;
}

/** Mapa de alertas por "fingerprint" do erro (ex: nome da tabela) */
const alertStates = new Map<string, AlertState>();

/**
 * Extrai o fingerprint de um erro de query para agrupamento.
 * Ex: "Failed query: select ... from admin_cards_arquivados" → "admin_cards_arquivados"
 */
function extractFingerprint(message: string): string | null {
  // Padrão: "Failed query: select ... from `table_name`"
  const fromMatch = message.match(/from\s+[`']?(\w+)[`']?/i);
  if (fromMatch) return `table:${fromMatch[1]}`;

  // Padrão genérico: primeiras 60 chars do erro
  if (message.includes("Failed query")) {
    return `query:${message.slice(0, 60).replace(/\s+/g, " ").trim()}`;
  }

  return null;
}

/**
 * Registra um erro de query e verifica se o threshold foi atingido.
 * Deve ser chamado no middleware tRPC ao detectar erros de banco.
 */
export async function trackQueryError(
  errorMessage: string,
  path: string
): Promise<void> {
  const fingerprint = extractFingerprint(errorMessage);
  if (!fingerprint) return;

  const now = Date.now();

  // Inicializar estado se necessário
  if (!alertStates.has(fingerprint)) {
    alertStates.set(fingerprint, { errors: [], lastNotifiedAt: 0 });
  }

  const state = alertStates.get(fingerprint)!;

  // Adicionar novo erro
  state.errors.push({ message: errorMessage, path, timestamp: now });

  // Remover erros fora da janela de tempo
  state.errors = state.errors.filter(
    (e) => now - e.timestamp < TIME_WINDOW_MS
  );

  // Verificar threshold
  const recentCount = state.errors.length;
  const cooldownExpired = now - state.lastNotifiedAt > NOTIFICATION_COOLDOWN_MS;

  if (recentCount >= ERROR_THRESHOLD && cooldownExpired) {
    state.lastNotifiedAt = now;

    // Agrupar paths únicos afetados
    const affectedPaths = [...new Set(state.errors.map((e) => e.path))].join(", ");
    const firstError = state.errors[0].message;

    console.error(
      `[QueryErrorAlert] THRESHOLD ATINGIDO: ${recentCount} erros em 1h para "${fingerprint}"`
    );

    // Notificar owner de forma não-bloqueante
    notifyOwner({
      title: `🚨 Query Error Alert: ${recentCount}+ erros em 1h`,
      content: [
        `**Fingerprint:** \`${fingerprint}\``,
        `**Ocorrências na última hora:** ${recentCount}`,
        `**Endpoints afetados:** ${affectedPaths}`,
        "",
        "**Mensagem do erro:**",
        `\`\`\``,
        firstError.slice(0, 500),
        `\`\`\``,
        "",
        "**Possíveis causas:**",
        "• Tabela não existe no banco de produção (execute `pnpm db:push`)",
        "• Coluna renomeada/removida sem migração",
        "• Permissão de acesso negada no banco",
        "",
        `Verifique o Sentry para o stack trace completo.`,
      ].join("\n"),
    }).catch((err) =>
      console.error("[QueryErrorAlert] Falha ao notificar owner:", err?.message)
    );
  }
}

/**
 * Retorna estatísticas dos erros monitorados (para painel admin).
 */
export function getQueryErrorStats(): Array<{
  fingerprint: string;
  recentCount: number;
  lastSeenAt: Date | null;
  lastNotifiedAt: Date | null;
}> {
  const now = Date.now();
  const stats = [];

  for (const [fingerprint, state] of alertStates.entries()) {
    const recentErrors = state.errors.filter(
      (e: any) => now - e.timestamp < TIME_WINDOW_MS
    );

    stats.push({
      fingerprint,
      recentCount: recentErrors.length,
      lastSeenAt:
        recentErrors.length > 0
          ? new Date(recentErrors[recentErrors.length - 1].timestamp)
          : null,
      lastNotifiedAt:
        state.lastNotifiedAt > 0 ? new Date(state.lastNotifiedAt) : null,
    });
  }

  return stats.sort((a, b) => b.recentCount - a.recentCount);
}

/**
 * Limpa estados antigos (erros fora da janela de tempo) para evitar vazamento de memória.
 * Executar periodicamente (a cada hora).
 */
export function cleanupQueryErrorStates(): void {
  const now = Date.now();
  for (const [fingerprint, state] of alertStates.entries()) {
    state.errors = state.errors.filter(
      (e: any) => now - e.timestamp < TIME_WINDOW_MS
    );
    // Remover entradas completamente vazias e sem notificação recente
    if (
      state.errors.length === 0 &&
      now - state.lastNotifiedAt > NOTIFICATION_COOLDOWN_MS
    ) {
      alertStates.delete(fingerprint);
    }
  }
}

// Limpeza automática a cada hora
setInterval(cleanupQueryErrorStates, 60 * 60 * 1000);
