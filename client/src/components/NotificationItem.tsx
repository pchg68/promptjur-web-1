import { CheckCircle2, AlertTriangle, XCircle, Info, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface NotificationItemProps {
  notification: {
    id: number;
    tipo: "sucesso" | "alerta" | "erro" | "info" | "sistema";
    titulo: string;
    mensagem: string;
    lida: boolean;
    link: string | null;
    createdAt: string; // ISO string from server
  };
}

const tipoConfig = {
  sucesso: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  alerta: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  erro: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  sistema: {
    icon: Settings,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const config = tipoConfig[notification.tipo];
  const Icon = config.icon;

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("Notificação removida");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleClick = () => {
    // Marcar como lida ao clicar
    if (!notification.lida) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }

    // Navegar para link se existir
    if (notification.link) {
      setLocation(notification.link);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate({ notificationId: notification.id });
  };

  const timeAgo = (date: string | Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return "agora mesmo";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d atrás`;
    
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div
      className={cn(
        "p-4 hover:bg-accent/50 transition-colors cursor-pointer relative group",
        !notification.lida && "bg-accent/30"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Ícone */}
        <div className={cn("flex-shrink-0 mt-0.5", config.color)}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn("text-sm font-medium", !notification.lida && "font-semibold")}>
              {notification.titulo}
            </h4>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timeAgo(notification.createdAt)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.mensagem}
          </p>
          {!notification.lida && (
            <div className="w-2 h-2 rounded-full bg-primary absolute left-2 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Botão deletar (visível no hover) */}
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-8 w-8"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
