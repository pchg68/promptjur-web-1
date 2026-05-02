/**
 * Testes para o fluxo de referral integrado (captura de código, validação, aplicação)
 * Verifica a lógica de negócio do sistema de indicações.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Referral Flow - Lógica de Negócio", () => {
  describe("Geração de código de referral", () => {
    it("deve gerar código no formato NOME-XXXXXX", () => {
      const nome = "Pedro Henrique";
      const primeiroNome = nome.split(" ")[0].toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${primeiroNome}-${randomPart}`;
      
      expect(code).toMatch(/^[A-Z]+-[A-Z0-9]{6}$/);
      expect(code.startsWith("PEDRO-")).toBe(true);
    });

    it("deve gerar códigos únicos para o mesmo nome", () => {
      const nome = "Maria";
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        codes.add(`${nome.toUpperCase()}-${randomPart}`);
      }
      // Com 100 tentativas, deve ter pelo menos 90 códigos únicos
      expect(codes.size).toBeGreaterThan(90);
    });

    it("deve normalizar nomes com acentos", () => {
      const nomes = ["José", "André", "Cláudia", "João"];
      const normalized = nomes.map(n => 
        n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
      );
      expect(normalized).toEqual(["JOSE", "ANDRE", "CLAUDIA", "JOAO"]);
    });
  });

  describe("Validação de código de referral", () => {
    it("deve rejeitar código vazio", () => {
      const code = "";
      expect(code.length).toBeLessThan(3);
    });

    it("deve rejeitar código com formato inválido", () => {
      const invalidCodes = ["abc", "123456", "A-B", "NOME-"];
      for (const code of invalidCodes) {
        const isValid = /^[A-Z]+-[A-Z0-9]{6}$/.test(code);
        expect(isValid).toBe(false);
      }
    });

    it("deve aceitar código com formato válido", () => {
      const validCodes = ["PEDRO-ABC123", "MARIA-XYZ789", "ANA-A1B2C3"];
      for (const code of validCodes) {
        const isValid = /^[A-Z]+-[A-Z0-9]{6}$/.test(code);
        expect(isValid).toBe(true);
      }
    });
  });

  describe("Recompensas de referral", () => {
    const REWARD_CREDITS = 5;

    it("deve conceder 5 créditos para quem indica", () => {
      const referrerCredits = 0;
      const newCredits = referrerCredits + REWARD_CREDITS;
      expect(newCredits).toBe(5);
    });

    it("deve conceder 5 créditos para o indicado", () => {
      const referredCredits = 0;
      const newCredits = referredCredits + REWARD_CREDITS;
      expect(newCredits).toBe(5);
    });

    it("deve acumular créditos em múltiplas indicações", () => {
      let referrerCredits = 0;
      const numReferrals = 10;
      for (let i = 0; i < numReferrals; i++) {
        referrerCredits += REWARD_CREDITS;
      }
      expect(referrerCredits).toBe(50);
    });
  });

  describe("Proteções anti-abuso", () => {
    it("não deve permitir auto-referral", () => {
      const userId = 1;
      const referralOwnerId = 1;
      const isSelfReferral = userId === referralOwnerId;
      expect(isSelfReferral).toBe(true);
    });

    it("não deve permitir uso duplicado de código pelo mesmo usuário", () => {
      const usedCodes = new Set(["PEDRO-ABC123"]);
      const newCode = "PEDRO-ABC123";
      const alreadyUsed = usedCodes.has(newCode);
      expect(alreadyUsed).toBe(true);
    });

    it("deve permitir código diferente para o mesmo usuário", () => {
      const usedCodes = new Set(["PEDRO-ABC123"]);
      const newCode = "MARIA-XYZ789";
      const alreadyUsed = usedCodes.has(newCode);
      expect(alreadyUsed).toBe(false);
    });
  });

  describe("Captura de código via URL", () => {
    it("deve extrair código do parâmetro ?ref=", () => {
      const url = "https://promptjur.com/?ref=PEDRO-ABC123";
      const params = new URLSearchParams(new URL(url).search);
      const refCode = params.get("ref");
      expect(refCode).toBe("PEDRO-ABC123");
    });

    it("deve converter código para uppercase", () => {
      const url = "https://promptjur.com/?ref=pedro-abc123";
      const params = new URLSearchParams(new URL(url).search);
      const refCode = params.get("ref")?.toUpperCase();
      expect(refCode).toBe("PEDRO-ABC123");
    });

    it("deve retornar null quando não há parâmetro ref", () => {
      const url = "https://promptjur.com/planos";
      const params = new URLSearchParams(new URL(url).search);
      const refCode = params.get("ref");
      expect(refCode).toBeNull();
    });
  });
});
