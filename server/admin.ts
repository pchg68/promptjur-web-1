/**
 * Admin Router — Barrel re-export
 * 
 * O admin.ts original (1585 linhas) foi refatorado em sub-routers modulares:
 * 
 * server/routers/admin/
 * ├── shared.ts       — adminProcedure, cache helpers
 * ├── cache.ts        — Serialização, cache, testes de integração
 * ├── auditoria.ts    — Logs de auditoria
 * ├── performance.ts  — Métricas, alertas, backup, Sentry, dependências
 * ├── features.ts     — Feature flags
 * ├── leads.ts        — Leads enterprise, interessados
 * ├── whitelist.ts    — Whitelist CRUD, convites, reenvio
 * ├── resend.ts       — Diagnóstico Resend
 * ├── acessos.ts      — Log de acessos, cards arquivados
 * └── index.ts        — Barrel que compõe adminRouter
 * 
 * Este arquivo mantém a compatibilidade com os imports existentes:
 * - import { adminRouter } from "./admin"
 * - import { getCachedData } from "../admin"
 */

export { adminRouter, getCachedData, adminProcedure } from "./routers/admin";
