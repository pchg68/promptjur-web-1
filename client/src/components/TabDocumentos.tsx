import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Sparkles, Brain, BookOpen, Save, Download, ArrowLeft, HardDrive, Mail, Send } from "lucide-react";
import { useState as useStateDialog } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AREAS_JURIDICAS } from "@shared/juridico";
import LazyStreamdown from "@/components/LazyStreamdown";
import { ModelSelector, parseModelValue } from "@/components/ModelSelector";
import { PesquisaJurisprudencial } from "@/components/PesquisaJurisprudencial";
import DocumentGenerationSkeleton from "@/components/DocumentGenerationSkeleton";
import HistoricoVersoes from "@/components/HistoricoVersoes";

type EstrategiaIA = "direct" | "chain_of_thought" | "knowledge_retrieval";

interface EstrategiaInfo {
  nome: string;
  descricao: string;
  icone: React.ReactNode;
}

const ESTRATEGIAS: Record<EstrategiaIA, EstrategiaInfo> = {
  direct: {
    nome: "Resposta Direta",
    descricao: "Geração rápida e direta do documento. Ideal para casos simples ou quando você já tem todas as informações necessárias.",
    icone: <Sparkles className="w-5 h-5" />,
  },
  chain_of_thought: {
    nome: "Raciocínio Passo a Passo",
    descricao: "A IA primeiro analisa o caso, identifica pontos-chave e argumentos, depois constrói o documento de forma estruturada. Ideal para casos complexos que exigem análise detalhada.",
    icone: <Brain className="w-5 h-5" />,
  },
  knowledge_retrieval: {
    nome: "Recuperação de Conhecimento",
    descricao: "A IA busca precedentes processuais REAIS na base do CNJ (DataJud), identifica prazos aplicáveis e recupera legislação relevante antes de elaborar o documento. Ideal para casos que exigem fundamentação baseada em dados reais do Judiciário.",
    icone: <BookOpen className="w-5 h-5" />,
  },
};

const TIPOS_DOCUMENTO = [
  { value: "peticao", label: "Petição Inicial" },
  { value: "contestacao", label: "Contestação" },
  { value: "recurso", label: "Recurso" },
  { value: "parecer", label: "Parecer Jurídico" },
  { value: "contrato", label: "Contrato" },
  { value: "memorando", label: "Memorando" },
  { value: "procuracao", label: "Procuração" },
  { value: "notificacao", label: "Notificação Extrajudicial" },
];

interface TabDocumentosProps {
  initialContexto?: string;
  initialArea?: string;
}

