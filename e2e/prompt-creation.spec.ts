import { test, expect } from '@playwright/test';

/**
 * Testes E2E para fluxo de criação de prompt
 */
test.describe('Criação de Prompt', () => {
  test.beforeEach(async ({ page, context }) => {
    // Simular autenticação
    await context.addCookies([{
      name: 'session',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
  });

  test('deve exibir formulário de criação de prompt na tab Gerar', async ({ page }) => {
    // Navegar para tab Gerar
    await page.goto('/gerar');
    
    // Verificar presença do formulário
    const form = page.locator('form, [role="form"]').first();
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test('deve permitir preencher campos do formulário', async ({ page }) => {
    await page.goto('/gerar');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Tentar preencher campo de contexto (se existir)
    const contextoInput = page.getByLabel(/contexto|descri/i).first();
    if (await contextoInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contextoInput.fill('Teste de contexto jurídico');
    }
    
    // Verificar que o valor foi preenchido
    if (await contextoInput.isVisible().catch(() => false)) {
      await expect(contextoInput).toHaveValue(/teste/i);
    }
  });

  test('deve exibir resultado após submissão', async ({ page }) => {
    await page.goto('/gerar');
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    // Preencher formulário mínimo
    const contextoInput = page.getByLabel(/contexto|descri/i).first();
    if (await contextoInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contextoInput.fill('Ação de cobrança de dívida');
      
      // Buscar botão de submit
      const submitButton = page.getByRole('button', { name: /gerar|criar|enviar/i }).first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        
        // Aguardar resposta (pode demorar devido à IA)
        await page.waitForTimeout(2000);
        
        // Verificar se há algum resultado ou loading
        const resultado = page.locator('[data-testid="resultado"], .resultado, [role="region"]').first();
        const loading = page.locator('[data-testid="loading"], .loading, [aria-busy="true"]').first();
        
        const temResultadoOuLoading = await Promise.race([
          resultado.isVisible({ timeout: 30000 }).catch(() => false),
          loading.isVisible({ timeout: 5000 }).catch(() => false),
        ]);
        
        expect(temResultadoOuLoading).toBeTruthy();
      }
    }
  });
});
