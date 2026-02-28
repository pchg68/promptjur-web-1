/**
 * Módulo de integração com Google Gemini API
 * Gemini 2.0 Flash - Janela de contexto de 1M tokens, ideal para processos volumosos
 * 
 * Documentação: https://ai.google.dev/gemini-api/docs
 */

export type GeminiModel =
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-1.5-pro";

export interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface GeminiRequestOptions {
  model: GeminiModel;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_object" | "text";
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion: string;
}

/**
 * Converte mensagens do formato unificado para formato Gemini
 */
function convertToGeminiMessages(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): { systemInstruction?: string; contents: GeminiMessage[] } {
  let systemInstruction: string | undefined;
  const contents: GeminiMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = (systemInstruction ? systemInstruction + "\n" : "") + msg.content;
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  // Gemini requer que a primeira mensagem seja do user
  if (contents.length > 0 && contents[0].role === "model") {
    contents.unshift({
      role: "user",
      parts: [{ text: "Olá" }],
    });
  }

  return { systemInstruction, contents };
}

/**
 * Invoca API do Google Gemini
 */
export async function invokeGemini(
  options: GeminiRequestOptions
): Promise<GeminiResponse> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY não configurada. Configure em Settings → Secrets.");
  }

  const { systemInstruction, contents } = convertToGeminiMessages(options.messages);

  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.max_tokens || 4096,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (options.response_format?.type === "json_object") {
    (requestBody.generationConfig as Record<string, unknown>).responseMimeType = "application/json";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data: GeminiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("[Gemini] Erro na chamada:", error);
    throw error;
  }
}

/**
 * Extrai conteúdo de texto da resposta do Gemini
 */
export function extractGeminiContent(response: GeminiResponse): string {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("Resposta do Gemini não contém candidatos");
  }

  const candidate = response.candidates[0];
  if (!candidate.content?.parts) {
    throw new Error("Resposta do Gemini não contém partes de conteúdo");
  }

  return candidate.content.parts
    .map(part => part.text)
    .join("\n");
}

/**
 * Mapeia modelo genérico para modelo específico do Gemini
 */
export function mapToGeminiModel(genericModel: string): GeminiModel {
  const mapping: Record<string, GeminiModel> = {
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-flash": "gemini-2.0-flash",
    "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
    "gemini-flash-lite": "gemini-2.0-flash-lite",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-pro": "gemini-1.5-pro",
  };

  return mapping[genericModel] || "gemini-2.0-flash";
}

/**
 * Verifica se a API key do Gemini está configurada
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_GEMINI_API_KEY;
}
