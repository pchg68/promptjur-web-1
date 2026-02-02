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