export default function TabDocumentos({ initialContexto, initialArea }: TabDocumentosProps = {}) {
  const [tipoDocumento, setTipoDocumento] = useState<string>("peticao");
  const [areaJuridica, setAreaJuridica] = useState<string>(initialArea || "Civil");
  const [contexto, setContexto] = useState<string>(initialContexto || "");
  const [objetivo, setObjetivo] = useState<string>("");
  const [partesEnvolvidas, setPartesEnvolvidas] = useState<string>("");
  const [legislacao, setLegislacao] = useState<string>("");
  const [detalhes, setDetalhes] = useState<string>("");
  const [estrategia, setEstrategia] = useState<EstrategiaIA>("direct");
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('promptjur_selected_model') || 'manus:default';
  });
  // Estado para o documento com jurisprudência incorporada
  const [documentoComJurisprudencia, setDocumentoComJurisprudencia] = useState<string>("");
  // Estado para o groupId do histórico de versões (persiste entre gerações do mesmo caso)
  const [currentGroupId, setCurrentGroupId] = useState<string>(() => crypto.randomUUID());

  // Atualizar campos quando props iniciais mudam (navegação da aba Análise)
  useEffect(() => {
    if (initialContexto) setContexto(initialContexto);
  }, [initialContexto]);
  useEffect(() => {
    if (initialArea) setAreaJuridica(initialArea);
  }, [initialArea]);

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    localStorage.setItem('promptjur_selected_model', value);
  };

  // Utils para invalidar cache
  const utils = trpc.useUtils();

  // Mutation para salvar versão no histórico
  const salvarVersaoMutation = trpc.documentVersions.salvar.useMutation({
    onSuccess: () => {
      // Invalidar cache do histórico silenciosamente
      utils.documentVersions.listarGrupos.invalidate();
    },
  });

  const geracaoMutation = trpc.documentos.gerar.useMutation({
    onSuccess: (data) => {
      toast.success("Documento gerado com sucesso!");
      // Inicializar o documento editável com o resultado
      setDocumentoComJurisprudencia(data.documento);

      // Salvar automaticamente no histórico de versões
      const tipoLabel = TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento;
      salvarVersaoMutation.mutate({
        groupId: currentGroupId,
        titulo: `${tipoLabel} — ${areaJuridica}`,
        tipoDocumento,
        areaJuridica,
        estrategia: data.estrategiaUsada,
        contexto,
        objetivo: objetivo || undefined,
        partesEnvolvidas: partesEnvolvidas || undefined,
        legislacao: legislacao || undefined,
        detalhes: detalhes || undefined,
        documento: data.documento,
        tempoGeracaoMs: data.tempoGeracao,
        metadata: {
          validacaoLegislacao: data.validacaoLegislacao,
          metadados: data.metadados,
        },
      });
    },
    onError: (error) => {
      toast.error(`Erro ao gerar documento: ${error.message}`);
    },
  });

  const handleGerar = () => {
    if (!contexto.trim()) {
      toast.error("Por favor, descreva o contexto do caso");
      return;
    }

    const { provider, model } = parseModelValue(selectedModel);
    geracaoMutation.mutate({
      tipoDocumento,
      areaJuridica,
      contexto,
      objetivo: objetivo || undefined,
      partesEnvolvidas: partesEnvolvidas || undefined,
      legislacao: legislacao || undefined,
      detalhes: detalhes || undefined,
      estrategia,
      provider,
      model,
    });
  };

  const handleVoltar = () => {
    geracaoMutation.reset();
    setDocumentoComJurisprudencia("");
    toast.info("Resultado limpo. Você pode ajustar os campos e gerar novamente.");
  };

  // Iniciar novo grupo (novo caso)
  const handleNovoGrupo = () => {
    setCurrentGroupId(crypto.randomUUID());
    setContexto("");
    setObjetivo("");
    setPartesEnvolvidas("");
    setLegislacao("");
    setDetalhes("");
    setDocumentoComJurisprudencia("");
    geracaoMutation.reset();
    toast.info("Novo caso iniciado. As próximas gerações serão agrupadas separadamente.");
  };

  // Callback para carregar versão do histórico
  const handleCarregarVersao = useCallback((versao: {
    documento: string;
    tipoDocumento: string;
    areaJuridica: string;
    estrategia: string;
    contexto: string;
  }) => {
    setTipoDocumento(versao.tipoDocumento);
    setAreaJuridica(versao.areaJuridica);
    setEstrategia(versao.estrategia as EstrategiaIA);
    setContexto(versao.contexto);
    setDocumentoComJurisprudencia(versao.documento);
  }, []);

  const handleIncorporarJurisprudencia = (citacao: string) => {
    setDocumentoComJurisprudencia(prev => prev + citacao);
  };

  const salvarModeloMutation = trpc.modelosPersonalizados.criar.useMutation({
    onSuccess: () => {
      toast.success("Documento salvo como modelo com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar modelo: ${error.message}`);
    },
  });

  const handleSalvarComoModelo = () => {
    if (!geracaoMutation.data) return;

    const nomeModelo = prompt(
      "Digite um nome para o modelo:",
      `Modelo ${TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento}`
    );

    if (!nomeModelo) return;

    salvarModeloMutation.mutate({
      nome: nomeModelo,
      descricao: `Documento gerado com estratégia ${ESTRATEGIAS[geracaoMutation.data.estrategiaUsada].nome}`,
      template: documentoComJurisprudencia || geracaoMutation.data.documento,
      areaJuridica,
      tipoDocumento,
      isPublico: false,
    });
  };

  const exportarDocxMutation = trpc.prompts.exportarDocx.useMutation({
    onSuccess: (data) => {
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
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Documento exportado: ${data.filename}`);
    },
    onError: (error) => {
      toast.error(`Erro ao exportar: ${error.message}`);
    },
  });

  const exportarPdfMutation = trpc.prompts.exportarPdf.useMutation({
    onSuccess: (data) => {
      const byteCharacters = atob(data.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Documento exportado: ${data.filename}`);
    },
    onError: (error) => {
      toast.error(`Erro ao exportar PDF: ${error.message}`);
    },
  });

  const handleExportarDocx = () => {
    if (!geracaoMutation.data) {
      toast.error("Nenhum documento gerado para exportar");
      return;
    }

    const tipoLabel = TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento;
    exportarDocxMutation.mutate({
      promptId: 0,
      titulo: `Documento Jurídico - ${tipoLabel}`,
      conteudo: documentoComJurisprudencia || geracaoMutation.data.documento,
      incluirCabecalho: true,
      incluirDataHora: true
    });
  };

  // Integrações Google
  const [showGmailDialog, setShowGmailDialog] = useStateDialog(false);
  const [gmailTo, setGmailTo] = useStateDialog("");

  const exportarDriveMutation = trpc.integracoes.exportarParaDrive.useMutation({
    onSuccess: (data) => {
      toast.success(
        <span>
          Documento enviado para o Google Drive!{" "}
          <a href={data.webViewLink} target="_blank" rel="noopener noreferrer" className="underline">
            Abrir no Drive
          </a>
        </span>
      );
    },
    onError: (err) => {
      if (err.message.includes("não configurada")) {
        toast.error("Conecte o Google Drive em Configurações → Integrações");
      } else {
        toast.error(`Erro ao exportar para Drive: ${err.message}`);
      }
    },
  });

  const enviarGmailMutation = trpc.integracoes.enviarPorGmail.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado por Gmail com sucesso!");
      setShowGmailDialog(false);
      setGmailTo("");
    },
    onError: (err) => {
      if (err.message.includes("não configurada")) {
        toast.error("Conecte o Gmail em Configurações → Integrações");
      } else {
        toast.error(`Erro ao enviar por Gmail: ${err.message}`);
      }
    },
  });

  const handleExportarDrive = () => {
    if (!geracaoMutation.data) {
      toast.error("Nenhum documento gerado para exportar");
      return;
    }
    const tipoLabel = TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento;
    exportarDriveMutation.mutate({
      fileName: `PromptJur - ${tipoLabel} - ${new Date().toLocaleDateString('pt-BR')}.txt`,
      content: documentoComJurisprudencia || geracaoMutation.data.documento,
    });
  };

  const handleEnviarGmail = () => {
    if (!geracaoMutation.data) {
      toast.error("Nenhum documento gerado para enviar");
      return;
    }
    setShowGmailDialog(true);
  };

  const confirmarEnvioGmail = () => {
    if (!gmailTo.trim() || !geracaoMutation.data) return;
    const tipoLabel = TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento;
    const conteudo = documentoComJurisprudencia || geracaoMutation.data.documento;
    enviarGmailMutation.mutate({
      to: gmailTo.trim(),
      subject: `PromptJur - ${tipoLabel} - ${new Date().toLocaleDateString('pt-BR')}`,
      body: `<pre style="font-family: Georgia, serif; white-space: pre-wrap;">${conteudo}</pre>`,
      attachmentName: `documento-juridico.txt`,
      attachmentContent: conteudo,
    });
  };

  const handleExportarPdf = () => {
    if (!geracaoMutation.data) {
      toast.error("Nenhum documento gerado para exportar");
      return;
    }

    const tipoLabel = TIPOS_DOCUMENTO.find(t => t.value === tipoDocumento)?.label || tipoDocumento;
    exportarPdfMutation.mutate({
      promptId: 0,
      titulo: `Documento Jurídico - ${tipoLabel}`,
      conteudo: documentoComJurisprudencia || geracaoMutation.data.documento,
      incluirCabecalho: true,
      incluirDataHora: true
    });
  };

  // Texto do prompt completo para pesquisa jurisprudencial
  const textoParaPesquisa = geracaoMutation.data
    ? documentoComJurisprudencia || geracaoMutation.data.documento
    : `${contexto}\n${objetivo}\n${partesEnvolvidas}\n${legislacao}\n${detalhes}`.trim();

  return (
    <div className="space-y-6">
      {/* Histórico de Versões — recolhível por padrão */}
      <Card>
        <HistoricoVersoes onCarregarVersao={handleCarregarVersao} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Geração Avançada de Documentos Jurídicos
          </CardTitle>
          <CardDescription>
            Gere documentos jurídicos completos usando estratégias avançadas de IA inspiradas no Manus AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!geracaoMutation.data ? (
            <>
              <ModelSelector
                value={selectedModel}
                onChange={handleModelChange}
                disabled={geracaoMutation.isPending}
              />
              {/* Seleção de Estratégia */}
              <div className="space-y-3">
                <Label>Estratégia de IA</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(Object.entries(ESTRATEGIAS) as [EstrategiaIA, EstrategiaInfo][]).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => setEstrategia(key)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        estrategia === key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {info.icone}
                        <span className="font-semibold">{info.nome}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{info.descricao}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de Documento e Área */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo-documento">Tipo de Documento</Label>
                  <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                    <SelectTrigger id="tipo-documento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area-juridica">Área Jurídica</Label>
                  <Select value={areaJuridica} onValueChange={setAreaJuridica}>
                    <SelectTrigger id="area-juridica">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS_JURIDICAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contexto (obrigatório) */}
              <div className="space-y-2">
                <Label htmlFor="contexto">
                  Contexto do Caso <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="contexto"
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                  placeholder="Descreva detalhadamente o contexto do caso jurídico..."
                  className="min-h-[120px]"
                />
              </div>

              {/* Objetivo */}
              <div className="space-y-2">
                <Label htmlFor="objetivo">Objetivo do Documento</Label>
                <Textarea
                  id="objetivo"
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  placeholder="Qual o objetivo específico deste documento?"
                  className="min-h-[80px]"
                />
              </div>

              {/* Partes Envolvidas */}
              <div className="space-y-2">
                <Label htmlFor="partes">Partes Envolvidas</Label>
                <Textarea
                  id="partes"
                  value={partesEnvolvidas}
                  onChange={(e) => setPartesEnvolvidas(e.target.value)}
                  placeholder="Liste as partes envolvidas (autor, réu, testemunhas, etc.)"
                  className="min-h-[80px]"
                />
              </div>

              {/* Legislação */}
              <div className="space-y-2">
                <Label htmlFor="legislacao">Legislação Relevante</Label>
                <Textarea
                  id="legislacao"
                  value={legislacao}
                  onChange={(e) => setLegislacao(e.target.value)}
                  placeholder="Cite leis, artigos, súmulas ou jurisprudências relevantes"
                  className="min-h-[80px]"
                />
              </div>

              {/* Detalhes Adicionais */}
              <div className="space-y-2">
                <Label htmlFor="detalhes">Detalhes Adicionais</Label>
                <Textarea
                  id="detalhes"
                  value={detalhes}
                  onChange={(e) => setDetalhes(e.target.value)}
                  placeholder="Informações complementares, prazos, valores, etc."
                  className="min-h-[80px]"
                />
              </div>

              {/* Botão Gerar */}
              <Button
                onClick={handleGerar}
                disabled={geracaoMutation.isPending || !contexto.trim()}
                className="w-full"
                size="lg"
              >
                {ESTRATEGIAS[estrategia].icone}
                <span className="ml-2">Gerar Documento Jurídico</span>
              </Button>

              {/* Skeleton de geração com feedback visual detalhado */}
              {geracaoMutation.isPending && (
                <DocumentGenerationSkeleton
                  estrategia={estrategia}
                  tipoDocumento={tipoDocumento}
                />
              )}
            </>
          ) : (
            /* Resultado */
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-semibold">Documento Gerado</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {ESTRATEGIAS[geracaoMutation.data.estrategiaUsada].nome}
                    </Badge>
                    <Badge variant="outline">
                      {geracaoMutation.data.tempoGeracao}ms
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={handleVoltar} variant="outline" size="sm">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Voltar
                  </Button>
                  <Button onClick={handleSalvarComoModelo} variant="outline" size="sm">
                    <Save className="mr-2 w-4 h-4" />
                    Salvar como Modelo
                  </Button>
                  <Button 
                    onClick={handleExportarDocx} 
                    variant="outline" 
                    size="sm"
                    disabled={exportarDocxMutation.isPending}
                  >
                    {exportarDocxMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 w-4 h-4" />
                        Exportar DOCX
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleExportarPdf} 
                    variant="default" 
                    size="sm"
                    disabled={exportarPdfMutation.isPending}
                  >
                    {exportarPdfMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 w-4 h-4" />
                        Exportar PDF
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExportarDrive}
                    variant="outline"
                    size="sm"
                    disabled={exportarDriveMutation.isPending}
                    title="Exportar para Google Drive"
                  >
                    {exportarDriveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <HardDrive className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={handleEnviarGmail}
                    variant="outline"
                    size="sm"
                    disabled={enviarGmailMutation.isPending}
                    title="Enviar por Gmail"
                  >
                    {enviarGmailMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Validação de Legislação */}
              {geracaoMutation.data.validacaoLegislacao.totalCitacoes > 0 && (
                <Alert>
                  <AlertDescription>
                    <strong>Validação de Legislação:</strong> {geracaoMutation.data.validacaoLegislacao.totalCitacoes} citações detectadas
                    ({geracaoMutation.data.validacaoLegislacao.citacoesValidadas} validadas) - 
                    Confiabilidade: {geracaoMutation.data.validacaoLegislacao.confiabilidadeGeral}
                  </AlertDescription>
                </Alert>
              )}

              {/* Pesquisa Jurisprudencial — integrada ao resultado */}
              <PesquisaJurisprudencial
                promptTexto={textoParaPesquisa}
                areaJuridica={areaJuridica}
                tipoDocumento={tipoDocumento}
                onIncorporar={handleIncorporarJurisprudencia}
              />

              {/* Documento */}
              <div className="p-6 bg-card border border-border rounded-lg">
                <LazyStreamdown>{documentoComJurisprudencia || geracaoMutation.data.documento}</LazyStreamdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Dialog: Enviar por Gmail */}
      <Dialog open={showGmailDialog} onOpenChange={(o) => !o && setShowGmailDialog(false)}>
        <DialogContent className="bg-[#1a2332] border-[#d4af37]/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#d4af37] flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Enviar Documento por Gmail
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              O documento será enviado como corpo do e-mail e também como anexo em formato .txt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Destinatário</Label>
              <Input
                type="email"
                value={gmailTo}
                onChange={(e) => setGmailTo(e.target.value)}
                placeholder="destinatario@exemplo.com"
                className="bg-[#0a0e1a] border-[#d4af37]/20 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGmailDialog(false)}
              className="border-[#d4af37]/20 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarEnvioGmail}
              disabled={!gmailTo.trim() || enviarGmailMutation.isPending}
              className="bg-[#d4af37] hover:bg-[#b8962e] text-black"
            >
              {enviarGmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
