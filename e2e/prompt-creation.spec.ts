import { test, expect, type Page } from '@playwright/test';

const trpcData = (data: unknown) => ({ result: { data: { json: data } } });

function mockResponseForProcedure(procedure: string) {
  switch (procedure) {
    case 'auth.me':
      return {
        id: 1,
        email: 'e2e@promptjur.test',
        name: 'Usuário E2E',
        role: 'admin',
        plan: 'pro',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        trialEndsAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        lastSignedIn: '2026-01-01T00:00:00.000Z',
      };
    case 'stripe.getMyUsage':
      return {
        plan: 'pro',
        planName: 'Profissional',
        monthlyLimit: 300,
        usedThisMonth: 0,
        remaining: 300,
        overage: 0,
        status: 'active',
      };
    case 'stripe.getTrialStatus':
      return { active: false, available: false, daysRemaining: 0, endsAt: null };
    case 'prompts.stats':
      return { total: 0, totalPrompts: 0, thisMonth: 0, favoritos: 0 };
    case 'analytics.get':
      return { totalPrompts: 0, totalTokens: 0, totalCost: 0, avgLatency: 0 };
    case 'analytics.usageByDate':
    case 'templates.meus':
    case 'modelos.listar':
    case 'modelos.maisUsados':
    case 'tags.minhas':
      return [];
    case 'prompts.loadPrompt':
      return null;
    case 'providerHealth.status':
      return {
        providers: [],
        userPlan: 'pro',
        modelAccess: { accessible: 1, total: 1 },
        overall: 'healthy',
        timestamp: '2026-01-01T00:00:00.000Z',
      };
    default:
      return null;
  }
}

async function mockTrpc(page: Page) {
  await page.route('**/api/trpc/**', async (route) => {
    const url = new URL(route.request().url());
    const procedures = decodeURIComponent(url.pathname.replace('/api/trpc/', '')).split(',');
    const payload = procedures.map((procedure) => trpcData(mockResponseForProcedure(procedure)));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

/**
 * Testes E2E para fluxo de criação de prompt.
 *
 * O fluxo atual de geração não usa mais uma rota isolada `/gerar`.
 * A criação de prompt fica dentro de `/dashboard`, na aba interna
 * "Gerar Prompt". Estes testes validam a navegação real do usuário
 * sem depender de chamada externa de IA para serem determinísticos.
 */
test.describe('Criação de Prompt', () => {
  test.beforeEach(async ({ page, context }) => {
    await mockTrpc(page);

    await page.addInitScript(() => {
      localStorage.setItem('promptjur-onboarding-v1', 'true');
      localStorage.setItem('cookie_consent', JSON.stringify({ necessary: true, analytics: false, marketing: false }));
      localStorage.setItem('cookie_consent_date', new Date().toISOString());
    });

    // Simular autenticação básica usada pelas suítes legadas.
    await context.addCookies([{
      name: 'session',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
    await page.getByRole('tab', { name: /gerar prompt/i }).click();
  });

  test('deve exibir formulário de criação de prompt na aba Gerar Prompt', async ({ page }) => {
    await expect(page.getByText('Parâmetros')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Resultado Gerado')).toBeVisible();
    await expect(page.getByPlaceholder(/descreva os fatos/i)).toBeVisible();
    await expect(page.getByPlaceholder(/o que você espera como resultado/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /gerar prompt profissional/i })).toBeVisible();
  });

  test('deve permitir preencher campos essenciais do formulário', async ({ page }) => {
    const contextoInput = page.getByPlaceholder(/descreva os fatos/i);
    const objetivoInput = page.getByPlaceholder(/o que você espera como resultado/i);

    await contextoInput.fill('Ação de cobrança de dívida decorrente de contrato de prestação de serviços.');
    await objetivoInput.fill('Gerar prompt jurídico para minuta de petição inicial com fundamentos e pedidos.');

    await expect(contextoInput).toHaveValue(/ação de cobrança/i);
    await expect(objetivoInput).toHaveValue(/petição inicial/i);
  });

  test('deve acionar validação ao tentar gerar sem campos obrigatórios', async ({ page }) => {
    await page.getByRole('button', { name: /gerar prompt profissional/i }).click();

    await expect(page.getByText(/por favor, descreva o contexto do caso/i)).toBeVisible({ timeout: 10000 });
  });
});
