import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, History, Zap } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { HighlightedTextarea } from "@/components/HighlightedTextarea";
import { ModelSelector } from "@/components/ModelSelector";
import { DisclaimerLegal } from "@/components/DisclaimerLegal";
import PromptActions from "@/components/PromptActions";
import GenerationStepper from "@/components/GenerationStepper";
import AIDisclaimer from "@/components/AIDisclaimer";
import PostGenerationGuide from "@/components/PostGenerationGuide";
import { PromptComparison } from "@/components/PromptComparison";
import { ValidacaoLegislacao } from "@/components/ValidacaoLegislacao";
import { VoiceInput } from "@/components/VoiceInput";

interface TabOtimizarProps {
  promptOtimizacao: string;
  setPromptOtimizacao: (v: string) => void;
  selectedModel: string;
  handleModelChange: (v: string) => void;
  onNavigateToAnalisar: () => void;
  onNavigateToGerar: (area: string, contexto: string) => void;
  onPreview: (data: { titulo: string; conteudo: string; areaJuridica?: string; tipoDocumento?: string; promptId?: number }) => void;
  onSaveTemplate: (conteudo: string, area: string) => void;
}

export default function TabOtimizar({
  promptOtimizacao, setPromptOtimizacao, selectedModel, handleModelChange,
  onNavigateToAnalisar, onNavigateToGerar, onPreview, onSaveTemplate,
}: TabOtimizarProps) {
  const otimizacaoMutation = trpc.prompts.otimizar.useMutation();

  const handleOtimizar = () => {
    if (!promptOtimizacao.trim()) { toast.error("Por favor, insira um prompt para otimizar"); return; }
    otimizacaoMutation.mutate({ prompt: promptOtimizacao, model: selectedModel as any });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Otimização de Prompt Jurídico</CardTitle>
        <CardDescription>Cole um prompt existente para receber sugestões de melhoria e uma versão otimizada</CardDescription>
        <DisclaimerLegal className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector value={selectedModel} onChange={handleModelChange} disabled={otimizacaoMutation.isPending} />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Prompt para Otimizar</Label>
            <VoiceInput
              onTranscription={(text) => setPromptOtimizacao(promptOtimizacao ? promptOtimizacao + " " + text : text)}
              disabled={otimizacaoMutation.isPending}
            />
          </div>
          <HighlightedTextarea value={promptOtimizacao} onChange={setPromptOtimizacao} placeholder="Cole aqui o prompt ou use o microfone para ditar..." showValidation={true} minHeight="200px" />
        </div>
        <Button type="button" onClick={handleOtimizar} disabled={otimizacaoMutation.isPending} className="w-full">
          {otimizacaoMutation.isPending ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Otimizando...</>) : (<><Shield className="mr-2 w-4 h-4" />Otimizar Prompt</>)}
        </Button>
        <GenerationStepper isGenerating={otimizacaoMutation.isPending} type="otimizacao" />
        {otimizacaoMutation.data && (
          <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PromptComparison promptOriginal={otimizacaoMutation.data.promptOriginal} promptOtimizado={otimizacaoMutation.data.promptOtimizado} melhorias={otimizacaoMutation.data.melhorias} />
            <AIDisclaimer compact />
            {otimizacaoMutation.data.validacaoLegislacao && (<div className="mt-4"><ValidacaoLegislacao validacao={otimizacaoMutation.data.validacaoLegislacao} /></div>)}
            <div className="flex flex-wrap gap-2">
              <PromptActions promptText={otimizacaoMutation.data.promptOtimizado || ""} titulo="Prompt Otimizado"
                onPreview={() => onPreview({ titulo: "Prompt Otimizado", conteudo: otimizacaoMutation.data?.promptOtimizado || "", areaJuridica: otimizacaoMutation.data?.area, tipoDocumento: "Otimização", promptId: otimizacaoMutation.data?.promptId })}
                onSaveTemplate={() => onSaveTemplate(otimizacaoMutation.data?.promptOtimizado || "", otimizacaoMutation.data?.area || "Geral")} />
            </div>
            <PostGenerationGuide className="mt-4" />
            <div className="pt-4 border-t border-border mt-4 space-y-3">
              <Button onClick={onNavigateToAnalisar} variant="outline" size="lg" className="w-full"><History className="w-4 h-4 mr-2" />Voltar para Análise</Button>
              <Button onClick={() => { onNavigateToGerar(otimizacaoMutation.data?.area || "", `Prompt otimizado: ${otimizacaoMutation.data?.promptOtimizado?.substring(0, 150)}...`); }} className="w-full" size="lg"><Zap className="w-4 h-4 mr-2" />Gerar Prompt Profissional</Button>
            </div>
          </div>
        )}
        {otimizacaoMutation.error && (<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">Erro: {otimizacaoMutation.error.message}</div>)}
      </CardContent>
    </Card>
  );
}
