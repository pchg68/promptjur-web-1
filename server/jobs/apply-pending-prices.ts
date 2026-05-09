/**
 * Job de Aplicação de Reajustes Pendentes — PromptJur
 *
 * Executa diariamente (a cada 24 horas) e aplica automaticamente os reajustes
 * de preço cujo aviso prévio de 30 dias já expirou (effectiveDate <= agora).
 *
 * Conformidade: CDC Art. 6º, III — o consumidor foi notificado com 30 dias
 * de antecedência. Após esse prazo, o reajuste é aplicado automaticamente.
 *
 * Fluxo:
 * 1. Busca price_change_notices com status="pending" e effectiveDate <= agora
 * 2. Para cada notice, aplica o override de preço via updatePrices()
 * 3. Marca o notice como "applied" com appliedAt = agora
 * 4. Notifica o owner via notifyOwner()
 */

/** Intervalo de execução: 24 horas em milissegundos */
const INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Executa o job de aplicação de reajustes pendentes.
 * Retorna o número de reajustes aplicados e erros encontrados.
 */
export async function runApplyPendingPricesJob(): Promise<{ applied: number; errors: string[] }> {
  try {
    const { applyPendingPriceChanges } = await import("../scheduled/price-change-notice");
    const result = await applyPendingPriceChanges();

    if (result.applied > 0) {
      console.log(
        `[ApplyPendingPrices] ${result.applied} reajuste(s) aplicado(s) com sucesso`
      );
    } else {
      console.log("[ApplyPendingPrices] Nenhum reajuste pendente para aplicar");
    }

    if (result.errors.length > 0) {
      console.error("[ApplyPendingPrices] Erros:", result.errors);
    }

    return result;
  } catch (err: any) {
    const msg = `[ApplyPendingPrices] Exceção: ${err?.message}`;
    console.error(msg);
    return { applied: 0, errors: [msg] };
  }
}

/**
 * Agenda o job de aplicação de reajustes para rodar diariamente.
 * Executa também imediatamente ao iniciar para cobrir reajustes
 * que possam ter ficado pendentes durante downtime.
 */
export function scheduleApplyPendingPrices(): void {
  // Execução imediata ao iniciar (cobre reajustes pendentes durante downtime)
  // Usa timeout de 5s para não bloquear o boot do servidor
  setTimeout(() => {
    runApplyPendingPricesJob().catch((err) =>
      console.error("[ApplyPendingPrices] Erro na execução inicial:", err)
    );
  }, 5000);

  // Execuções subsequentes a cada 24 horas
  setInterval(() => {
    runApplyPendingPricesJob().catch((err) =>
      console.error("[ApplyPendingPrices] Erro na execução periódica:", err)
    );
  }, INTERVAL_MS);

  console.log("[ApplyPendingPrices] Job agendado — execução a cada 24 horas");
}
