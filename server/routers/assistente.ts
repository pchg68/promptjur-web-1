import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  criarSessao,
  listarSessoes,
  buscarSessao,
  atualizarSessao,
  deletarSessao,
  listarMensagens,
  salvarMensagem,
} from "../db-chat";
import { gerarPerguntaEtapa } from "../assistente-prompts";

export const assistenteRouter = router({
  /** Listar todas as sessões do usuário */
  listarSessoes: protectedProcedure.query(async ({ ctx }) => {
    return listarSessoes(ctx.user.id);
  }),

  /** Criar nova sessão de chat */
  criarSessao: protectedProcedure
    .input(
      z.object({
        titulo: z.string().optional(),
        areaJuridica: z.string().optional(),
        tipoDocumento: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = await criarSessao({
        userId: ctx.user.id,
        titulo: input.titulo ?? "Nova conversa",
        etapaAtual: 1,
        etapaConcluida: false,
        areaJuridica: input.areaJuridica,
        tipoDocumento: input.tipoDocumento,
      });

      // Salvar mensagem inicial do assistente (boas-vindas + etapa 1)
      const perguntaInicial = gerarPerguntaEtapa(1);
      await salvarMensagem({
        sessionId,
        role: "assistant",
        content: perguntaInicial,
        etapa: 1,
      });

      return { sessionId };
    }),

  /** Buscar sessão com mensagens */
  buscarSessao: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const sessao = await buscarSessao(input.sessionId, ctx.user.id);
      if (!sessao) throw new Error("Sessão não encontrada");
      const mensagens = await listarMensagens(input.sessionId);
      return { sessao, mensagens };
    }),

  /** Deletar sessão */
  deletarSessao: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deletarSessao(input.sessionId, ctx.user.id);
      return { success: true };
    }),

  /** Atualizar título da sessão */
  atualizarTitulo: protectedProcedure
    .input(z.object({ sessionId: z.number(), titulo: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      await atualizarSessao(input.sessionId, ctx.user.id, { titulo: input.titulo });
      return { success: true };
    }),

  /** Salvar prompt gerado ao final do wizard */
  salvarPromptGerado: protectedProcedure
    .input(z.object({ sessionId: z.number(), promptGerado: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await atualizarSessao(input.sessionId, ctx.user.id, {
        promptGerado: input.promptGerado,
        etapaConcluida: true,
      });
      return { success: true };
    }),

  /** Reiniciar wizard (volta para etapa 1) */
  reiniciarWizard: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await atualizarSessao(input.sessionId, ctx.user.id, {
        etapaAtual: 1,
        etapaConcluida: false,
        contextoAcumulado: {},
        promptGerado: null,
      });
      // Adicionar mensagem de reinício
      const perguntaInicial = gerarPerguntaEtapa(1);
      await salvarMensagem({
        sessionId: input.sessionId,
        role: "assistant",
        content: "---\n*Wizard reiniciado. Vamos começar novamente!*\n\n" + perguntaInicial,
        etapa: 1,
      });
      return { success: true };
    }),
});
