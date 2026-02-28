import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { criarPerfil, listarPerfis, deletarPerfil, buscarPerfilPorId } from "../db-perfis";
import { sugerirArea } from "../sugestao-area";

export const perfisRouter = router({
  criar: protectedProcedure
    .input(z.object({
      nome: z.string().min(3, "Nome muito curto"),
      tipoDocumento: z.enum(["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"]),
      areaJuridica: z.string(), modeloId: z.string().optional(), descricao: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => criarPerfil({ userId: ctx.user.id, ...input })),

  listar: protectedProcedure.query(async ({ ctx }) => listarPerfis(ctx.user.id)),

  deletar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => deletarPerfil(input.id, ctx.user.id)),

  buscar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => buscarPerfilPorId(input.id, ctx.user.id))
});

export const formatacaoTemplatesRouter = router({
  criar: protectedProcedure
    .input(z.object({
      nome: z.string().min(3), fonte: z.string().optional(), tamanhoFonte: z.number().optional(),
      espacamento: z.string().optional(), margemSuperior: z.number().optional(), margemInferior: z.number().optional(),
      margemEsquerda: z.number().optional(), margemDireita: z.number().optional(),
      incluirCabecalho: z.boolean().optional(), incluirDataHora: z.boolean().optional(), isPadrao: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => db.criarFormatacaoTemplate({ userId: ctx.user.id, ...input })),

  listar: protectedProcedure.query(async ({ ctx }) => db.listarFormatacaoTemplates(ctx.user.id)),

  buscar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => db.buscarFormatacaoTemplate(input.id, ctx.user.id)),

  buscarPadrao: protectedProcedure.query(async ({ ctx }) => db.buscarFormatacaoTemplatePadrao(ctx.user.id)),

  atualizar: protectedProcedure
    .input(z.object({
      id: z.number(), nome: z.string().optional(), fonte: z.string().optional(), tamanhoFonte: z.number().optional(),
      espacamento: z.string().optional(), margemSuperior: z.number().optional(), margemInferior: z.number().optional(),
      margemEsquerda: z.number().optional(), margemDireita: z.number().optional(),
      incluirCabecalho: z.boolean().optional(), incluirDataHora: z.boolean().optional(), isPadrao: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => { const { id, ...data } = input; return db.atualizarFormatacaoTemplate(id, ctx.user.id, data); }),

  deletar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => db.deletarFormatacaoTemplate(input.id, ctx.user.id)),

  definirPadrao: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => db.definirFormatacaoTemplatePadrao(input.id, ctx.user.id))
});

export const sugestaoRouter = router({
  area: protectedProcedure
    .input(z.object({ contexto: z.string().min(10, "Contexto muito curto"), objetivo: z.string().optional() }))
    .query(async ({ input }) => sugerirArea(input.contexto, input.objetivo))
});
