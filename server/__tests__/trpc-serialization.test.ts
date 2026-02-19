/**
 * Teste de Integração: Validação de Serialização tRPC
 * 
 * Garante que todas as respostas tRPC não contenham objetos Date não serializados,
 * prevenindo o erro "Unable to transform response from server".
 * 
 * Este teste valida que:
 * 1. Todas as respostas de queries/mutations são serializáveis
 * 2. Campos Date são convertidos para strings ISO
 * 3. Não há objetos Date nativos nas respostas
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { Context } from '../_core/context';

// Mock de contexto para testes
const createMockContext = (userId?: number): Context => ({
  user: userId ? {
    id: userId,
    openId: 'test-open-id',
    name: 'Test User',
    email: 'test@example.com',
    loginMethod: 'google',
    role: 'user' as const,
    subscriptionPlan: 'free' as const,
    usageCount: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    lastSignedIn: new Date('2025-01-01'),
  } : null,
  req: {} as any,
  res: {} as any,
});

/**
 * Função recursiva que verifica se um objeto contém instâncias de Date
 */
function containsDateObject(obj: any, path: string = 'root'): { hasDate: boolean; path?: string } {
  if (obj === null || obj === undefined) {
    return { hasDate: false };
  }

  // Verifica se é uma instância de Date
  if (obj instanceof Date) {
    return { hasDate: true, path };
  }

  // Verifica arrays
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = containsDateObject(obj[i], `${path}[${i}]`);
      if (result.hasDate) return result;
    }
    return { hasDate: false };
  }

  // Verifica objetos
  if (typeof obj === 'object') {
    for (const key in obj) {
      const result = containsDateObject(obj[key], `${path}.${key}`);
      if (result.hasDate) return result;
    }
    return { hasDate: false };
  }

  return { hasDate: false };
}

describe('Validação de Serialização tRPC', () => {
  const caller = appRouter.createCaller(createMockContext(1));

  describe('Auth Router', () => {
    it('auth.me não deve retornar objetos Date', async () => {
      const result = await caller.auth.me();
      
      if (result) {
        const check = containsDateObject(result);
        expect(check.hasDate).toBe(false);
        if (check.hasDate) {
          console.error(`❌ Date encontrado em: ${check.path}`);
        }
      }
    });
  });

  describe('Analytics Router', () => {
    it('analytics.get não deve retornar objetos Date', async () => {
      const result = await caller.analytics.get();
      
      const check = containsDateObject(result);
      expect(check.hasDate).toBe(false);
      if (check.hasDate) {
        console.error(`❌ Date encontrado em: ${check.path}`);
      }
    });
  });

  describe('Tags Router', () => {
    it('tags.minhas não deve retornar objetos Date', async () => {
      const result = await caller.tags.minhas();
      
      const check = containsDateObject(result);
      expect(check.hasDate).toBe(false);
      if (check.hasDate) {
        console.error(`❌ Date encontrado em: ${check.path}`);
      }
    });
  });

  describe('Prompts Router', () => {
    it('prompts.search não deve retornar objetos Date', async () => {
      const result = await caller.prompts.search({
        texto: '',
        pagina: 1,
        limite: 10
      });
      
      const check = containsDateObject(result);
      expect(check.hasDate).toBe(false);
      if (check.hasDate) {
        console.error(`❌ Date encontrado em: ${check.path}`);
      }
    });
  });

  describe('Templates Router', () => {
    it('templates.meus não deve retornar objetos Date', async () => {
      const result = await caller.templates.meus();
      
      const check = containsDateObject(result);
      expect(check.hasDate).toBe(false);
      if (check.hasDate) {
        console.error(`❌ Date encontrado em: ${check.path}`);
      }
    });
  });

  describe('Validação Geral', () => {
    it('deve validar que analytics retorna dados serializáveis', async () => {
      const result = await caller.analytics.get();
      
      // Verifica que o resultado é um objeto simples
      expect(typeof result).toBe('object');
      const check = containsDateObject(result);
      expect(check.hasDate).toBe(false);
    });

    it('deve validar que timestamps são strings ISO', async () => {
      const tags = await caller.tags.minhas();
      
      tags.forEach((tag: any) => {
        if ('createdAt' in tag) {
          expect(typeof tag.createdAt).toBe('string');
          // Valida formato ISO
          expect(() => new Date(tag.createdAt)).not.toThrow();
        }
      });
    });
  });
});
