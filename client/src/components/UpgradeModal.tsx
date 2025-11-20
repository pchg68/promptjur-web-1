import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: "free" | "pro" | "enterprise";
}

export function UpgradeModal({ open, onClose, currentPlan }: UpgradeModalProps) {
  const plans = {
    pro: {
      name: "Pro",
      price: "R$ 99",
      period: "/mês",
      features: [
        "300 operações mensais",
        "Análise ilimitada de prompts",
        "Geração avançada com templates",
        "Otimização profissional",
        "Histórico completo",
        "Templates personalizados",
        "Suporte prioritário"
      ],
      icon: Zap,
      color: "text-blue-500"
    },
    enterprise: {
      name: "Enterprise",
      price: "R$ 299",
      period: "/mês",
      features: [
        "Operações ilimitadas",
        "Tudo do plano Pro",
        "API de integração",
        "Suporte dedicado 24/7",
        "Treinamento personalizado",
        "SLA garantido",
        "Consultoria jurídica"
      ],
      icon: Crown,
      color: "text-amber-500"
    }
  };

  const suggestedPlan = currentPlan === "free" ? "pro" : "enterprise";
  const plan = plans[suggestedPlan];
  const Icon = plan.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-6 h-6 ${plan.color}`} />
            Limite de Uso Atingido
          </DialogTitle>
          <DialogDescription>
            Você atingiu o limite do plano {currentPlan === "free" ? "gratuito" : "Pro"}. 
            Faça upgrade para continuar usando o PromptJur sem restrições.
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg p-6 bg-gradient-to-br from-background to-muted">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold">{plan.price}</span>
            <span className="text-muted-foreground">{plan.period}</span>
            <Badge variant="secondary" className="ml-auto">
              Recomendado
            </Badge>
          </div>

          <h3 className="font-semibold mb-3">Plano {plan.name}</h3>
          
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Continuar com Plano Atual
          </Button>
          <Button 
            onClick={() => {
              // TODO: Integrar com Stripe para upgrade
              window.open("https://help.manus.im", "_blank");
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            <Icon className="w-4 h-4 mr-2" />
            Fazer Upgrade Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
