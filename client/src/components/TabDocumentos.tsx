import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Sparkles, Brain, BookOpen, Save, Download, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AREAS_JURIDICAS } from "@shared/juridico";
import { Streamdown } from "streamdown";

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

export default function TabDocumentos() {
  const [tipoDocumento, setTipoDocumento] = useState<string>("peticao");
  const [areaJuridica, setAreaJuridica] = useState<string>("Civil");
  const [contexto, setContexto] = useState<string>("");
  const [objetivo, setObjetivo] = useState<string>("");
  const [partesEnvolvidas, setPartesEnvolvidas] = useState<string>("");
  const [legislacao, setLegislacao] = useState<string>("");
  const [detalhes, setDetalhes] = useState<string>("");
  const [estrategia, setEstrategia] = useState<EstrategiaIA>("direct");

  const geracaoMutation = trpc.documentos.gerar.useMutation({
    onSuccess: () => {
      toast.success("Documento gerado com sucesso!");
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

    geracaoMutation.mutate({
      tipoDocumento,
      areaJuridica,
      contexto,
      objetivo: objetivo || undefined,
      partesEnvolvidas: partesEnvolvidas || undefined,
      legislacao: legislacao || undefined,
      detalhes: detalhes || undefined,
      estrategia,
    });
  };

  const handleVoltar = () => {
    geracaoMutation.reset();
    toast.info("Resultado limpo. Você pode ajustar os campos e gerar novamente.");
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
      template: geracaoMutation.data.documento,
      areaJuridica,
      tipoDocumento,
      isPublico: false,
    });
  };

  const handleExportar = () => {
    // TODO: Implementar exportação DOCX
    toast.info("Funcionalidade de exportação será implementada em breve!");
  };

  return (
    <div className="space-y-6">
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
                {geracaoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Gerando documento com {ESTRATEGIAS[estrategia].nome}...
                  </>
                ) : (
                  <>
                    {ESTRATEGIAS[estrategia].icone}
                    <span className="ml-2">Gerar Documento Jurídico</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            /* Resultado */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
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
                <div className="flex items-center gap-2">
                  <Button onClick={handleVoltar} variant="outline" size="sm">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Voltar
                  </Button>
                  <Button onClick={handleSalvarComoModelo} variant="outline" size="sm">
                    <Save className="mr-2 w-4 h-4" />
                    Salvar como Modelo
                  </Button>
                  <Button onClick={handleExportar} variant="default" size="sm">
                    <Download className="mr-2 w-4 h-4" />
                    Exportar DOCX
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

              {/* Documento */}
              <div className="p-6 bg-card border border-border rounded-lg">
                <Streamdown>{geracaoMutation.data.documento}</Streamdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
