/**
 * Módulo de integração com Google Drive e Gmail
 * Usa googleapis para upload de documentos e envio de e-mails
 * 
 * Fluxo OAuth2:
 * 1. Frontend redireciona para /api/google/auth?provider=drive|gmail&userId=X
 * 2. Google redireciona para /api/google/callback com code
 * 3. Servidor troca code por tokens e salva em user_integrations
 */
import { google } from "googleapis";
import { upsertUserIntegration, getProviderOAuthTokens } from "./db-integrations";
import { logger } from "./_core/logger";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const APP_URL = process.env.VITE_APP_URL ?? "https://promptjur.com";
const REDIRECT_URI = `${APP_URL}/api/google/callback`;

/**
 * Escopos necessários para Drive e Gmail
 */
export const GOOGLE_SCOPES = {
  drive: [
    "https://www.googleapis.com/auth/drive.file", // Criar/modificar arquivos criados pelo app
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  gmail: [
    "https://www.googleapis.com/auth/gmail.send", // Apenas envio
    "https://www.googleapis.com/auth/userinfo.email",
  ],
};

/**
 * Cria um cliente OAuth2 configurado
 */
export function createOAuth2Client(accessToken?: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
  if (accessToken) {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
  return oauth2Client;
}

/**
 * Gera a URL de autorização do Google OAuth2
 */
export function getGoogleAuthUrl(provider: "drive" | "gmail", state: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES[provider],
    state,
    prompt: "consent", // Forçar para obter refresh_token sempre
  });
}

/**
 * Troca o código de autorização por tokens e salva no banco
 */
export async function exchangeGoogleCode(
  code: string,
  userId: number,
  provider: "drive" | "gmail"
): Promise<{ email: string }> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token) {
    throw new Error("Não foi possível obter o token de acesso do Google");
  }

  // Buscar email do usuário Google
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();
  const email = userInfo.email ?? "desconhecido";

  // Salvar tokens no banco
  await upsertUserIntegration(userId, provider, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    metadata: { email, name: userInfo.name },
  });

  logger.info(`[GoogleIntegration] ${provider} conectado para userId=${userId}, email=${email}`);
  return { email };
}

/**
 * Faz upload de um documento para o Google Drive do usuário
 * Retorna o link do arquivo criado
 */
export async function uploadToGoogleDrive(
  userId: number,
  fileName: string,
  content: string,
  mimeType: "text/plain" | "application/vnd.google-apps.document" = "text/plain"
): Promise<{ fileId: string; webViewLink: string }> {
  const tokens = await getProviderOAuthTokens(userId, "google_drive");
  if (!tokens) {
    throw new Error("Integração com Google Drive não configurada. Conecte sua conta em Configurações → Integrações.");
  }

  const oauth2Client = createOAuth2Client(tokens.accessToken, tokens.refreshToken ?? undefined);
  
  // Renovar token se necessário
  if (tokens.tokenExpiry && tokens.tokenExpiry < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await upsertUserIntegration(userId, "google_drive", {
      accessToken: credentials.access_token ?? tokens.accessToken,
      tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    });
    oauth2Client.setCredentials(credentials);
  }

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Criar pasta PromptJur se não existir
  let folderId: string | undefined;
  try {
    const folderSearch = await drive.files.list({
      q: "name='PromptJur' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id)",
    });
    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id ?? undefined;
    } else {
      const folder = await drive.files.create({
        requestBody: {
          name: "PromptJur",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      folderId = folder.data.id ?? undefined;
    }
  } catch {
    // Continuar sem pasta se houver erro
  }

  // Upload do arquivo
  const { Readable } = await import("stream");
  const stream = Readable.from([Buffer.from(content, "utf-8")]);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType: "text/plain",
      body: stream,
    },
    fields: "id,webViewLink",
  });

  if (!file.data.id) {
    throw new Error("Falha ao criar arquivo no Google Drive");
  }

  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink ?? `https://drive.google.com/file/d/${file.data.id}/view`,
  };
}

/**
 * Envia um documento por Gmail
 */
export async function sendViaGmail(
  userId: number,
  to: string,
  subject: string,
  bodyHtml: string,
  attachmentName?: string,
  attachmentContent?: string
): Promise<{ messageId: string }> {
  const tokens = await getProviderOAuthTokens(userId, "gmail");
  if (!tokens) {
    throw new Error("Integração com Gmail não configurada. Conecte sua conta em Configurações → Integrações.");
  }

  const oauth2Client = createOAuth2Client(tokens.accessToken, tokens.refreshToken ?? undefined);

  // Renovar token se necessário
  if (tokens.tokenExpiry && tokens.tokenExpiry < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await upsertUserIntegration(userId, "gmail", {
      accessToken: credentials.access_token ?? tokens.accessToken,
      tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    });
    oauth2Client.setCredentials(credentials);
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Construir e-mail MIME
  let rawEmail: string;
  if (attachmentName && attachmentContent) {
    const boundary = `boundary_${Date.now()}`;
    rawEmail = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      bodyHtml,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Disposition: attachment; filename="${attachmentName}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(attachmentContent, "utf-8").toString("base64"),
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    rawEmail = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      bodyHtml,
    ].join("\r\n");
  }

  const encodedEmail = Buffer.from(rawEmail).toString("base64url");
  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedEmail },
  });

  return { messageId: result.data.id ?? "unknown" };
}

/**
 * Verifica se as credenciais do Google estão configuradas no servidor
 */
export function isGoogleConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}
