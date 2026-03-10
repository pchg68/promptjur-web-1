import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Trash2, CheckCircle2, Shield, History } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { HighlightedTextarea } from "@/components/HighlightedTextarea";
import { ModelSelector } from "@/components/ModelSelector";
import { DisclaimerLegal } from "@/components/DisclaimerLegal";
import PromptActions from "@/components/PromptActions";
import GenerationStepper from "@/components/GenerationStepper";
import AIDisclaimer from "@/components/AIDisclaimer";
import PostGenerationGuide from "@/components/PostGenerationGuide";
import { VoiceInput } from "@/components/VoiceInput";

interface TabAnalisarProps {
  promptAnalise: string;
  setPromptAnalise: (v: string) => void;
  selectedModel: string;
  handleModelChange: (v: string) => void;
  onNavigateToOtimizar: (prompt: string) => void;
  onPreview: (data: { titulo: string; conteudo: string; areaJuridica?: string; tipoDocumento?: string; promptId?: number }) => void;
  onSaveTemplate: (conteudo: string, area: string) => void;
  onClearAll: () => void;
}

export default function TabAnalisar({
  promptAnalise, setPromptAnalise, selectedModel, handleModelChange,
  onNavigateToOtimizar, onPreview, onSaveTemplate, onClearAll,
}: TabAnalisarProps) {
  const analiseMutation = trpc.prompts.analisar.useMutation();

  const handleAnalisar = () => {
    if (!promptAnalise.trim()) { toast.error("Por favor, insira um prompt para análise"); return; }
    analiseMutation.mutate({ prompt: promptAnalise, model: selectedModel as any });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Análise de Prompt Jurídico
        </CardTitle>
        <CardDescription>Cole seu prompt abaixo para análise automática de área jurídica, palavras-chave e qualidade</CardDescription>
        <DisclaimerLegal className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector value={selectedModel} onChange={handleModelChange} disabled={analiseMutation.isPending} />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="prompt-analise">Prompt para Análise</Label>
            <VoiceInput
              onTranscription={(text) => setPromptAnalise(promptAnalise ? promptAnalise + " " + text : text)}
              disabled={analiseMutation.isPending}
            />
          </div>
          <HighlightedTextarea value={promptAnalise} onChange={setPromptAnalise} placeholder="Cole aqui o prompt ou use o microfone para ditar..." showValidation={true} minHeight="200px" />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Button onClick={handleAnalisar} disabled={analiseMutation.isPending}>
            {analiseMutation.isPending ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Analisando...</>) : (<><Sparkles className="mr-2 w-4 h-4" />Analisar Prompt</>)}
          </Button>
          <Button onClick={() => {
            if (promptAnalise || analiseMutation.data) { if (!confirm("Deseja realmente limpar todos os campos?")) return; }
            setPromptAnalise(""); analiseMutation.reset(); onClearAll(); toast.success("Campos limpos!");
          }} variant="outline" disabled={analiseMutation.isPending}>
            <Trash2 className="mr-2 w-4 h-4" />Limpar Tudo
          </Button>
        </div>

        <GenerationStepper isGenerating={analiseMutation.isPending} type="analise" />

        {analiseMutation.data && (
          <div className="mt-6 space-y-4 p-6 bg-card border border-border rounded-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-lg font-semibold text-foreground">Resultado da Análise</h3>
              <PromptActions
                promptText={promptAnalise}
                titulo="Análise de Prompt"
                onPreview={() => {
                  const d = analiseMutation.data;
                  const conteudoFormatado = [
                    `## Resultado da Análise\n`,
                    `**Área Jurídica:** ${d?.area || "N/A"}`,
                    `**Qualidade:** ${d?.qualidade || "N/A"}`,
                    `**Confiança:** ${d?.confianca || 0}%\n`,
                    d?.palavrasChave?.length ? `**Palavras-Chave:** ${d.palavrasChave.join(", ")}\n` : "",
                    d?.sugestoes?.length ? `**Sugestões de Melhoria:**\n${d.sugestoes.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n` : "",
                    `---\n\n**Prompt Original:**\n\n${promptAnalise}`,
                  ].filter(Boolean).join("\n");
                  onPreview({ titulo: "Análise de Prompt", conteudo: conteudoFormatado, areaJuridica: d?.area, tipoDocumento: "Análise" });
                }}
                onSaveTemplate={() => onSaveTemplate(promptAnalise, analiseMutation.data?.area || "Geral")}
              />
            </div>
            <AIDisclaimer compact />
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground">Área Jurídica</Label><Badge variant="secondary" className="mt-1">{analiseMutation.data.area}</Badge></div>
              <div><Label className="text-muted-foreground">Qualidade</Label><Badge variant={analiseMutation.data.qualidade === "excelente" ? "default" : analiseMutation.data.qualidade === "bom" ? "secondary" : "destructive"} className="mt-1">{analiseMutation.data.qualidade}</Badge></div>
            </div>
            {analiseMutation.data.palavrasChave?.length > 0 && (
              <div><Label className="text-muted-foreground">Palavras-Chave</Label>
                <div className="flex flex-wrap gap-2 mt-2">{analiseMutation.data.palavrasChave.map((p: string, i: number) => <Badge key={i} variant="outline">{p}</Badge>)}</div>
              </div>
            )}
            {analiseMutation.data.sugestoes?.length > 0 && (
              <div><Label className="text-muted-foreground">Sugestões de Melhoria</Label>
                <ul className="mt-2 space-y-2">{analiseMutation.data.sugestoes.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span>{s}</span></li>
                ))}</ul>
              </div>
            )}
            <PostGenerationGuide className="mt-4" />
            <div className="pt-4 border-t border-border space-y-3">
              <Button onClick={() => { analiseMutation.reset(); toast.info("Pronto para nova análise"); }} variant="outline" size="lg" className="w-full"><History className="w-4 h-4 mr-2" />Voltar</Button>
              <Button onClick={() => onNavigateToOtimizar(promptAnalise)} className="w-full" size="lg"><Shield className="w-4 h-4 mr-2" />Otimizar Este Prompt</Button>
            </div>
          </div>
        )}
        {analiseMutation.error && (<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">Erro: {analiseMutation.error.message}</div>)}
      </CardContent>
    </Card>
  );
}
