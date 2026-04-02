import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  salvarVersaoDocumento,
  listarGruposDocumentos,
  listarVersoesGrupo,
  obterVersaoDocumento,
  atualizarNotasVersao,
  excluirVersaoDocumento,
  excluirGrupoDocumentos,
} from "../db-document-versions";
import { logger } from "../_core/logger";

export const documentVersionsRouter = router({
  /**
   * Salvar uma nova versão de documento gerado.
   * Chamado automaticamente após cada geração de documento.
   */
  salvar: protectedProcedure
    .input(
      z.object({
        groupId: z.string().min(1),
        titulo: z.string().min(1),
        tipoDocumento: z.string().min(1),
        areaJuridica: z.string().min(1),
        estrategia: z.string().min(1),
        contexto: z.string().min(1),
        objetivo: z.string().optional(),
        partesEnvolvidas: z.string().optional(),
        legislacao: z.string().optional(),
        detalhes: z.string().optional(),
        documento: z.string().min(1),
        tempoGeracaoMs: z.number().optional(),
        metadata: z.any().optional(),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const id = await salvarVersaoDocumento({
          userId: ctx.user.id,
          groupId: input.groupId,
          titulo: input.titulo,
          tipoDocumento: input.tipoDocumento,
          areaJuridica: input.areaJuridica,
          estrategia: input.estrategia,
          contexto: input.contexto,
          objetivo: input.objetivo ?? null,
          partesEnvolvidas: input.partesEnvolvidas ?? null,
          legislacao: input.legislacao ?? null,
          detalhes: input.detalhes ?? null,
          documento: input.documento,
          tempoGeracaoMs: input.tempoGeracaoMs ?? null,
          metadata: input.metadata ?? null,
          notas: input.notas ?? null,
        });

        return { id, success: true };
      } catch (error) {
        logger.error("[DocumentVersions] Erro ao salvar versão", {
          userId: ctx.user.id,
          error,
        });
        throw new Error("Erro ao salvar versão do documento");
      }
    }),

  /**
   * Listar todos os grupos de documentos do usuário.
   * Cada grupo representa um "caso" com múltiplas versões.
   */
  listarGrupos: protectedProcedure.query(async ({ ctx }) => {
    return listarGruposDocumentos(ctx.user.id);
  }),

  /**
   * Listar todas as versões de um grupo específico.
   */
  listarVersoes: protectedProcedure
    .input(z.object({ groupId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return listarVersoesGrupo(ctx.user.id, input.groupId);
    }),

  /**
   * Obter uma versão específica por ID.
   */
  obterVersao: protectedProcedure
    .input(z.object({ versionId: z.number() }))
    .query(async ({ ctx, input }) => {
      return obterVersaoDocumento(ctx.user.id, input.versionId);
    }),

  /**
   * Atualizar notas de uma versão.
   */
  atualizarNotas: protectedProcedure
    .input(
      z.object({
        versionId: z.number(),
        notas: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await atualizarNotasVersao(ctx.user.id, input.versionId, input.notas);
      return { success: true };
    }),

  /**
   * Excluir uma versão específica.
   */
  excluirVersao: protectedProcedure
    .input(z.object({ versionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await excluirVersaoDocumento(ctx.user.id, input.versionId);
      return { success: true };
    }),

  /**
   * Excluir todas as versões de um grupo.
   */
  excluirGrupo: protectedProcedure
    .input(z.object({ groupId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await excluirGrupoDocumentos(ctx.user.id, input.groupId);
      return { success: true };
    }),
});
