import { useState, useRef, useEffect, useMemo, type Dispatch, type SetStateAction, type ReactNode } from "react";
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
  Wand2, RefreshCw, Lightbulb, History
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ModelSelector } from "@/components/ModelSelector";
import { DisclaimerLegal } from "@/components/DisclaimerLegal";
import { ValidacaoLegislacao } from "@/components/ValidacaoLegislacao";
import PromptActions from "@/components/PromptActions";
import GenerationStepper from "@/components/GenerationStepper";
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
import { PreviewA4 } from "@/components/PreviewA4";

interface TabGerarProps {
  selectedModel: string;
  handleModelChange: (v: string) => void;
  onPreview: (data: { titulo: string; conteudo: string; areaJuridica?: string; tipoDocumento?: string; promptId?: number }) => void;
  onSaveTemplate: (conteudo: string, area: string) => void;
  onGerarDocumento: (promptId: number, conteudo: string, tipo: string) => void;
  isGerandoDoc: boolean;
  initialArea?: string;
  objetivo: string;
  setObjetivo: Dispatch<SetStateAction<string>>;
  tipoDocumento: TipoDocumento | "auto";
  setTipoDocumento: Dispatch<SetStateAction<TipoDocumento | "auto">>;
  contexto: string;
  setContexto: Dispatch<SetStateAction<string>>;
  onNavigateToDocumentos?: () => void;
  onNavigateToAnalise?: () => void;
  onAnalisar?: () => void;
  onOtimizar?: () => void;
  onLimpar?: () => void;
  isAnalisando?: boolean;
  isOtimizando?: boolean;
  revisaoSlot?: ReactNode;
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
  initialArea = "", objetivo, setObjetivo, tipoDocumento, setTipoDocumento, contexto, setContexto,
  onNavigateToDocumentos, onNavigateToAnalise,
  onAnalisar, onOtimizar, onLimpar, isAnalisando, isOtimizando, revisaoSlot,
}: TabGerarProps) {
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
  const [viewMode, setViewMode] = useState<"a4" | "secoes">("a4"); // Modo de visualização do resultado
  // Estado da sugestão inteligente
  const [sugestaoDica, setSugestaoDica] = useState<string | null>(null);
  const [sugestaoTipo, setSugestaoTipo] = useState<string | null>(null);
  const [showHistorico, setShowHistorico] = useState(false);

  // Histórico de sugestões por tipo de documento (persistido no localStorage)
  type SugestaoHistorico = { contexto: string; objetivo: string; dica: string; tipoDocumento: string; areaJuridica: string; criadaEm: string };
  const HISTORICO_KEY = "promptjur-sugestoes-historico";
  const MAX_HISTORICO = 5;

  const carregarHistorico = (): SugestaoHistorico[] => {
    try { return JSON.parse(localStorage.getItem(HISTORICO_KEY) || "[]"); } catch { return []; }
  };

  const [historicoSugestoes, setHistoricoSugestoes] = useState<SugestaoHistorico[]>(carregarHistorico);

  const salvarNoHistorico = (item: SugestaoHistorico) => {
    const historico = carregarHistorico();
    // Remove duplicatas do mesmo tipo+área
    const filtrado = historico.filter(h => !(h.tipoDocumento === item.tipoDocumento && h.areaJuridica === item.areaJuridica && h.contexto === item.contexto));
    const novo = [item, ...filtrado].slice(0, MAX_HISTORICO);
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(novo));
    setHistoricoSugestoes(novo);
  };

  const historicoFiltrado = historicoSugestoes.filter(h => h.tipoDocumento === tipoDocumento);

  const resultRef = useRef<HTMLDivElement>(null);

  const geracaoMutation = trpc.prompts.gerar.useMutation({
    onSuccess: (data) => {
      // [#3] sincroniza dropdowns com o que foi detectado do texto
      if (data.tipoDocumento) setTipoDocumento(data.tipoDocumento as TipoDocumento);
      if (data.area) setAreaJuridica(data.area);
    },
  });
  const sugerirMutation = trpc.prompts.sugerirCampos.useMutation({
    onSuccess: (data) => {
      setContexto(data.contexto);
      setObjetivo(data.objetivo);
      setSugestaoDica(data.dica);
      setSugestaoTipo(data.tipoDocumento);
      // Salvar no histórico
      salvarNoHistorico({
        contexto: data.contexto,
        objetivo: data.objetivo,
        dica: data.dica,
        tipoDocumento: data.tipoDocumento,
        areaJuridica: data.areaJuridica,
        criadaEm: new Date().toISOString(),
      });
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
  }, [initialArea]);

  // Limpa a dica quando o tipo de documento ou área muda
  useEffect(() => {
    setSugestaoDica(null);
    setSugestaoTipo(null);
  }, [tipoDocumento, areaJuridica]);

  const handleSugerirCampos = (_modo: "gerar" | "completar" = "gerar") => {
    const temContexto = contexto.trim().length > 0;
    const temObjetivo = objetivo.trim().length > 0;
    // [#3] Honra o texto já escrito: havendo contexto/objetivo, a IA REFINA o caso
    // real do usuário (nunca descarta nem substitui por um exemplo genérico). Só
    // gera exemplo do zero quando ambos os campos estão vazios.
    sugerirMutation.mutate({
      tipoDocumento: tipoDocumento === "auto" ? "peticao" : tipoDocumento,
      areaJuridica: areaJuridica || undefined,
      model: selectedModel,
      contextoAtual: temContexto ? contexto : undefined,
      objetivoAtual: temObjetivo ? objetivo : undefined,
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
      tipoDocumento: (tipoDocumento === "auto" ? undefined : tipoDocumento) as any, // [#3] auto => backend detecta
      contextoJuridico: contextoFinal,
      objetivoEspecifico: objetivo,
      area: (areaJuridica || undefined) as any, // [#3] vazio => backend detecta a área pelo contexto
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

  // ── LAYOUT: 3 cards numerados + painel resultado ──────────────────────────
  return (
    <div className="flex gap-0 -mx-6 -mt-4 overflow-hidden rounded-lg border border-border" style={{height: 'calc(100vh - 360px)', minHeight: '500px'}}>

      {/* ── PAINEL ESQUERDO: 3 CARDS NUMERADOS ──────────────────────────────── */}
      <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-border bg-card overflow-hidden">

        {/* Header do painel */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 flex-shrink-0">
          <span className="text-sm font-semibold text-foreground">Nova Peça Jurídica</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-primary border-primary/40">✨ IA Integrada</Badge>
            <ModelSelector value={selectedModel} onChange={handleModelChange} />
          </div>
        </div>

        {/* Corpo do painel — scrollável com 3 cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* ── CARD 1: PROMPT BÁSICO ─────────────────────────────────────────── */}
          <div className="card-numerado overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40 bg-muted/10">
              <span className="card-numero">1</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Prompt Básico</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Entrada simples</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Descreva o que precisa em linguagem natural</p>
              </div>
            </div>
            <div className="p-3 space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Descreva sua peça jurídica</Label>
                    <VoiceInput onTranscription={(text) => setContexto(contexto ? contexto + " " + text : text)} disabled={geracaoMutation.isPending} />
                  </div>
                  <span className={`text-[10px] tabular-nums ${contexto.length > 1800 ? "text-destructive" : contexto.length > 1400 ? "text-amber-500" : "text-muted-foreground"}`}>{contexto.length}/2000</span>
                </div>
                <div className="relative">
                  <Textarea value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Ex: Elabore uma petição inicial de danos morais por cobrança indevida com fundamento no art. 42 do CDC, em favor de consumidor pessoa física..." rows={4} maxLength={2000} className={`text-xs resize-none ${isSugerindo ? "opacity-50" : ""}`} />
                  {isSugerindo && <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md"><RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /></div>}
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 2: PROMPT PROFISSIONAL ──────────────────────────────────── */}
          <div className="card-numerado-destaque overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-primary/25 bg-primary/5">
              <span className="card-numero">2</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Prompt Profissional</span>
                  <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">⭐ Recomendado</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Detalhamento completo para resultado superior</p>
              </div>
            </div>
            <div className="p-3 space-y-3">

              {/* Sugestão Inteligente */}
              <div className="card-sugestao-ia p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-semibold text-foreground">✨ Sugestão Inteligente</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {historicoFiltrado.length > 0 && (
                      <button onClick={() => setShowHistorico(v => !v)} className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5 transition-colors" title="Ver sugestões anteriores">
                        <History className="w-3 h-3" />{historicoFiltrado.length}
                      </button>
                    )}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">IA</Badge>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">Preencha os campos automaticamente com IA</p>
                <div className="flex gap-1.5">
                  <Button variant="default" size="sm" className="h-6 text-[11px] gap-1 flex-1" onClick={() => handleSugerirCampos("gerar")} disabled={isSugerindo || geracaoMutation.isPending}>
                    {isSugerindo ? <><RefreshCw className="w-3 h-3 animate-spin" />Gerando...</> : <><Wand2 className="w-3 h-3" />Sugerir</>}
                  </Button>
                  {(contexto.trim() || objetivo.trim()) && (
                    <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 px-2" onClick={() => handleSugerirCampos("completar")} disabled={isSugerindo || geracaoMutation.isPending}>
                      <Sparkles className="w-3 h-3" />Completar
                    </Button>
                  )}
                </div>
                {showHistorico && historicoFiltrado.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-primary/20 space-y-1">
                    {historicoFiltrado.map((h, i) => (
                      <button key={i} onClick={() => { setContexto(h.contexto); setObjetivo(h.objetivo); setSugestaoDica(h.dica); setShowHistorico(false); toast.success("Sugestão restaurada!", { duration: 2000 }); }} className="w-full text-left rounded bg-background/60 hover:bg-background border border-border/50 p-1.5 transition-colors">
                        <p className="text-[10px] text-foreground line-clamp-1">{h.contexto}</p>
                        <p className="text-[9px] text-muted-foreground">{h.areaJuridica} • {new Date(h.criadaEm).toLocaleDateString("pt-BR")}</p>
                      </button>
                    ))}
                  </div>
                )}
                {sugestaoDica && !showHistorico && (
                  <div className="mt-2 pt-2 border-t border-primary/20 flex items-start gap-1.5">
                    <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground"><span className="font-medium text-amber-600">Dica:</span> {sugestaoDica}</p>
                  </div>
                )}
              </div>

              {/* Tipo e Área em linha */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tipo de Documento</Label>
                  <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumento | "auto")}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="auto">🪄 Detectar automaticamente</SelectItem>{TIPOS_DOCUMENTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Área Jurídica</Label>
                  <Select value={areaJuridica} onValueChange={setAreaJuridica}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{AREAS_JURIDICAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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
                    <div className="flex items-center gap-1">
                    {historicoFiltrado.length > 0 && (
                      <button
                        onClick={() => setShowHistorico(v => !v)}
                        className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5 transition-colors"
                        title="Ver sugestões anteriores"
                      >
                        <History className="w-3 h-3" />
                        {historicoFiltrado.length}
                      </button>
                    )}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">IA</Badge>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                  Preencha contexto e objetivo automaticamente com um exemplo realista para{" "}
                  <span className="font-medium text-foreground">
                    {tipoDocumento === "auto" ? "o tipo que a IA vai detectar" : (TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento)}
                  </span>
                  {areaJuridica ? ` — ${areaJuridica}` : ""}.
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-xs gap-1.5 flex-1"
                    onClick={() => handleSugerirCampos("gerar")}
                    disabled={isSugerindo || geracaoMutation.isPending}
                    title="Gera um exemplo completo do zero"
                  >
                    {isSugerindo ? (
                      <><RefreshCw className="w-3 h-3 animate-spin" />Gerando...</>
                    ) : (
                      <><Wand2 className="w-3 h-3" />Gerar exemplo</>
                    )}
                  </Button>
                  {(contexto.trim() || objetivo.trim()) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 px-2"
                      onClick={() => handleSugerirCampos("completar")}
                      disabled={isSugerindo || geracaoMutation.isPending}
                      title="Usa o que você já digitou como base e completa/melhora os campos"
                    >
                      <Sparkles className="w-3 h-3" />
                      Completar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Histórico de sugestões anteriores */}
            {showHistorico && historicoFiltrado.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-primary/20 space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <History className="w-3 h-3" /> Sugestões anteriores para este tipo
                </p>
                {historicoFiltrado.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setContexto(h.contexto);
                      setObjetivo(h.objetivo);
                      setSugestaoDica(h.dica);
                      setShowHistorico(false);
                      toast.success("Sugestão anterior restaurada!", { duration: 2000 });
                    }}
                    className="w-full text-left rounded-md bg-background/60 hover:bg-background border border-border/50 p-2 transition-colors group"
                  >
                    <p className="text-[11px] text-foreground line-clamp-2 group-hover:text-primary transition-colors">{h.contexto}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{h.areaJuridica} • {new Date(h.criadaEm).toLocaleDateString("pt-BR")}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Dica da última sugestão */}
            {sugestaoDica && !showHistorico && (
              <div className="mt-2.5 pt-2.5 border-t border-primary/20 flex items-start gap-2">
                <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-medium text-amber-600">Dica:</span> {sugestaoDica}
                </p>
              </div>
            )}
          </div>

              {/* Objetivo */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Objetivo da Peça *</Label>
                  <span className={`text-[10px] tabular-nums ${objetivo.length > 450 ? "text-destructive" : objetivo.length > 350 ? "text-amber-500" : "text-muted-foreground"}`}>{objetivo.length}/500</span>
                </div>
                <div className="relative">
                  <Textarea value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="Ex: Obter indenização por danos morais e repetição em dobro..." rows={2} maxLength={500} className={`text-xs resize-none ${isSugerindo ? "opacity-50" : ""}`} />
                  {isSugerindo && <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md"><RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /></div>}
                </div>
              </div>

              {/* Documentos anexados */}
              <DocumentAttachment docs={attachedDocs} onChange={setAttachedDocs} disabled={geracaoMutation.isPending} />

              {/* Inspirações */}
              {starters.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/10 p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-semibold">Casos típicos{areaJuridica ? ` — ${areaJuridica}` : ""}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {starters.map((s, idx) => (
                      <button key={idx} type="button" onClick={() => applyStarter(s)} className="text-left text-[10px] px-2 py-0.5 rounded bg-background hover:bg-primary/10 border border-border hover:border-primary/40 transition-colors" title={s.contexto}>{s.titulo}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist de contexto */}
              <ContextChecklist campos={{ tipoDocumento, contexto, objetivo, areaJuridica, parteContraria, fundamentacao, tribunal, attachedDocs }} />

            </div>
          </div>

          {/* ── CARD 3: PERSONALIZAR SAÍDA ──────────────────────────────────── */}
          <div className="card-numerado overflow-hidden">
            <button type="button" onClick={() => setShowPersonalizar(!showPersonalizar)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/10 transition-colors">
              <span className="card-numero" style={{background: 'oklch(0.32 0.03 240)', color: 'oklch(0.80 0.01 240)', boxShadow: 'none'}}>3</span>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Personalizar Saída</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Opcional</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Configurações para refinar o resultado</p>
              </div>
              {showPersonalizar ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
            </button>
            {showPersonalizar && (
              <div className="px-3 pb-3 space-y-3 border-t border-border/60 pt-3">
                <PersonaSelector value={personaId} customValue={personaCustom} area={areaJuridica} onChange={setPersonaId} onCustomChange={setPersonaCustom} disabled={geracaoMutation.isPending} compact />
                <RagToggle ativo={ragAtivo} config={ragConfig} onAtivoChange={setRagAtivo} onConfigChange={setRagConfig} disabled={geracaoMutation.isPending} compact />
              </div>
            )}
          </div>

          {/* Opções avançadas — colapsável */}
          <div className="card-numerado overflow-hidden" style={{borderColor: 'oklch(0.28 0.025 240 / 0.6)'}}>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors">
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className="text-[11px] font-semibold text-muted-foreground">Opções avançadas</span>
            </button>
            {showAdvanced && (
              <div className="px-3 pb-3 space-y-2.5 border-t border-border/60 pt-2.5">
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
        <div className="flex-shrink-0 p-3 border-t border-border bg-card">
          {onAnalisar && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button type="button" variant="outline" size="sm" onClick={onAnalisar} disabled={isAnalisando || isOtimizando || geracaoMutation.isPending}>
                {isAnalisando ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Analisando...</>) : (<><Sparkles className="mr-2 w-4 h-4" />Analisar</>)}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onOtimizar?.()} disabled={isAnalisando || isOtimizando || geracaoMutation.isPending}>
                {isOtimizando ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Otimizando...</>) : (<><ShieldCheck className="mr-2 w-4 h-4" />Otimizar</>)}
              </Button>
            </div>
          )}
          <Button
            onClick={handleGerar}
            disabled={geracaoMutation.isPending || isSugerindo}
            className="w-full btn-gerar-principal"
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
          {onLimpar && (
            <button type="button" onClick={onLimpar} className="w-full mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors">Limpar tudo</button>
          )}
        </div>
      </div>

      {/* ── PAINEL DIREITO: RESULTADO ────────────────────────────────────────────── */}
      <div ref={resultRef} className="flex-1 min-w-0 flex flex-col bg-background overflow-hidden painel-resultado">

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
          {revisaoSlot}
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

              {/* Toggle de modo de visualização */}
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant={viewMode === "a4" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setViewMode("a4")}
                >
                  <FileText className="w-3 h-3" />Visualização A4
                </Button>
                <Button
                  variant={viewMode === "secoes" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setViewMode("secoes")}
                >
                  <ListChecks className="w-3 h-3" />Seções do Prompt
                </Button>
              </div>

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

              {/* Conteúdo do Prompt — modo A4 ou Seções */}
              {viewMode === "a4" ? (
                /* Preview A4 — folha branca com tipografia jurídica */
                <PreviewA4
                  content={promptText}
                  tipoDocumento={TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label}
                  areaJuridica={geracaoMutation.data?.area || areaJuridica}
                  isEditing={isEditing}
                  editedContent={editedPrompt}
                  onEditChange={setEditedPrompt}
                />
              ) : (
                /* Modo Seções — exibe cada seção do prompt separadamente */
                isEditing ? (
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
                )
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
