import { test, expect } from '@playwright/test';

/**
 * Testes de Whitelist e Convites
 * Requer projeto: authenticated-admin
 */
test.describe('Whitelist e Convites (Admin)', () => {

  test('admin deve acessar o painel administrativo', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    // Não deve ser redirecionado para login
    await expect(page).not.toHaveURL(/login|oauth/i);
  });

  test('admin deve visualizar a seção de whitelist', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verificar presença de texto relacionado a whitelist ou convites
    const whitelistEl = page.getByText(/whitelist|convite|acesso/i).first();
    await expect(whitelistEl).toBeVisible({ timeout: 15000 });
  });
});
