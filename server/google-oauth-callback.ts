/**
 * Handler do callback OAuth2 do Google
 * Rota: GET /api/google/callback
 * 
 * Recebe o código de autorização do Google, troca por tokens
 * e salva na tabela user_integrations.
 */
import type { Request, Response } from "express";
import { exchangeGoogleCode } from "./google-integrations";
import { logger } from "./_core/logger";

const APP_URL = process.env.VITE_APP_URL ?? "https://promptjur.com";

export async function handleGoogleOAuthCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;

  // Redirecionar para configurações com mensagem de erro se o usuário negou
  if (error) {
    logger.warn(`[GoogleOAuth] Usuário negou acesso: ${error}`);
    res.redirect(`${APP_URL}/configuracoes?google_error=${encodeURIComponent(error)}`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${APP_URL}/configuracoes?google_error=missing_params`);
    return;
  }

  try {
    // Decodificar state: userId:provider
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    const [userIdStr, provider] = decoded.split(":");
    const userId = parseInt(userIdStr, 10);

    if (!userId || !provider || !["drive", "gmail"].includes(provider)) {
      throw new Error("State inválido");
    }

    const { email } = await exchangeGoogleCode(code, userId, provider as "drive" | "gmail");

    logger.info(`[GoogleOAuth] Callback processado: provider=${provider}, userId=${userId}, email=${email}`);

    // Redirecionar para configurações com sucesso
    res.redirect(
      `${APP_URL}/configuracoes?google_success=${encodeURIComponent(provider)}&email=${encodeURIComponent(email)}`
    );
  } catch (err: any) {
    logger.error("[GoogleOAuth] Erro no callback:", err);
    res.redirect(
      `${APP_URL}/configuracoes?google_error=${encodeURIComponent(err.message || "Erro desconhecido")}`
    );
  }
}
