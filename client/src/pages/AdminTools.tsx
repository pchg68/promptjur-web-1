import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Database, TestTube, AlertTriangle, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminTools() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [auditando, setAuditando] = useState(false);
  const [resultadoAuditoria, setResultadoAuditoria] = useState<any>(null);

  // Verificar se é admin
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    setLocation('/dashboard');
    return null;
  }

  const auditarSerializacao = trpc.admin.auditarSerializacao.useMutation({
    onSuccess: (data) => {
      setResultadoAuditoria(data);
      setAuditando(false);
      if (data.problemasEncontrados === 0) {
        toast.success("✅ Nenhum problema de serialização encontrado!");
      } else {
        toast.warning(`⚠️ ${data.problemasEncontrados} problema(s) encontrado(s)`);
      }
    },
    onError: (error) => {
      setAuditando(false);
      toast.error("Erro ao auditar: " + error.message);
    }
  });

  const limparCacheMutation = trpc.admin.limparCache.useMutation({
    onSuccess: () => {
      toast.success("Cache limpo com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao limpar cache: " + error.message);
    }
  });

  const estatisticasCacheQuery = trpc.admin.estatisticasCache.useQuery();

  const executarTestesMutation = trpc.admin.executarTestes.useMutation({
    onSuccess: (data) => {
      if (data.totalFalhas === 0) {
        toast.success(`✅ Todos os ${data.totalTestes} testes passaram!`);
      } else {
        toast.error(`❌ ${data.totalFalhas} de ${data.totalTestes} testes falharam`);
      }
    },
    onError: (error) => {
      toast.error("Erro ao executar testes: " + error.message);
    }
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Ferramentas Administrativas</h1>
            <p className="text-muted-foreground">Acesso restrito a administradores</p>
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Auditoria de Serialização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Auditoria de Serialização
              </CardTitle>
              <CardDescription>
                Verifica rotas tRPC e funções do banco que podem causar erros de serialização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => {
                  setAuditando(true);
                  auditarSerializacao.mutate();
                }}
                disabled={auditando}
                className="w-full"
              >
                {auditando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Auditando...
                  </>
                ) : (
                  "Executar Auditoria"
                )}
              </Button>

              {resultadoAuditoria && (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Rotas Analisadas</span>
                    <Badge variant="outline">{resultadoAuditoria.totalRotas}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Problemas Encontrados</span>
                    <Badge variant={resultadoAuditoria.problemasEncontrados > 0 ? "destructive" : "default"}>
                      {resultadoAuditoria.problemasEncontrados}
                    </Badge>
                  </div>
                  
                  {resultadoAuditoria.problemas && resultadoAuditoria.problemas.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium">Rotas Problemáticas:</p>
                      {resultadoAuditoria.problemas.map((p: any, i: number) => (
                        <div key={i} className="p-2 bg-destructive/10 rounded text-sm">
                          <code className="text-destructive">{p.rota}</code>
                          <p className="text-muted-foreground text-xs mt-1">{p.motivo}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gerenciamento de Cache */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Gerenciamento de Cache
              </CardTitle>
              <CardDescription>
                Controle e monitore o cache em memória do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {estatisticasCacheQuery.data && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Entradas em Cache</span>
                    <Badge variant="outline">{estatisticasCacheQuery.data.totalEntradas}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Taxa de Acerto</span>
                    <Badge variant="default">{estatisticasCacheQuery.data.taxaAcerto}%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Memória Usada</span>
                    <Badge variant="outline">{estatisticasCacheQuery.data.memoriaUsada}</Badge>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => limparCacheMutation.mutate()}
                disabled={limparCacheMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                {limparCacheMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Cache
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Testes de Integração */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Testes de Integração tRPC
              </CardTitle>
              <CardDescription>
                Valida serialização e funcionamento de todas as rotas tRPC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => executarTestesMutation.mutate()}
                disabled={executarTestesMutation.isPending}
                className="w-full"
              >
                {executarTestesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executando Testes...
                  </>
                ) : (
                  "Executar Todos os Testes"
                )}
              </Button>

              {executarTestesMutation.data && (
                <div className="space-y-3 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{executarTestesMutation.data.totalTestes}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{executarTestesMutation.data.totalSucessos}</p>
                      <p className="text-xs text-muted-foreground">Sucessos</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-destructive">{executarTestesMutation.data.totalFalhas}</p>
                      <p className="text-xs text-muted-foreground">Falhas</p>
                    </div>
                  </div>

                  {executarTestesMutation.data.falhas && executarTestesMutation.data.falhas.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium">Testes Falhados:</p>
                      {executarTestesMutation.data.falhas.map((f: any, i: number) => (
                        <div key={i} className="p-3 bg-destructive/10 rounded">
                          <p className="text-sm font-medium text-destructive">{f.teste}</p>
                          <p className="text-xs text-muted-foreground mt-1">{f.erro}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
