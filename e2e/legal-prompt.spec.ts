import { test, expect } from '@playwright/test';

/**
 * Testes de Geração de Prompt Jurídico com IA
 * Requer projeto: authenticated-user
 */
test.describe('Geração de Prompt Jurídico', () => {

  test('deve acessar o dashboard sem ser bloqueado', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).not.toHaveURL(/login|oauth/i);
  });

  test('deve exibir opções de área jurídica', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar presença de texto de área jurídica
    const areaText = page.getByText(/civil|penal|trabalhista|tributário|direito/i).first();
    await expect(areaText).toBeVisible({ timeout: 15000 });
  });

  test('deve exibir a aba de geração de prompts', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar aba ou botão de "Gerar"
    const gerarBtn = page.getByText(/gerar|geração/i).first();
    await expect(gerarBtn).toBeVisible({ timeout: 15000 });
  });
});
