import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { isEmailAllowed } from "../whitelist";
import { notifyOwner } from "./notification";
import { registrarAcesso } from "../db-access-logs";
import { ENV } from "./env";
import { sendWelcomeEmail } from "../email";

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
      // O owner/admin sempre tem acesso garantido, independente da whitelist:
      // 1. Por openId (OWNER_OPEN_ID env)
      // 2. Por e-mail na lista OWNER_EMAILS
      // 3. Por role=admin no banco (usuário já existente)
      const isOwnerByOpenId = userInfo.openId === ENV.ownerOpenId;
      const isOwnerByEmail = userInfo.email
        ? ENV.ownerEmails.includes(userInfo.email.toLowerCase().trim())
        : false;
      const isAdminByRole = usuarioExistente?.role === "admin";
      const isOwner = isOwnerByOpenId || isOwnerByEmail || isAdminByRole;

      const emailPermitido = isOwner || await isEmailAllowed(userInfo.email ?? null);
      if (!emailPermitido) {
        console.log(`[Whitelist] Acesso negado para: ${userInfo.email}`);
        res.redirect(302, "/acesso-restrito");
        return;
      }
      if (isOwner) {
        console.log(`[Whitelist] Acesso garantido para owner/admin: ${userInfo.email} (openId=${isOwnerByOpenId}, email=${isOwnerByEmail}, role=${isAdminByRole})`);
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

        // Ativar trial de 7 dias no primeiro acesso (fire-and-forget)
        import("../trial").then(async ({ activateTrial }) => {
          const novoUsuario = await db.getUserByOpenId(userInfo.openId);
          if (novoUsuario?.id) {
            await activateTrial(novoUsuario.id);
          }
        }).catch((err) => {
          console.error("[OAuth] Falha ao ativar trial:", err);
        });

        // Enviar email de boas-vindas no primeiro acesso (fire-and-forget)
        if (userInfo.email) {
          sendWelcomeEmail({
            email: userInfo.email,
            nome: userInfo.name || undefined,
          }).then((result) => {
            if (result.success && !result.skipped) {
              console.log(`[OAuth] Welcome email enviado para ${userInfo.email}`);
            }
          }).catch((err) => {
            console.error("[OAuth] Falha ao enviar welcome email:", err);
          });

          // Agendar sequência de onboarding drip emails
          import("../onboarding-drip").then(async ({ scheduleOnboardingSequence }) => {
            const novoUsuario = await db.getUserByOpenId(userInfo.openId);
            if (novoUsuario?.id) {
              await scheduleOnboardingSequence(novoUsuario.id, userInfo.email!);
            }
          }).catch((err) => {
            console.error("[OAuth] Falha ao agendar onboarding:", err);
          });
        }
      }

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
