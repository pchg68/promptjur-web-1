import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HighlightedTextarea } from "@/components/HighlightedTextarea";
import { WizardPromptGenerator, type WizardData } from "@/components/WizardPromptGenerator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Scale, Sparkles, Zap, Shield, Loader2, Copy, CheckCircle2, History, BookTemplate, Home, FileDown, FileText, TrendingUp, Minimize2, Maximize2, Eye, ChevronDown, Bot, MessageSquare, Search, Cpu, PlayCircle, ChevronRight, Database, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AREAS_JURIDICAS } from "@/const";
import { toast } from "sonner";
import { Streamdown } from 'streamdown';
import TabDocumentos from '@/components/TabDocumentos';
import { exportAsTextABNT } from "@/utils/exportABNT";
import { exportAsDOCXABNT } from "@/utils/exportDOCX";
import { Link, useLocation } from "wouter";
import { UsageChart } from "@/components/UsageChart";
import { DistributionChart } from "@/components/DistributionChart";
import { FavoritosSection } from "@/components/FavoritosSection";
import TagsManager from "@/components/TagsManager";
import { PromptComparison } from "@/components/PromptComparison";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ValidacaoLegislacao } from "@/components/ValidacaoLegislacao";
import { PreviewDocumentoModal } from "@/components/PreviewDocumentoModal";
import { NotificationBell } from "@/components/NotificationBell";
import { CacheStatistics } from "@/components/CacheStatistics";
import { GerenciadorPerfis } from "@/components/GerenciadorPerfis";
import { SugestaoArea } from "@/components/SugestaoArea";
import { DisclaimerLegal } from "@/components/DisclaimerLegal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bookmark, Trash2 } from "lucide-react";
import { ModelSelector, parseModelValue } from "@/components/ModelSelector";

// Novos componentes modulares
import DashboardHeader2 from "@/components/DashboardHeader2";
import TabGerar from "@/components/TabGerar";
import AIDisclaimer from "@/components/AIDisclaimer";
import GenerationStepper from "@/components/GenerationStepper";
import PromptActions from "@/components/PromptActions";
import PostGenerationGuide from "@/components/PostGenerationGuide";
import { ProviderStatus } from "@/components/ProviderStatus";

