import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const modelosRouter = router({
  listar: publicProcedure
    .input(z.object({
      tipo: z.enum(["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"]).optional(),
      area: z.string().optional(), busca: z.string().optional(), apenasGratuitos: z.boolean().optional()
    }).optional())
    .query(async ({ input }) => {
      const { MODELOS_PROFISSIONAIS, filtrarModelos } = await import("../modelos-profissionais");
      if (!input) return MODELOS_PROFISSIONAIS;
      return filtrarModelos(input.tipo, input.area, input.busca, input.apenasGratuitos);
    }),

  obterPorId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { MODELOS_PROFISSIONAIS } = await import("../modelos-profissionais");
      const modelo = MODELOS_PROFISSIONAIS.find(m => m.id === input.id);
      if (!modelo) throw new Error("Modelo não encontrado");
      return modelo;
    }),

  verificarAcesso: protectedProcedure
    .input(z.object({ modeloId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { MODELOS_PROFISSIONAIS } = await import("../modelos-profissionais");
      const modelo = MODELOS_PROFISSIONAIS.find(m => m.id === input.modeloId);
      if (!modelo) return { temAcesso: false, motivo: "Modelo não encontrado" };
      if (!modelo.isPremium) return { temAcesso: true };
      const plano = (ctx.user as any).subscriptionPlan || "free";
      const temAcesso = plano === "pro" || plano === "enterprise";
      return { temAcesso, motivo: temAcesso ? undefined : "Este modelo é exclusivo para assinantes Premium." };
    }),

  registrarUso: protectedProcedure
    .input(z.object({ modeloId: z.string() }))
    .mutation(async ({ input, ctx }) => { await db.registrarUsoModelo(ctx.user.id, input.modeloId); return { sucesso: true }; }),

  maisUsados: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }).optional())
    .query(async ({ input, ctx }) => {
      const { MODELOS_PROFISSIONAIS } = await import("../modelos-profissionais");
      const limit = input?.limit || 5;
      const usados = await db.getModelosMaisUsados(ctx.user.id, limit);
      return usados.map(u => {
        const modelo = MODELOS_PROFISSIONAIS.find(m => m.id === u.modeloId);
        if (!modelo) return null;
        return {
          id: modelo.id, nome: modelo.nome, descricao: modelo.descricao,
          tipoDocumento: modelo.tipoDocumento, areaJuridica: modelo.areaJuridica,
          contextoJuridico: modelo.contextoJuridico, objetivoEspecifico: modelo.objetivoEspecifico,
          partesEnvolvidas: modelo.partesEnvolvidas, legislacaoRelevante: modelo.legislacaoRelevante,
          detalhesAdicionais: modelo.detalhesAdicionais, isPremium: modelo.isPremium,
          tags: modelo.tags, vezesUsado: Number(u.count)
        };
      }).filter(m => m !== null);
    })
});
