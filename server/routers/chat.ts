import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { canAccessModel, getAccessDeniedMessage } from "../plan-access";

/**
 * Chat router — alimenta o agente "Prof. Prompt" e qualquer outra
 * superfície conversacional do app (AIChatBox).
 *
 * Sprint 1: integração mínima com `invokeUnifiedLLM` para destravar a UI
 * que já estava pronta em `client/src/components/AIChatBox.tsx` mas órfã.
 *
 * Sprints futuros podem adicionar:
 *  - persistência de sessões (`chat_sessoes`, `chat_mensagens`)
 *  - streaming via SSE
 *  - análise estruturada de prompt do usuário com rubric jurídico
 */

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1),
});

const PROVIDERS = ["manus", "openai", "anthropic", "google", "perplexity"] as const;

/**
 * Persona do tutor — "Prof. Prompt".
 * É usado como mensagem de sistema padrão quando o cliente não fornece uma.
 * Mantido aqui (e não no client) para que a persona seja a mesma para todos
 * os consumidores e não possa ser sobrescrita por usuários finais via DevTools.
 */
const PROF_PROMPT_SYSTEM = `Você é o **Prof. Prompt**, tutor sênior especializado em \
engenharia de prompts jurídicos brasileiros. Seu objetivo é AJUDAR o usuário \
a construir prompts melhores — não escrever a peça por ele.

Metodologia (siga sempre):
1. Faça perguntas socráticas sobre fatos faltantes (datas, partes, valores, foro).
2. Aponte ambiguidades concretas com exemplo do que pode dar errado.
3. Sugira teses alternativas que o usuário pode não ter considerado.
4. Quando o prompt estiver claro, diga explicitamente "Agora está pronto" e \
   ofereça uma versão final estruturada (Persona, Contexto, Instruções, \
   Restrições, Verificação de Qualidade).
5. Após qualquer geração, avalie contra um rubric jurídico:
   - Legitimidade ativa/passiva justificada?
   - Competência fundamentada?
   - Pedidos certos, determinados e (quando exigido) com valor?
   - Citações de lei/jurisprudência são verificáveis?

Regras inegociáveis:
- Seja direto, didático e em português brasileiro.
- JAMAIS invente leis, súmulas ou acórdãos. Se não tiver certeza, diga "não tenho \
  certeza, verifique no Planalto/STF/STJ".
- Lembre que sua resposta NÃO substitui consulta a advogado licenciado.
- Use markdown leve (cabeçalhos, listas) para clareza, sem exageros.`;

export const chatRouter = router({
  /**
   * Envia uma rodada de chat para o LLM.
   * Recebe o histórico completo do client (stateless no servidor por enquanto).
   *
   * Convenções:
   * - Se a primeira mensagem não for `system`, o servidor injeta o
   *   `PROF_PROMPT_SYSTEM` automaticamente.
   * - Cliente pode passar `tutorMode: false` para um chat livre sem persona.
   */
  enviar: protectedProcedure
    .input(
      z.object({
        messages: z.array(messageSchema).min(1).max(50),
        provider: z.enum(PROVIDERS).optional(),
        model: z.string().optional(),
        tutorMode: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verificação de acesso ao modelo (mesmo padrão de prompts.ts)
      if (input.model) {
        const plan = (ctx.user.subscriptionPlan || "free") as "free" | "pro" | "enterprise";
        if (!canAccessModel(plan, input.model)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: getAccessDeniedMessage(input.model, plan),
          });
        }
      }

      // Garante que existe uma system message quando em modo tutor
      const messages = [...input.messages];
      const hasSystem = messages[0]?.role === "system";
      if (input.tutorMode && !hasSystem) {
        messages.unshift({ role: "system", content: PROF_PROMPT_SYSTEM });
      }

      const { invokeUnifiedLLM } = await import("../unified-llm");
      const response = await invokeUnifiedLLM({
        provider: input.provider,
        model: input.model,
        messages,
      });

      return {
        role: "assistant" as const,
        content: response.content,
        provider: response.provider,
        model: response.model,
      };
    }),
});
