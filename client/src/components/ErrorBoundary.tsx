/**
 * ErrorBoundary integrado com Sentry
 * 
 * Captura erros de componentes React e envia para o Sentry automaticamente.
 * Exibe uma UI de fallback amigável com opções de recuperação.
 * 
 * Funciona em dois modos:
 * - Com Sentry ativo: usa Sentry.ErrorBoundary para captura automática
 * - Sem Sentry: usa ErrorBoundary nativo do React como fallback
 */

import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home, Bug } from "lucide-react";
import { Component, ReactNode } from "react";
import { Sentry, isSentryActive, captureException } from "@/_core/sentry";

interface Props {
  children: ReactNode;
  /** Fallback personalizado (opcional) */
  fallback?: ReactNode;
  /** Callback quando um erro é capturado */
  onError?: (error: Error, componentStack: string) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

/**
 * Componente de fallback exibido quando ocorre um erro
 */
function ErrorFallback({ 
  error, 
  eventId, 
  onReset 
}: { 
  error: Error | null; 
  eventId?: string | null;
  onReset?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-background">
      <div className="flex flex-col items-center w-full max-w-lg text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle size={32} className="text-red-400" />
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          Ocorreu um erro inesperado
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6">
          Nosso sistema de monitoramento já foi notificado e estamos trabalhando para resolver.
        </p>

        {error && (
          <div className="p-4 w-full rounded-lg bg-muted/50 border border-border overflow-auto mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Bug size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Detalhes do Erro
              </span>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </div>
        )}

        {eventId && (
          <p className="text-xs text-muted-foreground mb-4">
            ID do evento: <code className="bg-muted px-1 py-0.5 rounded text-xs">{eventId}</code>
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (onReset) onReset();
              window.location.reload();
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "bg-primary text-primary-foreground",
              "hover:opacity-90 cursor-pointer transition-opacity"
            )}
          >
            <RotateCcw size={14} />
            Recarregar Página
          </button>
          
          <button
            onClick={() => window.location.href = "/"}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "bg-muted text-muted-foreground",
              "hover:bg-muted/80 cursor-pointer transition-colors"
            )}
          >
            <Home size={14} />
            Ir para Início
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ErrorBoundary principal com integração Sentry
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capturar no Sentry com contexto do componente React
    captureException(error, {
      componentStack: errorInfo.componentStack || "unknown",
      errorBoundary: "ErrorBoundary",
    });
    
    // Callback personalizado
    this.props.onError?.(error, errorInfo.componentStack || "");
    
    console.error("[ErrorBoundary] Erro capturado:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorFallback 
          error={this.state.error} 
          eventId={this.state.eventId}
          onReset={() => this.setState({ hasError: false, error: null, eventId: null })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper que usa Sentry.ErrorBoundary quando disponível,
 * ou o ErrorBoundary nativo como fallback.
 */
export function SentryErrorBoundary({ children, fallback, onError }: Props) {
  if (isSentryActive()) {
    return (
      <Sentry.ErrorBoundary
        fallback={({ error, eventId }: { error: unknown; componentStack: string; eventId: string; resetError: () => void }) => {
          if (fallback) return fallback as React.ReactElement;
          return <ErrorFallback error={error instanceof Error ? error : new Error(String(error))} eventId={eventId} />;
        }}
        onError={(error, componentStack) => {
          console.error("[Sentry.ErrorBoundary] Erro capturado:", error);
          onError?.(error as Error, componentStack);
        }}
        showDialog={false}
      >
        {children}
      </Sentry.ErrorBoundary>
    );
  }
  
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
