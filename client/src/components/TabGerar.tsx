import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Loader2, ChevronDown, ChevronUp, Pencil, Check, X, User, FileText, ListChecks, BookOpen, Palette, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ModelSelector } from "@/components/ModelSelector";
import { DisclaimerLegal } from "@/components/DisclaimerLegal";
import { ValidacaoLegislacao } from "@/components/ValidacaoLegislacao";
import PromptActions from "@/components/PromptActions";
import GenerationStepper from "@/components/GenerationStepper";
import AIDisclaimer from "@/components/AIDisclaimer";
import PostGenerationGuide from "@/components/PostGenerationGuide";
import { TIPOS_DOCUMENTO, type TipoDocumento } from "@/utils/dashboardUtils";
import { AREAS_JURIDICAS } from "@/const";
import { VoiceInput } from "@/components/VoiceInput";
import { getStarterPrompts, type StarterPrompt } from "@shared/juridico";
import { DocumentAttachment, type AttachedDocument } from "@/components/DocumentAttachment";
import { QualityScoreCard } from "@/components/QualityScoreCard";
import { PersonaSelector } from "@/components/PersonaSelector";
import { ContextChecklist } from "@/components/ContextChecklist";
import { RefinamentoPanel } from "@/components/RefinamentoPanel";
import { ReviewChecklist } from "@/components/ReviewChecklist";

interface TabGerarProps {
  selectedModel: string;
  handleModelChange: (v: string) => void;
  onPreview: (data: { titulo: string; conteudo: string; areaJuridica?: string; tipoDocumento?: string; promptId?: number }) => void;
  onSaveTemplate: (conteudo: string, area: string) => void;
  onGerarDocumento: (promptId: number, conteudo: string, tipo: string) => void;
  isGerandoDoc: boolean;
  initialArea?: string;
  initialContexto?: string;
  /** Navegar para aba Documentos com prompt preenchido */
  onNavigateToDocumentos?: () => void;
  /** Navegar para aba Análise com prompt preenchido */
  onNavigateToAnalise?: () => void;
}

// Seções do prompt para visualização estruturada
const PROMPT_SECTIONS = [
  { key: "persona", icon: User, label: "Persona Especializada", color: "text-blue-500" },
  { key: "contexto", icon: FileText, label: "Contexto do Caso", color: "text-emerald-500" },
  { key: "instrucoes", icon: ListChecks, label: "Instruções Estruturadas", color: "text-purple-500" },
  { key: "referencias", icon: BookOpen, label: "Referências Legais", color: "text-amber-500" },
  { key: "formato", icon: Palette, label: "Formato e Estilo", color: "text-rose-500" },
  { key: "qualidade", icon: ShieldCheck, label: "Critérios de Qualidade", color: "text-cyan-500" },
];

