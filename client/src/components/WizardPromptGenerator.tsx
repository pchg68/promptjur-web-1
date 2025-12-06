import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, ChevronLeft, Check, 
  FileSearch, Sparkles, RefreshCw,
  Scale, Briefcase, Users, Building2, TreePine, Shield, Landmark, Coins
} from "lucide-react";
import { AREAS_JURIDICAS } from "@/const";
import { EXEMPLOS_POR_AREA, type ExemploArea } from "@shared/exemplos-areas";

interface WizardPromptGeneratorProps {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

export interface WizardData {
  objetivo: 'analisar' | 'gerar' | 'otimizar';
  areaJuridica: string;
  descricaoCaso: string;
}

const OBJETIVOS = [
  {
    id: 'analisar' as const,
    titulo: 'Analisar Prompt Existente',
    descricao: 'Avalie a qualidade e identifique melhorias em um prompt jurídico',
    icon: FileSearch,
    cor: 'blue'
  },
  {
    id: 'gerar' as const,
    titulo: 'Gerar Novo Prompt',
    descricao: 'Crie um prompt jurídico profissional do zero',
    icon: Sparkles,
    cor: 'green'
  },
  {
    id: 'otimizar' as const,
    titulo: 'Otimizar Prompt',
    descricao: 'Melhore um prompt existente com técnicas avançadas',
    icon: RefreshCw,
    cor: 'purple'
  }
];

const AREAS_ICONS: Record<string, any> = {
  'Civil': Scale,
  'Penal': Shield,
  'Trabalhista': Briefcase,
  'Empresarial': Building2,
  'Tributário': Coins,
  'Consumidor': Users,
  'Ambiental': TreePine,
  'Constitucional': Landmark,
};

export function WizardPromptGenerator({ onComplete, onCancel }: WizardPromptGeneratorProps) {
  const [passo, setPasso] = useState(1);
  const [objetivo, setObjetivo] = useState<'analisar' | 'gerar' | 'otimizar' | null>(null);
  const [areaJuridica, setAreaJuridica] = useState<string>('');
  const [descricaoCaso, setDescricaoCaso] = useState('');
  const [mostrarExemplos, setMostrarExemplos] = useState(false);

  const handleProximo = () => {
    if (passo < 3) {
      setPasso(passo + 1);
    } else {
      // Finalizar wizard
      if (objetivo && (areaJuridica || descricaoCaso)) {
        onComplete({
          objetivo,
          areaJuridica: areaJuridica || 'auto',
          descricaoCaso
        });
      }
    }
  };

  const handleVoltar = () => {
    if (passo > 1) {
      setPasso(passo - 1);
    }
  };

  const podeAvancar = () => {
    switch (passo) {
      case 1:
        return objetivo !== null;
      case 2:
        return true; // Área jurídica é opcional (pode ser auto-detectada)
      case 3:
        return descricaoCaso.trim().length >= 20;
      default:
        return false;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Assistente de Prompts Jurídicos</CardTitle>
            <CardDescription>
              Siga os passos para criar ou analisar prompts de forma guiada
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            Passo {passo} de 3
          </Badge>
        </div>

        {/* Indicador de progresso */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center flex-1">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all
                  ${passo > num ? 'bg-primary border-primary text-primary-foreground' : ''}
                  ${passo === num ? 'border-primary text-primary' : ''}
                  ${passo < num ? 'border-muted text-muted-foreground' : ''}
                `}
              >
                {passo > num ? <Check className="w-4 h-4" /> : num}
              </div>
              {num < 3 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 transition-all
                    ${passo > num ? 'bg-primary' : 'bg-muted'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Passo 1: Escolha do Objetivo */}
        {passo === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">O que você deseja fazer?</h3>
              <p className="text-sm text-muted-foreground">
                Escolha uma das opções abaixo para começar
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {OBJETIVOS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = objetivo === opt.id;
                
                return (
                  <button
                    key={opt.id}
                    onClick={() => setObjetivo(opt.id)}
                    className={`
                      p-6 rounded-lg border-2 transition-all text-left
                      hover:border-primary hover:shadow-md
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}
                    `}
                  >
                    <div className="flex flex-col items-start gap-3">
                      <div className={`
                        p-3 rounded-lg
                        ${opt.cor === 'blue' ? 'bg-blue-500/10 text-blue-500' : ''}
                        ${opt.cor === 'green' ? 'bg-green-500/10 text-green-500' : ''}
                        ${opt.cor === 'purple' ? 'bg-purple-500/10 text-purple-500' : ''}
                      `}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{opt.titulo}</h4>
                        <p className="text-xs text-muted-foreground">{opt.descricao}</p>
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="mt-2">
                          <Check className="w-3 h-3 mr-1" />
                          Selecionado
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Passo 2: Seleção de Área Jurídica */}
        {passo === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Qual área jurídica?</h3>
              <p className="text-sm text-muted-foreground">
                Selecione a área principal ou deixe em branco para detecção automática
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {AREAS_JURIDICAS.map((area) => {
                const Icon = AREAS_ICONS[area] || Scale;
                const isSelected = areaJuridica === area;
                
                return (
                  <button
                    key={area}
                    onClick={() => setAreaJuridica(isSelected ? '' : area)}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      hover:border-primary hover:shadow-sm
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}
                    `}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{area}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {!areaJuridica && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-600">
                💡 <strong>Dica:</strong> Se não selecionar uma área, nossa IA identificará automaticamente com base no seu texto.
              </div>
            )}
          </div>
        )}

        {/* Passo 3: Descrição do Caso */}
        {passo === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {objetivo === 'analisar' && 'Cole o prompt que deseja analisar'}
                {objetivo === 'gerar' && 'Descreva o caso ou situação jurídica'}
                {objetivo === 'otimizar' && 'Cole o prompt que deseja otimizar'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {objetivo === 'analisar' && 'Cole o texto completo do prompt para análise detalhada'}
                {objetivo === 'gerar' && 'Forneça detalhes relevantes: partes envolvidas, valores, datas, pedidos, etc.'}
                {objetivo === 'otimizar' && 'Cole o prompt original que será aprimorado'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="descricao">
                  {objetivo === 'gerar' ? 'Descrição do Caso' : 'Prompt'}
                </Label>
                {areaJuridica && EXEMPLOS_POR_AREA[areaJuridica] && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarExemplos(!mostrarExemplos)}
                    className="text-xs"
                  >
                    {mostrarExemplos ? 'Ocultar' : 'Ver'} Exemplos
                  </Button>
                )}
              </div>
              {mostrarExemplos && areaJuridica && EXEMPLOS_POR_AREA[areaJuridica] && (
                <div className="mb-3 p-4 bg-muted/50 rounded-lg border space-y-3">
                  <p className="text-sm font-semibold">Exemplos de {areaJuridica}:</p>
                  {EXEMPLOS_POR_AREA[areaJuridica].map((exemplo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDescricaoCaso(exemplo.prompt);
                        setMostrarExemplos(false);
                      }}
                      className="w-full text-left p-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <p className="font-medium text-sm mb-1">{exemplo.titulo}</p>
                      <p className="text-xs text-muted-foreground">{exemplo.descricao}</p>
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                id="descricao"
                placeholder={
                  objetivo === 'analisar' 
                    ? 'Cole aqui o prompt que deseja analisar...'
                    : objetivo === 'gerar'
                    ? 'Ex: Cliente sofreu acidente de trânsito em 15/03/2024. Motorista embriagado colidiu na traseira do veículo. Danos materiais: R$ 15.000,00. Cliente sofreu lesões corporais leves. Busca indenização por danos morais e materiais...'
                    : 'Cole aqui o prompt que deseja otimizar...'
                }
                value={descricaoCaso}
                onChange={(e) => setDescricaoCaso(e.target.value)}
                className="min-h-[250px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {descricaoCaso.length} caracteres (mínimo: 20)
              </p>
            </div>

            {descricaoCaso.length >= 20 && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-start gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Pronto para continuar!</p>
                    <p className="text-xs">
                      {objetivo === 'analisar' && 'Vamos analisar a qualidade, área jurídica e sugerir melhorias'}
                      {objetivo === 'gerar' && 'Vamos criar um prompt profissional baseado nesta descrição'}
                      {objetivo === 'otimizar' && 'Vamos aprimorar este prompt com técnicas avançadas'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botões de navegação */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={passo === 1 ? onCancel : handleVoltar}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {passo === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          <Button
            onClick={handleProximo}
            disabled={!podeAvancar()}
          >
            {passo === 3 ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {objetivo === 'analisar' && 'Analisar Prompt'}
                {objetivo === 'gerar' && 'Gerar Prompt'}
                {objetivo === 'otimizar' && 'Otimizar Prompt'}
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
