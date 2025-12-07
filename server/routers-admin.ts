import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getTopAreasJuridicas,
  getDistribuicaoPlataformas,
  getEstatisticasGerais,
  getPromptsRecentes,
  getEvolucaoUso,
  getDistribuicaoPorTipo,
} from "./db-admin";
import { getCacheStatistics } from "./db-legislacao-cache";

/**
 * Middleware para verificar se o usuário é admin
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso negado. Esta funcionalidade é exclusiva para administradores.",
    });
  }
  return next({ ctx });
});

/**
 * Router administrativo com métricas e estatísticas da plataforma
 */
export const adminRouter = router({
  /**
   * Retorna estatísticas gerais da plataforma
   */
  getEstatisticasGerais: adminProcedure.query(async () => {
    const stats = await getEstatisticasGerais();
    return stats;
  }),

  /**
   * Retorna as 10 áreas jurídicas mais utilizadas
   */
  getTopAreasJuridicas: adminProcedure.query(async () => {
    const topAreas = await getTopAreasJuridicas();
    return topAreas;
  }),

  /**
   * Retorna a distribuição de uso por plataforma de IA
   */
  getDistribuicaoPlataformas: adminProcedure.query(async () => {
    const distribuicao = await getDistribuicaoPlataformas();
    return distribuicao;
  }),

  /**
   * Retorna os 10 prompts mais recentes
   */
  getPromptsRecentes: adminProcedure.query(async () => {
    const prompts = await getPromptsRecentes();
    return prompts;
  }),

  /**
   * Retorna a evolução de uso nos últimos 30 dias
   */
  getEvolucaoUso: adminProcedure.query(async () => {
    const evolucao = await getEvolucaoUso();
    return evolucao;
  }),

  /**
   * Retorna a distribuição de uso por tipo de ação
   */
  getDistribuicaoPorTipo: adminProcedure.query(async () => {
    const distribuicao = await getDistribuicaoPorTipo();
    return distribuicao;
  }),

  /**
   * Retorna estatísticas do cache de legislação
   */
  getCacheStatistics: adminProcedure.query(async () => {
    const cacheStats = await getCacheStatistics();
    return cacheStats;
  }),
});
