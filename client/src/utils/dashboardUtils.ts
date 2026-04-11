import { toast } from "sonner";
import { TIPOS_DOCUMENTO as SHARED_TIPOS_DOCUMENTO, type TipoDocumento as SharedTipoDocumento } from "@shared/juridico";

// Re-export dos tipos de documento — fonte única em shared/juridico.ts
// para garantir que frontend e backend (Zod) fiquem sincronizados.
export type TipoDocumento = SharedTipoDocumento;
export const TIPOS_DOCUMENTO: ReadonlyArray<{ value: TipoDocumento; label: string }> = SHARED_TIPOS_DOCUMENTO;

export function getTipoDocumentoLabel(value: string): string {
  return TIPOS_DOCUMENTO.find(t => t.value === value)?.label || value;
}

// Copiar para clipboard com toast
export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    toast.success("Copiado para a área de transferência!");
  }
}

// Exportar como Markdown
export function exportAsMarkdown(titulo: string, conteudo: any) {
  const text = typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo, null, 2);
  const blob = new Blob([`# ${titulo}\n\n${text}`], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${titulo.toLowerCase().replace(/\s+/g, "-")}.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Arquivo Markdown baixado!");
}

// Testar prompt em plataformas externas
export function testarPromptNaPlataforma(prompt: string, plataforma: "chatgpt" | "perplexity" | "manus") {
  const encodedPrompt = encodeURIComponent(prompt);
  let url = "";
  switch (plataforma) {
    case "chatgpt":
      url = `https://chat.openai.com/?q=${encodedPrompt}`;
      break;
    case "perplexity":
      url = `https://www.perplexity.ai/search?q=${encodedPrompt}`;
      break;
    case "manus":
      url = `https://manus.im/chat?q=${encodedPrompt}`;
      break;
  }
  window.open(url, "_blank");
  toast.success(`Abrindo ${plataforma === "chatgpt" ? "ChatGPT" : plataforma === "perplexity" ? "Perplexity" : "Manus"}...`);
}

// Formatar data brasileira
export function formatarDataBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
