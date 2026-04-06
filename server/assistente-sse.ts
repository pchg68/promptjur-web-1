/**
 * Rota SSE (Server-Sent Events) para streaming de respostas do assistente jurídico.
 * Endpoint: GET /api/assistente/stream?sessionId=X&message=Y
 *
 * Usa a API de completions com stream:true para enviar tokens em tempo real.
 */
import { Request, Response } from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import {
  buscarSessao,
  listarMensagens,
  salvarMensagem,
  atualizarSessao,
} from "./db-chat";
import { SYSTEM_PROMPT_ASSISTENTE, gerarPerguntaEtapa } from "./assistente-prompts";

export async function assistenteSSEHandler(req: Request, res: Response) {
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
  const userMessage = (req.query.message as string) || "";
  const isEtapaGuiada = req.query.etapa === "true";

  if (!sessionId || !userMessage.trim()) {
    res.status(400).json({ error: "sessionId e message são obrigatórios" });
    return;
  }

  // Verificar se a sessão pertence ao usuário
  const sessao = await buscarSessao(sessionId, user.id);
  if (!sessao) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  // Salvar mensagem do usuário
  await salvarMensagem({
    sessionId,
    role: "user",
    content: userMessage,
    etapa: isEtapaGuiada ? sessao.etapaAtual : null,
  });

  // Buscar histórico de mensagens para contexto
  const mensagens = await listarMensagens(sessionId);
  const contexto = mensagens.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  // Montar payload para a API LLM com stream
  const systemPrompt = SYSTEM_PROMPT_ASSISTENTE(sessao);
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...contexto.filter((m) => m.role !== "system"),
  ];

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

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        messages,
        stream: true,
        max_tokens: 2048,
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

    // Salvar resposta completa do assistente
    await salvarMensagem({
      sessionId,
      role: "assistant",
      content: fullResponse,
      etapa: isEtapaGuiada ? sessao.etapaAtual : null,
    });

    // Atualizar contexto acumulado se for etapa guiada
    if (isEtapaGuiada && sessao.etapaAtual <= 6) {
      const contextoAtualizado = {
        ...(sessao.contextoAcumulado ?? {}),
        [`etapa_${sessao.etapaAtual}_resposta`]: userMessage,
        [`etapa_${sessao.etapaAtual}_assistente`]: fullResponse,
      };
      await atualizarSessao(sessionId, user.id, {
        contextoAcumulado: contextoAtualizado,
        etapaAtual: sessao.etapaAtual < 6 ? sessao.etapaAtual + 1 : sessao.etapaAtual,
        etapaConcluida: sessao.etapaAtual >= 6,
      });
    }

    // Enviar evento de conclusão com metadados
    res.write(`data: ${JSON.stringify({ done: true, etapaAtual: sessao.etapaAtual })}\n\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
  } finally {
    res.end();
  }
}