function parsePromptSections(text: string): { key: string; content: string }[] {
  if (!text) return [];
  const sections: { key: string; content: string }[] = [];
  const lines = text.split("\n");
  let currentSection = "";
  let currentContent: string[] = [];

  const sectionPatterns: Record<string, RegExp> = {
    persona: /^(#+\s*)?(persona|papel|atue como|você é|aja como)/i,
    contexto: /^(#+\s*)?(contexto|caso|situação|fato|cenário)/i,
    instrucoes: /^(#+\s*)?(instruç|tarefa|objetivo|elabore|redija|analise)/i,
    referencias: /^(#+\s*)?(referência|legislaç|fundament|base legal|jurisprud)/i,
    formato: /^(#+\s*)?(formato|estrutura|estilo|organiz)/i,
    qualidade: /^(#+\s*)?(qualidade|critério|requisito|observ|atenç)/i,
  };

  for (const line of lines) {
    let matched = false;
    for (const [key, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(line.trim())) {
        if (currentSection && currentContent.length > 0) {
          sections.push({ key: currentSection, content: currentContent.join("\n").trim() });
        }
        currentSection = key;
        currentContent = [line];
        matched = true;
        break;
      }
    }
    if (!matched) {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections.push({ key: currentSection, content: currentContent.join("\n").trim() });
  }

  // Se não encontrou seções, retorna o texto inteiro como "instrucoes"
  if (sections.length === 0 && text.trim()) {
    sections.push({ key: "instrucoes", content: text.trim() });
  }

  return sections;
}

export default function TabGerar({
  selectedModel, handleModelChange, onPreview, onSaveTemplate, onGerarDocumento, isGerandoDoc,
  initialArea = "", initialContexto = "",
  onNavigateToDocumentos, onNavigateToAnalise,
}: TabGerarProps) {
  // Form state
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("peticao");
  const [contexto, setContexto] = useState(initialContexto);
  const [objetivo, setObjetivo] = useState("");
  const [areaJuridica, setAreaJuridica] = useState(initialArea);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tomProfissional, setTomProfissional] = useState(true);
  const [incluirJurisprudencia, setIncluirJurisprudencia] = useState(true);
  const [incluirLegislacao, setIncluirLegislacao] = useState(true);
  const [fundamentacao, setFundamentacao] = useState("");
  const [parteContraria, setParteContraria] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);

  // P1: Persona e Chain of Thought
  const [personaId, setPersonaId] = useState<string | undefined>();
  const [personaCustom, setPersonaCustom] = useState<string | undefined>();
  const [chainOfThought, setChainOfThought] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");

  // Result ref for scroll
  const resultRef = useRef<HTMLDivElement>(null);

  const geracaoMutation = trpc.prompts.gerar.useMutation({
    onSuccess: () => {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    },
  });

  // Update from parent props
  useEffect(() => {
    if (initialArea) setAreaJuridica(initialArea);
    if (initialContexto) setContexto(initialContexto);
  }, [initialArea, initialContexto]);

  const handleGerar = () => {
    if (!contexto.trim()) { toast.error("Por favor, descreva o contexto do caso"); return; }
    if (!objetivo.trim()) { toast.error("Por favor, descreva o objetivo do prompt"); return; }

    // Sprint 3: se houver docs anexados, mescla o texto extraído ao final do contexto
    // de forma claramente demarcada para o LLM. Cada documento em seu próprio bloco
    // para que o LLM (e o metaprompt no server) saibam tratá-los como fonte primária.
    const contextoFinal = attachedDocs.length > 0
      ? `${contexto}\n\n${attachedDocs.map(d =>
          `--- DOCUMENTO ANEXADO (${d.fileName}) ---\n${d.text}\n--- FIM DO DOCUMENTO ---`,
        ).join("\n\n")}`
      : contexto;

    geracaoMutation.mutate({
      tipoDocumento: tipoDocumento as any,
      contextoJuridico: contextoFinal,
      objetivoEspecifico: objetivo,
      area: (areaJuridica || "Civil") as any,
      partesEnvolvidas: parteContraria || undefined,
      legislacaoRelevante: fundamentacao || undefined,
      detalhesAdicionais: tribunal ? `Tribunal: ${tribunal}. Tom: ${tomProfissional ? "profissional" : "informal"}. ${incluirJurisprudencia ? "Incluir jurisprudência." : ""} ${incluirLegislacao ? "Incluir legislação." : ""}` : undefined,
      personaId: personaId || undefined,
      personaCustom: personaCustom || undefined,
      chainOfThought,
      model: selectedModel as any,
    });
  };

  const promptText = isEditing ? editedPrompt : (geracaoMutation.data?.promptProfissional || "");
  const parsedSections = useMemo(() => parsePromptSections(promptText), [promptText]);

  // Starter prompts contextuais à área selecionada (catálogo curado em shared/juridico.ts)
  const starters = useMemo(() => getStarterPrompts(areaJuridica), [areaJuridica]);

  const applyStarter = (starter: StarterPrompt) => {
    setTipoDocumento(starter.tipoDocumento);
    setContexto(starter.contexto);
    setObjetivo(starter.objetivo);
    toast.success(`Inspiração carregada: ${starter.titulo}`);
  };

  const startEditing = () => {
    setEditedPrompt(geracaoMutation.data?.promptProfissional || "");
    setIsEditing(true);
  };

  const confirmEdit = () => {
    setIsEditing(false);
    toast.success("Prompt editado com sucesso!");
  };

  const cancelEdit = () => {
    setEditedPrompt("");
    setIsEditing(false);
  };

  const hasResult = !!geracaoMutation.data;

  return (
    <div className={`transition-all duration-500 ${hasResult ? "flex gap-6" : ""}`}>
      {/* Painel Esquerdo: Formulário */}
      <div className={`transition-all duration-500 ${hasResult ? "w-[380px] flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto" : "w-full"}`}>
        <Card>
          <CardHeader className={hasResult ? "p-4" : ""}>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-5 h-5 text-primary" />
              {hasResult ? "Parâmetros" : "Gerar Prompt Jurídico Profissional"}
            </CardTitle>
            {!hasResult && (
              <CardDescription>Preencha os campos para gerar um prompt profissional estruturado com referências legais</CardDescription>
            )}
            {!hasResult && <DisclaimerLegal className="mt-4" />}
          </CardHeader>
          <CardContent className={`space-y-4 ${hasResult ? "p-4 pt-0" : ""}`}>
            {!hasResult && (
              <ModelSelector value={selectedModel} onChange={handleModelChange} disabled={geracaoMutation.isPending} />
            )}

            <div className="space-y-2">
              <Label className="text-sm">Tipo de Documento</Label>
              <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Contexto do Caso *</Label>
                <VoiceInput
                  onTranscription={(text) => setContexto(contexto ? contexto + " " + text : text)}
                  disabled={geracaoMutation.isPending}
                />
              </div>
              <Textarea value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Descreva os fatos ou use o microfone para ditar..." rows={hasResult ? 3 : 4} />
            </div>

            {/* Sprint 3: anexo de múltiplos documentos client-side (PDF/DOCX/TXT) */}
            <DocumentAttachment
              docs={attachedDocs}
              onChange={setAttachedDocs}
              disabled={geracaoMutation.isPending}
            />

            <div className="space-y-2">
              <Label className="text-sm">Objetivo do Prompt *</Label>
              <Textarea value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="O que você espera como resultado..." rows={hasResult ? 2 : 3} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Área Jurídica</Label>
              <Select value={areaJuridica} onValueChange={setAreaJuridica}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {AREAS_JURIDICAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Inspirações: starter prompts contextuais à área (Sprint 2) */}
            {!hasResult && starters.length > 0 && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Inspirações para {areaJuridica}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Comece a partir de um caso típico — clique para preencher os campos automaticamente.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {starters.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyStarter(s)}
                      className="text-left text-xs px-2.5 py-1.5 rounded-md bg-background hover:bg-primary/10 border border-border hover:border-primary/40 transition-colors"
                      title={s.contexto}
                    >
                      {s.titulo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* P1: Persona Jurídica Especializada */}
            <PersonaSelector
              value={personaId}
              customValue={personaCustom}
              area={areaJuridica}
              onChange={setPersonaId}
              onCustomChange={setPersonaCustom}
              disabled={geracaoMutation.isPending}
              compact={hasResult}
            />

            {/* P2: Checklist de Contexto (pré-geração) */}
            {!hasResult && (
              <ContextChecklist
                campos={{
                  tipoDocumento,
                  contexto,
                  objetivo,
                  areaJuridica,
                  parteContraria,
                  fundamentacao,
                  tribunal,
                  attachedDocs,
                }}
              />
            )}

            {/* Campos Avançados */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Opções Avançadas
            </button>

            {showAdvanced && (
              <div className="space-y-4 pl-2 border-l-2 border-primary/20">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Tom Profissional</Label>
                  <Switch checked={tomProfissional} onCheckedChange={setTomProfissional} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Incluir Jurisprudência</Label>
                  <Switch checked={incluirJurisprudencia} onCheckedChange={setIncluirJurisprudencia} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Incluir Legislação</Label>
                  <Switch checked={incluirLegislacao} onCheckedChange={setIncluirLegislacao} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Fundamentação Específica</Label>
                  <Input value={fundamentacao} onChange={e => setFundamentacao(e.target.value)} placeholder="Ex: Art. 5º CF/88..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Parte Contrária</Label>
                  <Input value={parteContraria} onChange={e => setParteContraria(e.target.value)} placeholder="Identificação da parte contrária..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Tribunal</Label>
                  <Input value={tribunal} onChange={e => setTribunal(e.target.value)} placeholder="Ex: STF, STJ, TJ-SP..." />
                </div>

                {/* P1: Chain of Thought Jurídico */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Raciocínio Passo a Passo (CoT)</Label>
                    <p className="text-[11px] text-muted-foreground">Instrui a IA a seguir: Fatos → Enquadramento → Fundamentação → Argumentação → Pedidos</p>
                  </div>
                  <Switch checked={chainOfThought} onCheckedChange={setChainOfThought} />
                </div>
              </div>
            )}

            <Button onClick={handleGerar} disabled={geracaoMutation.isPending} className="w-full" size={hasResult ? "default" : "lg"}>
              {geracaoMutation.isPending ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Gerando...</>) : (<><Zap className="mr-2 w-4 h-4" />{hasResult ? "Regerar" : "Gerar Prompt Profissional"}</>)}
            </Button>

            {!hasResult && <GenerationStepper isGenerating={geracaoMutation.isPending} type="geracao" />}
          </CardContent>
        </Card>
      </div>

      {/* Painel Direito: Resultado (Artifact View) */}
      {hasResult && (
        <div ref={resultRef} className="flex-1 min-w-0 animate-in fade-in slide-in-from-right-8 duration-500">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-lg">Prompt Profissional Gerado</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {geracaoMutation.data?.area && (
                      <Badge variant="secondary">{geracaoMutation.data.area}</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={startEditing} className="gap-1">
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button variant="default" size="sm" onClick={confirmEdit} className="gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Confirmar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit} className="gap-1">
                        <X className="w-3.5 h-3.5" />
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AIDisclaimer />

              {/* P2: Refinamento Iterativo */}
              <RefinamentoPanel
                promptText={promptText}
                promptId={geracaoMutation.data?.promptId}
                selectedModel={selectedModel}
                onRefinado={(novoTexto) => {
                  setEditedPrompt(novoTexto);
                  setIsEditing(false);
                  // Atualiza o promptProfissional no cache da mutation
                  if (geracaoMutation.data) {
                    (geracaoMutation.data as any).promptProfissional = novoTexto;
                  }
                }}
              />

              {/* Ações Hierárquicas */}
              <PromptActions
                promptText={promptText}
                titulo={`Prompt ${TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || ""}`}
                promptId={geracaoMutation.data?.promptId}
                tipoDocumento={TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label}
                areaJuridica={geracaoMutation.data?.area || areaJuridica}
                onPreview={() => onPreview({
                  titulo: `Prompt Profissional - ${TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || ""}`,
                  conteudo: promptText,
                  areaJuridica: geracaoMutation.data?.area,
                  tipoDocumento: TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label,
                  promptId: geracaoMutation.data?.promptId,
                })}
                onSaveTemplate={() => onSaveTemplate(promptText, geracaoMutation.data?.area || areaJuridica || "Geral")}
                showGerarDocumento={!!geracaoMutation.data?.promptId}
                onGerarDocumento={() => geracaoMutation.data?.promptId && onGerarDocumento(geracaoMutation.data.promptId, promptText, tipoDocumento)}
                isGerandoDoc={isGerandoDoc}
                onNavigateToDocumentos={onNavigateToDocumentos}
                onNavigateToAnalise={onNavigateToAnalise}
              />

              {/* Conteúdo do Prompt */}
              {isEditing ? (
                <Textarea
                  value={editedPrompt}
                  onChange={e => setEditedPrompt(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              ) : (
                <div className="space-y-3">
                  {parsedSections.length > 1 ? (
                    parsedSections.map((section, idx) => {
                      const sectionConfig = PROMPT_SECTIONS.find(s => s.key === section.key);
                      const Icon = sectionConfig?.icon || FileText;
                      return (
                        <div key={idx} className="p-4 bg-muted/30 rounded-sm border-l-2 border-primary/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${sectionConfig?.color || "text-muted-foreground"}`} />
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {sectionConfig?.label || "Conteúdo"}
                            </span>
                          </div>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                            {section.content}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-muted/20 rounded-sm">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground abnt-document">
                        {promptText}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sprint 4: Card de Qualidade com breakdown por critério */}
              {geracaoMutation.data?.avaliacaoQualidade && (
                <QualityScoreCard avaliacao={geracaoMutation.data.avaliacaoQualidade} />
              )}

              {/* Validação de Legislação */}
              {geracaoMutation.data?.validacaoLegislacao && (
                <ValidacaoLegislacao validacao={geracaoMutation.data.validacaoLegislacao} />
              )}

              {/* P2: Disclaimer + Checklist de Revisão */}
              <ReviewChecklist className="mt-4" />

              {/* Fluxo Guiado */}
              <PostGenerationGuide className="mt-6" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Erro */}
      {geracaoMutation.error && !hasResult && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm mt-4">
          Erro: {geracaoMutation.error.message}
        </div>
      )}
    </div>
  );
}