export default function Dashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("analisar");
  const [modoWizard, setModoWizard] = useState(false);
  
  // Estado para Modo Compacto (persistido no localStorage)
  const [isCompactMode, setIsCompactMode] = useState(() => {
    const saved = localStorage.getItem('promptjur-compact-mode');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Estado para modelo de IA selecionado (persistido no localStorage)
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('promptjur-selected-model');
    return saved || 'manus:manus-default';
  });
  
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    localStorage.setItem('promptjur-selected-model', value);
    const [provider, model] = value.split(':');
    toast.success(`Modelo alterado para ${model === 'manus-default' ? 'Manus AI' : model}`);
  };
  
  const toggleCompactMode = () => {
    const newMode = !isCompactMode;
    setIsCompactMode(newMode);
    localStorage.setItem('promptjur-compact-mode', JSON.stringify(newMode));
    toast.success(newMode ? 'Modo Compacto ativado' : 'Modo Completo ativado');
  };
  
  // Estados para controlar visibilidade das seções laterais (persistidos)
  const [mostrarFavoritos, setMostrarFavoritos] = useState(() => {
    const saved = localStorage.getItem('promptjur-mostrar-favoritos');
    return saved ? JSON.parse(saved) : false;
  });
  const [mostrarTags, setMostrarTags] = useState(() => {
    const saved = localStorage.getItem('promptjur-mostrar-tags');
    return saved ? JSON.parse(saved) : false;
  });
  const [mostrarAnalytics, setMostrarAnalytics] = useState(() => {
    const saved = localStorage.getItem('promptjur-mostrar-analytics');
    return saved ? JSON.parse(saved) : false;
  });
  const [mostrarCacheLegislacao, setMostrarCacheLegislacao] = useState(() => {
    const saved = localStorage.getItem('promptjur-mostrar-cache-legislacao');
    return saved ? JSON.parse(saved) : false;
  });
  
  const toggleFavoritos = () => { const v = !mostrarFavoritos; setMostrarFavoritos(v); localStorage.setItem('promptjur-mostrar-favoritos', JSON.stringify(v)); };
  const toggleTags = () => { const v = !mostrarTags; setMostrarTags(v); localStorage.setItem('promptjur-mostrar-tags', JSON.stringify(v)); };
  const toggleAnalytics = () => { const v = !mostrarAnalytics; setMostrarAnalytics(v); localStorage.setItem('promptjur-mostrar-analytics', JSON.stringify(v)); };
  const toggleCacheLegislacao = () => { const v = !mostrarCacheLegislacao; setMostrarCacheLegislacao(v); localStorage.setItem('promptjur-mostrar-cache-legislacao', JSON.stringify(v)); };
  
  // Queries
  const statsQuery = trpc.prompts.stats.useQuery();
  const analyticsQuery = trpc.analytics.get.useQuery();
  const usageByDateQuery = trpc.analytics.usageByDate.useQuery({ days: 7 });
  
  // Detectar template/prompt da URL
  const urlParams = new URLSearchParams(window.location.search);
  const templateIdFromUrl = urlParams.get('template');
  const promptIdFromUrl = urlParams.get('prompt');
  
  const templateQuery = trpc.templates.meus.useQuery(undefined, { enabled: !!templateIdFromUrl });
  const promptQuery = trpc.prompts.loadPrompt.useQuery({ id: parseInt(promptIdFromUrl!) }, { enabled: !!promptIdFromUrl });
  
  // Estado para Análise
  const [promptAnalise, setPromptAnalise] = useState("");
  const analiseMutation = trpc.prompts.analisar.useMutation({
    onSuccess: () => toast.success("Análise concluída com sucesso!"),
    onError: (error) => toast.error(`Erro na análise: ${error.message}`)
  });

  // Estado para Geração (mantido para compatibilidade com Wizard e usarModelo)
  const [tipoDocumento, setTipoDocumento] = useState<"peticao" | "parecer" | "contrato" | "recurso" | "defesa" | "memorando" | "outro">("peticao");
  const [contextoJuridico, setContextoJuridico] = useState("");
  const [objetivoEspecifico, setObjetivoEspecifico] = useState("");
  const [areaGeracao, setAreaGeracao] = useState<"Civil" | "Penal" | "Trabalhista" | "Tributário" | "Administrativo" | "Constitucional" | "Empresarial" | "Consumidor" | "Família" | "Previdenciário" | "Ambiental" | "Internacional" | "Processo Civil" | "Direito Médico" | "Direito Digital" | "Direito Internacional">("Civil");
  const [partesEnvolvidas, setPartesEnvolvidas] = useState("");
  const [legislacaoRelevante, setLegislacaoRelevante] = useState("");
  const [detalhesAdicionais, setDetalhesAdicionais] = useState("");
  const [mostrarDadosAnaliticos, setMostrarDadosAnaliticos] = useState(false);
  const resultadoGeracaoRef = useRef<HTMLDivElement>(null);
  
  // Validação em tempo real
  const [validationErrors, setValidationErrors] = useState<{ contextoJuridico?: string; objetivoEspecifico?: string }>({});
  const [touchedFields, setTouchedFields] = useState<{ contextoJuridico?: boolean; objetivoEspecifico?: boolean }>({});
  
  const geracaoMutation = trpc.prompts.gerar.useMutation({
    onSuccess: (data) => {
      toast.success("Prompt profissional gerado com sucesso!");
      if (data.areaDetectadaAutomaticamente) toast.info(`Área jurídica detectada automaticamente: ${data.area}`);
      setTimeout(() => { resultadoGeracaoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    },
    onError: (error) => toast.error(`Erro na geração: ${error.message}`)
  });

  const validateField = (field: 'contextoJuridico' | 'objetivoEspecifico', value: string) => {
    const errors = { ...validationErrors };
    if (field === 'contextoJuridico') {
      if (!value.trim()) errors.contextoJuridico = 'O contexto jurídico é obrigatório';
      else if (value.trim().length < 20) errors.contextoJuridico = 'O contexto deve ter pelo menos 20 caracteres';
      else delete errors.contextoJuridico;
    }
    if (field === 'objetivoEspecifico') {
      if (!value.trim()) errors.objetivoEspecifico = 'O objetivo específico é obrigatório';
      else if (value.trim().length < 10) errors.objetivoEspecifico = 'O objetivo deve ter pelo menos 10 caracteres';
      else delete errors.objetivoEspecifico;
    }
    setValidationErrors(errors);
  };

  const handleFieldBlur = (field: 'contextoJuridico' | 'objetivoEspecifico') => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const value = field === 'contextoJuridico' ? contextoJuridico : objetivoEspecifico;
    validateField(field, value);
  };

  useEffect(() => { if (touchedFields.contextoJuridico) validateField('contextoJuridico', contextoJuridico); }, [contextoJuridico]);
  useEffect(() => { if (touchedFields.objetivoEspecifico) validateField('objetivoEspecifico', objetivoEspecifico); }, [objetivoEspecifico]);

  // Exportar como DOCX
  const gerarDocMutation = trpc.prompts.exportarDocx.useMutation({
    onSuccess: (data) => {
      const byteCharacters = atob(data.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = data.filename; document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success("Documento Word gerado com sucesso!");
    },
    onError: (error) => toast.error(`Erro ao gerar documento: ${error.message}`)
  });

  // Estado para Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ titulo: string; conteudo: string; areaJuridica?: string; tipoDocumento?: string; promptId?: number } | null>(null);

  // Estado para preencher TabDocumentos ao navegar da aba Análise
  const [documentosInitialContexto, setDocumentosInitialContexto] = useState<string>("");
  const [documentosInitialArea, setDocumentosInitialArea] = useState<string>("");

  // Modelos
  const [filtroTipoModelo, setFiltroTipoModelo] = useState<string | undefined>(undefined);
  const [filtroAreaModelo, setFiltroAreaModelo] = useState<string | undefined>(undefined);
  const [buscaModelo, setBuscaModelo] = useState("");
  const [modeloPreview, setModeloPreview] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const modelosQuery = trpc.modelos.listar.useQuery({ tipo: filtroTipoModelo || undefined as any, area: filtroAreaModelo || undefined, busca: buscaModelo || undefined });
  const modelosMaisUsadosQuery = trpc.modelos.maisUsados.useQuery({ limit: 5 });

  // Otimização
  const [promptOtimizacao, setPromptOtimizacao] = useState("");
  const otimizacaoMutation = trpc.prompts.otimizar.useMutation({
    onSuccess: () => toast.success("Otimização concluída com sucesso!"),
    onError: (error) => toast.error(`Erro na otimização: ${error.message}`)
  });

  // Salvar Template
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateNome, setTemplateNome] = useState("");
  const [templateDescricao, setTemplateDescricao] = useState("");
  const [templateConteudo, setTemplateConteudo] = useState("");
  const [templateArea, setTemplateArea] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const tagsQuery = trpc.tags.minhas.useQuery();
  const atribuirTagMutation = trpc.tags.atribuirTemplate.useMutation();
  const salvarTemplateMutation = trpc.templates.salvar.useMutation({
    onSuccess: async (data) => {
      if (selectedTags.length > 0 && data.templateId) {
        for (const tagId of selectedTags) {
          try { await atribuirTagMutation.mutateAsync({ templateId: data.templateId, tagId }); } catch (e) { console.error("Erro ao atribuir tag:", e); }
        }
      }
      toast.success("Template salvo com sucesso!");
      setShowSaveTemplate(false); setTemplateNome(""); setSelectedTags([]); setTemplateDescricao(""); setTemplateConteudo(""); setTemplateArea("");
    },
    onError: (error) => toast.error(`Erro ao salvar template: ${error.message}`)
  });

  // Carregar template/prompt da URL
  useEffect(() => {
    if (templateIdFromUrl && templateQuery.data) {
      const template = templateQuery.data.find(t => t.id === parseInt(templateIdFromUrl));
      if (template) { setPromptAnalise(template.template); toast.success(`Template "${template.nome}" carregado!`); window.history.replaceState({}, '', '/dashboard'); }
    }
  }, [templateIdFromUrl, templateQuery.data]);

  useEffect(() => {
    if (promptIdFromUrl && promptQuery.data) {
      const prompt = promptQuery.data;
      setPromptOtimizacao(prompt.promptOriginal || prompt.promptOtimizado || "");
      setActiveTab("otimizar");
      toast.success(`Prompt #${prompt.id} carregado para reutilização!`);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [promptIdFromUrl, promptQuery.data]);

  // Handlers
  const handleAnalisar = async () => {
    if (!promptAnalise.trim()) { toast.error("Por favor, insira um prompt para analisar"); return; }
    const { provider, model } = parseModelValue(selectedModel);
    analiseMutation.mutate({ prompt: promptAnalise, provider, model });
  };

  const handleGerar = async (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    if (!contextoJuridico.trim() || !objetivoEspecifico.trim()) { toast.error("Por favor, preencha os campos obrigatórios (Contexto e Objetivo)"); return; }
    const { provider, model } = parseModelValue(selectedModel);
    geracaoMutation.mutate({ tipoDocumento, contextoJuridico, objetivoEspecifico, area: areaGeracao, partesEnvolvidas: partesEnvolvidas || undefined, legislacaoRelevante: legislacaoRelevante || undefined, detalhesAdicionais: detalhesAdicionais || undefined, provider, model });
  };

  const handleOtimizar = async (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    if (!promptOtimizacao.trim()) { toast.error("Por favor, insira um prompt para otimizar"); return; }
    const { provider, model } = parseModelValue(selectedModel);
    otimizacaoMutation.mutate({ prompt: promptOtimizacao, provider, model });
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado para a área de transferência!"); };

  const testarPromptNaPlataforma = (prompt: string, plataforma: 'chatgpt' | 'perplexity' | 'manus') => {
    navigator.clipboard.writeText(prompt);
    const urls = { chatgpt: 'https://chatgpt.com/', perplexity: 'https://www.perplexity.ai/', manus: 'https://manus.im/' };
    const nomes = { chatgpt: 'ChatGPT', perplexity: 'Perplexity', manus: 'Manus' };
    window.open(urls[plataforma], '_blank');
    toast.success(<div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /><span className="font-semibold">Prompt copiado!</span></div>, { description: `${nomes[plataforma]} aberto. Cole com Ctrl+V.`, duration: 4000 });
  };

  const exportAsMarkdown = (title: string, content: any) => {
    let md = `# ${title}\n\n**Data:** ${new Date().toLocaleString('pt-BR')}\n\n`;
    md += typeof content === 'string' ? content : '```json\n' + JSON.stringify(content, null, 2) + '\n```';
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.md`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success("Exportado como Markdown!");
  };

  const exportAsPDF = (title: string, content: any) => {
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>@page{margin:3cm 2cm 2cm 3cm;size:A4}body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.5;text-align:justify;color:#000}h1{font-size:14pt;font-weight:bold;text-align:center;margin-bottom:1.5cm}p{text-indent:2cm;margin-bottom:0.5cm}.content{margin-top:1cm}</style></head><body><h1>${title}</h1><div class="content">`;
    html += typeof content === 'string' ? `<p>${content.replace(/\n/g, '<br>')}</p>` : `<pre style="font-family:Arial;font-size:12pt;line-height:1.0;white-space:pre-wrap">${JSON.stringify(content, null, 2)}</pre>`;
    html += `</div></body></html>`;
    const pw = window.open('', '_blank');
    if (pw) { pw.document.write(html); pw.document.close(); pw.onload = () => pw.print(); toast.success("Abrindo impressão ABNT..."); }
  };

  // Usar modelo
  const registrarUsoMutation = trpc.modelos.registrarUso.useMutation();
  const usarModelo = (modelo: any) => {
    registrarUsoMutation.mutate({ modeloId: modelo.id });
    setTipoDocumento(modelo.tipoDocumento); setContextoJuridico(modelo.contextoJuridico); setObjetivoEspecifico(modelo.objetivoEspecifico);
    setAreaGeracao((modelo.areaJuridica || "Civil") as typeof areaGeracao);
    setPartesEnvolvidas(modelo.partesEnvolvidas || ""); setLegislacaoRelevante(modelo.legislacaoRelevante || ""); setDetalhesAdicionais(modelo.detalhesAdicionais || "");
    setActiveTab("gerar"); toast.success(`Modelo "${modelo.nome}" carregado!`);
  };

  const gerarDocumentoFinal = () => {
    if (!geracaoMutation.data?.promptProfissional) { toast.error("Nenhum prompt gerado para exportar"); return; }
    gerarDocMutation.mutate({ promptId: geracaoMutation.data.promptId, titulo: `Prompt Jurídico - ${tipoDocumento.charAt(0).toUpperCase() + tipoDocumento.slice(1)}`, conteudo: geracaoMutation.data.promptProfissional, incluirCabecalho: true, incluirDataHora: true });
  };

  const openSaveTemplateDialog = (conteudo: string, area: string) => { setTemplateConteudo(conteudo); setTemplateArea(area); setShowSaveTemplate(true); };
  const handleSaveTemplate = () => {
    if (!templateNome.trim()) { toast.error("Insira um nome para o template"); return; }
    if (!templateConteudo.trim()) { toast.error("Conteúdo inválido"); return; }
    salvarTemplateMutation.mutate({ nome: templateNome, descricao: templateDescricao, template: templateConteudo, areaJuridica: templateArea || "Geral" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Navegação Persistente */}
      <DashboardHeader2
        isCompactMode={isCompactMode}
        toggleCompactMode={toggleCompactMode}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Toggle Modo Wizard */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Ferramentas de Engenharia de Prompts</h2>
            <p className="text-sm text-muted-foreground">Escolha entre modo avançado ou assistente guiado</p>
          </div>
          <Button variant={modoWizard ? "default" : "outline"} onClick={() => setModoWizard(!modoWizard)} className="flex items-center gap-2">
            {modoWizard ? (<><Maximize2 className="w-4 h-4" />Modo Avançado</>) : (<><Sparkles className="w-4 h-4" />Modo Assistido</>)}
          </Button>
        </div>

        {modoWizard ? (
          <WizardPromptGenerator
            onComplete={(data: WizardData) => {
              if (data.objetivo === 'analisar') { setPromptAnalise(data.descricaoCaso); setActiveTab('analisar'); setModoWizard(false); setTimeout(handleAnalisar, 100); }
              else if (data.objetivo === 'gerar') { setAreaGeracao((data.areaJuridica === 'auto' ? 'Civil' : data.areaJuridica) as typeof areaGeracao); setContextoJuridico(data.descricaoCaso); setActiveTab('gerar'); setModoWizard(false); setTimeout(handleGerar, 100); }
              else if (data.objetivo === 'otimizar') { setPromptOtimizacao(data.descricaoCaso); setActiveTab('otimizar'); setModoWizard(false); setTimeout(handleOtimizar, 100); }
            }}
            onCancel={() => setModoWizard(false)}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-4">
              <ProviderStatus />
            </div>
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="analisar" className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Analisar</TabsTrigger>
              <TabsTrigger value="otimizar" className="flex items-center gap-2"><Shield className="w-4 h-4" />Otimizar</TabsTrigger>
              <TabsTrigger value="gerar" className="flex items-center gap-2"><Zap className="w-4 h-4" />Gerar Prompt</TabsTrigger>
              <TabsTrigger value="documentos" className="flex items-center gap-2"><FileText className="w-4 h-4" />Documentos</TabsTrigger>
              <TabsTrigger value="modelos" className="flex items-center gap-2"><FileText className="w-4 h-4" />Modelos</TabsTrigger>
            </TabsList>

            {/* ═══════════════ Tab: Analisar ═══════════════ */}
            <TabsContent value="analisar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Análise de Prompt Jurídico</CardTitle>
                  <CardDescription>Cole seu prompt abaixo para análise automática de área jurídica, palavras-chave e qualidade</CardDescription>
                  <AIDisclaimer className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <ModelSelector value={selectedModel} onChange={handleModelChange} disabled={analiseMutation.isPending} />
                  <div className="space-y-2">
                    <Label htmlFor="prompt-analise">Prompt para Análise</Label>
                    <HighlightedTextarea value={promptAnalise} onChange={setPromptAnalise} placeholder="Cole aqui o prompt que deseja analisar..." showValidation={true} minHeight="200px" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <Button onClick={handleAnalisar} disabled={analiseMutation.isPending}>
                      {analiseMutation.isPending ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Analisando...</>) : (<><Sparkles className="mr-2 w-4 h-4" />Analisar Prompt</>)}
                    </Button>
                    <Button onClick={() => {
                      if (promptAnalise || analiseMutation.data) { if (!confirm('Limpar todos os campos de todas as abas?')) return; }
                      setPromptAnalise(''); analiseMutation.reset(); setContextoJuridico(''); setObjetivoEspecifico(''); setPartesEnvolvidas(''); setLegislacaoRelevante(''); setDetalhesAdicionais(''); setTipoDocumento('peticao'); setAreaGeracao('Civil'); geracaoMutation.reset(); setPromptOtimizacao(''); otimizacaoMutation.reset();
                      toast.success('Todos os campos foram limpos!');
                    }} variant="outline" disabled={analiseMutation.isPending}>
                      <Trash2 className="mr-2 w-4 h-4" />Limpar Tudo
                    </Button>
                  </div>

                  <GenerationStepper isGenerating={analiseMutation.isPending} type="analise" />

                  {analiseMutation.data && (
                    <div className="mt-6 space-y-4 p-6 bg-card border border-border rounded-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between">
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
                              d?.pontuacaoQualidade !== undefined ? `**Nota:** ${d.pontuacaoQualidade}/10\n` : "",
                              d?.palavrasChave?.length ? `**Palavras-Chave:** ${d.palavrasChave.join(", ")}\n` : "",
                              d?.sugestoes?.length ? `**Sugestões de Melhoria:**\n${d.sugestoes.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n` : "",
                              `---\n\n**Prompt Original:**\n\n${promptAnalise}`,
                            ].filter(Boolean).join("\n");
                            setPreviewData({ titulo: "Análise de Prompt Jurídico", conteudo: conteudoFormatado });
                            setPreviewOpen(true);
                          }}
                          onSaveTemplate={() => openSaveTemplateDialog(promptAnalise, analiseMutation.data?.area || "Geral")}
                        />
                      </div>
                      
                      {/* Área Detectada */}
                      {analiseMutation.data.area && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Área Jurídica:</span>
                          <Badge variant="secondary">{analiseMutation.data.area}</Badge>
                        </div>
                      )}

                      {/* Palavras-chave */}
                      {analiseMutation.data.palavrasChave && analiseMutation.data.palavrasChave.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Palavras-chave identificadas:</p>
                          <div className="flex flex-wrap gap-2">
                            {analiseMutation.data.palavrasChave.map((kw: string, i: number) => (
                              <Badge key={i} variant="outline">{kw}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Qualidade */}
                      {analiseMutation.data.qualidade && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Qualidade:</span>
                          <Badge variant={analiseMutation.data.qualidade === 'excelente' ? 'default' : analiseMutation.data.qualidade === 'bom' ? 'secondary' : 'destructive'}>
                            {analiseMutation.data.qualidade}
                          </Badge>
                        </div>
                      )}

                      {/* Sugestões */}
                      {analiseMutation.data.sugestoes && analiseMutation.data.sugestoes.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Sugestões de Melhoria:</p>
                          <ul className="space-y-2">
                            {analiseMutation.data.sugestoes.map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Nota de Qualidade */}
                      {analiseMutation.data.pontuacaoQualidade !== undefined && (
                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-sm">
                          <span className="text-sm font-medium">Nota de Qualidade:</span>
                          <span className="text-2xl font-bold text-primary">{analiseMutation.data.pontuacaoQualidade}/10</span>
                        </div>
                      )}

                      {/* Citações Legais */}
                      {analiseMutation.data.citacoesLegais && (
                        <div className="p-3 bg-muted/20 rounded-sm">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Citações Legais Identificadas</p>
                          <div className="flex flex-wrap gap-2">
                            {analiseMutation.data.citacoesLegais.lista?.map((c: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <PostGenerationGuide className="mt-4" />

                      {/* Botões de navegação */}
                      <div className="pt-4 border-t border-border space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Button
                            onClick={() => {
                              setPromptOtimizacao(promptAnalise);
                              setActiveTab("otimizar");
                              toast.info("Prompt carregado na aba Otimizar!");
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            size="lg"
                            variant="default"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Otimizar Este Prompt
                          </Button>
                          <Button
                            onClick={() => {
                              setDocumentosInitialContexto(promptAnalise);
                              setDocumentosInitialArea(analiseMutation.data?.area || "Civil");
                              setActiveTab("documentos");
                              toast.info("Prompt carregado na aba Documentos!");
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            size="lg"
                            variant="outline"
                            className="bg-primary/10 hover:bg-primary/20 border-primary/30"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Gerar Documento
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {analiseMutation.error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                      Erro: {analiseMutation.error.message}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════ Tab: Gerar (Artifact View) ═══════════════ */}
            <TabsContent value="gerar" className="space-y-6">
              <TabGerar
                selectedModel={selectedModel}
                handleModelChange={handleModelChange}
                onPreview={(data) => { setPreviewData(data); setPreviewOpen(true); }}
                onSaveTemplate={openSaveTemplateDialog}
                onGerarDocumento={(promptId, conteudo, tipo) => {
                  gerarDocMutation.mutate({ promptId, titulo: `Prompt Jurídico - ${tipo}`, conteudo, incluirCabecalho: true, incluirDataHora: true });
                }}
                isGerandoDoc={gerarDocMutation.isPending}
                initialArea={areaGeracao}
                initialContexto={contextoJuridico}
                onNavigateToDocumentos={() => {
                  setActiveTab("documentos");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  toast.info("Navegando para a aba Documentos");
                }}
                onNavigateToAnalise={() => {
                  setActiveTab("analisar");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  toast.info("Navegando para a aba Análise");
                }}
              />
            </TabsContent>

            {/* ═══════════════ Tab: Otimizar ═══════════════ */}
            <TabsContent value="otimizar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Otimização de Prompt Jurídico</CardTitle>
                  <CardDescription>Cole um prompt existente para receber sugestões de melhoria e uma versão otimizada</CardDescription>
                  <AIDisclaimer className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <ModelSelector value={selectedModel} onChange={handleModelChange} disabled={otimizacaoMutation.isPending} />
                  <div className="space-y-2">
                    <Label>Prompt para Otimizar</Label>
                    <HighlightedTextarea value={promptOtimizacao} onChange={setPromptOtimizacao} placeholder="Cole aqui o prompt que deseja otimizar..." showValidation={true} minHeight="200px" />
                  </div>
                  <Button type="button" onClick={handleOtimizar} disabled={otimizacaoMutation.isPending} className="w-full">
                    {otimizacaoMutation.isPending ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Otimizando...</>) : (<><Shield className="mr-2 w-4 h-4" />Otimizar Prompt</>)}
                  </Button>

                  <GenerationStepper isGenerating={otimizacaoMutation.isPending} type="otimizacao" />

                  {otimizacaoMutation.data && (
                    <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <PromptComparison promptOriginal={otimizacaoMutation.data.promptOriginal} promptOtimizado={otimizacaoMutation.data.promptOtimizado} melhorias={otimizacaoMutation.data.melhorias} />
                      {otimizacaoMutation.data.validacaoLegislacao && <ValidacaoLegislacao validacao={otimizacaoMutation.data.validacaoLegislacao} />}
                      
                      <PromptActions
                        promptText={otimizacaoMutation.data.promptOtimizado}
                        titulo="Prompt Otimizado"
                        onPreview={() => {
                          setPreviewData({ titulo: "Prompt Otimizado", conteudo: otimizacaoMutation.data?.promptOtimizado || "", areaJuridica: otimizacaoMutation.data?.area, tipoDocumento: "Otimização", promptId: otimizacaoMutation.data?.promptId });
                          setPreviewOpen(true);
                        }}
                        onSaveTemplate={() => openSaveTemplateDialog(otimizacaoMutation.data?.promptOtimizado || "", otimizacaoMutation.data?.area || "Geral")}
                      />

                      <PostGenerationGuide className="mt-4" />

                      <div className="pt-4 border-t border-border space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Button
                            onClick={() => {
                              setPromptAnalise(otimizacaoMutation.data?.promptOtimizado || "");
                              setActiveTab('analisar');
                              toast.info('Versão otimizada carregada na aba Análise!');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            variant="outline"
                            size="lg"
                            className="bg-primary/10 hover:bg-primary/20 border-primary/30"
                          >
                            <Search className="w-4 h-4 mr-2" />Analisar Versão Otimizada
                          </Button>
                          <Button
                            onClick={() => {
                              setDocumentosInitialContexto(otimizacaoMutation.data?.promptOtimizado || "");
                              setDocumentosInitialArea(otimizacaoMutation.data?.area || "Civil");
                              setActiveTab('documentos');
                              toast.info('Prompt otimizado carregado na aba Documentos!');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            variant="outline"
                            size="lg"
                          >
                            <FileText className="w-4 h-4 mr-2" />Gerar Documento
                          </Button>
                        </div>
                        <Button onClick={() => {
                          if (otimizacaoMutation.data?.area) setAreaGeracao(otimizacaoMutation.data.area as typeof areaGeracao);
                          setContextoJuridico(`Prompt otimizado: ${otimizacaoMutation.data?.promptOtimizado?.substring(0, 150)}...`);
                          setObjetivoEspecifico('Gerar nova versão baseada no prompt otimizado');
                          setActiveTab('gerar'); toast.success('Pronto para gerar nova versão!');
                        }} className="w-full" size="lg">
                          <Zap className="w-4 h-4 mr-2" />Gerar Prompt Profissional
                        </Button>
                      </div>
                    </div>
                  )}

                  {otimizacaoMutation.error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">Erro: {otimizacaoMutation.error.message}</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════ Tab: Documentos ═══════════════ */}
            <TabsContent value="documentos" className="space-y-6">
              <TabDocumentos initialContexto={documentosInitialContexto} initialArea={documentosInitialArea} />
            </TabsContent>

            {/* ═══════════════ Tab: Modelos ═══════════════ */}
            <TabsContent value="modelos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Biblioteca de Modelos Profissionais</CardTitle>
                  <CardDescription>Escolha um modelo pré-pronto e personalize para gerar seu prompt profissional</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Buscar</Label>
                      <Input placeholder="Nome ou descrição..." value={buscaModelo} onChange={(e) => setBuscaModelo(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Documento</Label>
                      <Select value={filtroTipoModelo} onValueChange={setFiltroTipoModelo}>
                        <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="peticao">Petição</SelectItem>
                          <SelectItem value="parecer">Parecer</SelectItem>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="recurso">Recurso</SelectItem>
                          <SelectItem value="defesa">Defesa</SelectItem>
                          <SelectItem value="memorando">Memorando</SelectItem>
                          <SelectItem value="agravo">Agravo</SelectItem>
                          <SelectItem value="apelacao">Apelação</SelectItem>
                          <SelectItem value="contestacao">Contestação</SelectItem>
                          <SelectItem value="embargos">Embargos</SelectItem>
                          <SelectItem value="mandado_seguranca">Mandado de Segurança</SelectItem>
                          <SelectItem value="habeas_corpus">Habeas Corpus</SelectItem>
                          <SelectItem value="notificacao">Notificação Extrajudicial</SelectItem>
                          <SelectItem value="procuracao">Procuração</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Área Jurídica</Label>
                      <Select value={filtroAreaModelo} onValueChange={setFiltroAreaModelo}>
                        <SelectTrigger><SelectValue placeholder="Todas as áreas" /></SelectTrigger>
                        <SelectContent>{AREAS_JURIDICAS.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Modelos Mais Usados */}
                  {modelosMaisUsadosQuery.data && modelosMaisUsadosQuery.data.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Seus Modelos Favoritos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {modelosMaisUsadosQuery.data.map((modelo: any) => (
                          <Card key={modelo.id} className="hover:border-primary/50 transition-colors border-primary/30">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">{modelo.nome}</CardTitle>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">{modelo.vezesUsado}x</Badge>
                                  {modelo.isPremium && <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">Premium</Badge>}
                                </div>
                              </div>
                              <CardDescription className="text-sm">{modelo.descricao}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">{modelo.tipoDocumento}</Badge>
                                <Badge variant="outline" className="text-xs">{modelo.areaJuridica}</Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setModeloPreview(modelo); setShowPreviewModal(true); }}>
                                  <Eye className="w-4 h-4 mr-2" />Visualizar
                                </Button>
                                <Button size="sm" className="flex-1" onClick={() => usarModelo(modelo)}>
                                  <Zap className="w-4 h-4 mr-2" />Usar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {modelosQuery.isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
                  {modelosQuery.data && modelosQuery.data.length === 0 && (
                    <div className="text-center py-12"><FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Nenhum modelo encontrado</p></div>
                  )}
                  {modelosQuery.data && modelosQuery.data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {modelosQuery.data.map((modelo) => (
                        <Card key={modelo.id} className="hover:border-primary/50 transition-colors">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{modelo.nome}</CardTitle>
                              {modelo.isPremium && <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">Premium</Badge>}
                            </div>
                            <CardDescription className="text-sm">{modelo.descricao}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">{modelo.tipoDocumento}</Badge>
                              <Badge variant="outline" className="text-xs">{modelo.areaJuridica}</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setModeloPreview(modelo); setShowPreviewModal(true); }}>
                                <Eye className="w-4 h-4 mr-2" />Visualizar
                              </Button>
                              <Button size="sm" className="flex-1" onClick={() => usarModelo(modelo)}>
                                <Zap className="w-4 h-4 mr-2" />Usar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Modal de Preview de Modelo */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{modeloPreview?.nome}</DialogTitle>
              <DialogDescription>{modeloPreview?.descricao}</DialogDescription>
            </DialogHeader>
            {modeloPreview && (
              <div className="space-y-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{modeloPreview.tipoDocumento}</Badge>
                  <Badge variant="outline">{modeloPreview.areaJuridica}</Badge>
                  {modeloPreview.isPremium && <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">Premium</Badge>}
                </div>
                <div><h4 className="font-semibold text-sm mb-2">Contexto Jurídico</h4><p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{modeloPreview.contextoJuridico}</p></div>
                <div><h4 className="font-semibold text-sm mb-2">Objetivo Específico</h4><p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{modeloPreview.objetivoEspecifico}</p></div>
                {modeloPreview.legislacaoRelevante && <div><h4 className="font-semibold text-sm mb-2">Legislação Relevante</h4><p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{modeloPreview.legislacaoRelevante}</p></div>}
                {modeloPreview.partesEnvolvidas && <div><h4 className="font-semibold text-sm mb-2">Partes Envolvidas</h4><p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{modeloPreview.partesEnvolvidas}</p></div>}
                {modeloPreview.detalhesAdicionais && <div><h4 className="font-semibold text-sm mb-2">Detalhes Adicionais</h4><p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{modeloPreview.detalhesAdicionais}</p></div>}
                {modeloPreview.tags?.length > 0 && <div><h4 className="font-semibold text-sm mb-2">Tags</h4><div className="flex flex-wrap gap-2">{modeloPreview.tags.map((tag: string, idx: number) => <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>)}</div></div>}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Fechar</Button>
              <Button onClick={() => { if (modeloPreview) { usarModelo(modeloPreview); setShowPreviewModal(false); } }}><Zap className="w-4 h-4 mr-2" />Usar Este Modelo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════════════ Seções Secundárias (Colapsáveis) ═══════════════ */}
        {!isCompactMode && (
          <>
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-8">
              {[
                { label: "Análises", value: statsQuery.data?.totalAnalises || 0, icon: Sparkles },
                { label: "Gerações", value: statsQuery.data?.totalGeracoes || 0, icon: Zap },
                { label: "Otimizações", value: statsQuery.data?.totalOtimizacoes || 0, icon: Shield },
                { label: "Templates", value: statsQuery.data?.totalTemplates || 0, icon: BookTemplate },
              ].map((m) => (
                <Card key={m.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
                        <p className="text-2xl font-bold text-foreground">{m.value}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
                        <m.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Favoritos */}
            <div className="mb-8">
              <Button variant="outline" size="sm" onClick={toggleFavoritos} className="mb-4 w-full justify-between">
                <span className="flex items-center gap-2"><Bookmark className="w-4 h-4" />Prompts Favoritos</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${mostrarFavoritos ? 'rotate-90' : ''}`} />
              </Button>
              {mostrarFavoritos && <FavoritosSection />}
            </div>

            {/* Tags */}
            <div className="mb-8">
              <Button variant="outline" size="sm" onClick={toggleTags} className="mb-4 w-full justify-between">
                <span className="flex items-center gap-2"><Search className="w-4 h-4" />Gerenciar Tags</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${mostrarTags ? 'rotate-90' : ''}`} />
              </Button>
              {mostrarTags && <TagsManager />}
            </div>

            {/* Analytics */}
            {analyticsQuery.data && (
              <div className="mb-8">
                <Button variant="outline" size="sm" onClick={toggleAnalytics} className="mb-4 w-full justify-between">
                  <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Analytics de Uso</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${mostrarAnalytics ? 'rotate-90' : ''}`} />
                </Button>
                {mostrarAnalytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />Analytics de Uso</CardTitle>
                      <CardDescription>Estatísticas e métricas de desempenho</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { label: "Tempo Médio - Análise", value: analyticsQuery.data.avgTimes.analise },
                          { label: "Tempo Médio - Geração", value: analyticsQuery.data.avgTimes.geracao },
                          { label: "Tempo Médio - Otimização", value: analyticsQuery.data.avgTimes.otimizacao },
                        ].map((t) => (
                          <div key={t.label} className="p-4 bg-muted/30 rounded-sm">
                            <p className="text-sm font-medium text-muted-foreground mb-2">{t.label}</p>
                            <p className="text-2xl font-bold text-foreground">{t.value > 0 ? `${(t.value / 1000).toFixed(1)}s` : "N/A"}</p>
                          </div>
                        ))}
                      </div>
                      {usageByDateQuery.data && usageByDateQuery.data.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                          <div className="p-4 bg-muted/30 rounded-sm">
                            <h4 className="text-sm font-medium text-muted-foreground mb-4">Evolução de Uso (últimos 7 dias)</h4>
                            <UsageChart data={usageByDateQuery.data} />
                          </div>
                          <div className="p-4 bg-muted/30 rounded-sm">
                            <h4 className="text-sm font-medium text-muted-foreground mb-4">Distribuição por Tipo</h4>
                            <DistributionChart data={{ analises: statsQuery.data?.totalAnalises || 0, geracoes: statsQuery.data?.totalGeracoes || 0, otimizacoes: statsQuery.data?.totalOtimizacoes || 0 }} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Cache de Legislação */}
            <div className="mb-8">
              <Button variant="outline" size="sm" onClick={toggleCacheLegislacao} className="mb-4 w-full justify-between">
                <span className="flex items-center gap-2"><Database className="w-4 h-4" />Estatísticas do Cache de Legislação</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${mostrarCacheLegislacao ? 'rotate-90' : ''}`} />
              </Button>
              {mostrarCacheLegislacao && <CacheStatistics />}
            </div>
          </>
        )}
      </main>

      {/* Dialog para Salvar Template */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Prompt</DialogTitle>
            <DialogDescription>Salve este prompt para reutilização futura</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nome do Template *</Label><Input placeholder="Ex: Análise de Contrato de Locação" value={templateNome} onChange={(e) => setTemplateNome(e.target.value)} className="mt-1" /></div>
            <div><Label>Descrição (opcional)</Label><Textarea placeholder="Descreva quando e como usar este template..." value={templateDescricao} onChange={(e) => setTemplateDescricao(e.target.value)} className="mt-1 min-h-[80px]" /></div>
            <div><Label className="text-muted-foreground">Conteúdo</Label><div className="mt-1 p-3 bg-muted/50 rounded-sm border border-border max-h-[150px] overflow-y-auto"><p className="text-sm font-mono whitespace-pre-wrap">{templateConteudo.substring(0, 200)}{templateConteudo.length > 200 && "..."}</p></div></div>
            <div><Label className="text-muted-foreground">Área Jurídica</Label><Badge variant="secondary" className="mt-1">{templateArea}</Badge></div>
            <div>
              <Label>Tags (opcional)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {tagsQuery.data && tagsQuery.data.length > 0 ? tagsQuery.data.map((tag) => (
                  <Badge key={tag.id} variant={selectedTags.includes(tag.id) ? "default" : "outline"} className="cursor-pointer"
                    style={{ backgroundColor: selectedTags.includes(tag.id) ? (tag.cor || "#3b82f6") : "transparent", borderColor: tag.cor || "#3b82f6", color: selectedTags.includes(tag.id) ? "white" : (tag.cor || "#3b82f6") }}
                    onClick={() => setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                  >{tag.nome}</Badge>
                )) : <p className="text-sm text-muted-foreground">Nenhuma tag criada ainda</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>Cancelar</Button>
            <Button onClick={handleSaveTemplate} disabled={salvarTemplateMutation.isPending}>
              {salvarTemplateMutation.isPending ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Salvando...</>) : (<><BookTemplate className="mr-2 w-4 h-4" />Salvar Prompt</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview */}
      {previewData && (
        <PreviewDocumentoModal open={previewOpen} onOpenChange={setPreviewOpen} titulo={previewData.titulo} conteudo={previewData.conteudo} areaJuridica={previewData.areaJuridica} tipoDocumento={previewData.tipoDocumento} promptId={previewData.promptId} />
      )}
    </div>
  );
}
