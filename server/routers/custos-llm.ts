/**
 * Router de Custos LLM — acesso restrito a administradores.
 * Expõe resumo de custos, tendências, tabela de preços e projeções.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { calcularResumoCustos, obterTabelaPrecos } from "../db-llm-custos";

/** Middleware que garante acesso apenas para admins */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito a administradores.",
    });
  }
  return next({ ctx });
});

export const custosLlmRouter = router({
  /**
   * Resumo completo de custos: por modelo, provider, tendência diária e top usuários.
   */
  resumo: adminProcedure
    .input(
      z.object({
        horasAtras: z.number().min(1).max(8760).default(720), // padrão: 30 dias
        taxaCambio: z.number().min(1).max(20).default(5.0),
      }).optional()
    )
    .query(async ({ input }) => {
      const horas = input?.horasAtras ?? 720;
      const taxa = input?.taxaCambio ?? 5.0;
      return calcularResumoCustos(horas, taxa);
    }),

  /**
   * Tabela de preços dos modelos disponíveis.
   */
  tabelaPrecos: adminProcedure
    .query(async () => {
      return obterTabelaPrecos();
    }),

  /**
   * Comparação de custo entre dois períodos (mês atual vs. mês anterior).
   */
  comparacaoPeriodos: adminProcedure
    .query(async () => {
      const [periodoAtual, periodoAnterior] = await Promise.all([
        calcularResumoCustos(720),   // últimos 30 dias
        calcularResumoCustos(1440),  // últimos 60 dias (inclui os 30 anteriores)
      ]);

      const custoAnterior = periodoAnterior.totalCustoUsd - periodoAtual.totalCustoUsd;
      const variacaoPercent = custoAnterior > 0
        ? ((periodoAtual.totalCustoUsd - custoAnterior) / custoAnterior) * 100
        : 0;

      return {
        periodoAtual: {
          label: "Últimos 30 dias",
          custoUsd: periodoAtual.totalCustoUsd,
          custoBrl: periodoAtual.totalCustoBrl,
          chamadas: periodoAtual.totalChamadas,
          tokens: periodoAtual.totalTokens,
        },
        periodoAnterior: {
          label: "30 dias anteriores",
          custoUsd: custoAnterior,
          custoBrl: custoAnterior * 5.0,
          chamadas: periodoAnterior.totalChamadas - periodoAtual.totalChamadas,
          tokens: periodoAnterior.totalTokens - periodoAtual.totalTokens,
        },
        variacaoPercent,
        tendencia: variacaoPercent > 10 ? "alta" : variacaoPercent < -10 ? "queda" : "estavel",
      };
    }),

  /**
   * Projeção de custo para os próximos 30/90/365 dias.
   */
  projecao: adminProcedure
    .input(
      z.object({
        taxaCambio: z.number().min(1).max(20).default(5.0),
      }).optional()
    )
    .query(async ({ input }) => {
      const taxa = input?.taxaCambio ?? 5.0;
      // Usa os últimos 7 dias para projeção mais precisa
      const ultimos7Dias = await calcularResumoCustos(168, taxa);
      const custoDiario = ultimos7Dias.totalCustoUsd / 7;

      return {
        custoDiarioUsd: custoDiario,
        custoDiarioBrl: custoDiario * taxa,
        projecao30DiasUsd: custoDiario * 30,
        projecao30DiasBrl: custoDiario * 30 * taxa,
        projecao90DiasUsd: custoDiario * 90,
        projecao90DiasBrl: custoDiario * 90 * taxa,
        projecao365DiasUsd: custoDiario * 365,
        projecao365DiasBrl: custoDiario * 365 * taxa,
        baseCalculo: "Média dos últimos 7 dias",
        taxaCambio: taxa,
      };
    }),
});
