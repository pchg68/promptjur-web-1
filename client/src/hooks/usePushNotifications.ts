import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const subscribeMutation = trpc.pushSubscriptions.subscribe.useMutation();
  const unsubscribeMutation = trpc.pushSubscriptions.unsubscribe.useMutation();
  const testMutation = trpc.pushSubscriptions.test.useMutation();

  // Verificar suporte e estado inicial
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);

    // Verificar se já tem subscrição ativa
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  // Registrar service worker
  const registerSW = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      return reg;
    } catch (err) {
      console.error("[Push] Erro ao registrar SW:", err);
      return null;
    }
  }, []);

  // Ativar notificações push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Seu navegador não suporta notificações push");
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      toast.error("Chave VAPID não configurada");
      return false;
    }

    setIsLoading(true);
    try {
      // Solicitar permissão
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);

      if (perm !== "granted") {
        toast.error("Permissão de notificações negada");
        return false;
      }

      const reg = await registerSW();
      if (!reg) {
        toast.error("Erro ao registrar service worker");
        return false;
      }

      // Criar subscrição push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        toast.error("Erro ao obter dados da subscrição push");
        return false;
      }

      // Salvar no servidor
      await subscribeMutation.mutateAsync({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent.substring(0, 200),
      });

      setIsSubscribed(true);
      toast.success("Notificações push ativadas!");
      return true;
    } catch (err) {
      console.error("[Push] Erro ao ativar push:", err);
      toast.error("Erro ao ativar notificações push");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [registerSW, subscribeMutation]);

  // Desativar notificações push
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        await unsubscribeMutation.mutateAsync({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success("Notificações push desativadas");
      return true;
    } catch (err) {
      console.error("[Push] Erro ao desativar push:", err);
      toast.error("Erro ao desativar notificações push");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribeMutation]);

  // Enviar notificação de teste
  const sendTest = useCallback(async () => {
    try {
      await testMutation.mutateAsync();
      toast.success("Notificação de teste enviada!");
    } catch {
      toast.error("Erro ao enviar notificação de teste");
    }
  }, [testMutation]);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported: permission !== "unsupported",
    subscribe,
    unsubscribe,
    sendTest,
  };
}
