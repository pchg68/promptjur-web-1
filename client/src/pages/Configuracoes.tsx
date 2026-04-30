import { useAuth } from "@/_core/hooks/useAuth";
import { IntegracoesPanel } from "@/components/IntegracoesPanel";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Building2, Download, Eye, Loader2, Mail, MapPin, Phone, Save, Scale, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Configuracoes() {
  const { user, loading: authLoading } = useAuth();
  const [nomeEscritorio, setNomeEscritorio] = useState("");
  const [oab, setOab] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  // Buscar dados salvos
  const { data: cabecalhoData, isLoading: loadingCabecalho } = trpc.cabecalho.get.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  // Mutation para salvar
  const salvarMutation = trpc.cabecalho.salvar.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  // Preencher campos quando dados forem carregados
  useEffect(() => {
    if (cabecalhoData) {
      setNomeEscritorio(cabecalhoData.nomeEscritorio || "");
      setOab(cabecalhoData.oab || "");
      setEndereco(cabecalhoData.endereco || "");
      setTelefone(cabecalhoData.telefone || "");
      setEmail(cabecalhoData.email || "");
    }
  }, [cabecalhoData]);

  const handleSalvar = () => {
    // Validação básica
    if (!nomeEscritorio.trim()) {
      toast.error("Nome do escritório é obrigatório");
      return;
    }

    salvarMutation.mutate({
      nomeEscritorio: nomeEscritorio.trim(),
      oab: oab.trim() || undefined,
      endereco: endereco.trim() || undefined,
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
    });
  };

  if (authLoading || loadingCabecalho) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#1a2332] to-[#0a0e1a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#1a2332] to-[#0a0e1a]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar autenticado para acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#1a2332] to-[#0a0e1a]">
      {/* Header */}
      <header className="border-b border-[#d4af37]/20 bg-[#1a2332]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-[#d4af37]" />
            <div>
              <h1 className="text-xl font-bold text-white">{APP_TITLE}</h1>
              <p className="text-sm text-gray-400">Configurações do Escritório</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="border-[#d4af37]/20 bg-[#1a2332]/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-white">
              <Building2 className="w-6 h-6 text-[#d4af37]" />
              Dados do Escritório
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure os dados do seu escritório que serão incluídos no cabeçalho dos documentos exportados (DOCX).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome do Escritório */}
            <div className="space-y-2">
              <Label htmlFor="nomeEscritorio" className="text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#d4af37]" />
                Nome do Escritório *
              </Label>
              <Input
                id="nomeEscritorio"
                placeholder="Ex: Silva & Advogados Associados"
                value={nomeEscritorio}
                onChange={(e) => setNomeEscritorio(e.target.value)}
                className="bg-[#0a0e1a]/50 border-[#d4af37]/30 text-white placeholder:text-gray-500"
              />
            </div>

            {/* OAB */}
            <div className="space-y-2">
              <Label htmlFor="oab" className="text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#d4af37]" />
                Número da OAB
              </Label>
              <Input
                id="oab"
                placeholder="Ex: OAB/SP 123.456"
                value={oab}
                onChange={(e) => setOab(e.target.value)}
                className="bg-[#0a0e1a]/50 border-[#d4af37]/30 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="endereco" className="text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#d4af37]" />
                Endereço Completo
              </Label>
              <Textarea
                id="endereco"
                placeholder="Ex: Rua Exemplo, 123 - Sala 45&#10;Centro, São Paulo - SP&#10;CEP: 01234-567"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                rows={3}
                className="bg-[#0a0e1a]/50 border-[#d4af37]/30 text-white placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#d4af37]" />
                Telefone
              </Label>
              <Input
                id="telefone"
                placeholder="Ex: (11) 98765-4321"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="bg-[#0a0e1a]/50 border-[#d4af37]/30 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#d4af37]" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: contato@escritorio.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#0a0e1a]/50 border-[#d4af37]/30 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Pré-visualização do Cabeçalho */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#d4af37]" />
                Pré-visualização do Cabeçalho
              </Label>
              <div className="bg-white text-black p-6 rounded-lg border-2 border-[#d4af37]/30">
                {/* Simulação do cabeçalho DOCX */}
                <div className="space-y-2 font-sans">
                  {nomeEscritorio ? (
                    <p className="font-bold text-lg text-center">{nomeEscritorio}</p>
                  ) : (
                    <p className="text-gray-400 text-center italic">Nome do Escritório</p>
                  )}
                  
                  {oab && <p className="text-sm text-center">{oab}</p>}
                  
                  {endereco && (
                    <p className="text-sm text-center whitespace-pre-line">{endereco}</p>
                  )}
                  
                  <div className="flex justify-center gap-4 text-sm">
                    {telefone && <span>Tel: {telefone}</span>}
                    {email && <span>Email: {email}</span>}
                  </div>
                  
                  <p className="text-xs text-center text-gray-500 mt-4 pt-2 border-t border-gray-300">
                    Gerado em: {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                {!nomeEscritorio && !oab && !endereco && !telefone && !email && (
                  <p className="text-gray-400 text-center text-sm mt-4">
                    Preencha os campos acima para ver a pré-visualização
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Esta é uma representação aproximada de como o cabeçalho aparecerá nos documentos DOCX exportados.
              </p>
            </div>

            {/* Botão Salvar */}
            <div className="pt-4 border-t border-[#d4af37]/20">
              <Button
                onClick={handleSalvar}
                disabled={salvarMutation.isPending}
                className="w-full bg-[#d4af37] hover:bg-[#b8941f] text-[#1a2332] font-semibold"
              >
                {salvarMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>

            {/* Informação adicional */}
            <div className="text-sm text-gray-400 bg-[#0a0e1a]/30 p-4 rounded-lg border border-[#d4af37]/10">
              <p className="font-semibold text-[#d4af37] mb-2">ℹ️ Como funciona:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Estes dados serão incluídos automaticamente no cabeçalho dos documentos DOCX exportados</li>
                <li>Apenas o nome do escritório é obrigatório</li>
                <li>Os demais campos são opcionais e podem ser preenchidos conforme necessário</li>
                <li>Você pode atualizar estas informações a qualquer momento</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        {/* Configurações de Notificações */}
        <div className="mt-6">
          <Card className="border-[#d4af37]/20 bg-[#1a2332]/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-white">
                🔔 Notificações
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure como e quando deseja receber notificações do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </div>

        {/* Painel de Integrações */}
        <div className="mt-6">
          <IntegracoesPanel />
        </div>

        {/* Exportar Dados e Excluir Conta — LGPD */}
        <div className="mt-6">
          <ExcluirContaSection />
        </div>
      </main>
    </div>
  );
}

// ─── Seção de Exclusão de Conta (LGPD Art. 18) ─────────────────────────────
function ExcluirContaSection() {
  const [confirmacao, setConfirmacao] = useState("");
  const [motivo, setMotivo] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const exportarDados = trpc.account.exportarDados.useQuery(undefined, { enabled: false });
  const excluirConta = trpc.account.excluirConta.useMutation({
    onSuccess: () => {
      toast.success("Conta excluída com sucesso. Você será redirecionado.");
      setTimeout(() => { window.location.href = "/"; }, 2000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleExportar = async () => {
    try {
      const result = await exportarDados.refetch();
      if (result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `promptjur_meus_dados_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Dados exportados com sucesso!");
      }
    } catch {
      toast.error("Erro ao exportar dados. Tente novamente.");
    }
  };

  const handleExcluir = () => {
    if (confirmacao !== "EXCLUIR MINHA CONTA") {
      toast.error('Digite exatamente "EXCLUIR MINHA CONTA" para confirmar.');
      return;
    }
    excluirConta.mutate({ confirmacao, motivo: motivo.trim() || undefined });
  };

  return (
    <Card className="border-red-500/30 bg-[#1a2332]/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-white">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Dados Pessoais e Conta
        </CardTitle>
        <CardDescription className="text-gray-400">
          Gerencie seus dados pessoais conforme a LGPD (Lei 13.709/2018, Art. 18).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exportar Dados */}
        <div className="p-4 rounded-lg border border-[#d4af37]/20 bg-[#0a0e1a]/30">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Download className="w-4 h-4 text-[#d4af37]" />
            Exportar Meus Dados (Portabilidade)
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Baixe uma cópia de todos os seus dados pessoais armazenados no PromptJur em formato JSON.
          </p>
          <Button
            variant="outline"
            onClick={handleExportar}
            disabled={exportarDados.isFetching}
            className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
          >
            {exportarDados.isFetching ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportando...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> Exportar Dados</>
            )}
          </Button>
        </div>

        {/* Excluir Conta */}
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-950/10">
          <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Excluir Minha Conta
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Esta ação é <strong className="text-red-400">irreversível</strong>. Todos os seus dados, prompts, documentos e configurações serão permanentemente excluídos.
          </p>

          {!showConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowConfirm(true)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Solicitar Exclusão
            </Button>
          ) : (
            <div className="space-y-4 mt-4 p-4 rounded border border-red-500/20 bg-red-950/20">
              <div className="space-y-2">
                <Label className="text-red-300 text-sm">
                  Motivo da exclusão (opcional)
                </Label>
                <Input
                  placeholder="Por que está excluindo sua conta?"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="bg-[#0a0e1a]/50 border-red-500/30 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-red-300 text-sm">
                  Para confirmar, digite: <code className="bg-red-950/50 px-2 py-0.5 rounded text-red-200">EXCLUIR MINHA CONTA</code>
                </Label>
                <Input
                  placeholder="EXCLUIR MINHA CONTA"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  className="bg-[#0a0e1a]/50 border-red-500/30 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setShowConfirm(false); setConfirmacao(""); setMotivo(""); }}
                  className="border-gray-500/30 text-gray-400"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleExcluir}
                  disabled={confirmacao !== "EXCLUIR MINHA CONTA" || excluirConta.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {excluirConta.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...</>
                  ) : (
                    <><Trash2 className="w-4 h-4 mr-2" /> Confirmar Exclusão</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-red-300/70">
                Ao confirmar, seus dados serão excluídos permanentemente conforme LGPD Art. 18, V. Registros de auditoria anonimizados podem ser mantidos por até 5 anos para fins legais.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
