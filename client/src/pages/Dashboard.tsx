import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Scale, Sparkles, Zap, Shield, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AREAS_JURIDICAS } from "@/const";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("analisar");

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

  // Estado para Geração
  const [areaGeracao, setAreaGeracao] = useState<string>("");
  const [objetivoGeracao, setObjetivoGeracao] = useState("");
  const [nivelDetalhe, setNivelDetalhe] = useState([7]);
  const [incluirReferencias, setIncluirReferencias] = useState(true);
  const geracaoMutation = trpc.prompts.gerar.useMutation({
    onSuccess: () => {
      toast.success("Prompt gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro na geração: ${error.message}`);
    }
  });

  // Estado para Otimização
  const [promptOtimizacao, setPromptOtimizacao] = useState("");
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
    
    console.log('[DEBUG] Chamando mutation com:', { prompt: promptAnalise });
    try {
      analiseMutation.mutate({ prompt: promptAnalise });
      console.log('[DEBUG] Mutation chamada com sucesso');
    } catch (error) {
      console.error('[DEBUG] Erro ao chamar mutation:', error);
    }
  };

  const handleGerar = async () => {
    if (!areaGeracao || !objetivoGeracao.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    geracaoMutation.mutate({
      area: areaGeracao,
      objetivo: objetivoGeracao,
      nivelDetalhe: nivelDetalhe[0],
      incluirReferencias,
    });
  };

  const handleOtimizar = async () => {
    if (!promptOtimizacao.trim()) {
      toast.error("Por favor, insira um prompt para otimizar");
      return;
    }
    otimizacaoMutation.mutate({ prompt: promptOtimizacao });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Olá, {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="analisar" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Analisar Prompt
            </TabsTrigger>
            <TabsTrigger value="gerar" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Gerar Prompt
            </TabsTrigger>
            <TabsTrigger value="otimizar" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Otimizar Prompt
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-analise">Prompt para Análise</Label>
                  <Textarea
                    id="prompt-analise"
                    placeholder="Cole aqui o prompt que deseja analisar..."
                    value={promptAnalise}
                    onChange={(e) => setPromptAnalise(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                <Button 
                  onClick={handleAnalisar} 
                  disabled={analiseMutation.isPending}
                  className="w-full"
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

                {analiseMutation.data && (
                  <div className="mt-6 space-y-4 p-6 bg-card border border-border rounded-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Resultado da Análise</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(analiseMutation.data, null, 2))}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
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
                  Geração de Prompt Jurídico
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros abaixo para gerar um prompt jurídico otimizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="area-geracao">Área Jurídica *</Label>
                    <Select value={areaGeracao} onValueChange={setAreaGeracao}>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nivel-detalhe">
                      Nível de Detalhe: {nivelDetalhe[0]}
                    </Label>
                    <Slider
                      id="nivel-detalhe"
                      min={1}
                      max={10}
                      step={1}
                      value={nivelDetalhe}
                      onValueChange={setNivelDetalhe}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      1 = Básico | 10 = Muito Detalhado
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objetivo-geracao">Objetivo do Prompt *</Label>
                  <Textarea
                    id="objetivo-geracao"
                    placeholder="Descreva o que você deseja que o prompt faça (ex: redigir petição inicial de ação de cobrança)"
                    value={objetivoGeracao}
                    onChange={(e) => setObjetivoGeracao(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <Button 
                  onClick={handleGerar} 
                  disabled={geracaoMutation.isPending}
                  className="w-full"
                >
                  {geracaoMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 w-4 h-4" />
                      Gerar Prompt
                    </>
                  )}
                </Button>

                {geracaoMutation.data && (
                  <div className="mt-6 space-y-4 p-6 bg-card border border-border rounded-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Prompt Gerado</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(geracaoMutation.data?.promptGerado || "")}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-sm">
                      <Streamdown className="text-sm font-mono whitespace-pre-wrap">
                        {geracaoMutation.data.promptGerado}
                      </Streamdown>
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-otimizacao">Prompt para Otimizar</Label>
                  <Textarea
                    id="prompt-otimizacao"
                    placeholder="Cole aqui o prompt que deseja otimizar..."
                    value={promptOtimizacao}
                    onChange={(e) => setPromptOtimizacao(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                <Button 
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
                    {/* Prompt Original */}
                    <div className="p-6 bg-card border border-border rounded-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Prompt Original</h3>
                        <Badge variant="outline">Antes</Badge>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-sm">
                        <p className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
                          {otimizacaoMutation.data.promptOriginal}
                        </p>
                      </div>
                    </div>

                    {/* Melhorias Aplicadas */}
                    {otimizacaoMutation.data.melhorias && otimizacaoMutation.data.melhorias.length > 0 && (
                      <div className="p-6 bg-card border border-border rounded-sm">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Melhorias Aplicadas</h3>
                        <ul className="space-y-2">
                          {otimizacaoMutation.data.melhorias.map((melhoria: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{melhoria}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Prompt Otimizado */}
                    <div className="p-6 bg-card border border-primary/20 rounded-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Prompt Otimizado</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Depois</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(otimizacaoMutation.data?.promptOtimizado || "")}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-sm">
                        <Streamdown className="text-sm font-mono whitespace-pre-wrap">
                          {otimizacaoMutation.data.promptOtimizado}
                        </Streamdown>
                      </div>
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
        </Tabs>
      </main>
    </div>
  );
}
