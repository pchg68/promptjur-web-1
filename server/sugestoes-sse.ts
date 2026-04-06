/**
 * Rota SSE para streaming das sugestões automáticas de prompts.
 * Endpoint: GET /api/assistente/sugestoes?sessionId=X&estrategia=direta|raciocinio|recuperacao
 *
 * Gera uma variação do prompt para a estratégia solicitada via streaming.
 */
import { Request, Response } from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { buscarSessao } from "./db-chat";
import {
  gerarSystemPromptSugestao,
  gerarUserPromptSugestao,
  type EstrategiaPrompt,
} from "./sugestoes-prompts";

const ESTRATEGIAS_VALIDAS: EstrategiaPrompt[] = ["direta", "raciocinio", "recuperacao"];

export async function sugestoesSSEHandler(req: Request, res: Response) {
  // Autenticação
  let user = null;
  try {
    user = await sdk.authenticateRequest(req);
  } catch {
    user = null;
  }
  if (!user) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const sessionId = parseInt(req.query.sessionId as string);
  const estrategia = req.query.estrategia as EstrategiaPrompt;

  if (!sessionId || !ESTRATEGIAS_VALIDAS.includes(estrategia)) {
    res.status(400).json({ error: "sessionId e estrategia válida são obrigatórios" });
    return;
  }

  // Verificar se a sessão pertence ao usuário
  const sessao = await buscarSessao(sessionId, user.id);
  if (!sessao) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  // Configurar headers SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let fullResponse = "";

  try {
    const apiUrl =
      ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
        ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
        : "https://api.openai.com/v1/chat/completions";

    const systemPrompt = gerarSystemPromptSugestao(estrategia);
    const userPrompt = gerarUserPromptSugestao({
      areaJuridica: sessao.areaJuridica,
      tipoDocumento: sessao.tipoDocumento,
      contextoAcumulado: sessao.contextoAcumulado as Record<string, string> | null,
      promptGerado: sessao.promptGerado,
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        max_tokens: 1500,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      res.write(`data: ${JSON.stringify({ error: errText })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullResponse += delta;
            res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
          }
        } catch {
          // Ignorar linhas malformadas
        }
      }
    }

    // Extrair apenas o conteúdo entre <prompt> e </prompt> se existir
    const matchPrompt = fullResponse.match(/<prompt>([\s\S]*?)<\/prompt>/);
    const promptExtraido = matchPrompt ? matchPrompt[1].trim() : fullResponse.trim();

    // Enviar evento de conclusão com o prompt extraído
    res.write(
      `data: ${JSON.stringify({
        done: true,
        estrategia,
        promptCompleto: promptExtraido,
      })}\n\n`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
  } finally {
    res.end();
  }
}
