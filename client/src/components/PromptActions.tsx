import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, FileText, MoreHorizontal, Zap, Bot, Search, Cpu, BookTemplate, Loader2, CheckCircle2 } from "lucide-react";
import { copyToClipboard, exportAsMarkdown, testarPromptNaPlataforma } from "@/utils/dashboardUtils";
import { toast } from "sonner";

interface PromptActionsProps {
  promptText: string;
  titulo?: string;
  onPreview?: () => void;
  onSaveTemplate?: () => void;
  onGerarDocumento?: () => void;
  isGerandoDoc?: boolean;
  showGerarDocumento?: boolean;
}

export default function PromptActions({
  promptText,
  titulo = "Prompt",
  onPreview,
  onSaveTemplate,
  onGerarDocumento,
  isGerandoDoc = false,
  showGerarDocumento = false,
}: PromptActionsProps) {
  const handleCopyFormatted = async () => {
    try {
      const { copyFormattedToClipboard } = await import("@/lib/formatacao-abnt");
      await copyFormattedToClipboard(promptText);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="font-semibold">Copiado com formatação ABNT!</span>
        </div>,
        {
          description: "Cole no Word ou Google Docs para manter a formatação profissional.",
          duration: 4000,
        }
      );
    } catch {
      toast.error("Erro ao copiar formatado. Tente o botão 'Copiar' normal.");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Ação Primária: Copiar */}
      <Button variant="default" size="sm" onClick={() => copyToClipboard(promptText)} className="gap-2">
        <Copy className="w-4 h-4" />
        Copiar Prompt
      </Button>

      {/* Ação Secundária: Preview */}
      {onPreview && (
        <Button variant="outline" size="sm" onClick={onPreview} className="gap-2">
          <Eye className="w-4 h-4" />
          Preview
        </Button>
      )}

      {/* Testar em IA */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Zap className="w-4 h-4" />
            Testar em IA
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => testarPromptNaPlataforma(promptText, "manus")}>
            <Cpu className="w-4 h-4 mr-2" />
            Manus
            <Badge variant="secondary" className="ml-auto text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Recomendado</Badge>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => testarPromptNaPlataforma(promptText, "chatgpt")}>
            <Bot className="w-4 h-4 mr-2" />
            ChatGPT
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => testarPromptNaPlataforma(promptText, "perplexity")}>
            <Search className="w-4 h-4 mr-2" />
            Perplexity
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Menu Terciário */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="px-2">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyFormatted}>
            <FileText className="w-4 h-4 mr-2" />
            Copiar Formatado (ABNT)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportAsMarkdown(titulo, promptText)}>
            <FileText className="w-4 h-4 mr-2" />
            Exportar Markdown
          </DropdownMenuItem>
          {onSaveTemplate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSaveTemplate}>
                <BookTemplate className="w-4 h-4 mr-2" />
                Salvar como Template
              </DropdownMenuItem>
            </>
          )}
          {showGerarDocumento && onGerarDocumento && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onGerarDocumento} disabled={isGerandoDoc}>
                {isGerandoDoc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Gerar Documento Final
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
