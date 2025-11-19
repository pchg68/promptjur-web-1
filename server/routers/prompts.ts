import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { gerarAvisosFontes } from "@shared/verificacao-fontes";

/**
 * Router de Prompts Jurídicos
 * Implementa análise, geração e otimização de prompts com verificação automática de fontes
 */
export const promptsRouter = router({
  /**
   * Analisar um prompt jurídico existente
   */
  analisar: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(10, "Prompt deve ter pelo menos 10 caracteres"),
        contexto: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prompt, contexto } = input;

      // Chamar LLM para análise
      const systemPrompt = `Você é um especialista em engenharia de prompts jurídicos brasileiros. 
Analise o prompt fornecido e identifique:
1. Clareza e precisão da linguagem jurídica
2. Estrutura e organização
3. Completude das informações
4. Possíveis melhorias
5. Citações legais presentes

Forneça uma análise detalhada e construtiva.`;

      const userPrompt = contexto
        ? `Contexto: ${contexto}\n\nPrompt a analisar:\n${prompt}`
        : `Prompt a analisar:\n${prompt}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      const resultado = typeof messageContent === 'string' ? messageContent : '';

      // Verificar fontes no prompt original
      const avisosFontes = gerarAvisosFontes(prompt);

      return {
        resultado,
        avisosFontes,
        promptAnalisado: prompt,
      };
    }),

  /**
   * Gerar um novo prompt jurídico
   */
  gerar: protectedProcedure
    .input(
      z.object({
        objetivo: z.string().min(10, "Objetivo deve ter pelo menos 10 caracteres"),
        areaJuridica: z.string().optional(),
        contextoAdicional: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { objetivo, areaJuridica, contextoAdicional } = input;

      // Chamar LLM para geração
      const systemPrompt = `Você é um especialista em engenharia de prompts jurídicos brasileiros.
Crie um prompt jurídico profissional, claro e eficaz baseado no objetivo fornecido.
O prompt deve ser estruturado, preciso e adequado para uso com IA em contextos jurídicos.`;

      let userPrompt = `Objetivo: ${objetivo}`;
      if (areaJuridica) {
        userPrompt += `\nÁrea Jurídica: ${areaJuridica}`;
      }
      if (contextoAdicional) {
        userPrompt += `\nContexto Adicional: ${contextoAdicional}`;
      }

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      const promptGerado = typeof messageContent === 'string' ? messageContent : '';

      // Verificar fontes no prompt gerado
      const avisosFontes = gerarAvisosFontes(promptGerado);

      return {
        promptGerado,
        avisosFontes,
        objetivo,
      };
    }),

  /**
   * Otimizar um prompt jurídico existente
   */
  otimizar: protectedProcedure
    .input(
      z.object({
        promptOriginal: z.string().min(10, "Prompt deve ter pelo menos 10 caracteres"),
        focoOtimizacao: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { promptOriginal, focoOtimizacao } = input;

      // Chamar LLM para otimização
      const systemPrompt = `Você é um especialista em engenharia de prompts jurídicos brasileiros.
Otimize o prompt fornecido melhorando:
1. Clareza e precisão
2. Estrutura e organização
3. Linguagem jurídica adequada
4. Completude das informações

Mantenha o objetivo original, mas torne o prompt mais eficaz.`;

      let userPrompt = `Prompt Original:\n${promptOriginal}`;
      if (focoOtimizacao) {
        userPrompt += `\n\nFoco da Otimização: ${focoOtimizacao}`;
      }

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      const promptOtimizado = typeof messageContent === 'string' ? messageContent : '';

      // Verificar fontes no prompt otimizado
      const avisosFontes = gerarAvisosFontes(promptOtimizado);

      return {
        promptOriginal,
        promptOtimizado,
        avisosFontes,
        melhorias: "Prompt otimizado com sucesso",
      };
    }),
});
