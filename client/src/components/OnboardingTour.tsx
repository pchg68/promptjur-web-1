import { useEffect, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";

/**
 * Onboarding tour minimalista — sem dependências externas.
 *
 * Por que não usar Driver.js? Para Sprint 1 queremos zero novas dependências
 * (mantém a PR pequena, sem risco de quebra de bundler/lockfile). Esta
 * implementação cobre 95% dos casos: highlight de elementos via clip-path
 * inverso, popover posicionado e estado controlado.
 *
 * Uso:
 *   <OnboardingTour
 *     storageKey="promptjur-onboarding-v1"
 *     steps={[
 *       { selector: "[data-tour='wizard-toggle']", title: "...", body: "..." }
 *     ]}
 *   />
 *
 * O componente:
 *  - Verifica `localStorage[storageKey]` — se já visitou, não exibe.
 *  - Persiste "concluído" ao terminar ou pular.
 *  - Reage a resize/scroll (recalcula posição do destaque).
 */

export interface TourStep {
  /** Seletor CSS do elemento a destacar. Se vazio, o passo é centralizado na tela. */
  selector?: string;
  title: string;
  body: string;
  /** Posicionamento preferido do popover relativo ao alvo */
  placement?: "bottom" | "top" | "left" | "right";
}

interface OnboardingTourProps {
  steps: TourStep[];
  storageKey?: string;
  /** Forçar reabrir o tour (ignora localStorage). */
  forceOpen?: boolean;
  /** Callback chamado ao concluir/pular o tour. */
  onClose?: () => void;
}

const PADDING = 8;

export function OnboardingTour({
  steps,
  storageKey = "promptjur-onboarding-v1",
  forceOpen = false,
  onClose,
}: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Decide se mostra o tour na primeira render
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    try {
      const seen = localStorage.getItem(storageKey);
      if (!seen) setIsOpen(true);
    } catch {
      // localStorage indisponível (modo privado, etc) — abre uma vez por sessão
      setIsOpen(true);
    }
  }, [forceOpen, storageKey]);

  // Calcula a posição do elemento alvo do passo atual
  const computeTargetRect = useCallback(() => {
    const step = steps[stepIndex];
    if (!step?.selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    // Aguarda o scroll completar antes de medir
    requestAnimationFrame(() => {
      setTargetRect(el.getBoundingClientRect());
    });
  }, [stepIndex, steps]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    computeTargetRect();
    const handler = () => computeTargetRect();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [isOpen, computeTargetRect]);

  const finish = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(storageKey, new Date().toISOString());
    } catch {
      /* ignore */
    }
    onClose?.();
  }, [storageKey, onClose]);

  const next = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  if (!isOpen || steps.length === 0) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  // Posicionamento do popover
  let popoverStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 10001,
  };

  if (targetRect) {
    const placement = step.placement ?? "bottom";
    const popoverWidth = 380;
    const margin = 16;

    let top = targetRect.bottom + margin;
    let left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    if (placement === "top") top = targetRect.top - margin - 200;
    if (placement === "left") {
      top = targetRect.top + targetRect.height / 2 - 100;
      left = targetRect.left - margin - popoverWidth;
    }
    if (placement === "right") {
      top = targetRect.top + targetRect.height / 2 - 100;
      left = targetRect.right + margin;
    }
    // Clamp dentro da viewport
    left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, left));
    top = Math.max(16, Math.min(window.innerHeight - 220, top));
    popoverStyle = {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      zIndex: 10001,
      transform: "none",
    };
  }

  // Highlight via duas máscaras retangulares (sem clip-path por compatibilidade)
  const highlight = targetRect ? (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
        borderRadius: 8,
        pointerEvents: "none",
        zIndex: 10000,
        transition: "all 200ms ease",
      }}
    />
  ) : (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 10000,
        pointerEvents: "none",
      }}
    />
  );

  const content = (
    <>
      {highlight}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        style={popoverStyle}
        className="rounded-lg border bg-card text-card-foreground shadow-2xl p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Passo {stepIndex + 1} de {steps.length}
            </p>
            <h3 id="onboarding-title" className="text-base font-semibold leading-tight">
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label="Fechar tour"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step.body}</p>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
            Pular
          </Button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={prev}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {isLast ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Concluir
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
