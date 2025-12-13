import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Scale, ArrowLeft, Copy, CheckCircle2, Cpu, Bot, MessageSquare, Sparkle, Search } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Comparador() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [plataformasSelecionadas, setPlataformasSelecionadas] = useState<Set<string>>(new Set(["manus"]));

  const plataformas = [
    { id: "manus", nome: "Manus", icon: Cpu, cor: "bg-blue-500/10 text-blue-400 border-blue-500/30", url: "https://manus.im/" },
    { id: "chatgpt", nome: "ChatGPT", icon: Bot, cor: "bg-green-500/10 text-green-400 border-green-500/30", url: "https://chatgpt.com/" },
    { id: "claude", nome: "Claude", icon: MessageSquare, cor: "bg-purple-500/10 text-purple-400 border-purple-500/30", url: "https://claude.ai/new" },
    { id: "gemini", nome: "Gemini", icon: Sparkle, cor: "bg-orange-500/10 text-orange-400 border-orange-500/30", url: "https://gemini.google.com/app" },
    { id: "perplexity", nome: "Perplexity", icon: Search, cor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", url: "https://www.perplexity.ai/" },
  ];

  const togglePlataforma = (id: string) => {
    const novaSelecao = new Set(plataformasSelecionadas);
    if (novaSelecao.has(id)) {
      if (novaSelecao.size > 1) {
        novaSelecao.delete(id);
      } else {
        toast.error("Selecione pelo menos uma plataforma");
        return;
      }
    } else {
      novaSelecao.add(id);
    }
    setPlataformasSelecionadas(novaSelecao);
  };

  const compararPlataformas = () => {
    if (!prompt.trim()) {
      toast.error("Digite um prompt para comparar");
      return;
    }

    if (plataformasSelecionadas.size === 0) {
      toast.error("Selecione pelo menos uma plataforma");
      return;
    }

    // Copiar prompt para clipboard
    navigator.clipboard.writeText(prompt);

    // Abrir todas as plataformas selecionadas em novas abas
    const plataformasArray = Array.from(plataformasSelecionadas);
    plataformasArray.forEach((platId) => {
      const plat = plataformas.find((p) => p.id === platId);
      if (plat) {
        window.open(plat.url, '_blank');
      }
    });

    toast.success(
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="font-semibold">Prompt copiado!</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {plataformasArray.length} {plataformasArray.length === 1 ? "plataforma aberta" : "plataformas abertas"}. Cole o prompt com Ctrl+V (ou Cmd+V) em cada aba para comparar.
        </span>
      </div>,
      {
        duration: 6000,
        className: "border-green-500/50 bg-green-500/10"
      }
    );
  };

  const copiarPrompt = () => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copiado para a área de transferência!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/dashboard")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Comparador de Plataformas</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          
          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle>Compare Resultados de Diferentes IAs</CardTitle>
              <CardDescription>
                Teste o mesmo prompt em múltiplas plataformas de IA simultaneamente e compare os resultados lado a lado para identificar qual oferece a melhor resposta para seu caso jurídico.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Prompt Input */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt para Comparação</CardTitle>
              <CardDescription>
                Digite ou cole o prompt jurídico que deseja testar em múltiplas plataformas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ex: Elabore uma petição inicial de ação de cobrança com base no Código Civil..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copiarPrompt}
                  disabled={!prompt.trim()}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Prompt
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {prompt.length} caracteres
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Plataformas */}
          <Card>
            <CardHeader>
              <CardTitle>Selecione as Plataformas para Comparar</CardTitle>
              <CardDescription>
                Escolha 2 ou mais plataformas de IA para testar o prompt simultaneamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plataformas.map((plat) => {
                  const Icon = plat.icon;
                  const selecionada = plataformasSelecionadas.has(plat.id);
                  return (
                    <div
                      key={plat.id}
                      className={`flex items-center gap-3 p-4 border rounded-sm cursor-pointer transition-all ${
                        selecionada
                          ? `${plat.cor} border-current`
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => togglePlataforma(plat.id)}
                    >
                      <Checkbox
                        checked={selecionada}
                        onCheckedChange={() => togglePlataforma(plat.id)}
                        className="pointer-events-none"
                      />
                      <Icon className="w-5 h-5" />
                      <Label className="flex-1 cursor-pointer font-semibold">
                        {plat.nome}
                      </Label>
                      {plat.id === "manus" && (
                        <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Recomendado
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Botão de Comparação */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Pronto para Comparar?
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Ao clicar no botão abaixo, o prompt será copiado automaticamente e {plataformasSelecionadas.size} {plataformasSelecionadas.size === 1 ? "plataforma será aberta" : "plataformas serão abertas"} em novas abas. Cole o prompt em cada uma delas com Ctrl+V (ou Cmd+V) e compare os resultados.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={compararPlataformas}
                  disabled={!prompt.trim() || plataformasSelecionadas.size === 0}
                  className="gap-2 px-8"
                >
                  <Scale className="w-5 h-5" />
                  Comparar em {plataformasSelecionadas.size} {plataformasSelecionadas.size === 1 ? "Plataforma" : "Plataformas"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">💡 Dicas para Comparação Eficaz</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Teste o mesmo prompt em todas as plataformas para garantir comparação justa</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Avalie critérios como precisão jurídica, clareza, estrutura e referências legais</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Anote qual plataforma ofereceu a melhor resposta para seu tipo de caso</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Use o histórico para registrar qual plataforma foi mais eficaz</span>
                </li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
