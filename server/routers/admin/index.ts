/**
 * Admin Router — Barrel file
 * Compõe todos os sub-routers em um único adminRouter
 * 
 * Sub-routers:
 * - cache: Cache helpers, auditoria de serialização, testes de integração
 * - auditoria: Logs de auditoria
 * - performance: Métricas, alertas, dependências, backup, Sentry
 * - features: Feature flags
 * - leads: Leads enterprise, interessados no lançamento
 * - whitelist: Whitelist CRUD, convites, reenvio automático
 * - resend: Diagnóstico do Resend
 * - acessos: Log de acessos, arquivamento de cards
 */

import { router } from "../../_core/trpc";
import { adminCacheRouter } from "./cache";
import { adminAuditoriaRouter } from "./auditoria";
import { adminPerformanceRouter } from "./performance";
import { adminFeaturesRouter } from "./features";
import { adminLeadsRouter } from "./leads";
import { adminWhitelistRouter } from "./whitelist";
import { adminResendRouter } from "./resend";
import { adminAcessosRouter } from "./acessos";

// Re-export shared utilities
export { adminProcedure, getCachedData } from "./shared";

/**
 * adminRouter composto — mantém a mesma API pública do admin.ts original
 * usando router.merge() para flatten todos os procedures no mesmo namespace
 */
export const adminRouter = router({
  // Cache & Testes de Integração
  ...adminCacheRouter._def.procedures,
  // Logs de Auditoria
  ...adminAuditoriaRouter._def.procedures,
  // Performance, Alertas, Backup, Sentry
  ...adminPerformanceRouter._def.procedures,
  // Feature Flags
  ...adminFeaturesRouter._def.procedures,
  // Leads Enterprise & Interessados
  ...adminLeadsRouter._def.procedures,
  // Whitelist & Manutenção
  ...adminWhitelistRouter._def.procedures,
  // Diagnóstico Resend
  ...adminResendRouter._def.procedures,
  // Log de Acessos & Cards Arquivados
  ...adminAcessosRouter._def.procedures,
});
