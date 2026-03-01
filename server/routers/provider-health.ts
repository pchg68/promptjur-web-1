import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getConfiguredProviders, isProviderConfigured, type LLMProvider } from "../unified-llm";
import { canAccessModel, getModelAccessInfo, type UserPlan } from "../plan-access";

export const providerHealthRouter = router({
  /**
   * Retorna o status de configuração de todos os provedores de IA
   * e quais modelos o usuário pode acessar com seu plano atual
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const userPlan = (ctx.user.subscriptionPlan || "free") as UserPlan;
    const configuredProviders = getConfiguredProviders();
    
    const providers: Array<{
      id: string;
      name: string;
      configured: boolean;
      modelsCount: number;
    }> = [
      { id: "manus", name: "Manus AI", configured: isProviderConfigured("manus"), modelsCount: 1 },
      { id: "openai", name: "OpenAI", configured: isProviderConfigured("openai"), modelsCount: 3 },
      { id: "claude", name: "Anthropic Claude", configured: isProviderConfigured("claude"), modelsCount: 2 },
      { id: "gemini", name: "Google Gemini", configured: isProviderConfigured("gemini"), modelsCount: 2 },
      { id: "perplexity", name: "Perplexity", configured: isProviderConfigured("perplexity"), modelsCount: 1 },
    ];

    const modelAccess = getModelAccessInfo(userPlan);
    const accessibleCount = modelAccess.filter(m => m.hasAccess).length;
    const totalCount = modelAccess.length;

    return {
      userPlan,
      configuredProviders: configuredProviders.length,
      totalProviders: 5,
      providers,
      modelAccess: {
        accessible: accessibleCount,
        total: totalCount,
        details: modelAccess,
      },
    };
  }),

  /**
   * Testa a conectividade de um provedor específico fazendo uma chamada leve
   */
  testProvider: protectedProcedure
    .input(z.object({
      provider: z.enum(["manus", "openai", "claude", "gemini", "perplexity"]),
    }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      
      try {
        if (!isProviderConfigured(input.provider as LLMProvider)) {
          return {
            provider: input.provider,
            status: "not_configured" as const,
            latencyMs: 0,
            message: "Provedor não configurado. Configure a API key nas configurações.",
          };
        }

        const { invokeUnifiedLLM } = await import("../unified-llm");
        
        // Chamada leve: pedir apenas "ok" para testar conectividade
        const response = await invokeUnifiedLLM({
          provider: input.provider as LLMProvider,
          messages: [
            { role: "user", content: "Responda apenas com a palavra 'ok'." },
          ],
        });

        const latencyMs = Date.now() - startTime;
        const content = response.content;

        return {
          provider: input.provider,
          status: "online" as const,
          latencyMs,
          message: `Provedor respondeu em ${latencyMs}ms`,
          response: typeof content === "string" ? content.substring(0, 50) : "ok",
        };
      } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        return {
          provider: input.provider,
          status: "error" as const,
          latencyMs,
          message: error.message || "Erro ao conectar com o provedor",
        };
      }
    }),
});
