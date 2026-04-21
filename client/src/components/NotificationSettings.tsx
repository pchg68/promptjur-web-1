import { useState } from "react";
import { Bell, Mail, Smartphone, Volume2, CheckCircle, AlertCircle, Info, AlertTriangle, Settings2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

export function NotificationSettings() {
  const utils = trpc.useUtils();
  const { data: prefs, isLoading } = trpc.notificationPreferences.get.useQuery();
  const { permission, isSubscribed, isLoading: pushLoading, isSupported, subscribe, unsubscribe, sendTest } = usePushNotifications();

  const updateMutation = trpc.notificationPreferences.update.useMutation({
    onSuccess: () => {
      utils.notificationPreferences.get.invalidate();
      toast.success("Preferências salvas");
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const handleToggle = (field: string, value: boolean) => {
    updateMutation.mutate({ [field]: value } as any);
  };

  const handleEmailDigest = (value: string) => {
    updateMutation.mutate({ emailDigest: value as any });
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const ok = await subscribe();
      if (ok) updateMutation.mutate({ pushEnabled: true });
    } else {
      const ok = await unsubscribe();
      if (ok) updateMutation.mutate({ pushEnabled: false });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pushActive = isSubscribed && prefs?.pushEnabled;

  return (
    <div className="space-y-6">
      {/* Canais de entrega */}
      <Card className="bg-[#0d1b2e] border-[#1e3a5f]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <Settings2 className="w-4 h-4 text-blue-400" />
            Canais de entrega
          </CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            Escolha como deseja receber suas notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* In-app (sempre ativo) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <Label className="text-sm font-medium text-white">Notificações in-app</Label>
                <p className="text-xs text-gray-400 mt-0.5">Sino no topo da página</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
              Sempre ativo
            </Badge>
          </div>

          <Separator className="bg-[#1e3a5f]" />

          {/* E-mail */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <Label className="text-sm font-medium text-white">E-mail</Label>
                <p className="text-xs text-gray-400 mt-0.5">Receber alertas por e-mail</p>
              </div>
            </div>
            <Switch
              checked={prefs?.emailEnabled ?? true}
              onCheckedChange={(v) => handleToggle("emailEnabled", v)}
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Frequência de e-mail */}
          {prefs?.emailEnabled && (
            <div className="ml-11 flex items-center gap-3">
              <Label className="text-xs text-gray-400 whitespace-nowrap">Frequência:</Label>
              <Select
                value={(prefs as any)?.emailDigest ?? "imediato"}
                onValueChange={handleEmailDigest}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger className="h-8 text-xs bg-[#0a1628] border-[#1e3a5f] text-white w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1b2e] border-[#1e3a5f]">
                  <SelectItem value="imediato" className="text-xs text-white">Imediato</SelectItem>
                  <SelectItem value="diario" className="text-xs text-white">Resumo diário</SelectItem>
                  <SelectItem value="nunca" className="text-xs text-white">Nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator className="bg-[#1e3a5f]" />

          {/* Push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <Label className="text-sm font-medium text-white">Push (browser)</Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  {!isSupported
                    ? "Não suportado neste navegador"
                    : permission === "denied"
                    ? "Permissão negada — habilite nas configurações do navegador"
                    : "Notificações mesmo com o site fechado"}
                </p>
              </div>
            </div>
            <Switch
              checked={pushActive}
              onCheckedChange={handlePushToggle}
              disabled={!isSupported || permission === "denied" || pushLoading || updateMutation.isPending}
            />
          </div>

          {/* Botão de teste push */}
          {pushActive && (
            <div className="ml-11">
              <Button
                variant="outline"
                size="sm"
                onClick={sendTest}
                disabled={pushLoading}
                className="h-8 text-xs border-[#1e3a5f] text-gray-300 hover:text-white"
              >
                <Send className="w-3 h-3 mr-1.5" />
                Enviar notificação de teste
              </Button>
            </div>
          )}

          <Separator className="bg-[#1e3a5f]" />

          {/* Som */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <Label className="text-sm font-medium text-white">Som</Label>
                <p className="text-xs text-gray-400 mt-0.5">Reproduzir som ao receber notificação</p>
              </div>
            </div>
            <Switch
              checked={prefs?.soundEnabled ?? true}
              onCheckedChange={(v) => handleToggle("soundEnabled", v)}
              disabled={updateMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos de notificação */}
      <Card className="bg-[#0d1b2e] border-[#1e3a5f]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <Bell className="w-4 h-4 text-blue-400" />
            Tipos de notificação
          </CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            Escolha quais categorias deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { field: "tiposSucesso", label: "Sucesso", desc: "Operações concluídas com êxito", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
            { field: "tiposAlerta", label: "Alertas", desc: "Avisos importantes que requerem atenção", icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { field: "tiposErro", label: "Erros", desc: "Falhas e problemas que precisam ser resolvidos", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
            { field: "tiposInfo", label: "Informações", desc: "Atualizações e novidades do sistema", icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
            { field: "tiposSistema", label: "Sistema", desc: "Manutenções, backups e eventos técnicos", icon: Settings2, color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map(({ field, label, desc, icon: Icon, color, bg }) => (
            <div key={field} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-white">{label}</Label>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
              <Switch
                checked={(prefs as any)?.[field] ?? true}
                onCheckedChange={(v) => handleToggle(field, v)}
                disabled={updateMutation.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
