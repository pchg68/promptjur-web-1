import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HighlightedTextarea } from "@/components/HighlightedTextarea";
import { WizardPromptGenerator, type WizardData } from "@/components/WizardPromptGenerator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Scale, Sparkles, Zap, Shield, Loader2, Copy, CheckCircle2, History, BookTemplate, Home, FileDown, FileText, TrendingUp, Minimize2, Maximize2, Eye, ChevronDown, Bot, MessageSquare, Sparkle, Search, Cpu, PlayCircle, ChevronRight, Database } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Bookmark, Lightbulb, Save, Trash2 } from "lucide-react";
import { ModelSelector, parseModelValue } from "@/components/ModelSelector";

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
  
  // Salvar preferência de modelo
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    localStorage.setItem('promptjur-selected-model', value);
    const [provider, model] = value.split(':');
    toast.success(`Modelo alterado para ${model === 'manus-default' ? 'Manus AI' : model}`);
  };
  
  // Salvar preferência de modo compacto
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
  
  // Funções para toggle com persistência
  const toggleFavoritos = () => {
    const newValue = !mostrarFavoritos;
    setMostrarFavoritos(newValue);
    localStorage.setItem('promptjur-mostrar-favoritos', JSON.stringify(newValue));
  };
  const toggleTags = () => {
    const newValue = !mostrarTags;
    setMostrarTags(newValue);
    localStorage.setItem('promptjur-mostrar-tags', JSON.stringify(newValue));
  };
  const toggleAnalytics = () => {
    const newValue = !mostrarAnalytics;
    setMostrarAnalytics(newValue);
    localStorage.setItem('promptjur-mostrar-analytics', JSON.stringify(newValue));
  };
  const toggleCacheLegislacao = () => {
    const newValue = !mostrarCacheLegislacao;
    setMostrarCacheLegislacao(newValue);
    localStorage.setItem('promptjur-mostrar-cache-legislacao', JSON.stringify(newValue));
  };
  
  // Buscar estatísticas do usuário
  const statsQuery = trpc.prompts.stats.useQuery();
  const analyticsQuery = trpc.analytics.get.useQuery();
  const usageByDateQuery = trpc.analytics.usageByDate.useQuery({ days: 7 });
  
  // Detectar template ID e prompt ID da URL
  const urlParams = new URLSearchParams(window.location.search);
  const templateIdFromUrl = urlParams.get('template');
  const promptIdFromUrl = urlParams.get('prompt');
  
  // Buscar template se ID estiver presente
  const templateQuery = trpc.templates.meus.useQuery(undefined, {
    enabled: !!templateIdFromUrl
  });
  
  // Buscar prompt se ID estiver presente
  const promptQuery = trpc.prompts.loadPrompt.useQuery(
    { id: parseInt(promptIdFromUrl!) },
    { enabled: !!promptIdFromUrl }
  );
  
  // Carregar template quando dados estiverem disponíveis
  useEffect(() => {
    if (templateIdFromUrl && templateQuery.data) {
      const template = templateQuery.data.find(t => t.id === parseInt(templateIdFromUrl));
      if (template) {
        // Preencher campo de análise por padrão
        setPromptAnalise(template.template);
        toast.success(`Template "${template.nome}" carregado!`);
        // Limpar URL
        window.history.replaceState({}, '', '/dashboard');
      }
    }
  }, [templateIdFromUrl, templateQuery.data]);
  
  // Carregar prompt quando dados estiverem disponíveis
  useEffect(() => {
    if (promptIdFromUrl && promptQuery.data) {
      const prompt = promptQuery.data;
      // Preencher campo de otimização com o prompt
      setPromptOtimizacao(prompt.promptOriginal || prompt.promptOtimizado || "");
      setActiveTab("otimizar");
      toast.success(`Prompt #${prompt.id} carregado para reutilização!`);
      // Limpar URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [promptIdFromUrl, promptQuery.data]);

  // Estado para Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    titulo: string;
    conteudo: string;
    areaJuridica?: string;
    tipoDocumento?: string;
    onExportPDF: () => void;
  } | null>(null);

  // Estado para Análise
  const [promptAnalise, setPromptAnalise] = useState("");
  const analiseMutation = trpc.prompts.analisar.useMutation({
    onSuccess: () => {
      toast.success("Análise concluída com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro na análise: ${error.message}`);
    }
  });

  // Estado para Geração (Reformulado)
  const [tipoDocumento, setTipoDocumento] = useState<"peticao" | "parecer" | "contrato" | "recurso" | "defesa" | "memorando" | "outro">("peticao");
  const [contextoJuridico, setContextoJuridico] = useState("");
  const [objetivoEspecifico, setObjetivoEspecifico] = useState("");
  const [areaGeracao, setAreaGeracao] = useState<"Civil" | "Penal" | "Trabalhista" | "Tributário" | "Administrativo" | "Constitucional" | "Empresarial" | "Consumidor" | "Família" | "Previdenciário" | "Ambiental" | "Internacional" | "Processo Civil" | "Direito Médico" | "Direito Digital" | "Direito Internacional">("Civil"); // Obrigatório - valor padrão Civil
  const [partesEnvolvidas, setPartesEnvolvidas] = useState("");
  const [legislacaoRelevante, setLegislacaoRelevante] = useState("");
  const [detalhesAdicionais, setDetalhesAdicionais] = useState("");
  const [mostrarDadosAnaliticos, setMostrarDadosAnaliticos] = useState(false);
  const resultadoGeracaoRef = useRef<HTMLDivElement>(null);
  
  // Estados de validação em tempo real
  const [validationErrors, setValidationErrors] = useState<{
    contextoJuridico?: string;
    objetivoEspecifico?: string;
  }>({});
  const [touchedFields, setTouchedFields] = useState<{
    contextoJuridico?: boolean;
    objetivoEspecifico?: boolean;
  }>({});
  
  
  const geracaoMutation = trpc.prompts.gerar.useMutation({
    onSuccess: (data) => {
      toast.success("Prompt profissional gerado com sucesso!");
      if (data.areaDetectadaAutomaticamente) {
        toast.info(`Área jurídica detectada automaticamente: ${data.area}`);
      }
      // Scroll suave para o resultado
      setTimeout(() => {
        resultadoGeracaoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    },
    onError: (error) => {
      toast.error(`Erro na geração: ${error.message}`);
    }
  });

  // Mutation para exportar como DOCX
  // Função de validação em tempo real
  const validateField = (field: 'contextoJuridico' | 'objetivoEspecifico', value: string) => {
    const errors: typeof validationErrors = { ...validationErrors };
    
    if (field === 'contextoJuridico') {
      if (!value.trim()) {
        errors.contextoJuridico = 'O contexto jurídico é obrigatório';
      } else if (value.trim().length < 20) {
        errors.contextoJuridico = 'O contexto deve ter pelo menos 20 caracteres para gerar um prompt de qualidade';
      } else {
        delete errors.contextoJuridico;
      }
    }
    
    if (field === 'objetivoEspecifico') {
      if (!value.trim()) {
        errors.objetivoEspecifico = 'O objetivo específico é obrigatório';
      } else if (value.trim().length < 10) {
        errors.objetivoEspecifico = 'O objetivo deve ter pelo menos 10 caracteres';
      } else {
        delete errors.objetivoEspecifico;
      }
    }
    
    setValidationErrors(errors);
  };
  
  // Validar quando o usuário sai do campo (onBlur)
  const handleFieldBlur = (field: 'contextoJuridico' | 'objetivoEspecifico') => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const value = field === 'contextoJuridico' ? contextoJuridico : objetivoEspecifico;
    validateField(field, value);
  };
  
  // Validar conforme o usuário digita (apenas se o campo já foi tocado)
  useEffect(() => {
    if (touchedFields.contextoJuridico) {
      validateField('contextoJuridico', contextoJuridico);
    }
  }, [contextoJuridico]);
  
  useEffect(() => {
    if (touchedFields.objetivoEspecifico) {
      validateField('objetivoEspecifico', objetivoEspecifico);
    }
  }, [objetivoEspecifico]);

  const gerarDocMutation = trpc.prompts.exportarDocx.useMutation({
    onSuccess: (data) => {
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(data.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Documento Word gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao gerar documento: ${error.message}`);
    }
  });

  // Estados para Modelos
  const [filtroTipoModelo, setFiltroTipoModelo] = useState<string | undefined>(undefined);
  const [filtroAreaModelo, setFiltroAreaModelo] = useState<string | undefined>(undefined);
  const [buscaModelo, setBuscaModelo] = useState("");
  const [modeloPreview, setModeloPreview] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const modelosQuery = trpc.modelos.listar.useQuery({
    tipo: filtroTipoModelo || undefined as any,
    area: filtroAreaModelo || undefined,
    busca: buscaModelo || undefined
  });
  const modelosMaisUsadosQuery = trpc.modelos.maisUsados.useQuery({ limit: 5 });

  // Estado para Otimização
  const [promptOtimizacao, setPromptOtimizacao] = useState("");
  
  // Estado para salvar template
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
      // Atribuir tags selecionadas ao template recém-criado
      if (selectedTags.length > 0 && data.templateId) {
        for (const tagId of selectedTags) {
          try {
            await atribuirTagMutation.mutateAsync({
              templateId: data.templateId,
              tagId
            });
          } catch (error) {
            console.error("Erro ao atribuir tag:", error);
          }
        }
      }
      toast.success("Template salvo com sucesso!");
      setShowSaveTemplate(false);
      setTemplateNome("");
      setSelectedTags([]);
      setTemplateDescricao("");
      setTemplateConteudo("");
      setTemplateArea("");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar template: ${error.message}`);
    }
  });

  const otimizacaoMutation = trpc.prompts.otimizar.useMutation({
    onSuccess: () => {
      toast.success("Otimização concluída com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro na otimização: ${error.message}`);
    }
  });

  const handleAnalisar = async () => {
    console.log('[DEBUG] handleAnalisar chamado');
    console.log('[DEBUG] promptAnalise:', promptAnalise);
    
    if (!promptAnalise.trim()) {
      console.log('[DEBUG] Prompt vazio');
      toast.error("Por favor, insira um prompt para analisar");
      return;
    }
    
    const { provider, model } = parseModelValue(selectedModel);
    console.log('[DEBUG] Chamando mutation com:', { prompt: promptAnalise, provider, model });
    try {
      analiseMutation.mutate({ prompt: promptAnalise, provider, model });
      console.log('[DEBUG] Mutation chamada com sucesso');
    } catch (error) {
      console.error('[DEBUG] Erro ao chamar mutation:', error);
    }
  };

  const handleGerar = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!contextoJuridico.trim() || !objetivoEspecifico.trim()) {
      toast.error("Por favor, preencha os campos obrigatórios (Contexto e Objetivo)");
      return;
    }
    const { provider, model } = parseModelValue(selectedModel);
    geracaoMutation.mutate({
      tipoDocumento,
      contextoJuridico,
      objetivoEspecifico,
      area: areaGeracao, // Campo obrigatório
      partesEnvolvidas: partesEnvolvidas || undefined,
      legislacaoRelevante: legislacaoRelevante || undefined,
      detalhesAdicionais: detalhesAdicionais || undefined,
      provider,
      model
    });
  };

  const handleOtimizar = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!promptOtimizacao.trim()) {
      toast.error("Por favor, insira um prompt para otimizar");
      return;
    }
    const { provider, model } = parseModelValue(selectedModel);
    otimizacaoMutation.mutate({ prompt: promptOtimizacao, provider, model });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const testarPromptNaPlataforma = (prompt: string, plataforma: 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'manus') => {
    // Copiar para clipboard
    navigator.clipboard.writeText(prompt);
    
    // URLs das plataformas
    const urls = {
      chatgpt: 'https://chatgpt.com/',
      claude: 'https://claude.ai/new',
      gemini: 'https://gemini.google.com/app',
      perplexity: 'https://www.perplexity.ai/',
      manus: 'https://manus.im/'
    };
    
    const nomes = {
      chatgpt: 'ChatGPT',
      claude: 'Claude',
      gemini: 'Gemini',
      perplexity: 'Perplexity',
      manus: 'Manus'
    };
    
    // Abrir plataforma em nova aba
    window.open(urls[plataforma], '_blank');
    
    toast.success(
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in duration-300" />
        <span className="font-semibold">Prompt copiado com sucesso!</span>
      </div>, 
      {
        description: `${nomes[plataforma]} aberto em nova aba. Cole o prompt com Ctrl+V (ou Cmd+V no Mac) para começar a testar.`,
        duration: 4000,
        className: "border-green-500/50 bg-green-500/10"
      }
    );
  };

  // Funções de exportação
  const exportAsMarkdown = (title: string, content: any) => {
    let markdown = `# ${title}\n\n`;
    markdown += `**Data:** ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    if (typeof content === 'string') {
      markdown += content;
    } else {
      markdown += '```json\n' + JSON.stringify(content, null, 2) + '\n```';
    }
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Exportado como Markdown!");
  };

  const exportAsPDF = (title: string, content: any) => {
    // Criar HTML para PDF com formatação ABNT
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            margin: 3cm 2cm 2cm 3cm;
            size: A4;
          }
          body { 
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            text-align: justify;
            margin: 0;
            padding: 0;
            color: #000;
          }
          h1 { 
            font-family: Arial, sans-serif;
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 1.5cm;
            margin-top: 0;
            text-transform: uppercase;
          }
          h2 {
            font-family: Arial, sans-serif;
            font-size: 13pt;
            font-weight: bold;
            margin-top: 1.5cm;
            margin-bottom: 1cm;
            text-indent: 0;
          }
          h3 {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            font-weight: bold;
            margin-top: 1.5cm;
            margin-bottom: 1cm;
            text-indent: 0;
          }
          .metadata { 
            font-family: Arial, sans-serif;
            font-size: 10pt;
            color: #666;
            margin-bottom: 2cm;
            text-align: center;
          }
          .content { 
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            text-align: justify;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .content p {
            margin-bottom: 1.5cm;
            text-indent: 2cm;
            line-height: 1.5;
          }
          .content h1 + p,
          .content h2 + p,
          .content h3 + p {
            text-indent: 0;
          }
          .content ul,
          .content ol {
            margin-bottom: 1.5cm;
            padding-left: 2cm;
          }
          .content li {
            margin-bottom: 0.5cm;
          }
          .content blockquote {
            margin-left: 4cm;
            margin-right: 0;
            font-size: 11pt;
            margin-bottom: 1.5cm;
          }
          .content strong,
          .content b {
            font-weight: bold;
          }
          .content em,
          .content i {
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="metadata">Data: ${new Date().toLocaleString('pt-BR')}</div>
        <div class="content">
    `;
    
    if (typeof content === 'string') {
      html += `<p>${content.replace(/\n/g, '<br>')}</p>`;
    } else {
      html += `<pre style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.0; white-space: pre-wrap;">${JSON.stringify(content, null, 2)}</pre>`;
    }
    
    html += `
        </div>
      </body>
      </html>
    `;
    
    // Abrir em nova janela para imprimir
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      toast.success("Abrindo janela de impressão com formatação ABNT (Arial 12, espaçamento 1.0)...");
    }
  };

  // Função para usar modelo (preencher tab Gerar automaticamente)
  const registrarUsoMutation = trpc.modelos.registrarUso.useMutation();

  const usarModelo = (modelo: any) => {
    // Registrar uso do modelo
    registrarUsoMutation.mutate({ modeloId: modelo.id });
    
    // Preencher campos da tab Gerar
    setTipoDocumento(modelo.tipoDocumento);
    setContextoJuridico(modelo.contextoJuridico);
    setObjetivoEspecifico(modelo.objetivoEspecifico);
    setAreaGeracao((modelo.areaJuridica || "Civil") as typeof areaGeracao);
    setPartesEnvolvidas(modelo.partesEnvolvidas || "");
    setLegislacaoRelevante(modelo.legislacaoRelevante || "");
    setDetalhesAdicionais(modelo.detalhesAdicionais || "");
    
    // Navegar para tab Gerar
    setActiveTab("gerar");
    toast.success(`Modelo "${modelo.nome}" carregado! Personalize e gere seu prompt.`);
  };

  // Função para gerar documento Word final
  const gerarDocumentoFinal = () => {
    if (!geracaoMutation.data?.promptProfissional) {
      toast.error("Nenhum prompt gerado para exportar");
      return;
    }

    gerarDocMutation.mutate({
      promptId: geracaoMutation.data.promptId,
      titulo: `Prompt Jurídico - ${tipoDocumento.charAt(0).toUpperCase() + tipoDocumento.slice(1)}`,
      conteudo: geracaoMutation.data.promptProfissional,
      incluirCabecalho: true,
      incluirDataHora: true
    });
  };

  const openSaveTemplateDialog = (conteudo: string, area: string) => {
    setTemplateConteudo(conteudo);
    setTemplateArea(area);
    setShowSaveTemplate(true);
  };

  const handleSaveTemplate = () => {
    if (!templateNome.trim()) {
      toast.error("Por favor, insira um nome para o template");
      return;
    }
    if (!templateConteudo.trim()) {
      toast.error("Conteúdo do template inválido");
      return;
    }
    salvarTemplateMutation.mutate({
      nome: templateNome,
      descricao: templateDescricao,
      template: templateConteudo,
      areaJuridica: templateArea || "Geral"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">PromptJur</h1>
                <p className="text-sm text-muted-foreground">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-4 h-4" />
                  Início
                </Link>
                <Link href="/historico" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <History className="w-4 h-4" />
                  Histórico
                </Link>
                <Link href="/biblioteca-templates" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <BookTemplate className="w-4 h-4" />
                  Meus Templates
                </Link>
                <Link href="/meus-modelos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <FileText className="w-4 h-4" />
                  Meus Modelos
                </Link>
                <Link href="/biblioteca-publica" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <BookTemplate className="w-4 h-4" />
                  Biblioteca
                </Link>
                <Link href="/tutoriais" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <PlayCircle className="w-4 h-4" />
                  Tutoriais
                </Link>
              </nav>
              <NotificationBell />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCompactMode}
                className="flex items-center gap-2"
                title={isCompactMode ? 'Modo Completo' : 'Modo Compacto'}
              >
                {isCompactMode ? (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span className="text-sm">Expandir</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span className="text-sm">Compacto</span>
                  </>
                )}
              </Button>
              <span className="text-sm text-muted-foreground border-l border-border pl-6">Olá, {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Toggle Modo Wizard */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Ferramentas de Engenharia de Prompts</h2>
            <p className="text-sm text-muted-foreground">Escolha entre modo avançado ou assistente guiado</p>
          </div>
          <Button
            variant={modoWizard ? "default" : "outline"}
            onClick={() => setModoWizard(!modoWizard)}
            className="flex items-center gap-2"
          >
            {modoWizard ? (
              <>
                <Maximize2 className="w-4 h-4" />
                Modo Avançado
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Modo Assistido
              </>
            )}
          </Button>
        </div>
        {/* Modo Wizard */}
        {modoWizard ? (
          <WizardPromptGenerator
            onComplete={(data: WizardData) => {
              // Processar dados do wizard
              if (data.objetivo === 'analisar') {
                setPromptAnalise(data.descricaoCaso);
                setActiveTab('analisar');
                setModoWizard(false);
                // Executar análise automaticamente
                setTimeout(() => {
                  handleAnalisar();
                }, 100);
              } else if (data.objetivo === 'gerar') {
                setAreaGeracao((data.areaJuridica === 'auto' ? 'Civil' : data.areaJuridica) as typeof areaGeracao);
                setContextoJuridico(data.descricaoCaso);
                setActiveTab('gerar');
                setModoWizard(false);
                // Executar geração automaticamente
                setTimeout(() => {
                  handleGerar();
                }, 100);
              } else if (data.objetivo === 'otimizar') {
                setPromptOtimizacao(data.descricaoCaso);
                setActiveTab('otimizar');
                setModoWizard(false);
                // Executar otimização automaticamente
                setTimeout(() => {
                  handleOtimizar();
                }, 100);
              }
            }}
            onCancel={() => setModoWizard(false)}
          />
        ) : (
          /* Tabs Principais - Prioridade Máxima */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="analisar" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Analisar Prompt
            </TabsTrigger>
            <TabsTrigger value="otimizar" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Otimizar Prompt
            </TabsTrigger>
            <TabsTrigger value="gerar" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Gerar Prompt Jurídico
            </TabsTrigger>
            <TabsTrigger value="documentos" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="modelos" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Modelos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Analisar */}
          <TabsContent value="analisar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Análise de Prompt Jurídico
                </CardTitle>
                <CardDescription>
                  Cole seu prompt abaixo para análise automática de área jurídica, palavras-chave e qualidade
                </CardDescription>
                <DisclaimerLegal className="mt-4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <ModelSelector
                  value={selectedModel}
                  onChange={handleModelChange}
                  disabled={analiseMutation.isPending}
                />
                <div className="space-y-2">
                  <Label htmlFor="prompt-analise">Prompt para Análise</Label>
                  <HighlightedTextarea
                    value={promptAnalise}
                    onChange={setPromptAnalise}
                    placeholder="Cole aqui o prompt que deseja analisar..."
                    showValidation={true}
                    minHeight="200px"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <Button 
                    onClick={handleAnalisar} 
                    disabled={analiseMutation.isPending}
                  >
                    {analiseMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 w-4 h-4" />
                        Analisar Prompt
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      // Confirmar antes de limpar
                      if (promptAnalise || analiseMutation.data) {
                        if (!confirm('Deseja realmente limpar todos os campos de todas as abas? Esta ação não pode ser desfeita.')) {
                          return;
                        }
                      }
                      
                      // Limpar tab Analisar
                      setPromptAnalise('');
                      analiseMutation.reset();
                      
                      // Limpar tab Gerar
                      setContextoJuridico('');
                      setObjetivoEspecifico('');
                      setPartesEnvolvidas('');
                      setLegislacaoRelevante('');
                      setDetalhesAdicionais('');
                      setTipoDocumento('peticao');
                      setAreaGeracao('Civil');
                      geracaoMutation.reset();
                      
                      // Limpar tab Otimizar
                      setPromptOtimizacao('');
                      otimizacaoMutation.reset();
                      
                      toast.success('Todos os campos foram limpos!');
                    }}
                    variant="outline"
                    disabled={analiseMutation.isPending}
                  >
                    <Trash2 className="mr-2 w-4 h-4" />
                    Limpar Tudo
                  </Button>
                </div>

                {analiseMutation.data && (
                  <div className="mt-6 space-y-4 p-6 bg-card border border-border rounded-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Resultado da Análise</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setPreviewData({
                              titulo: "Análise de Prompt",
                              conteudo: JSON.stringify(analiseMutation.data, null, 2),
                              areaJuridica: analiseMutation.data?.area,
                              tipoDocumento: "Análise",
                              onExportPDF: () => exportAsPDF("Análise de Prompt", analiseMutation.data)
                            });
                            setPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview e Exportar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportAsMarkdown("Análise de Prompt", analiseMutation.data)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Markdown
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSaveTemplateDialog(promptAnalise, analiseMutation.data?.area || "Geral")}
                        >
                          <BookTemplate className="w-4 h-4 mr-2" />
                          Salvar Prompt
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(analiseMutation.data, null, 2))}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="default" size="sm">
                              <Zap className="w-4 h-4 mr-2" />
                              Testar Prompt
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => testarPromptNaPlataforma(promptAnalise, 'manus')}>
                              <Cpu className="w-4 h-4 mr-2" />
                              Manus
                              <Badge variant="secondary" className="ml-auto text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Recomendado</Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => testarPromptNaPlataforma(promptAnalise, 'chatgpt')}>
                              <Bot className="w-4 h-4 mr-2" />
                              ChatGPT
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => testarPromptNaPlataforma(promptAnalise, 'claude')}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Claude
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => testarPromptNaPlataforma(promptAnalise, 'gemini')}>
                              <Sparkle className="w-4 h-4 mr-2" />
                              Gemini
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => testarPromptNaPlataforma(promptAnalise, 'perplexity')}>
                              <Search className="w-4 h-4 mr-2" />
                              Perplexity
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Área Jurídica</Label>
                        <Badge variant="secondary" className="mt-1">
                          {analiseMutation.data.area}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Qualidade</Label>
                        <Badge 
                          variant={
                            analiseMutation.data.qualidade === "excelente" ? "default" :
                            analiseMutation.data.qualidade === "bom" ? "secondary" : "destructive"
                          }
                          className="mt-1"
                        >
                          {analiseMutation.data.qualidade}
                        </Badge>
                      </div>
                    </div>

                    {analiseMutation.data.palavrasChave && analiseMutation.data.palavrasChave.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Palavras-Chave</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {analiseMutation.data.palavrasChave.map((palavra: string, idx: number) => (
                            <Badge key={idx} variant="outline">{palavra}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analiseMutation.data.sugestoes && analiseMutation.data.sugestoes.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Sugestões de Melhoria</Label>
                        <ul className="mt-2 space-y-2">
                          {analiseMutation.data.sugestoes.map((sugestao: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{sugestao}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Botões de Navegação e Fluxo Automatizado */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <Button
                        onClick={() => {
                          // Limpar resultado mas manter o prompt para refazer
                          analiseMutation.reset();
                          toast.info('Resultado limpo. Pronto para nova análise');
                        }}
                        variant="outline"
                        size="lg"
                        className="w-full"
                      >
                        <History className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      <Button
                        onClick={() => {
                          // Preencher tab de otimização com prompt analisado
                          setPromptOtimizacao(promptAnalise);
                          // Navegar para tab de otimização
                          setActiveTab('otimizar');
                          toast.success('Prompt transferido para Otimização!');
                        }}
                        className="w-full"
                        size="lg"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Otimizar Este Prompt
                      </Button>
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

          {/* Tab: Gerar */}
          <TabsContent value="gerar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Gerar Prompt Jurídico Profissional
                </CardTitle>
                <CardDescription>
                  Crie prompts PRONTOS PARA USO em ferramentas de IA (ChatGPT, Claude, Gemini) para gerar peças jurídicas de excelência
                </CardDescription>
                <DisclaimerLegal className="mt-4" />
              </CardHeader>
              <CardContent className="space-y-6">
                <ModelSelector
                  value={selectedModel}
                  onChange={handleModelChange}
                  disabled={geracaoMutation.isPending}
                />

                {/* Tipo de Documento */}
                <div className="space-y-2">
                  <Label htmlFor="tipo-documento">Tipo de Documento Jurídico *</Label>
                  <Select value={tipoDocumento} onValueChange={(v: any) => setTipoDocumento(v)}>
                    <SelectTrigger id="tipo-documento">
                      <SelectValue />
                    </SelectTrigger>
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
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contexto Jurídico */}
                <div className="space-y-2">
                  <Label htmlFor="contexto-juridico">Contexto/Situação Jurídica *</Label>
                  <HighlightedTextarea
                    value={contextoJuridico}
                    onChange={setContextoJuridico}
                    placeholder="Descreva a situação jurídica completa (ex: Cliente sofreu acidente de trânsito, réu não pagou indenização acordada, empresa descumpriu contrato de prestação de serviços...)"
                    showValidation={true}
                    minHeight="120px"
                    onBlur={() => handleFieldBlur('contextoJuridico')}
                    className={touchedFields.contextoJuridico && validationErrors.contextoJuridico ? 'border-destructive' : ''}
                  />
                  {touchedFields.contextoJuridico && validationErrors.contextoJuridico && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-lg">⚠️</span>
                      {validationErrors.contextoJuridico}
                    </p>
                  )}
                </div>

                {/* Objetivo Específico */}
                <div className="space-y-2">
                  <Label htmlFor="objetivo-especifico">Objetivo Específico *</Label>
                  <Textarea
                    id="objetivo-especifico"
                    placeholder="O que você quer que a IA gere? (ex: Redigir petição inicial de ação de cobrança com pedido de tutela de urgência)"
                    value={objetivoEspecifico}
                    onChange={(e) => setObjetivoEspecifico(e.target.value)}
                    onBlur={() => handleFieldBlur('objetivoEspecifico')}
                    className={`min-h-[80px] ${touchedFields.objetivoEspecifico && validationErrors.objetivoEspecifico ? 'border-destructive' : ''}`}
                  />
                  {touchedFields.objetivoEspecifico && validationErrors.objetivoEspecifico && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-lg">⚠️</span>
                      {validationErrors.objetivoEspecifico}
                    </p>
                  )}
                </div>

                {/* Área Jurídica (Obrigatório) */}
                <div className="space-y-2">
                  <Label htmlFor="area-geracao">Área Jurídica <span className="text-destructive">*</span></Label>
                  <Select value={areaGeracao} onValueChange={(value) => setAreaGeracao(value as typeof areaGeracao)}>
                    <SelectTrigger id="area-geracao">
                      <SelectValue placeholder="Selecione a área jurídica" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS_JURIDICAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Sugestão Inteligente de Área */}
                  <SugestaoArea
                    contexto={contextoJuridico}
                    objetivo={objetivoEspecifico}
                    onAplicarSugestao={setAreaGeracao}
                  />
                </div>
                
                {/* Gerenciador de Perfis */}
                <div className="flex justify-end">
                  <GerenciadorPerfis
                    tipoDocumento={tipoDocumento}
                    areaJuridica={areaGeracao}
                    onCarregarPerfil={(perfil) => {
                      setTipoDocumento(perfil.tipoDocumento as any);
                      setAreaGeracao(perfil.areaJuridica as typeof areaGeracao);
                    }}
                  />
                </div>

                {/* Campos Opcionais Avançados */}
                <details className="space-y-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    ▶ Campos Opcionais Avançados
                  </summary>
                  
                  <div className="space-y-4 pt-4">
                    {/* Partes Envolvidas */}
                    <div className="space-y-2">
                      <Label htmlFor="partes-envolvidas">Partes Envolvidas (Opcional)</Label>
                      <Textarea
                        id="partes-envolvidas"
                        placeholder="Ex: Autor: João Silva (CPF 123.456.789-00), Réu: Empresa XYZ Ltda (CNPJ 12.345.678/0001-90)"
                        value={partesEnvolvidas}
                        onChange={(e) => setPartesEnvolvidas(e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>

                    {/* Legislação Relevante */}
                    <div className="space-y-2">
                      <Label htmlFor="legislacao-relevante">Legislação Relevante (Opcional)</Label>
                      <HighlightedTextarea
                        value={legislacaoRelevante}
                        onChange={setLegislacaoRelevante}
                        placeholder="Ex: Art. 927 do CC/02, Art. 186 do CC/02, Súmula 37 do STJ"
                        showValidation={true}
                        minHeight="60px"
                      />
                    </div>

                    {/* Detalhes Adicionais */}
                    <div className="space-y-2">
                      <Label htmlFor="detalhes-adicionais">Detalhes Adicionais (Opcional)</Label>
                      <Textarea
                        id="detalhes-adicionais"
                        placeholder="Qualquer informação adicional relevante"
                        value={detalhesAdicionais}
                        onChange={(e) => setDetalhesAdicionais(e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                </details>

                <Button 
                  type="button"
                  onClick={handleGerar} 
                  disabled={geracaoMutation.isPending}
                  className="w-full"
                >
                  {geracaoMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Gerando Prompt Profissional...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 w-4 h-4" />
                      ✨ Gerar Prompt Profissional
                    </>
                  )}
                </Button>

                {geracaoMutation.data && (
                  <div ref={resultadoGeracaoRef} className="mt-6 space-y-4 p-6 bg-card border border-border rounded-sm">
                     <div className="flex flex-col gap-3">
                      <h3 className="text-lg font-semibold text-foreground">✨ Prompt Profissional Pronto para Uso</h3>
                       <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => copyToClipboard(geracaoMutation.data?.promptProfissional || "")}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Prompt
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={async () => {
                            try {
                              const { copyFormattedToClipboard } = await import('@/lib/formatacao-abnt');
                              await copyFormattedToClipboard(geracaoMutation.data?.promptProfissional || "");
                              toast.success(
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in duration-300" />
                                  <span className="font-semibold">Copiado com formatação ABNT!</span>
                                </div>,
                                {
                                  description: "Cole no Word ou Google Docs para manter a formatação profissional.",
                                  duration: 4000,
                                  className: "border-green-500/50 bg-green-500/10"
                                }
                              );
                            } catch (error) {
                              toast.error("Erro ao copiar formatado. Tente usar o botão 'Copiar Prompt' normal.");
                            }
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Copiar Formatado
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!geracaoMutation.data?.promptProfissional || !geracaoMutation.data?.promptId) {
                              toast.error("Nenhum prompt gerado para exportar");
                              return;
                            }
                            gerarDocMutation.mutate({
                              promptId: geracaoMutation.data.promptId,
                              titulo: `Prompt Jurídico - ${tipoDocumento.charAt(0).toUpperCase() + tipoDocumento.slice(1)}`,
                              conteudo: geracaoMutation.data.promptProfissional,
                              incluirCabecalho: true,
                              incluirDataHora: true
                            });
                          }}
                          disabled={gerarDocMutation.isPending || !geracaoMutation.data?.promptId}
                        >
                          {gerarDocMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <FileDown className="w-4 h-4 mr-2" />
                          )}
                          DOCX (ABNT)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportAsPDF("Prompt Gerado", geracaoMutation.data?.promptProfissional || "")}
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          PDF (ABNT)
                        </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => openSaveTemplateDialog(geracaoMutation.data?.promptProfissional || "", areaGeracao)}
                         >
                           <BookTemplate className="w-4 h-4 mr-2" />
                           Salvar como Template
                         </Button>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="default" size="sm">
                               <Zap className="w-4 h-4 mr-2" />
                               Testar Prompt
                               <ChevronDown className="w-3 h-3 ml-1" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => testarPromptNaPlataforma(geracaoMutation.data?.promptProfissional || "", 'manus')}>
                               <Cpu className="w-4 h-4 mr-2" />
                               Manus
                               <Badge variant="secondary" className="ml-auto text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Recomendado</Badge>
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => testarPromptNaPlataforma(geracaoMutation.data?.promptProfissional || "", 'chatgpt')}>
                               <Bot className="w-4 h-4 mr-2" />
                               ChatGPT
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => testarPromptNaPlataforma(geracaoMutation.data?.promptProfissional || "", 'claude')}>
                               <MessageSquare className="w-4 h-4 mr-2" />
                               Claude
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => testarPromptNaPlataforma(geracaoMutation.data?.promptProfissional || "", 'gemini')}>
                               <Sparkle className="w-4 h-4 mr-2" />
                               Gemini
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => testarPromptNaPlataforma(geracaoMutation.data?.promptProfissional || "", 'perplexity')}>
                               <Search className="w-4 h-4 mr-2" />
                               Perplexity
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => gerarDocumentoFinal()}
                           disabled={gerarDocMutation.isPending}
                         >
                           {gerarDocMutation.isPending ? (
                             <>
                               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                               Gerando...
                             </>
                           ) : (
                             <>
                               <FileText className="w-4 h-4 mr-2" />
                               Gerar Documento Final
                             </>
                           )}
                         </Button>
                       </div>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-900 rounded-sm border border-gray-200 dark:border-gray-700">
                      <Streamdown className="abnt-document">
                        {geracaoMutation.data.promptProfissional}
                      </Streamdown>
                    </div>

                    {/* Validação de Legislação */}
                    {geracaoMutation.data.validacaoLegislacao && (
                      <div className="mt-4">
                        <ValidacaoLegislacao validacao={geracaoMutation.data.validacaoLegislacao} />
                      </div>
                    )}
                    
                    {/* Dados Analíticos (Colapsável) */}
                    <Collapsible open={mostrarDadosAnaliticos} onOpenChange={setMostrarDadosAnaliticos} className="mt-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full flex items-center justify-between p-3 hover:bg-muted/50">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Dados Analíticos e Métricas
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${mostrarDadosAnaliticos ? 'rotate-90' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="p-4 bg-muted/30 rounded-sm space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-muted-foreground">Tipo de Documento:</p>
                              <p className="font-medium">{tipoDocumento}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Área Jurídica:</p>
                              <p className="font-medium">{geracaoMutation.data.area}</p>
                            </div>
                            {geracaoMutation.data.areaDetectadaAutomaticamente && (
                              <div className="col-span-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Área detectada automaticamente
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                    
                    {/* Botão de Navegação */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <Button
                        onClick={() => {
                          // Navegar para tab Analisar (página inicial)
                          setActiveTab('analisar');
                          toast.info('Retornando à análise de prompt');
                        }}
                        variant="outline"
                        size="lg"
                        className="w-full"
                      >
                        <History className="w-4 h-4 mr-2" />
                        Voltar para Análise
                      </Button>
                      <p className="text-sm text-muted-foreground text-center">
                        ✅ Prompt profissional gerado! Copie e use diretamente em ferramentas de IA.
                      </p>
                    </div>
                  </div>
                )}

                {geracaoMutation.error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                    Erro: {geracaoMutation.error.message}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Otimizar */}
          <TabsContent value="otimizar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Otimização de Prompt Jurídico
                </CardTitle>
                <CardDescription>
                  Cole um prompt existente para receber sugestões de melhoria e uma versão otimizada
                </CardDescription>
                <DisclaimerLegal className="mt-4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <ModelSelector
                  value={selectedModel}
                  onChange={handleModelChange}
                  disabled={otimizacaoMutation.isPending}
                />
                <div className="space-y-2">
                  <Label htmlFor="prompt-otimizacao">Prompt para Otimizar</Label>
                  <HighlightedTextarea
                    value={promptOtimizacao}
                    onChange={setPromptOtimizacao}
                    placeholder="Cole aqui o prompt que deseja otimizar..."
                    showValidation={true}
                    minHeight="200px"
                  />
                </div>
                <Button 
                  type="button"
                  onClick={handleOtimizar} 
                  disabled={otimizacaoMutation.isPending}
                  className="w-full"
                >
                  {otimizacaoMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Otimizando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 w-4 h-4" />
                      Otimizar Prompt
                    </>
                  )}
                </Button>

                {otimizacaoMutation.data && (
                  <div className="mt-6 space-y-6">
                    {/* Comparação Lado a Lado */}
                    <PromptComparison
                      promptOriginal={otimizacaoMutation.data.promptOriginal}
                      promptOtimizado={otimizacaoMutation.data.promptOtimizado}
                      melhorias={otimizacaoMutation.data.melhorias}
                    />

                    {/* Validação de Legislação */}
                    {otimizacaoMutation.data.validacaoLegislacao && (
                      <div className="mt-4">
                        <ValidacaoLegislacao validacao={otimizacaoMutation.data.validacaoLegislacao} />
                      </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          exportAsTextABNT("Prompt Otimizado", otimizacaoMutation.data?.promptOtimizado || "");
                          toast.success("Arquivo .TXT salvo com formatação ABNT (Arial 12, espaçamento 1.0)!");
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Salvar .TXT (ABNT)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportAsPDF("Prompt Otimizado", otimizacaoMutation.data?.promptOtimizado || "")}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        PDF (ABNT)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!otimizacaoMutation.data?.promptOtimizado || !otimizacaoMutation.data?.promptId) {
                            toast.error("Nenhum prompt otimizado para exportar");
                            return;
                          }
                          gerarDocMutation.mutate({
                            promptId: otimizacaoMutation.data.promptId,
                            titulo: "Prompt Otimizado",
                            conteudo: otimizacaoMutation.data.promptOtimizado,
                            incluirCabecalho: true,
                            incluirDataHora: true
                          });
                        }}
                        disabled={gerarDocMutation.isPending || !otimizacaoMutation.data?.promptId}
                      >
                        {gerarDocMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <FileDown className="w-4 h-4 mr-2" />
                        )}
                        DOCX (ABNT)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportAsMarkdown("Prompt Otimizado", otimizacaoMutation.data?.promptOtimizado || "")}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Markdown
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSaveTemplateDialog(otimizacaoMutation.data?.promptOtimizado || "", otimizacaoMutation.data?.area || "Geral")}
                      >
                        <BookTemplate className="w-4 h-4 mr-2" />
                        Salvar Prompt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(otimizacaoMutation.data?.promptOtimizado || "")}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="default" size="sm">
                            <Zap className="w-4 h-4 mr-2" />
                            Testar Prompt
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => testarPromptNaPlataforma(otimizacaoMutation.data?.promptOtimizado || "", 'manus')}>
                            <Cpu className="w-4 h-4 mr-2" />
                            Manus
                            <Badge variant="secondary" className="ml-auto text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Recomendado</Badge>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => testarPromptNaPlataforma(otimizacaoMutation.data?.promptOtimizado || "", 'chatgpt')}>
                            <Bot className="w-4 h-4 mr-2" />
                            ChatGPT
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => testarPromptNaPlataforma(otimizacaoMutation.data?.promptOtimizado || "", 'claude')}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Claude
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => testarPromptNaPlataforma(otimizacaoMutation.data?.promptOtimizado || "", 'gemini')}>
                            <Sparkle className="w-4 h-4 mr-2" />
                            Gemini
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => testarPromptNaPlataforma(otimizacaoMutation.data?.promptOtimizado || "", 'perplexity')}>
                            <Search className="w-4 h-4 mr-2" />
                            Perplexity
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Botão de Navegação e Fluxo Automatizado */}
                    <div className="pt-4 border-t border-border mt-4 space-y-3">
                      <Button
                        onClick={() => {
                          // Navegar para tab Analisar (página inicial)
                          setActiveTab('analisar');
                          toast.info('Retornando à análise de prompt');
                        }}
                        variant="outline"
                        size="lg"
                        className="w-full"
                      >
                        <History className="w-4 h-4 mr-2" />
                        Voltar para Análise
                      </Button>
                      <Button
                        onClick={() => {
                          // Preencher tab de geração com prompt otimizado como base
                          if (otimizacaoMutation.data?.area) {
                            setAreaGeracao(otimizacaoMutation.data.area as typeof areaGeracao);
                          }
                          setContextoJuridico(`Prompt otimizado: ${otimizacaoMutation.data?.promptOtimizado?.substring(0, 150)}...`);
                          setObjetivoEspecifico(`Gerar nova versão baseada no prompt otimizado`);
                          // Navegar para tab de geração
                          setActiveTab('gerar');
                          toast.success('Pronto para gerar nova versão!');
                        }}
                        className="w-full"
                        size="lg"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        ✨ Gerar Prompt Profissional
                      </Button>
                    </div>
                  </div>
                )}

                {otimizacaoMutation.error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                    Erro: {otimizacaoMutation.error.message}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Documentos */}
          <TabsContent value="documentos" className="space-y-6">
            <TabDocumentos />
          </TabsContent>

          {/* Tab: Modelos */}
          <TabsContent value="modelos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Biblioteca de Modelos Profissionais
                </CardTitle>
                <CardDescription>
                  Escolha um modelo pré-pronto e personalize para gerar seu prompt profissional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Buscar</Label>
                    <Input
                      placeholder="Nome ou descrição..."
                      value={buscaModelo}
                      onChange={(e) => setBuscaModelo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select value={filtroTipoModelo} onValueChange={setFiltroTipoModelo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as áreas" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS_JURIDICAS.map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Seção de Modelos Mais Usados */}
                {modelosMaisUsadosQuery.data && modelosMaisUsadosQuery.data.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Seus Modelos Favoritos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {modelosMaisUsadosQuery.data.map((modelo: any) => (
                        <Card key={modelo.id} className="hover:border-primary/50 transition-colors border-primary/30">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{modelo.nome}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {modelo.vezesUsado}x
                                </Badge>
                                {modelo.isPremium && (
                                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                    Premium
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <CardDescription className="text-sm">{modelo.descricao}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {modelo.tipoDocumento === "peticao" && "Petição"}
                                {modelo.tipoDocumento === "parecer" && "Parecer"}
                                {modelo.tipoDocumento === "contrato" && "Contrato"}
                                {modelo.tipoDocumento === "recurso" && "Recurso"}
                                {modelo.tipoDocumento === "defesa" && "Defesa"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {modelo.areaJuridica}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setModeloPreview(modelo);
                                  setShowPreviewModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => usarModelo(modelo)}
                              >
                                <Zap className="w-4 h-4 mr-2" />
                                Usar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid de Modelos */}
                {modelosQuery.isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}

                {modelosQuery.data && modelosQuery.data.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum modelo encontrado com os filtros aplicados</p>
                  </div>
                )}

                {modelosQuery.data && modelosQuery.data.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modelosQuery.data.map((modelo) => (
                      <Card key={modelo.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{modelo.nome}</CardTitle>
                            {modelo.isPremium && (
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                Premium
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">{modelo.descricao}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {modelo.tipoDocumento === "peticao" && "Petição"}
                              {modelo.tipoDocumento === "parecer" && "Parecer"}
                              {modelo.tipoDocumento === "contrato" && "Contrato"}
                              {modelo.tipoDocumento === "recurso" && "Recurso"}
                              {modelo.tipoDocumento === "defesa" && "Defesa"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {modelo.areaJuridica}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setModeloPreview(modelo);
                                setShowPreviewModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => usarModelo(modelo)}
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Usar
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
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {modeloPreview.tipoDocumento === "peticao" && "Petição"}
                    {modeloPreview.tipoDocumento === "parecer" && "Parecer"}
                    {modeloPreview.tipoDocumento === "contrato" && "Contrato"}
                    {modeloPreview.tipoDocumento === "recurso" && "Recurso"}
                    {modeloPreview.tipoDocumento === "defesa" && "Defesa"}
                  </Badge>
                  <Badge variant="outline">{modeloPreview.areaJuridica}</Badge>
                  {modeloPreview.isPremium && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      Premium
                    </Badge>
                  )}
                </div>

                {/* Contexto Jurídico */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Contexto Jurídico</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {modeloPreview.contextoJuridico}
                  </p>
                </div>

                {/* Objetivo Específico */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Objetivo Específico</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {modeloPreview.objetivoEspecifico}
                  </p>
                </div>

                {/* Legislação Relevante */}
                {modeloPreview.legislacaoRelevante && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Legislação Relevante</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {modeloPreview.legislacaoRelevante}
                    </p>
                  </div>
                )}

                {/* Partes Envolvidas */}
                {modeloPreview.partesEnvolvidas && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Partes Envolvidas</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {modeloPreview.partesEnvolvidas}
                    </p>
                  </div>
                )}

                {/* Detalhes Adicionais */}
                {modeloPreview.detalhesAdicionais && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Detalhes Adicionais</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {modeloPreview.detalhesAdicionais}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {modeloPreview.tags && modeloPreview.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {modeloPreview.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                if (modeloPreview) {
                  usarModelo(modeloPreview);
                  setShowPreviewModal(false);
                }
              }}>
                <Zap className="w-4 h-4 mr-2" />
                Usar Este Modelo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Seções Secundárias - Após as Tabs Principais */}
        {!isCompactMode && (
          <>
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Análises</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsQuery.data?.totalAnalises || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gerações</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsQuery.data?.totalGeracoes || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Otimizações</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsQuery.data?.totalOtimizacoes || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Templates</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsQuery.data?.totalTemplates || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
                  <BookTemplate className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
            </div>

            {/* Seção de Favoritos */}
            <div className="mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFavoritos}
                className="mb-4 w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Prompts Favoritos
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${mostrarFavoritos ? 'rotate-90' : ''}`} />
              </Button>
              {mostrarFavoritos && <FavoritosSection />}
            </div>
            
            {/* Gerenciamento de Tags */}
            <div className="mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTags}
                className="mb-4 w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Gerenciar Tags
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${mostrarTags ? 'rotate-90' : ''}`} />
              </Button>
              {mostrarTags && <TagsManager />}
            </div>

            {/* Seção de Analytics */}
            {analyticsQuery.data && (
              <div className="mb-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAnalytics}
                  className="mb-4 w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Analytics de Uso
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${mostrarAnalytics ? 'rotate-90' : ''}`} />
                </Button>
                {mostrarAnalytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Analytics de Uso
                      </CardTitle>
                      <CardDescription>
                        Estatísticas e métricas de desempenho
                      </CardDescription>
                    </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tempo Médio de Análise */}
                <div className="p-4 bg-muted/30 rounded-sm">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tempo Médio - Análise</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analyticsQuery.data.avgTimes.analise > 0 
                      ? `${(analyticsQuery.data.avgTimes.analise / 1000).toFixed(1)}s`
                      : "N/A"
                    }
                  </p>
                </div>
                
                {/* Tempo Médio de Geração */}
                <div className="p-4 bg-muted/30 rounded-sm">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tempo Médio - Geração</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analyticsQuery.data.avgTimes.geracao > 0 
                      ? `${(analyticsQuery.data.avgTimes.geracao / 1000).toFixed(1)}s`
                      : "N/A"
                    }
                  </p>
                </div>
                
                {/* Tempo Médio de Otimização */}
                <div className="p-4 bg-muted/30 rounded-sm">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tempo Médio - Otimização</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analyticsQuery.data.avgTimes.otimizacao > 0 
                      ? `${(analyticsQuery.data.avgTimes.otimizacao / 1000).toFixed(1)}s`
                      : "N/A"
                    }
                  </p>
                </div>
              </div>
              
              {/* Gráficos */}
              {usageByDateQuery.data && usageByDateQuery.data.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Gráfico de Evolução */}
                  <div className="p-4 bg-muted/30 rounded-sm">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Evolução de Uso (últimos 7 dias)</h4>
                    <UsageChart data={usageByDateQuery.data} />
                  </div>
                  
                  {/* Gráfico de Distribuição */}
                  <div className="p-4 bg-muted/30 rounded-sm">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Distribuição por Tipo</h4>
                    <DistributionChart data={{
                      analises: statsQuery.data?.totalAnalises || 0,
                      geracoes: statsQuery.data?.totalGeracoes || 0,
                      otimizacoes: statsQuery.data?.totalOtimizacoes || 0
                    }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )}

            {/* Estatísticas do Cache de Legislação */}
            {!isCompactMode && (
              <div className="mb-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCacheLegislacao}
                  className="mb-4 w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Estatísticas do Cache de Legislação
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${mostrarCacheLegislacao ? 'rotate-90' : ''}`} />
                </Button>
                {mostrarCacheLegislacao && <CacheStatistics />}
              </div>
            )}
          </>
        )}

      </main>

      {/* Dialog para Salvar Prompt */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Prompt</DialogTitle>
            <DialogDescription>
              Salve este prompt para reutilização futura
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template-nome">Nome do Template *</Label>
              <Input
                id="template-nome"
                placeholder="Ex: Análise de Contrato de Locação"
                value={templateNome}
                onChange={(e) => setTemplateNome(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="template-descricao">Descrição (opcional)</Label>
              <Textarea
                id="template-descricao"
                placeholder="Descreva quando e como usar este template..."
                value={templateDescricao}
                onChange={(e) => setTemplateDescricao(e.target.value)}
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Conteúdo</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-sm border border-border max-h-[150px] overflow-y-auto">
                <p className="text-sm font-mono whitespace-pre-wrap">
                  {templateConteudo.substring(0, 200)}{templateConteudo.length > 200 && "..."}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Área Jurídica</Label>
              <Badge variant="secondary" className="mt-1">{templateArea}</Badge>
            </div>
            <div>
              <Label htmlFor="tags-select">Tags (opcional)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {tagsQuery.data && tagsQuery.data.length > 0 ? (
                  tagsQuery.data.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{
                        backgroundColor: selectedTags.includes(tag.id) ? (tag.cor || "#3b82f6") : "transparent",
                        borderColor: tag.cor || "#3b82f6",
                        color: selectedTags.includes(tag.id) ? "white" : (tag.cor || "#3b82f6")
                      }}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag.id)
                            ? prev.filter(id => id !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                    >
                      {tag.nome}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma tag criada ainda</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={salvarTemplateMutation.isPending}>
              {salvarTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <BookTemplate className="mr-2 w-4 h-4" />
                  Salvar Prompt
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview de Documento */}
      {previewData && (
        <PreviewDocumentoModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          titulo={previewData.titulo}
          conteudo={previewData.conteudo}
          areaJuridica={previewData.areaJuridica}
          tipoDocumento={previewData.tipoDocumento}
          onExportPDF={previewData.onExportPDF}
        />
      )}
    </div>
  );
}
