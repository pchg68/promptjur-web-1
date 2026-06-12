import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SeletorModeloPersonalizadoProps {
  onModeloPreenchido: (promptGerado: string) => void;
  areaJuridica?: string;
}

export function SeletorModeloPersonalizado({ onModeloPreenchido, areaJuridica }: SeletorModeloPersonalizadoProps) {
  const [modeloSelecionado, setModeloSelecionado] = useState<string>("");
  const [variaveis, setVariaveis] = useState<Record<string, string>>({});
  const [variaveisExtraidas, setVariaveisExtraidas] = useState<string[]>([]);
  
  // Buscar modelos personalizados do usuário
  const modelosQuery = trpc.modelosPersonalizados.listar.useQuery({});
  
  // Filtrar modelos por área jurídica se fornecida
  const modelosFiltrados = modelosQuery.data?.filter((modelo: any) => 
    !areaJuridica || modelo.areaJuridica === areaJuridica
  ) || [];
  
  // Extrair variáveis do template quando modelo é selecionado
  useEffect(() => {
    if (modeloSelecionado) {
      const modelo = modelosQuery.data?.find((m: any) => m.id.toString() === modeloSelecionado);
      if (modelo) {
        // Extrair variáveis no formato {{nome}}
        const regex = /\{\{(\w+)\}\}/g;
        const matches = modelo.template.matchAll(regex);
        const vars = Array.from(matches, (m: any) => m[1]);
        const uniqueVars = Array.from(new Set(vars));
        setVariaveisExtraidas(uniqueVars);
        
        // Inicializar objeto de variáveis
        const initialVars: Record<string, string> = {};
        uniqueVars.forEach(v => {
          initialVars[v] = "";
        });
        setVariaveis(initialVars);
      }
    } else {
      setVariaveisExtraidas([]);
      setVariaveis({});
    }
  }, [modeloSelecionado, modelosQuery.data]);
  
  const preencherModelo = () => {
    const modelo = modelosQuery.data?.find((m: any) => m.id.toString() === modeloSelecionado);
    if (!modelo) {
      toast.error("Modelo não encontrado");
      return;
    }
    
    // Verificar se todas as variáveis foram preenchidas
    const variaveisVazias = variaveisExtraidas.filter(v => !variaveis[v] || variaveis[v].trim() === "");
    if (variaveisVazias.length > 0) {
      toast.error(`Preencha todas as variáveis: ${variaveisVazias.join(", ")}`);
      return;
    }
    
    // Substituir variáveis no template
    let promptGerado = modelo.template;
    Object.entries(variaveis).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      promptGerado = promptGerado.replace(regex, value);
    });
    
    onModeloPreenchido(promptGerado);
    toast.success(`Modelo "${modelo.nome}" aplicado com sucesso!`);
    
    // Limpar seleção
    setModeloSelecionado("");
    setVariaveis({});
  };
  
  if (modelosQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando modelos...</div>;
  }
  
  if (!modelosQuery.data || modelosFiltrados.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Você ainda não possui modelos personalizados{areaJuridica && ` para ${areaJuridica}`}.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/meus-modelos">Criar Primeiro Modelo</a>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Usar Modelo Personalizado
        </CardTitle>
        <CardDescription>
          Selecione um dos seus modelos e preencha as variáveis para gerar o prompt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de Modelo */}
        <div className="space-y-2">
          <Label>Selecionar Modelo</Label>
          <Select value={modeloSelecionado} onValueChange={setModeloSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um modelo..." />
            </SelectTrigger>
            <SelectContent>
              {modelosFiltrados.map((modelo: any) => (
                <SelectItem key={modelo.id} value={modelo.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{modelo.nome}</span>
                    {modelo.isPublico && (
                      <Badge variant="secondary" className="text-xs">Público</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Campos de Variáveis */}
        {variaveisExtraidas.length > 0 && (
          <>
            <div className="border-t pt-4">
              <Label className="text-base mb-3 block">Preencher Variáveis</Label>
              <div className="space-y-3">
                {variaveisExtraidas.map(variavel => (
                  <div key={variavel} className="space-y-1">
                    <Label htmlFor={`var-${variavel}`} className="text-sm">
                      {variavel.charAt(0).toUpperCase() + variavel.slice(1).replace(/_/g, " ")}
                    </Label>
                    <Input
                      id={`var-${variavel}`}
                      placeholder={`Digite ${variavel}...`}
                      value={variaveis[variavel] || ""}
                      onChange={(e) => setVariaveis(prev => ({
                        ...prev,
                        [variavel]: e.target.value
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={preencherModelo}
              className="w-full"
              disabled={variaveisExtraidas.some(v => !variaveis[v])}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Aplicar Modelo
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
