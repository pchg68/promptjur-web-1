import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  ChevronDown,
  Zap,
  Crown,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

const PROVIDER_ICONS: Record<string, string> = {
  manus: "M",
  openai: "O",
  claude: "C",
  gemini: "G",
  perplexity: "P",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  pro: "Profissional",
  enterprise: "Escritório",
};

export function ProviderStatus() {
  const [isOpen, setIsOpen] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; latencyMs: number; message: string }>>({});
  
  const statusQuery = trpc.providerHealth.status.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const testMutation = trpc.providerHealth.testProvider.useMutation({
    onSuccess: (data) => {
      setTestResults(prev => ({
        ...prev,
        [data.provider]: {
          status: data.status,
          latencyMs: data.latencyMs,
          message: data.message,
        },
      }));
      if (data.status === "online") {
        toast.success(`${data.provider} respondeu em ${data.latencyMs}ms`);
      } else {
        toast.error(`Erro ao testar ${data.provider}: ${data.message}`);
      }
    },
    onError: (error) => {
      toast.error("Erro ao testar provedor", { description: error.message });
    },
    onSettled: () => {
      setTestingProvider(null);
    },
  });

  const handleTest = (providerId: string) => {
    setTestingProvider(providerId);
    testMutation.mutate({ provider: providerId as any });
  };

  if (statusQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando status dos provedores...
      </div>
    );
  }

  if (!statusQuery.data) return null;

  const { providers, userPlan, modelAccess } = statusQuery.data;
  const configuredCount = providers.filter(p => p.configured).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Provedores de IA</span>
            <Badge variant="outline" className="text-xs">
              {configuredCount}/{providers.length} ativos
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Crown className="h-3 w-3 mr-0.5" />
              {PLAN_LABELS[userPlan]}
            </Badge>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pt-2 px-1">
          {/* Provider list */}
          {providers.map((provider) => {
            const testResult = testResults[provider.id];
            const isTesting = testingProvider === provider.id;
            
            return (
              <div
                key={provider.id}
                className="flex items-center justify-between gap-3 p-2.5 bg-muted/30 rounded-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold ${
                    provider.configured ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {PROVIDER_ICONS[provider.id] || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{provider.name}</span>
                      {provider.configured ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {provider.modelsCount} modelo{provider.modelsCount > 1 ? "s" : ""}
                      {testResult && testResult.status === "online" && (
                        <span className="text-green-500 ml-1">
                          ({testResult.latencyMs}ms)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleTest(provider.id)}
                      disabled={isTesting || !provider.configured}
                    >
                      {isTesting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {provider.configured ? "Testar conectividade" : "Provedor não configurado"}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}

          {/* Model access summary */}
          <div className="flex items-center justify-between p-2.5 bg-muted/20 rounded-sm text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {modelAccess.accessible < modelAccess.total && <Lock className="h-3 w-3" />}
              {modelAccess.accessible}/{modelAccess.total} modelos acessíveis
            </span>
            {userPlan === "free" && (
              <span className="text-primary text-xs">
                Upgrade para mais modelos
              </span>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
