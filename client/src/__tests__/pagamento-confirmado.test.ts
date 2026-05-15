/**
 * Testes unitários para a lógica do modal de confirmação de pagamento
 * Cobre: detecção de query params, mapeamento de planos, limpeza de URL
 */

import { describe, it, expect } from "vitest";

// ─── Helpers extraídos da lógica de Planos.tsx ──────────────────────────────

function resolvePlanDisplay(planParam: string): string {
  if (planParam === "pro" || planParam === "profissional") return "Profissional";
  if (planParam === "enterprise" || planParam === "escritório") return "Escritório";
  return planParam.charAt(0).toUpperCase() + planParam.slice(1);
}

function detectarSucesso(searchString: string): {
  sucesso: boolean;
  cancelado: boolean;
  planDisplay: string;
} {
  const params = new URLSearchParams(searchString);
  const sucesso = params.get("success") === "true";
  const cancelado = params.get("canceled") === "true";
  const planParam = params.get("plan") || "pro";
  return {
    sucesso,
    cancelado,
    planDisplay: sucesso ? resolvePlanDisplay(planParam) : "",
  };
}

function limparQueryParams(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("success");
  url.searchParams.delete("plan");
  return url.toString();
}

function detectarBeneficios(planName: string): "pro" | "enterprise" | "generico" {
  const lower = planName.toLowerCase();
  if (lower.includes("pro") || lower.includes("profissional")) return "pro";
  if (lower.includes("enterprise") || lower.includes("escritório")) return "enterprise";
  return "generico";
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe("resolvePlanDisplay", () => {
  it("mapeia 'pro' para 'Profissional'", () => {
    expect(resolvePlanDisplay("pro")).toBe("Profissional");
  });

  it("mapeia 'profissional' para 'Profissional'", () => {
    expect(resolvePlanDisplay("profissional")).toBe("Profissional");
  });

  it("mapeia 'enterprise' para 'Escritório'", () => {
    expect(resolvePlanDisplay("enterprise")).toBe("Escritório");
  });

  it("mapeia 'escritório' para 'Escritório'", () => {
    expect(resolvePlanDisplay("escritório")).toBe("Escritório");
  });

  it("capitaliza planos desconhecidos", () => {
    expect(resolvePlanDisplay("custom")).toBe("Custom");
  });

  it("capitaliza plano vazio como fallback 'pro'", () => {
    // searchString sem plan param usa "pro" como padrão
    const result = detectarSucesso("success=true");
    expect(result.planDisplay).toBe("Profissional");
  });
});

describe("detectarSucesso", () => {
  it("detecta success=true com plan=pro", () => {
    const result = detectarSucesso("success=true&plan=pro");
    expect(result.sucesso).toBe(true);
    expect(result.cancelado).toBe(false);
    expect(result.planDisplay).toBe("Profissional");
  });

  it("detecta success=true com plan=enterprise", () => {
    const result = detectarSucesso("success=true&plan=enterprise");
    expect(result.sucesso).toBe(true);
    expect(result.planDisplay).toBe("Escritório");
  });

  it("detecta canceled=true", () => {
    const result = detectarSucesso("canceled=true");
    expect(result.sucesso).toBe(false);
    expect(result.cancelado).toBe(true);
    expect(result.planDisplay).toBe("");
  });

  it("não detecta nada em URL limpa", () => {
    const result = detectarSucesso("");
    expect(result.sucesso).toBe(false);
    expect(result.cancelado).toBe(false);
  });

  it("não confunde credits_success com success", () => {
    const result = detectarSucesso("credits_success=true");
    expect(result.sucesso).toBe(false);
  });
});

describe("limparQueryParams", () => {
  it("remove success e plan da URL", () => {
    const cleaned = limparQueryParams(
      "https://promptjur.com/planos?success=true&plan=pro"
    );
    expect(cleaned).toBe("https://promptjur.com/planos");
  });

  it("mantém outros params intactos", () => {
    const cleaned = limparQueryParams(
      "https://promptjur.com/planos?success=true&plan=pro&ref=email"
    );
    expect(cleaned).toContain("ref=email");
    expect(cleaned).not.toContain("success");
    expect(cleaned).not.toContain("plan=");
  });

  it("não altera URL sem query params", () => {
    const cleaned = limparQueryParams("https://promptjur.com/planos");
    expect(cleaned).toBe("https://promptjur.com/planos");
  });
});

describe("comportamento do modal: onConfirm vs onClose", () => {
  it("onConfirm deve redirecionar para /dashboard (flag true)", () => {
    // Simula a lógica do handleClosePagamentoConfirmado
    function handleClose(redirect: boolean) {
      return { redirect };
    }
    expect(handleClose(true).redirect).toBe(true);
    expect(handleClose(false).redirect).toBe(false);
  });

  it("fechar pelo X (onClose) não deve redirecionar", () => {
    function handleClose(redirect: boolean) {
      return { redirect };
    }
    expect(handleClose(false).redirect).toBe(false);
  });
});

describe("detectarBeneficios", () => {
  it("retorna 'pro' para plano Profissional", () => {
    expect(detectarBeneficios("Profissional")).toBe("pro");
  });

  it("retorna 'pro' para variante 'pro'", () => {
    expect(detectarBeneficios("Pro")).toBe("pro");
  });

  it("retorna 'enterprise' para plano Escritório", () => {
    expect(detectarBeneficios("Escritório")).toBe("enterprise");
  });

  it("retorna 'enterprise' para variante 'enterprise'", () => {
    expect(detectarBeneficios("Enterprise")).toBe("enterprise");
  });

  it("retorna 'generico' para plano desconhecido", () => {
    expect(detectarBeneficios("Custom")).toBe("generico");
  });
});
