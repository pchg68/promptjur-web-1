import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E do PromptJur
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Timeout máximo por teste */
  timeout: 30 * 1000,
  
  /* Executar testes em paralelo */
  fullyParallel: true,
  
  /* Falhar o build se você acidentalmente deixou test.only no código */
  forbidOnly: !!process.env.CI,
  
  /* Tentar novamente em CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Número de workers em paralelo */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter para usar */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  /* Configuração compartilhada para todos os projetos */
  use: {
    /* URL base para usar em ações como `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Coletar trace quando reprovar */
    trace: 'on-first-retry',
    
    /* Screenshot apenas em falhas */
    screenshot: 'only-on-failure',
    
    /* Vídeo apenas em falhas */
    video: 'retain-on-failure',
  },

  /* Configurar projetos para diferentes navegadores */
  projects: [
    // ─── Projetos autenticados (usam token JWT — sem Turnstile) ───────────────
    {
      name: 'authenticated-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/admin-auth.json',
        baseURL: process.env.BASE_URL || 'https://promptjur.com',
      },
      testMatch: /e2e\/(access-control|whitelist|save-prompt|legal-prompt)\.spec\.ts/,
    },
    {
      name: 'authenticated-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/user-auth.json',
        baseURL: process.env.BASE_URL || 'https://promptjur.com',
      },
      testMatch: /e2e\/(access-control|save-prompt|legal-prompt)\.spec\.ts/,
    },
    // ─── Projetos padrão (sem autenticação) ──────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Testes mobile */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Executar servidor local antes dos testes */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
