/**
 * Admin Sub-Router: Logs de Auditoria
 * - Listar logs de auditoria
 * - Estatísticas de auditoria
 */

import { z } from "zod";
import { router } from "../../_core/trpc";
import { adminProcedure } from "./shared";
import { listarLogs, getAuditStats } from "../../audit";

export const adminAuditoriaRouter = router({
  // Listar logs de auditoria
  listarLogs: adminProcedure
    .input(z.object({
      userId: z.number().optional(),
      acao: z.string().optional(),
      dataInicio: z.string().optional(), // ISO string
      dataFim: z.string().optional(), // ISO string
      limit: z.number().min(1).max(500).optional().default(100)
    }).optional())
    .query(async ({ input }) => {
      const params = {
        userId: input?.userId,
        acao: input?.acao,
        dataInicio: input?.dataInicio ? new Date(input.dataInicio) : undefined,
        dataFim: input?.dataFim ? new Date(input.dataFim) : undefined,
        limit: input?.limit
      };
      return listarLogs(params);
    }),
  
  // Estatísticas de auditoria
  statsAuditoria: adminProcedure.query(async () => {
    return getAuditStats();
  }),
});
