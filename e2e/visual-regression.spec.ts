import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Testes de Regressão Visual com Percy
 * 
 * Este arquivo captura snapshots visuais de componentes críticos
 * para detectar quebras de layout/CSS durante atualizações.
 * 
 * Percy compara automaticamente os snapshots com a baseline
 * e notifica sobre diferenças visuais.
 * 
 * Execução:
 * - Local (sem Percy): pnpm exec playwright test e2e/visual-regression.spec.ts
 * - Com Percy: PERCY_TOKEN=xxx pnpm exec percy exec -- playwright test e2e/visual-regression.spec.ts
 */

test.describe('Regressão Visual - PromptJur', () => {
  test.beforeEach(async ({ page, context }) => {
    // Simular autenticação com cookie de sessão
    await context.addCookies([{
      name: 'session',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('deve capturar snapshot da homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Aguardar elementos principais carregarem
    await page.waitForTimeout(2000);
    
    // Capturar snapshot
    await percySnapshot(page, 'Homepage');
  });

  test('deve capturar snapshot do dashboard principal', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Aguardar carregamento completo
    await page.waitForTimeout(2000);
    
    await percySnapshot(page, 'Dashboard Principal');
  });

  test('deve capturar snapshot do formulário de geração de prompt', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navegar para tab de geração
    const tabGerar = page.getByRole('tab', { name: /gerar|criar/i }).first();
    if (await tabGerar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tabGerar.click();
      await page.waitForTimeout(1000);
    }
    
    await percySnapshot(page, 'Formulário de Geração de Prompt');
  });

  test('deve capturar snapshot do formulário de análise', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navegar para tab de análise
    const tabAnalisar = page.getByRole('tab', { name: /analisar|análise/i }).first();
    if (await tabAnalisar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tabAnalisar.click();
      await page.waitForTimeout(1000);
    }
    
    await percySnapshot(page, 'Formulário de Análise');
  });

  test('deve capturar snapshot do formulário de otimização', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navegar para tab de otimização
    const tabOtimizar = page.getByRole('tab', { name: /otimizar|otimização/i }).first();
    if (await tabOtimizar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tabOtimizar.click();
      await page.waitForTimeout(1000);
    }
    
    await percySnapshot(page, 'Formulário de Otimização');
  });

  test('deve capturar snapshot da página de modelos personalizados', async ({ page }) => {
    await page.goto('/meus-modelos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await percySnapshot(page, 'Página de Modelos Personalizados');
  });

  test('deve capturar snapshot da página de histórico', async ({ page }) => {
    await page.goto('/historico');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await percySnapshot(page, 'Página de Histórico');
  });

  test('deve capturar snapshot de resultado de geração (com prompt)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navegar para tab de geração
    const tabGerar = page.getByRole('tab', { name: /gerar|criar/i }).first();
    if (await tabGerar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tabGerar.click();
      await page.waitForTimeout(1000);
      
      // Preencher formulário básico
      const inputTipo = page.locator('select').filter({ hasText: /tipo|documento/i }).first();
      if (await inputTipo.isVisible({ timeout: 3000 }).catch(() => false)) {
        await inputTipo.selectOption({ index: 1 });
      }
      
      const inputContexto = page.getByLabel(/contexto/i).first();
      if (await inputContexto.isVisible({ timeout: 3000 }).catch(() => false)) {
        await inputContexto.fill('Contexto de teste para snapshot visual');
      }
      
      const inputObjetivo = page.getByLabel(/objetivo/i).first();
      if (await inputObjetivo.isVisible({ timeout: 3000 }).catch(() => false)) {
        await inputObjetivo.fill('Objetivo de teste para snapshot visual');
      }
      
      // Submeter (se botão estiver disponível)
      const botaoGerar = page.getByRole('button', { name: /gerar|criar/i }).last();
      if (await botaoGerar.isVisible({ timeout: 3000 }).catch(() => false)) {
        await botaoGerar.click();
        
        // Aguardar resultado (máximo 30s)
        await page.waitForTimeout(5000);
        
        // Capturar snapshot do resultado
        await percySnapshot(page, 'Resultado de Geração de Prompt');
      }
    }
  });

  test('deve capturar snapshot de modal de criação de modelo', async ({ page }) => {
    await page.goto('/meus-modelos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Abrir modal de criação
    const botaoNovo = page.getByRole('button', { name: /novo modelo|criar/i }).first();
    if (await botaoNovo.isVisible({ timeout: 5000 }).catch(() => false)) {
      await botaoNovo.click();
      await page.waitForTimeout(1000);
      
      await percySnapshot(page, 'Modal de Criação de Modelo');
    }
  });

  test('deve capturar snapshot de diferentes breakpoints (responsivo)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Desktop (padrão já capturado)
    await percySnapshot(page, 'Dashboard - Desktop', {
      widths: [1920, 1366, 1024],
    });
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await percySnapshot(page, 'Dashboard - Tablet', {
      widths: [768],
    });
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await percySnapshot(page, 'Dashboard - Mobile', {
      widths: [375],
    });
  });
});
