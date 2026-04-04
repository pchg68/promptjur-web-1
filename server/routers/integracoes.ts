/**
 * Router tRPC para gerenciar integrações do usuário
 * - API Keys: OpenAI, Anthropic, Gemini, Perplexity
 * - OAuth2: Google Drive, Gmail
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserIntegrations,
  getUserIntegration,
  upsertUserIntegration,
  removeUserIntegration,
} from "../db-integrations";
import {
  getGoogleAuthUrl,
  uploadToGoogleDrive,
  sendViaGmail,
  isGoogleConfigured,
} from "../google-integrations";
import { logger } from "../_core/logger";

/** Provedores suportados */
const PROVIDERS_API_KEY = ["openai", "anthropic", "gemini", "perplexity"] as const;
const PROVIDERS_OAUTH = ["google_drive", "gmail"] as const;
const ALL_PROVIDERS = [...PROVIDERS_API_KEY, ...PROVIDERS_OAUTH] as const;
type Provider = (typeof ALL_PROVIDERS)[number];

export const integracoesRouter = router({
  /**
   * Lista todas as integrações ativas do usuário (sem expor as keys)
   */
  listar: protectedProcedure.query(async ({ ctx }) => {
    const integrations = await getUserIntegrations(ctx.user.id);
    const googleConfigured = isGoogleConfigured();

    // Mapear para formato seguro (sem expor tokens/keys completos)
    const result = ALL_PROVIDERS.map((provider) => {
      const integration = integrations.find((i) => i.provider === provider);
      const isOAuth = PROVIDERS_OAUTH.includes(provider as any);
      return {
        provider,
        isConnected: !!integration,
        isOAuth,
        isGoogleAvailable: isOAuth ? googleConfigured : undefined,
        // Mostrar apenas os últimos 4 caracteres da API key
        apiKeyPreview: integration?.apiKey
          ? `...${integration.apiKey.slice(-4)}`
          : null,
        // Email da conta Google conectada
        email: (integration?.metadata as any)?.email ?? null,
        tokenExpiry: integration?.tokenExpiry ?? null,
        connectedAt: integration?.createdAt ?? null,
      };
    });

    return result;
  }),

  /**
   * Salva ou atualiza uma API Key de um provedor
   */
  salvarApiKey: protectedProcedure
    .input(
      z.object({
        provider: z.enum(PROVIDERS_API_KEY),
        apiKey: z.string().min(10, "API Key muito curta"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validação básica da key por provedor
      const prefixos: Record<string, string> = {
        openai: "sk-",
        anthropic: "sk-ant-",
        perplexity: "pplx-",
      };
      const prefixo = prefixos[input.provider];
      if (prefixo && !input.apiKey.startsWith(prefixo)) {
        throw new Error(
          `API Key inválida para ${input.provider}. Deve começar com "${prefixo}"`
        );
      }

      await upsertUserIntegration(ctx.user.id, input.provider, {
        apiKey: input.apiKey,
      });

      logger.info(`[Integracoes] API Key salva para provider=${input.provider}, userId=${ctx.user.id}`);
      return { success: true };
    }),

  /**
   * Remove uma integração (API Key ou OAuth)
   */
  remover: protectedProcedure
    .input(z.object({ provider: z.enum(ALL_PROVIDERS) }))
    .mutation(async ({ ctx, input }) => {
      await removeUserIntegration(ctx.user.id, input.provider);
      logger.info(`[Integracoes] Integração removida: provider=${input.provider}, userId=${ctx.user.id}`);
      return { success: true };
    }),

  /**
   * Gera URL de autorização OAuth2 do Google
   */
  googleAuthUrl: protectedProcedure
    .input(z.object({ provider: z.enum(["google_drive", "gmail"] as const) }))
    .query(async ({ ctx, input }) => {
      if (!isGoogleConfigured()) {
        throw new Error(
          "Integração com Google não configurada no servidor. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET."
        );
      }
      // State = userId:provider para validação no callback
      const state = Buffer.from(`${ctx.user.id}:${input.provider}`).toString("base64");
      const url = getGoogleAuthUrl(
        input.provider === "google_drive" ? "drive" : "gmail",
        state
      );
      return { url };
    }),

  /**
   * Exporta documento para Google Drive
   */
  exportarParaDrive: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const integration = await getUserIntegration(ctx.user.id, "google_drive");
      if (!integration) {
        throw new Error(
          "Conta Google Drive não conectada. Conecte em Configurações → Integrações."
        );
      }

      const result = await uploadToGoogleDrive(
        ctx.user.id,
        input.fileName,
        input.content
      );

      logger.info(`[Integracoes] Documento exportado para Drive: fileId=${result.fileId}, userId=${ctx.user.id}`);
      return result;
    }),

  /**
   * Envia documento por Gmail
   */
  enviarPorGmail: protectedProcedure
    .input(
      z.object({
        to: z.string().email("E-mail de destino inválido"),
        subject: z.string().min(1),
        body: z.string().min(1),
        attachmentName: z.string().optional(),
        attachmentContent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const integration = await getUserIntegration(ctx.user.id, "gmail");
      if (!integration) {
        throw new Error(
          "Conta Gmail não conectada. Conecte em Configurações → Integrações."
        );
      }

      const result = await sendViaGmail(
        ctx.user.id,
        input.to,
        input.subject,
        input.body,
        input.attachmentName,
        input.attachmentContent
      );

      logger.info(`[Integracoes] E-mail enviado via Gmail: to=${input.to}, userId=${ctx.user.id}`);
      return result;
    }),

  /**
   * Testa a conectividade de uma API Key salva
   */
  testarApiKey: protectedProcedure
    .input(z.object({ provider: z.enum(PROVIDERS_API_KEY) }))
    .mutation(async ({ ctx, input }) => {
      const integration = await getUserIntegration(ctx.user.id, input.provider);
      if (!integration?.apiKey) {
        return { success: false, message: "API Key não configurada" };
      }

      try {
        // Teste leve: verificar se a key é aceita pelo provedor
        const { invokeUnifiedLLM } = await import("../unified-llm");
        
        // Mapear provider para o formato do unified-llm
        const providerMap: Record<string, string> = {
          openai: "openai",
          anthropic: "anthropic",
          gemini: "google",
          perplexity: "perplexity",
        };

        // Verificar se o provider está configurado no servidor
        const { isProviderConfigured } = await import("../unified-llm");
        const isConfigured = isProviderConfigured(providerMap[input.provider] as any);
        if (!isConfigured && !integration.apiKey) {
          return { success: false, message: "API Key não configurada no servidor" };
        }
        // Teste leve de conectividade
        await invokeUnifiedLLM({
          provider: providerMap[input.provider] as any,
          messages: [{ role: "user", content: "Responda apenas com a palavra ok" }],
        });

        return { success: true, message: "Conexão bem-sucedida" };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erro ao conectar com o provedor",
        };
      }
    }),
});
