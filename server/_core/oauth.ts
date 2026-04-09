import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { isEmailAllowed } from "../whitelist";
import { notifyOwner } from "./notification";
import { registrarAcesso } from "../db-access-logs";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Verificar se é o primeiro acesso ANTES de criar/atualizar o usuário
      const usuarioExistente = await db.getUserByOpenId(userInfo.openId);
      const isPrimeiroAcesso = !usuarioExistente;

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Verificar whitelist de acesso (apenas quando whitelist_ativa estiver ligada)
      // O owner/admin sempre tem acesso garantido, independente da whitelist
      const isOwner = userInfo.openId === ENV.ownerOpenId;
      const emailPermitido = isOwner || await isEmailAllowed(userInfo.email ?? null);
      if (!emailPermitido) {
        console.log(`[Whitelist] Acesso negado para: ${userInfo.email}`);
        res.redirect(302, "/acesso-restrito");
        return;
      }
      if (isOwner) {
        console.log(`[Whitelist] Acesso garantido para owner: ${userInfo.email}`);
      }

      // Registrar log de acesso (fire-and-forget)
      const ipOrigem =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        undefined;
      const userAgent = (req.headers["user-agent"] as string) || undefined;

      registrarAcesso({
        openId: userInfo.openId,
        nome: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        ipOrigem: ipOrigem ?? null,
        userAgent: userAgent ? userAgent.substring(0, 512) : null,
        primeiroAcesso: isPrimeiroAcesso,
        acessoPermitido: true,
      }).catch((err) =>
        console.error("[OAuth] Falha ao registrar log de acesso:", err)
      );

      // Notificar owner no primeiro acesso de usuário da whitelist
      if (isPrimeiroAcesso) {
        const agora = new Date();
        const horario = agora.toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "short",
          timeStyle: "short",
        });
        const nome = userInfo.name || "(sem nome)";
        const email = userInfo.email || "(sem e-mail)";

        notifyOwner({
          title: `Novo usuário: ${nome}`,
          content: `**${nome}** (${email}) acessou o PromptJur pela primeira vez em ${horario}.`,
        }).catch((err) =>
          console.error("[OAuth] Falha ao notificar owner sobre primeiro acesso:", err)
        );

        console.log(`[OAuth] Primeiro acesso registrado: ${email} (${nome}) em ${horario}`);
      }

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
