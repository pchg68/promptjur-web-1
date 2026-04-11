import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { parseModelValue } from "@/components/ModelSelector";

interface ProfPromptChatProps {
  /** Modelo selecionado no Dashboard, no formato `provider:model` */
  selectedModel?: string;
  /** Altura do chatbox (default 520px) */
  height?: string;
  /** Texto inicial sugerido para colocar no input quando vazio */
  suggestedPrompts?: string[];
  /** Texto adicional de contexto que será injetado como primeira mensagem do usuário (opcional) */
  initialContext?: string;
}

const DEFAULT_SUGGESTIONS = [
  "Quero ajuda para escrever um prompt para uma petição inicial trabalhista",
  "Como melhoro este prompt para que a IA gere uma contestação melhor?",
  "Quais fatos eu deveria adicionar ao meu prompt sobre rescisão indireta?",
  "Critique o meu prompt e me diga o que está faltando",
];

/**
 * Painel conversacional do "Prof. Prompt" — tutor socrático que ajuda
 * o usuário a refinar prompts jurídicos.
 *
 * Estratégia Sprint 1:
 *  - Mantém histórico de mensagens em estado local (stateless no servidor).
 *  - Persona é injetada no servidor (`tutorMode: true` é o default).
 *  - Quando o usuário envia, chamamos `trpc.chat.enviar` e anexamos a resposta.
 */
export function ProfPromptChat({
  selectedModel,
  height = "520px",
  suggestedPrompts = DEFAULT_SUGGESTIONS,
  initialContext,
}: ProfPromptChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialContext && initialContext.trim()) {
      return [{ role: "user", content: initialContext.trim() }];
    }
    return [];
  });

  const chatMutation = trpc.chat.enviar.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    },
    onError: (error) => {
      toast.error(`Erro no chat: ${error.message}`);
    },
  });

  const handleSend = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    const { provider, model } = selectedModel
      ? parseModelValue(selectedModel)
      : { provider: undefined, model: undefined };
    chatMutation.mutate({
      messages: next,
      provider: provider as any,
      model,
      tutorMode: true,
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="w-5 h-5 text-primary" />
          Prof. Prompt — Tutor de Engenharia de Prompts Jurídicos
        </CardTitle>
        <CardDescription>
          Tire dúvidas, peça críticas ao seu prompt ou peça ajuda para refinar até ficar pronto.
          Este tutor não substitui um advogado — é um auxílio educacional.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSend}
          isLoading={chatMutation.isPending}
          height={height}
          placeholder="Pergunte ao Prof. Prompt..."
          emptyStateMessage="Comece com uma das sugestões abaixo ou descreva seu caso."
          suggestedPrompts={suggestedPrompts}
        />
      </CardContent>
    </Card>
  );
}
