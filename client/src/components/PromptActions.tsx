import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Eye, FileText, MoreHorizontal, Zap, BookTemplate, Loader2, CheckCircle2, PlayCircle, ChevronDown, ChevronUp, Clock, Shield, Download } from "lucide-react";
import { copyToClipboard, exportAsMarkdown } from "@/utils/dashboardUtils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { ModelSelector, parseModelValue } from "@/components/ModelSelector";
import { ValidacaoLegislacao } from "@/components/ValidacaoLegislacao";

interface PromptActionsProps {
  promptText: string;
  titulo?: string;
  promptId?: number;
  tipoDocumento?: string;
  areaJuridica?: string;
  onPreview?: () => void;
  onSaveTemplate?: () => void;
  onGerarDocumento?: () => void;
  isGerandoDoc?: boolean;
  showGerarDocumento?: boolean;
  /** Callback para navegar para aba Documentos com o prompt preenchido */
  onNavigateToDocumentos?: () => void;
  /** Callback para navegar para aba Análise com o prompt preenchido */
  onNavigateToAnalise?: () => void;
}

export default function PromptActions({
  promptText,
  titulo = "Prompt",
  promptId,
  tipoDocumento,
  areaJuridica,
  onPreview,
  onSaveTemplate,
  onGerarDocumento,
  isGerandoDoc = false,
  showGerarDocumento = false,
  onNavigateToDocumentos,
  onNavigateToAnalise,
}: PromptActionsProps) {
  const [showExecucao, setShowExecucao] = useState(false);
  const [execModel, setExecModel] = useState("manus:default");
  const [execResult, setExecResult] = useState<{
    documento: string;
    provider: string;
    model: string;
    tempoGeracao: number;
    tipoDocumento?: string;
    areaJuridica?: string;
    validacaoLegislacao?: {
      confiabilidadeGeral: string;
      totalCitacoes: number;
      citacoesValidadas: number;
      citacoes: unknown[];
    };
  } | null>(null);

  const executarMutation = trpc.prompts.executarPrompt.useMutation({
    onSuccess: (data) => {
      setExecResult(data);
      toast.success("Documento gerado com sucesso pela IA!");
    },
    onError: (error) => {
      toast.error(`Erro ao executar: ${error.message}`);
    },
  });

  const handleExecutar = () => {
    const { provider, model } = parseModelValue(execModel);
    executarMutation.mutate({
      promptText,
      promptId,
      tipoDocumento,
      areaJuridica,
      provider: provider as any,
      model,
    });
  };

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
    <div className="space-y-4">
      {/* ═══ Ações Primárias ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Ação Principal: Executar com IA */}
        <Button
          size="lg"
          className="gap-2 h-12"
          onClick={() => setShowExecucao(!showExecucao)}
          variant={showExecucao ? "secondary" : "default"}
        >
          <PlayCircle className="w-5 h-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">Executar com IA</span>
            <span className="text-[10px] opacity-80">Gerar documento direto</span>
          </div>
        </Button>

        {/* Ação Secundária: Ir para Documentos */}
        {onNavigateToDocumentos && (
          <Button
            size="lg"
            variant="outline"
            className="gap-2 h-12"
            onClick={onNavigateToDocumentos}
          >
            <FileText className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">Elaborar Documento</span>
              <span className="text-[10px] opacity-80">Aba de documentos</span>
            </div>
          </Button>
        )}
      </div>

      {/* ═══ Painel de Execução Integrada ═══ */}
      <Collapsible open={showExecucao} onOpenChange={setShowExecucao}>
        <CollapsibleContent>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Executar Prompt com IA</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  O prompt será enviado diretamente para a IA
                </Badge>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <ModelSelector
                    value={execModel}
                    onChange={setExecModel}
                    disabled={executarMutation.isPending}
                  />
                </div>
                <Button
                  onClick={handleExecutar}
                  disabled={executarMutation.isPending}
                  className="gap-2 h-10"
                >
                  {executarMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</>
                  ) : (
                    <><PlayCircle className="w-4 h-4" />Executar</>
                  )}
                </Button>
              </div>

              {/* Progresso */}
              {executarMutation.isPending && (
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-medium">Gerando documento...</p>
                    <p className="text-xs text-muted-foreground">A IA está elaborando o documento com base no seu prompt</p>
                  </div>
                </div>
              )}

              {/* Resultado da Execução */}
              {execResult && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-600">Documento Gerado</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {(execResult.tempoGeracao / 1000).toFixed(1)}s
                      <Badge variant="secondary" className="text-xs">{execResult.provider}/{execResult.model}</Badge>
                    </div>
                  </div>

                  {/* Documento renderizado */}
                  <div className="p-4 bg-background rounded-sm border max-h-[500px] overflow-y-auto">
                    <div className="prose prose-sm max-w-none dark:prose-invert abnt-document">
                      <Streamdown>{execResult.documento}</Streamdown>
                    </div>
                  </div>

                  {/* Validação de legislação */}
                  {execResult.validacaoLegislacao && (
                    <ValidacaoLegislacao validacao={execResult.validacaoLegislacao as any} />
                  )}

                  {/* Ações do documento gerado */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" onClick={() => copyToClipboard(execResult.documento)} className="gap-2">
                      <Copy className="w-4 h-4" />Copiar Documento
                    </Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        const { copyFormattedToClipboard } = await import("@/lib/formatacao-abnt");
                        await copyFormattedToClipboard(execResult.documento);
                        toast.success("Documento copiado com formatação ABNT!");
                      } catch { toast.error("Erro ao copiar formatado"); }
                    }} className="gap-2">
                      <FileText className="w-4 h-4" />Copiar ABNT
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => exportAsMarkdown(titulo + " - Documento", execResult.documento)} className="gap-2">
                      <Download className="w-4 h-4" />Exportar
                    </Button>
                  </div>
                </div>
              )}

              {/* Erro */}
              {executarMutation.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                  {executarMutation.error.message}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* ═══ Ações Secundárias (linha compacta) ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => copyToClipboard(promptText)} className="gap-2">
          <Copy className="w-4 h-4" />
          Copiar Prompt
        </Button>

        {onPreview && (
          <Button variant="outline" size="sm" onClick={onPreview} className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
        )}

        {onNavigateToAnalise && (
          <Button variant="outline" size="sm" onClick={onNavigateToAnalise} className="gap-2">
            <Shield className="w-4 h-4" />
            Analisar
          </Button>
        )}

        {/* Menu de opções adicionais */}
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
              <Download className="w-4 h-4 mr-2" />
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
                  Gerar Documento Final (PDF)
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
