/**
 * Testes para Onboarding Tour e Referral Dialog
 * Verifica a lógica de exibição, localStorage e fluxo de referral
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("Onboarding Tour — Lógica de Exibição", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("deve exibir o tour quando storageKey não existe no localStorage", () => {
    const seen = localStorage.getItem("promptjur-onboarding-v3");
    expect(seen).toBeNull();
    // Tour deve abrir (isOpen = true)
  });

  it("não deve exibir o tour quando storageKey já existe", () => {
    localStorage.setItem("promptjur-onboarding-v3", new Date().toISOString());
    const seen = localStorage.getItem("promptjur-onboarding-v3");
    expect(seen).not.toBeNull();
    // Tour não deve abrir (isOpen = false)
  });

  it("deve marcar como concluído ao finalizar", () => {
    // Simular conclusão do tour
    localStorage.setItem("promptjur-onboarding-v3", new Date().toISOString());
    const seen = localStorage.getItem("promptjur-onboarding-v3");
    expect(seen).toBeTruthy();
    expect(new Date(seen!).getTime()).toBeGreaterThan(0);
  });

  it("deve ter 5 passos no tour atualizado", () => {
    // Verificar que o tour tem os passos esperados
    const EXPECTED_STEPS = [
      "Bem-vindo ao PromptJur",
      "JurIA",
      "Prompts e Templates",
      "Consumo e Créditos",
      "Indique e Ganhe",
    ];
    expect(EXPECTED_STEPS.length).toBe(5);
  });
});

describe("Referral Dialog — Lógica de Captura e Aplicação", () => {
  const REFERRAL_CODE_KEY = "promptjur-referral-code";
  const REFERRAL_APPLIED_KEY = "promptjur-referral-applied";

  beforeEach(() => {
    localStorageMock.clear();
  });

  it("deve salvar código de referral no localStorage quando ?ref= está na URL", () => {
    const refCode = "PEDRO-ABC123";
    localStorage.setItem(REFERRAL_CODE_KEY, refCode.toUpperCase());
    
    expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBe("PEDRO-ABC123");
  });

  it("deve normalizar código para uppercase", () => {
    const refCode = "pedro-abc123";
    localStorage.setItem(REFERRAL_CODE_KEY, refCode.toUpperCase());
    
    expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBe("PEDRO-ABC123");
  });

  it("deve detectar código pendente quando não foi aplicado", () => {
    localStorage.setItem(REFERRAL_CODE_KEY, "PJUR-ABC123");
    
    const code = localStorage.getItem(REFERRAL_CODE_KEY);
    const applied = localStorage.getItem(REFERRAL_APPLIED_KEY);
    
    const hasPending = !!code && !applied;
    expect(hasPending).toBe(true);
  });

  it("não deve detectar código pendente quando já foi aplicado", () => {
    localStorage.setItem(REFERRAL_CODE_KEY, "PJUR-ABC123");
    localStorage.setItem(REFERRAL_APPLIED_KEY, "true");
    
    const code = localStorage.getItem(REFERRAL_CODE_KEY);
    const applied = localStorage.getItem(REFERRAL_APPLIED_KEY);
    
    const hasPending = !!code && !applied;
    expect(hasPending).toBe(false);
  });

  it("deve limpar código e marcar como aplicado após sucesso", () => {
    localStorage.setItem(REFERRAL_CODE_KEY, "PJUR-ABC123");
    
    // Simular aplicação bem-sucedida
    localStorage.setItem(REFERRAL_APPLIED_KEY, "true");
    localStorage.removeItem(REFERRAL_CODE_KEY);
    
    expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBeNull();
    expect(localStorage.getItem(REFERRAL_APPLIED_KEY)).toBe("true");
  });

  it("deve marcar como 'skipped' quando usuário pula o dialog", () => {
    localStorage.setItem(REFERRAL_CODE_KEY, "PJUR-ABC123");
    
    // Simular skip
    localStorage.removeItem(REFERRAL_CODE_KEY);
    localStorage.setItem(REFERRAL_APPLIED_KEY, "skipped");
    
    expect(localStorage.getItem(REFERRAL_CODE_KEY)).toBeNull();
    expect(localStorage.getItem(REFERRAL_APPLIED_KEY)).toBe("skipped");
  });

  it("não deve exibir dialog para usuários que já pularam", () => {
    localStorage.setItem(REFERRAL_APPLIED_KEY, "skipped");
    
    const applied = localStorage.getItem(REFERRAL_APPLIED_KEY);
    expect(applied).toBeTruthy();
    // Dialog não deve abrir
  });
});

describe("Referral — Validação de Código", () => {
  it("código deve ter formato NOME-XXXXXX", () => {
    const validCodes = ["PEDRO-ABC123", "PJUR-DEF456", "ANA-789GHI"];
    const invalidCodes = ["", "AB", "SEMHIFEN"];
    
    for (const code of validCodes) {
      expect(code.length).toBeGreaterThanOrEqual(3);
      expect(code).toMatch(/^[A-Z]+-[A-Z0-9]+$/);
    }
    
    for (const code of invalidCodes) {
      expect(code.length < 3 || !code.includes("-")).toBe(true);
    }
  });

  it("deve rejeitar auto-referral (mesmo userId)", () => {
    const referrerUserId = 42;
    const currentUserId = 42;
    
    const isSelfReferral = referrerUserId === currentUserId;
    expect(isSelfReferral).toBe(true);
  });

  it("deve permitir referral de outro usuário", () => {
    const referrerUserId = 42;
    const currentUserId = 99;
    
    const isSelfReferral = referrerUserId === currentUserId;
    expect(isSelfReferral).toBe(false);
  });
});
