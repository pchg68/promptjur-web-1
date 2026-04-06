/**
 * Router tRPC para gerenciamento do histórico de prompts salvos (Meus Prompts).
 * Todas as procedures são protegidas — requerem autenticação.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  salvarPrompt,
  listarPromptsSalvos,
  contarPromptsSalvos,
  buscarPromptSalvo,
  atualizarPromptSalvo,
  toggleFavorito,
  deletarPromptSalvo,
  incrementarUsoPrompt,
  listarAreasJuridicas,
} from "../db-prompts-salvos";

const estrategiaEnum = z.enum(["direta", "raciocinio", "recuperacao", "manual"]);

export const promptsSalvosRouter = router({
  /**
   * Salva um novo prompt no histórico do usuário.
   * Chamado automaticamente ao clicar em "Usar este" nas sugestões.
   */
  salvar: protectedProcedure
    .input(
      z.object({
        titulo: z.string().min(1).max(255),
        estrategia: estrategiaEnum.default("manual"),
        areaJuridica: z.string().max(100).optional(),
        tipoDocumento: z.string().max(100).optional(),
        conteudo: z.string().min(10),
        sessionId: z.number().int().positive().optional(),
        notas: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await salvarPrompt({
        userId: ctx.user.id,
        titulo: input.titulo,
        estrategia: input.estrategia,
        areaJuridica: input.areaJuridica ?? null,
        tipoDocumento: input.tipoDocumento ?? null,
        conteudo: input.conteudo,
        sessionId: input.sessionId ?? null,
        notas: input.notas ?? null,
        isFavorito: false,
        usoCount: 0,
      });
      return { id, sucesso: true };
    }),

  /**
   * Lista os prompts salvos do usuário com filtros e paginação.
   */
  listar: protectedProcedure
    .input(
      z.object({
        areaJuridica: z.string().optional(),
        estrategia: estrategiaEnum.optional(),
        apenasFavorito: z.boolean().optional(),
        busca: z.string().max(200).optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const [prompts, total] = await Promise.all([
        listarPromptsSalvos(ctx.user.id, input),
        contarPromptsSalvos(ctx.user.id, {
          areaJuridica: input.areaJuridica,
          estrategia: input.estrategia,
          apenasFavorito: input.apenasFavorito,
          busca: input.busca,
        }),
      ]);
      return { prompts, total };
    }),

  /**
   * Busca um prompt salvo específico pelo ID.
   */
  buscar: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const prompt = await buscarPromptSalvo(input.id, ctx.user.id);
      if (!prompt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Prompt não encontrado" });
      }
      return prompt;
    }),

  /**
   * Atualiza o título, notas ou conteúdo de um prompt salvo.
   */
  atualizar: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        titulo: z.string().min(1).max(255).optional(),
        notas: z.string().max(2000).nullable().optional(),
        conteudo: z.string().min(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...dados } = input;
      // Filtrar undefined para não sobrescrever campos não enviados
      const dadosFiltrados = Object.fromEntries(
        Object.entries(dados).filter(([, v]) => v !== undefined)
      ) as Parameters<typeof atualizarPromptSalvo>[2];

      await atualizarPromptSalvo(id, ctx.user.id, dadosFiltrados);
      return { sucesso: true };
    }),

  /**
   * Alterna o estado de favorito de um prompt.
   */
  toggleFavorito: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const novoEstado = await toggleFavorito(input.id, ctx.user.id);
      return { isFavorito: novoEstado };
    }),

  /**
   * Incrementa o contador de uso de um prompt (chamado ao copiar/usar).
   */
  registrarUso: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await incrementarUsoPrompt(input.id, ctx.user.id);
      return { sucesso: true };
    }),

  /**
   * Remove um prompt do histórico.
   */
  deletar: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await deletarPromptSalvo(input.id, ctx.user.id);
      return { sucesso: true };
    }),

  /**
   * Lista as áreas jurídicas distintas dos prompts salvos (para filtro).
   */
  listarAreas: protectedProcedure.query(async ({ ctx }) => {
    return listarAreasJuridicas(ctx.user.id);
  }),
});
