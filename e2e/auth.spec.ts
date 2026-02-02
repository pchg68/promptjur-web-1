import { test, expect } from '@playwright/test';

/**
 * Testes E2E para fluxo de autenticação e navegação básica
 */
test.describe('Autenticação e Navegação', () => {
  test('deve carregar a página inicial', async ({ page }) => {
    await page.goto('/');
    
    // Verificar título da página
    await expect(page).toHaveTitle(/PromptJur/);
    
    // Verificar presença de elementos principais
    await expect(page.locator('body')).toBeVisible();
  });

  test('deve exibir botão de login quando não autenticado', async ({ page }) => {
    await page.goto('/');
    
    // Buscar link ou botão de login
    const loginButton = page.getByRole('link', { name: /entrar|login/i });
    await expect(loginButton).toBeVisible();
  });

  test('deve redirecionar para dashboard após login simulado', async ({ page, context }) => {
    // Simular cookie de sessão (para testes sem OAuth real)
    await context.addCookies([{
      name: 'session',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
    
    // Verificar se está na página do dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('deve navegar entre páginas do dashboard', async ({ page, context }) => {
    // Simular autenticação
    await context.addCookies([{
      name: 'session',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
    
    // Verificar navegação para Analisar
    const analisarLink = page.getByRole('link', { name: /analisar/i });
    if (await analisarLink.isVisible()) {
      await analisarLink.click();
      await expect(page).toHaveURL(/\/analisar/);
    }
  });
});
