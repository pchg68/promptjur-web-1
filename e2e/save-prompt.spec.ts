import { test, expect } from '@playwright/test';

/**
 * Testes de Gerenciamento de Prompts Salvos
 * Requer projeto: authenticated-user
 */
test.describe('Salvar Prompts', () => {

  test('usuário autenticado deve acessar o dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('deve exibir área de entrada de prompt', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar que há um campo de texto para o prompt
    const promptInput = page.locator('textarea').first();
    await expect(promptInput).toBeVisible({ timeout: 15000 });
  });

  test('deve exibir templates de prompts salvos', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/login|oauth/i);
  });
});
