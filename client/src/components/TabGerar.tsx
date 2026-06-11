import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Loader2, ChevronDown, ChevronUp, Pencil, Check, X,
  User, FileText, ListChecks, BookOpen, Palette, ShieldCheck,
  Sparkles, Copy, Download, Save, AlertTriangle, BarChart2,
  Wand2, RefreshCw, Lightbulb
} from "lucide-react";
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
import { RagToggle } from "@/components/RagToggle";
import { RagResultsPanel } from "@/components/RagResultsPanel";
import { AlucinacaoAlert } from "@/components/AlucinacaoAlert";

interface TabGerarProps {
  selectedModel: string;
  handleModelChange: (v: string) => void;
  onPreview: (data: { titulo: string; conteudo: string; areaJuridica?: string; tipoDocumento?: string; promptId?: number }) => void;
  onSaveTemplate: (conteudo: string, area: string) => void;
  onGerarDocumento: (promptId: number, conteudo: string, tipo: string) => void;
  isGerandoDoc: boolean;
  initialArea?: string;
  initialContexto?: string;
  onNavigateToDocumentos?: () => void;
  onNavigateToAnalise?: () => void;
}

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
    if (!matched) currentContent.push(line);
  }
  if (currentSection && currentContent.length > 0) {
    sections.push({ key: currentSection, content: currentContent.join("\n").trim() });
  }
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
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("peticao");
  const [contexto, setContexto] = useState(initialContexto);
  const [objetivo, setObjetivo] = useState("");
  const [areaJuridica, setAreaJuridica] = useState(initialArea);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPersonalizar, setShowPersonalizar] = useState(false);
  const [tomProfissional, setTomProfissional] = useState(true);
  const [incluirJurisprudencia, setIncluirJurisprudencia] = useState(true);
  const [incluirLegislacao, setIncluirLegislacao] = useState(true);
  const [fundamentacao, setFundamentacao] = useState("");
  const [parteContraria, setParteContraria] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);
  const [personaId, setPersonaId] = useState<string | undefined>();
  const [personaCustom, setPersonaCustom] = useState<string | undefined>();
  const [chainOfThought, setChainOfThought] = useState(false);
  const [ragAtivo, setRagAtivo] = useState(false);
  const [ragConfig, setRagConfig] = useState({
    buscarLegislacao: true, buscarSumulas: true, buscarJurisprudencia: true,
    tribunais: ["STF", "STJ", "TJSP", "TJRJ", "TJRS"],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  // Estado da sugestão inteligente
  const [sugestaoDica, setSugestaoDica] = useState<string | null>(null);
  const [sugestaoTipo, setSugestaoTipo] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  const geracaoMutation = trpc.prompts.gerar.useMutation();
  const sugerirMutation = trpc.prompts.sugerirCampos.useMutation({
    onSuccess: (data) => {
      setContexto(data.contexto);
      setObjetivo(data.objetivo);
      setSugestaoDica(data.dica);
      setSugestaoTipo(data.tipoDocumento);
      toast.success("Campos preenchidos com sugestão inteligente!", {
        description: `Exemplo para ${data.tipoDocumento} — ${data.areaJuridica}`,
        duration: 4000,
      });
    },
    onError: (err) => {
      toast.error("Não foi possível gerar a sugestão", {
        description: err.message,
      });
    },
  });

  useEffect(() => {
    if (initialArea) setAreaJuridica(initialArea);
    if (initialContexto) setContexto(initialContexto);
  }, [initialArea, initialContexto]);

  // Limpa a dica quando o tipo de documento ou área muda
  useEffect(() => {
    setSugestaoDica(null);
    setSugestaoTipo(null);
  }, [tipoDocumento, areaJuridica]);

  const handleSugerirCampos = () => {
    const camposPreenchidos = contexto.trim() || objetivo.trim();
    if (camposPreenchidos) {
      // Confirmar sobrescrita se já há conteúdo
      if (!window.confirm("Os campos de contexto e objetivo serão substituídos pela sugestão da IA. Deseja continuar?")) {
        return;
      }
    }
    sugerirMutation.mutate({
      tipoDocumento,
      areaJuridica: areaJuridica || undefined,
      model: selectedModel,
    });
  };

  const handleGerar = () => {
    if (!contexto.trim()) { toast.error("Por favor, descreva o contexto do caso"); return; }
    if (!objetivo.trim()) { toast.error("Por favor, descreva o objetivo do prompt"); return; }
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
      ragAtivo,
      ragConfig: ragAtivo ? ragConfig : undefined,
      model: selectedModel as any,
    });
  };

  const promptText = isEditing ? editedPrompt : (geracaoMutation.data?.promptProfissional || "");
  const parsedSections = useMemo(() => parsePromptSections(promptText), [promptText]);
  const starters = useMemo(() => getStarterPrompts(areaJuridica), [areaJuridica]);

  const applyStarter = (starter: StarterPrompt) => {
    setTipoDocumento(starter.tipoDocumento);
    setContexto(starter.contexto);
    setObjetivo(starter.objetivo);
    toast.success(`Inspiração carregada: ${starter.titulo}`);
  };

  const hasResult = !!geracaoMutation.data;

  const handleCopyPrompt = () => {
    if (!promptText) return;
    navigator.clipboard.writeText(promptText).then(() => {
      toast.success("Prompt copiado para a área de transferência!");
    });
  };

  const isSugerindo = sugerirMutation.isPending;

  // ── LAYOUT: 3 painéis fixos lado a lado ──────────────────────────────────
  return (
    <div className="flex gap-0 -mx-6 -mt-4 overflow-hidden rounded-lg border border-border" style={{height: 'calc(100vh - 360px)', minHeight: '500px'}}>

      {/* ── PAINEL CENTRAL: ENTRADA ─────────────────────────────────────────── */}
      <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-border bg-card overflow-hidden">

        {/* Header do painel */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
            <span className="text-sm font-semibold">Parâmetros</span>
          </div>
          <ModelSelector value={selectedModel} onChange={handleModelChange} compact />
        </div>

        {/* Corpo do painel — scrollável */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Disclaimer compacto — colapsável para não ocupar espaço */}
          <details className="group">
            <summary className="flex items-center gap-1.5 text-[11px] text-amber-600 cursor-pointer list-none select-none">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span className="font-medium">Aviso: revise sempre as referências jurídicas geradas pela IA</span>
              <ChevronDown className="w-3 h-3 ml-auto group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed pl-4 border-l border-amber-500/30">
              Citações legais e jurisprudências geradas por IA <strong>não são verificadas automaticamente</strong>. Confirme a validade de todas as referências antes de usar em documentos oficiais. A responsabilidade é sempre do profissional do Direito.
            </div>
          </details>

          {/* Tipo de documento */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de Documento</Label>
            <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumento)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_DOCUMENTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Área Jurídica */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Área Jurídica</Label>
            <Select value={areaJuridica} onValueChange={setAreaJuridica}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {AREAS_JURIDICAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* ── BOTÃO DE SUGESTÃO INTELIGENTE ─────────────────────────────── */}
          <div className="rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Wand2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">Sugestão Inteligente</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">IA</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                  Preencha contexto e objetivo automaticamente com um exemplo realista para{" "}
                  <span className="font-medium text-foreground">
                    {TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento}
                  </span>
                  {areaJuridica ? ` — ${areaJuridica}` : ""}.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs gap-1.5 w-full"
                  onClick={handleSugerirCampos}
                  disabled={isSugerindo || geracaoMutation.isPending}
                >
                  {isSugerindo ? (
                    <><RefreshCw className="w-3 h-3 animate-spin" />Gerando sugestão...</>
                  ) : (
                    <><Wand2 className="w-3 h-3" />Sugerir campos com IA</>
                  )}
                </Button>
              </div>
            </div>

            {/* Dica da última sugestão */}
            {sugestaoDica && (
              <div className="mt-2.5 pt-2.5 border-t border-primary/20 flex items-start gap-2">
                <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-medium text-amber-600">Dica:</span> {sugestaoDica}
                </p>
              </div>
            )}
          </div>

          {/* Contexto */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contexto do Caso *</Label>
                <VoiceInput
                  onTranscription={(text) => setContexto(contexto ? contexto + " " + text : text)}
                  disabled={geracaoMutation.isPending}
                />
              </div>
              <span className={`text-xs tabular-nums ${
                contexto.length > 1800 ? "text-destructive" : contexto.length > 1400 ? "text-amber-500" : "text-muted-foreground"
              }`}>{contexto.length}/2000</span>
            </div>
            <div className="relative">
              <Textarea
                value={contexto}
                onChange={e => setContexto(e.target.value)}
                placeholder="Descreva os fatos ou use o microfone para ditar..."
                rows={4}
                maxLength={2000}
                className={`text-sm resize-none transition-all duration-300 ${isSugerindo ? "opacity-50" : ""}`}
              />
              {isSugerindo && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    Gerando...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Objetivo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objetivo do Prompt *</Label>
              <span className={`text-xs tabular-nums ${
                objetivo.length > 450 ? "text-destructive" : objetivo.length > 350 ? "text-amber-500" : "text-muted-foreground"
              }`}>{objetivo.length}/500</span>
            </div>
            <div className="relative">
              <Textarea
                value={objetivo}
                onChange={e => setObjetivo(e.target.value)}
                placeholder="O que você espera como resultado..."
                rows={3}
                maxLength={500}
                className={`text-sm resize-none transition-all duration-300 ${isSugerindo ? "opacity-50" : ""}`}
              />
              {isSugerindo && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    Gerando...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documentos anexados */}
          <DocumentAttachment
            docs={attachedDocs}
            onChange={setAttachedDocs}
            disabled={geracaoMutation.isPending}
          />

          {/* Inspirações */}
          {starters.length > 0 && (
            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold">Casos típicos{areaJuridica ? ` — ${areaJuridica}` : ""}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {starters.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyStarter(s)}
                    className="text-left text-xs px-2 py-1 rounded bg-background hover:bg-primary/10 border border-border hover:border-primary/40 transition-colors"
                    title={s.contexto}
                  >
                    {s.titulo}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checklist de contexto */}
          <ContextChecklist
            campos={{ tipoDocumento, contexto, objetivo, areaJuridica, parteContraria, fundamentacao, tribunal, attachedDocs }}
          />

          {/* Personalizar saída — colapsável */}
          <div>
            <button
              type="button"
              onClick={() => setShowPersonalizar(!showPersonalizar)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full py-1"
            >
              {showPersonalizar ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              ⚙ Personalizar saída
              <span className="text-[10px] text-muted-foreground/60 font-normal">(opcional)</span>
            </button>
            {showPersonalizar && (
              <div className="mt-2 space-y-3 pl-3 border-l border-border">
                <PersonaSelector
                  value={personaId}
                  customValue={personaCustom}
                  area={areaJuridica}
                  onChange={setPersonaId}
                  onCustomChange={setPersonaCustom}
                  disabled={geracaoMutation.isPending}
                  compact
                />
                <RagToggle
                  ativo={ragAtivo}
                  config={ragConfig}
                  onAtivoChange={setRagAtivo}
                  onConfigChange={setRagConfig}
                  disabled={geracaoMutation.isPending}
                  compact
                />
              </div>
            )}
          </div>

          {/* Opções avançadas — colapsável */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full py-1"
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              ▸ Opções avançadas
            </button>
            {showAdvanced && (
              <div className="mt-2 space-y-3 pl-3 border-l border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Tom Profissional</Label>
                  <Switch checked={tomProfissional} onCheckedChange={setTomProfissional} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Incluir Jurisprudência</Label>
                  <Switch checked={incluirJurisprudencia} onCheckedChange={setIncluirJurisprudencia} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Incluir Legislação</Label>
                  <Switch checked={incluirLegislacao} onCheckedChange={setIncluirLegislacao} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fundamentação Específica</Label>
                  <Input value={fundamentacao} onChange={e => setFundamentacao(e.target.value)} placeholder="Ex: Art. 5º CF/88..." className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Parte Contrária</Label>
                  <Input value={parteContraria} onChange={e => setParteContraria(e.target.value)} placeholder="Identificação da parte contrária..." className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tribunal</Label>
                  <Input value={tribunal} onChange={e => setTribunal(e.target.value)} placeholder="Ex: STF, STJ, TJ-SP..." className="h-7 text-xs" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Raciocínio Passo a Passo (CoT)</Label>
                    <p className="text-[10px] text-muted-foreground">Fatos → Enquadramento → Fundamentação → Pedidos</p>
                  </div>
                  <Switch checked={chainOfThought} onCheckedChange={setChainOfThought} />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Botão Gerar — fixo no rodapé do painel */}
        <div className="flex-shrink-0 p-4 border-t border-border bg-card">
          <Button
            onClick={handleGerar}
            disabled={geracaoMutation.isPending || isSugerindo}
            className="w-full"
            size="default"
          >
            {geracaoMutation.isPending
              ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Gerando...</>)
              : (<><Zap className="mr-2 w-4 h-4" />{hasResult ? "Regerar Prompt" : "Gerar Prompt Profissional"}</>)
            }
          </Button>
          {geracaoMutation.isPending && (
            <div className="mt-2">
              <GenerationStepper isGenerating={geracaoMutation.isPending} type="geracao" />
            </div>
          )}
        </div>
      </div>

      {/* ── PAINEL DIREITO: RESULTADO ────────────────────────────────────────── */}
      <div ref={resultRef} className="flex-1 min-w-0 flex flex-col bg-background overflow-hidden">

        {/* Header do painel de resultado */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
            <span className="text-sm font-semibold">Resultado Gerado</span>
            {hasResult && geracaoMutation.data?.area && (
              <Badge variant="secondary" className="text-xs">{geracaoMutation.data.area}</Badge>
            )}
            {hasResult && (
              <Badge variant="outline" className="text-xs">
                {TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento}
              </Badge>
            )}
          </div>
          {hasResult && (
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => { setEditedPrompt(geracaoMutation.data?.promptProfissional || ""); setIsEditing(true); }} className="gap-1 h-7 text-xs">
                  <Pencil className="w-3 h-3" />Editar
                </Button>
              ) : (
                <>
                  <Button variant="default" size="sm" onClick={() => { setIsEditing(false); toast.success("Prompt editado!"); }} className="gap-1 h-7 text-xs">
                    <Check className="w-3 h-3" />Confirmar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditedPrompt(""); setIsEditing(false); }} className="gap-1 h-7 text-xs">
                    <X className="w-3 h-3" />Cancelar
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Corpo do resultado — scrollável */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hasResult && !geracaoMutation.isPending && (
            /* Estado vazio */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Zap className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground/60 mb-1">Pronto para gerar</h4>
                <p className="text-sm max-w-xs">
                  Preencha o contexto e o objetivo no painel ao lado — ou use{" "}
                  <span className="font-medium text-primary">Sugestão Inteligente</span>{" "}
                  para preencher automaticamente — e clique em <strong>Gerar Prompt Profissional</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60 mt-2">
                <Wand2 className="w-3.5 h-3.5 text-primary/50" />
                <span>Dica: use a sugestão inteligente para começar rapidamente</span>
              </div>
            </div>
          )}

          {geracaoMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm">Gerando seu prompt profissional...</p>
            </div>
          )}

          {hasResult && (
            <>
              <AIDisclaimer />

              {/* Refinamento iterativo */}
              <RefinamentoPanel
                promptText={promptText}
                promptId={geracaoMutation.data?.promptId}
                selectedModel={selectedModel}
                onRefinado={(novoTexto) => {
                  setEditedPrompt(novoTexto);
                  setIsEditing(false);
                  if (geracaoMutation.data) {
                    (geracaoMutation.data as any).promptProfissional = novoTexto;
                  }
                }}
              />

              {/* Ações */}
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
                onSaveTemplate={() => onSaveTemplate(promptText, geracaoMutation.data?.area || areaJuridica)}
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
                <div className="space-y-2">
                  {parsedSections.length > 1 ? (
                    parsedSections.map((section, idx) => {
                      const sectionConfig = PROMPT_SECTIONS.find(s => s.key === section.key);
                      const Icon = sectionConfig?.icon || FileText;
                      return (
                        <div key={idx} className="p-3 bg-muted/30 rounded-sm border-l-2 border-primary/30">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className={`w-3.5 h-3.5 ${sectionConfig?.color || "text-muted-foreground"}`} />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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

              {/* Qualidade */}
              {geracaoMutation.data?.avaliacaoQualidade && (
                <QualityScoreCard avaliacao={geracaoMutation.data.avaliacaoQualidade} />
              )}

              {/* RAG */}
              <RagResultsPanel ragResult={geracaoMutation.data?.ragResult ?? null} />

              {/* Alucinações */}
              <AlucinacaoAlert deteccao={geracaoMutation.data?.deteccaoAlucinacao ?? null} />

              {/* Validação de Legislação */}
              {geracaoMutation.data?.validacaoLegislacao && (
                <ValidacaoLegislacao validacao={geracaoMutation.data.validacaoLegislacao} />
              )}

              {/* Checklist de Revisão */}
              <ReviewChecklist className="mt-2" />

              {/* Fluxo Guiado */}
              <PostGenerationGuide className="mt-4" />
            </>
          )}

          {/* Erro */}
          {geracaoMutation.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
              Erro: {geracaoMutation.error.message}
            </div>
          )}
        </div>

        {/* Barra de ações fixas no rodapé — sempre visível */}
        <div className="flex-shrink-0 px-4 py-2.5 border-t border-border bg-muted/20 flex items-center gap-2 flex-wrap">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            disabled={!hasResult}
            onClick={handleCopyPrompt}
          >
            <Copy className="w-3 h-3" />
            Copiar prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            disabled={!hasResult || isGerandoDoc}
            onClick={() => hasResult && geracaoMutation.data?.promptId && onGerarDocumento(geracaoMutation.data.promptId, promptText, tipoDocumento)}
          >
            <Download className="w-3 h-3" />
            Gerar .docx
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            disabled={!hasResult}
            onClick={() => hasResult && onPreview({
              titulo: `Prompt Profissional - ${TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || ""}`,
              conteudo: promptText,
              areaJuridica: geracaoMutation.data?.area,
              tipoDocumento: TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label,
              promptId: geracaoMutation.data?.promptId,
            })}
          >
            <BarChart2 className="w-3 h-3" />
            Visualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            disabled={!hasResult}
            onClick={() => hasResult && onSaveTemplate(promptText, geracaoMutation.data?.area || areaJuridica)}
          >
            <Save className="w-3 h-3" />
            Salvar modelo
          </Button>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Sempre revise o conteúdo gerado. A IA pode cometer erros.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
