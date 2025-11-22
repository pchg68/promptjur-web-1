import { createNotification } from "./db-notifications";

/**
 * Helper para enviar notificações automáticas de forma consistente
 */

export async function notifyPromptGenerated(userId: number, tipo: string) {
  await createNotification({
    userId,
    tipo: "sucesso",
    titulo: "Prompt Gerado com Sucesso!",
    mensagem: `Seu prompt jurídico de ${tipo} foi gerado e está pronto para uso.`,
    link: "/dashboard",
    lida: false,
  });
}

export async function notifyPromptOptimized(userId: number) {
  await createNotification({
    userId,
    tipo: "sucesso",
    titulo: "Prompt Otimizado!",
    mensagem: "Seu prompt foi otimizado com sugestões profissionais aplicadas.",
    link: "/dashboard",
    lida: false,
  });
}

export async function notifyStyleAnalysisComplete(userId: number, confidence: number) {
  await createNotification({
    userId,
    tipo: "info",
    titulo: "Análise de Estilo Concluída",
    mensagem: `Seu perfil de estilo foi analisado com ${confidence}% de confiança. Confira os resultados!`,
    link: "/meu-estilo",
    lida: false,
  });
}

export async function notifySharedPromptViewed(userId: number, promptTitle: string, views: number) {
  await createNotification({
    userId,
    tipo: "info",
    titulo: "Seu Prompt Foi Visualizado",
    mensagem: `O prompt "${promptTitle}" foi visualizado ${views} ${views === 1 ? "vez" : "vezes"}.`,
    link: "/dashboard",
    lida: false,
  });
}

export async function notifyAnalysisComplete(userId: number, area: string, qualidade: string) {
  await createNotification({
    userId,
    tipo: "sucesso",
    titulo: "Análise Concluída",
    mensagem: `Seu prompt foi analisado: Área ${area}, Qualidade ${qualidade}.`,
    link: "/dashboard",
    lida: false,
  });
}

export async function notifyError(userId: number, message: string) {
  await createNotification({
    userId,
    tipo: "erro",
    titulo: "Erro na Operação",
    mensagem: message,
    link: null,
    lida: false,
  });
}

export async function notifyWarning(userId: number, title: string, message: string) {
  await createNotification({
    userId,
    tipo: "alerta",
    titulo: title,
    mensagem: message,
    link: null,
    lida: false,
  });
}
