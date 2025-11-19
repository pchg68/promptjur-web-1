import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

/**
 * Router de Templates Jurídicos
 * Implementa visualização pública e importação de templates
 */
export const templatesRouter = router({
  /**
   * Buscar template público por ID
   * Permite visualização sem autenticação
   */
  getPublico: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      // TODO: Implementar busca no banco de dados quando schema estiver pronto
      // Por enquanto, retornar dados mock para demonstração
      
      const { id } = input;
      
      // Simular template público
      const templateMock = {
        id,
        nome: "Template de Petição Inicial",
        descricao: "Template profissional para elaboração de petições iniciais em processos cíveis",
        areaJuridica: "Direito Civil",
        conteudo: `Você é um assistente jurídico especializado em Direito Civil brasileiro.

Elabore uma petição inicial considerando:
- Qualificação completa das partes
- Dos fatos (narrativa clara e cronológica)
- Do direito (fundamentação legal com citações)
- Dos pedidos (principal e subsidiários)
- Do valor da causa
- Das provas que pretende produzir

Utilize linguagem técnica, formal e respeitosa. Cite a legislação aplicável (Código Civil, CPC, CF/88).`,
        isPublico: true,
        criadoPor: "Sistema",
        criadoEm: new Date().toISOString(),
      };
      
      if (!templateMock.isPublico) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template não encontrado ou não é público",
        });
      }
      
      return templateMock;
    }),

  /**
   * Importar template público para biblioteca do usuário
   * Requer autenticação
   */
  importar: protectedProcedure
    .input(
      z.object({
        templateId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { templateId } = input;
      const userId = ctx.user.id;
      
      // TODO: Implementar lógica de importação no banco de dados
      // 1. Buscar template público
      // 2. Criar cópia na biblioteca do usuário
      // 3. Retornar sucesso
      
      return {
        success: true,
        message: "Template importado com sucesso para sua biblioteca",
        templateId,
      };
    }),
});
