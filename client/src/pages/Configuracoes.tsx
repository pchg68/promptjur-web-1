import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { trpc } from "@/lib/trpc";
import { Settings, Trash2, User, BarChart3, Palette, Zap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Configuracoes() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { preferences, setPreferredMode, resetPreferences } = useUserPreferences();
  
  // Buscar estatísticas do usuário
  const { data: stats } = trpc.prompts.stats.useQuery(undefined, {
    enabled: !!user
  });

  const handleResetPreferences = () => {
    if (confirm("Tem certeza que deseja resetar todas as suas preferências? Esta ação não pode ser desfeita.")) {
      resetPreferences();
      toast.success("Preferências resetadas com sucesso!");
    }
  };

  const handleToggleMode = () => {
    const newMode = preferences.preferredMode === 'wizard' ? 'advanced' : 'wizard';
    setPreferredMode(newMode);
    toast.success(`Modo ${newMode === 'wizard' ? 'Assistido' : 'Avançado'} definido como padrão`);
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

  const platformNames = {
    manus: 'Manus',
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    perplexity: 'Perplexity'
  };

  const modeNames = {
    wizard: 'Modo Assistido',
    advanced: 'Modo Avançado'
  };

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
                <Settings className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          
          {/* Preferências */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle>Preferências</CardTitle>
              </div>
              <CardDescription>
                Gerencie suas preferências de uso da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Última Plataforma de IA */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Última Plataforma de IA Usada</Label>
                <div className="flex items-center gap-3">
                  {preferences.lastAIPlatform ? (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {platformNames[preferences.lastAIPlatform as keyof typeof platformNames]}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Nenhuma plataforma usada ainda</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta plataforma será destacada nos dropdowns "Testar Prompt"
                </p>
              </div>

              <Separator />

              {/* Modo Preferido */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Modo de Uso Preferido</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-sm">
                      {modeNames[preferences.preferredMode as keyof typeof modeNames]}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {preferences.preferredMode === 'wizard' 
                        ? 'Interface guiada passo a passo para iniciantes'
                        : 'Interface completa com todos os campos visíveis'}
                    </p>
                  </div>
                  <Switch
                    checked={preferences.preferredMode === 'wizard'}
                    onCheckedChange={handleToggleMode}
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Estatísticas Pessoais */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <CardTitle>Estatísticas Pessoais</CardTitle>
              </div>
              <CardDescription>
                Resumo do seu uso da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total de Prompts</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalPrompts || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Favoritos</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalFavoritos || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Análises</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalAnalises || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gerações</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalGeracoes || 0}</p>
                </div>
              </div>

              {stats?.areasMaisUsadas && stats.areasMaisUsadas.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Áreas Jurídicas Mais Usadas</Label>
                    <div className="flex flex-wrap gap-2">
                      {stats.areasMaisUsadas.slice(0, 5).map((area: any) => (
                        <Badge key={area.area} variant="outline" className="text-xs">
                          {area.area} ({area.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle>Aparência</CardTitle>
              </div>
              <CardDescription>
                Personalize a aparência da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Tema</Label>
                <Badge variant="secondary" className="text-sm">
                  Tema Escuro (Padrão)
                </Badge>
                <p className="text-xs text-muted-foreground">
                  O tema escuro está ativo por padrão para melhor experiência visual
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ações Perigosas */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              </div>
              <CardDescription>
                Ações irreversíveis que afetam suas configurações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-sm">
                  <div>
                    <p className="font-semibold text-foreground">Resetar Preferências</p>
                    <p className="text-sm text-muted-foreground">
                      Remove todas as preferências salvas (plataforma, modo, tema)
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleResetPreferences}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
