import { describe, it, expect } from 'vitest';
import { join } from 'path';

const ROOT = process.cwd();

/**
 * Testes para as correções de estabilidade aplicadas:
 * 1. Auth redirect loop prevention (main.tsx)
 * 2. SQL aggregation optimization (getHistoricoStats)
 * 3. SQL GROUP BY optimization (getAtividadePorDia)
 * 4. N+1 query fix (getHistoricoUnificado)
 */

describe('Correções de Estabilidade', () => {
  describe('Auth Redirect Loop Prevention', () => {
    it('deve ter cooldown de redirect configurado', async () => {
      const fs = await import('fs');
      const mainContent = fs.readFileSync(
        join(ROOT, 'client/src/main.tsx'),
        'utf-8'
      );

      expect(mainContent).toContain('REDIRECT_COOLDOWN_MS');
      expect(mainContent).toContain('lastRedirectTime');
      expect(mainContent).toContain('redirectScheduled');
    });

    it('deve ter retry configurado no QueryClient', async () => {
      const fs = await import('fs');
      const mainContent = fs.readFileSync(
        join(ROOT, 'client/src/main.tsx'),
        'utf-8'
      );

      expect(mainContent).toContain('retry: (failureCount, error)');
      expect(mainContent).toContain('return failureCount < 2');
      expect(mainContent).toContain('staleTime');
      expect(mainContent).toContain('refetchOnWindowFocus: false');
    });

    it('deve ignorar auth.me query no redirect', async () => {
      const fs = await import('fs');
      const mainContent = fs.readFileSync(
        join(ROOT, 'client/src/main.tsx'),
        'utf-8'
      );

      expect(mainContent).toContain('isAuthMeQuery');
      expect(mainContent).toContain('auth.me');
    });
  });

  describe('SQL Aggregation Optimization (getHistoricoStats)', () => {
    it('deve usar SQL COUNT/SUM/AVG em vez de carregar todos os registros', async () => {
      const fs = await import('fs');
      const dbContent = fs.readFileSync(
        join(ROOT, 'server/db/historico.ts'),
        'utf-8'
      );

      const statsSection = dbContent.substring(
        dbContent.indexOf('export async function getHistoricoStats'),
        dbContent.indexOf('export async function getHistoricoStats') + 2000
      );

      expect(statsSection).toContain('COUNT(*)');
      expect(statsSection).toContain('SUM(CASE WHEN');
      expect(statsSection).toContain('AVG(');
      expect(statsSection).toContain('MAX(');
      expect(statsSection).not.toContain('const allHistorico = await db.select().from(historico)');
    });

    it('deve usar SQL GROUP BY para contagem por ação', async () => {
      const fs = await import('fs');
      const dbContent = fs.readFileSync(
        join(ROOT, 'server/db/historico.ts'),
        'utf-8'
      );

      const statsSection = dbContent.substring(
        dbContent.indexOf('export async function getHistoricoStats'),
        dbContent.indexOf('export async function getHistoricoStats') + 2000
      );

      expect(statsSection).toContain('.groupBy(historico.acao)');
    });

    it('deve ter try/catch para resiliência', async () => {
      const fs = await import('fs');
      const dbContent = fs.readFileSync(
        join(ROOT, 'server/db/historico.ts'),
        'utf-8'
      );

      const startIdx = dbContent.indexOf('export async function getHistoricoStats');
      const endIdx = dbContent.indexOf('export async function getHistoricoUnificado');
      const statsSection = dbContent.substring(startIdx, endIdx);

      expect(statsSection).toContain('try {');
      expect(statsSection).toContain('} catch');
      expect(statsSection).toContain('return emptyResult');
    });
  });

  describe('SQL GROUP BY Optimization (getAtividadePorDia)', () => {
    it('deve usar SQL GROUP BY em vez de carregar todos os registros', async () => {
      const fs = await import('fs');
      const dbContent = fs.readFileSync(
        join(ROOT, 'server/db/historico.ts'),
        'utf-8'
      );

      const atividadeSection = dbContent.substring(
        dbContent.indexOf('export async function getAtividadePorDia'),
        dbContent.indexOf('export async function getAtividadePorDia') + 1500
      );

      expect(atividadeSection).toContain('DATE(createdAt)');
      expect(atividadeSection).toContain('COUNT(*)');
      expect(atividadeSection).not.toContain('const allHistorico = await db.select().from(historico)');
    });

    it('deve filtrar por data de início para limitar dados', async () => {
      const fs = await import('fs');
      const dbContent = fs.readFileSync(
        join(ROOT, 'server/db/historico.ts'),
        'utf-8'
      );

      const atividadeSection = dbContent.substring(
        dbContent.indexOf('export async function getAtividadePorDia'),
        dbContent.indexOf('export async function getAtividadePorDia') + 1500
      );

      expect(atividadeSection).toContain('dataInicio');
      expect(atividadeSection).toContain('>= ${dataInicio}');
    });
  });

  describe('N+1 Query Fix (getHistoricoUnificado)', () => {
    it('deve usar batch lookup com inArray em vez de queries individuais', async () => {
      const fs = await import('fs');
      const dbContent = fs.readFileSync(
        join(ROOT, 'server/db/historico.ts'),
        'utf-8'
      );

      const unificadoSection = dbContent.substring(
        dbContent.indexOf('export async function getHistoricoUnificado'),
        dbContent.indexOf('export async function getHistoricoUnificado') + 2500
      );

      expect(unificadoSection).toContain('promptIdSet');
      expect(unificadoSection).toContain('promptsMap');
      expect(unificadoSection).toContain('inArray(prompts.id, promptIds)');
      expect(unificadoSection).not.toContain('Promise.all(items.map(async');
    });

    it('deve importar inArray do drizzle-orm', async () => {
      const fs = await import('fs');
      const dbContent = fs.readFileSync(
        join(ROOT, 'server/db/historico.ts'),
        'utf-8'
      );

      expect(dbContent).toContain('inArray');
      expect(dbContent).toMatch(/import \{[^}]*inArray[^}]*\} from "drizzle-orm"/);
    });
  });

  describe('Verificação de Integridade das Páginas', () => {
    it('todas as páginas devem estar registradas no App.tsx', async () => {
      const fs = await import('fs');
      const appContent = fs.readFileSync(
        join(ROOT, 'client/src/App.tsx'),
        'utf-8'
      );

      const requiredRoutes = [
        '/dashboard',
        '/historico',
        '/templates',
        '/tutoriais',
        '/planos',
        '/configuracoes',
      ];

      requiredRoutes.forEach(route => {
        expect(appContent).toContain(route);
      });
    });

    it('Historico.tsx deve existir e ter componentes essenciais', async () => {
      const fs = await import('fs');
      const historicoContent = fs.readFileSync(
        join(ROOT, 'client/src/pages/Historico.tsx'),
        'utf-8'
      );

      expect(historicoContent).toContain('Painel de Controle');
      expect(historicoContent).toContain('trpc.historico');
      expect(historicoContent).toContain('statsQuery');
    });
  });
});
