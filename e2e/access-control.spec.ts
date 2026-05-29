import { test, expect } from '@playwright/test';

/**
 * Testes de Controle de Acesso
 * Verifica que usuários não autenticados são bloqueados
 * e que usuários autenticados têm acesso normal.
 *
 * Requer projeto: authenticated-admin ou authenticated-user
 */
test.describe('Controle de Acesso', () => {

  // Teste COM autenticação — usa o storageState do projeto configurado
  test('deve permitir acesso ao dashboard com login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Deve permanecer no dashboard (não redirecionar para login)
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('body')).toBeVisible();
  });

  // Teste que verifica que usuário deslogado NÃO acessa o dashboard
  test('deve bloquear acesso ao dashboard sem login', async ({ browser }) => {
    // Cria um contexto completamente limpo, sem nenhum cookie
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://promptjur.com/dashboard');
    await page.waitForLoadState('networkidle');

    // Deve ser redirecionado para fora do dashboard
    const url = page.url();
    expect(url).not.toMatch(/\/dashboard/);

    await context.close();
  });
});
