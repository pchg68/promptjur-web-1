# Guia de Testes - PromptJur

Este documento descreve a estratégia completa de testes do PromptJur, incluindo testes unitários, de integração, E2E, performance e regressão visual.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Testes Unitários (Vitest)](#testes-unitários-vitest)
3. [Testes de Integração com APIs Externas](#testes-de-integração-com-apis-externas)
4. [Testes E2E (Playwright)](#testes-e2e-playwright)
5. [Testes de Performance (k6)](#testes-de-performance-k6)
6. [Testes de Regressão Visual (Percy)](#testes-de-regressão-visual-percy)
7. [Cobertura de Código](#cobertura-de-código)
8. [CI/CD](#cicd)

---

## Visão Geral

O PromptJur utiliza uma estratégia de testes em múltiplas camadas para garantir qualidade, confiabilidade e performance:

| Tipo de Teste | Ferramenta | Escopo | Execução |
|---------------|------------|--------|----------|
| **Unitários** | Vitest | Funções isoladas, lógica de negócio | A cada commit |
| **Integração** | Vitest + MSW | Integração com APIs externas (mock) | A cada commit |
| **E2E** | Playwright | Fluxos completos de usuário | A cada PR |
| **Performance** | k6 | Carga e stress testing | Semanal / Pré-release |
| **Visual** | Percy + Playwright | Regressão visual de UI | A cada PR |

---

## Testes Unitários (Vitest)

### Configuração

Os testes unitários utilizam **Vitest** como framework de testes, configurado em `vitest.config.ts`.

### Localização dos Testes

```
server/**/*.test.ts        # Testes de lógica de servidor
server/**/*.spec.ts        # Testes de routers/procedures
client/src/__tests__/**    # Testes de componentes React
shared/__tests__/**        # Testes de utilitários compartilhados
```

### Comandos

```bash
# Executar todos os testes unitários
pnpm test

# Executar testes em modo watch
pnpm test:watch

# Executar com cobertura de código
pnpm test:coverage
```

### Exemplo de Teste Unitário

```typescript
import { describe, it, expect } from 'vitest';
import { calcularPrazoProcessual } from './prazos';

describe('Cálculo de Prazos Processuais', () => {
  it('deve calcular prazo de 15 dias úteis corretamente', () => {
    const dataInicio = new Date('2024-01-02'); // Segunda-feira
    const prazo = calcularPrazoProcessual(dataInicio, 15);
    
    expect(prazo).toEqual(new Date('2024-01-23'));
  });
  
  it('deve excluir feriados nacionais do cálculo', () => {
    const dataInicio = new Date('2024-01-01'); // Feriado
    const prazo = calcularPrazoProcessual(dataInicio, 5);
    
    expect(prazo).toEqual(new Date('2024-01-08'));
  });
});
```

---

## Testes de Integração com APIs Externas

### Configuração

Os testes de integração utilizam **MSW (Mock Service Worker)** para simular respostas de APIs externas sem fazer requisições reais.

### Localização

```
server/__tests__/integration/external-apis.test.ts
```

### APIs Mockadas

1. **DataJud (CNJ)** - Busca de precedentes processuais
2. **API de Feriados** - Consulta de feriados nacionais/estaduais
3. **Validação de Legislação** - Verificação de artigos legais

### Comandos

```bash
# Executar testes de integração
pnpm test server/__tests__/integration/external-apis.test.ts
```

### Cobertura

- ✅ 17 testes implementados
- ✅ 100% de taxa de sucesso
- ✅ Cobertura de cenários de erro (timeout, 404, 500, 503)

### Exemplo de Mock com MSW

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('https://api-publica.datajud.cnj.jus.br/_search', () => {
    return HttpResponse.json({
      hits: {
        total: { value: 10 },
        hits: [/* processos mockados */]
      }
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Testes E2E (Playwright)

### Configuração

Os testes E2E utilizam **Playwright** para simular interações reais de usuários em múltiplos navegadores.

### Localização dos Testes

```
e2e/auth.spec.ts                    # Autenticação e logout
e2e/prompt-creation.spec.ts         # Criação de prompts
e2e/document-generation.spec.ts     # Geração de documentos jurídicos
e2e/custom-models.spec.ts           # Modelos personalizados
e2e/visual-regression.spec.ts       # Regressão visual
```

### Navegadores Suportados

- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit (Safari Desktop)
- ✅ Mobile Chrome (Android)
- ✅ Mobile Safari (iOS)

### Comandos

```bash
# Executar todos os testes E2E
pnpm test:e2e

# Executar com interface gráfica
pnpm test:e2e:ui

# Executar com navegador visível (debug)
pnpm test:e2e:headed

# Executar apenas um arquivo específico
pnpm exec playwright test e2e/document-generation.spec.ts
```

### Cobertura de Testes E2E

#### 1. Autenticação (`auth.spec.ts`)
- Login via OAuth
- Logout
- Redirecionamento após autenticação

#### 2. Criação de Prompts (`prompt-creation.spec.ts`)
- Navegação para dashboard
- Preenchimento de formulário
- Submissão e validação

#### 3. Geração de Documentos (`document-generation.spec.ts`)
- ✅ 10 testes implementados
- Navegação para tab "Gerar Prompt Jurídico"
- Preenchimento completo de formulário
- Seleção de modelo de IA
- Validação de resultado
- Exportação Markdown e PDF
- Salvamento de prompt

#### 4. Modelos Personalizados (`custom-models.spec.ts`)
- ✅ 12 testes implementados
- Criação de modelo com variáveis dinâmicas
- Edição de modelo existente
- Duplicação de modelo
- Alternar visibilidade (público/privado)
- Exclusão com confirmação
- Uso de modelo na geração

### Exemplo de Teste E2E

```typescript
import { test, expect } from '@playwright/test';

test('deve gerar documento jurídico completo', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Navegar para tab de geração
  await page.getByRole('tab', { name: /gerar/i }).click();
  
  // Preencher formulário
  await page.getByLabel(/tipo de documento/i).selectOption('Petição Inicial');
  await page.getByLabel(/contexto/i).fill('Ação de cobrança...');
  await page.getByLabel(/objetivo/i).fill('Cobrar dívida...');
  
  // Submeter
  await page.getByRole('button', { name: /gerar/i }).click();
  
  // Aguardar resultado
  await expect(page.getByText(/prompt gerado/i)).toBeVisible({ timeout: 30000 });
  
  // Validar conteúdo
  const resultado = await page.locator('[data-testid="resultado"]').textContent();
  expect(resultado).toContain('Petição Inicial');
});
```

---

## Testes de Performance (k6)

### Configuração

Os testes de performance utilizam **k6** para simular carga de usuários simultâneos e medir métricas de performance.

### Localização

```
k6-tests/smoke-test.js    # Teste rápido (5 usuários, 30s)
k6-tests/load-test.js     # Teste de carga (até 100 usuários, 7min)
```

### Comandos

```bash
# Smoke test (validação rápida)
pnpm test:perf:smoke

# Load test (teste de carga completo)
pnpm test:perf:load

# Executar com URL customizada
BASE_URL="https://promptjur.com" k6 run k6-tests/load-test.js
```

### Cenários de Teste

#### Smoke Test
- **Duração:** 30 segundos
- **Usuários:** 5 simultâneos
- **Objetivo:** Validar que o sistema está funcionando

#### Load Test
- **Duração:** 7 minutos
- **Fases:**
  1. Warmup: 10 usuários (30s)
  2. Ramp-up: 50 usuários (1min)
  3. Carga sustentada: 50 usuários (2min)
  4. Pico: 100 usuários (1min)
  5. Carga máxima: 100 usuários (2min)
  6. Ramp-down: 0 usuários (30s)

### Cenários Simulados

| Cenário | Peso | Descrição |
|---------|------|-----------|
| Geração de documentos | 40% | Ação mais comum |
| Análise de prompts | 25% | Segunda mais comum |
| Otimização de prompts | 20% | Terceira mais comum |
| Listagem de modelos | 10% | Navegação |
| Busca no histórico | 5% | Consulta |

### Métricas de Sucesso

| Métrica | Threshold | Descrição |
|---------|-----------|-----------|
| **P95** | < 3000ms | 95% das requisições em menos de 3s |
| **P99** | < 5000ms | 99% das requisições em menos de 5s |
| **Taxa de erro** | < 1% | Menos de 1% de erros |
| **Taxa de falha** | < 5% | Menos de 5% de falhas HTTP |

### Resultados do Smoke Test

```
Total Requests: 150
Request Rate: 4.85/s
Avg Duration: 28.16ms
P95 Duration: 42.69ms
Failed Rate: 0.00%
```

✅ **Todos os thresholds atendidos!**

### Exemplo de Cenário k6

```javascript
export default function () {
  const action = Math.random();
  
  if (action < 0.40) {
    // 40% - Geração de documento
    const response = http.post(`${BASE_URL}/api/trpc/gerar`, payload);
    check(response, {
      'status 200': (r) => r.status === 200,
    });
  } else if (action < 0.65) {
    // 25% - Análise de prompt
    const response = http.post(`${BASE_URL}/api/trpc/analisar`, payload);
    check(response, {
      'status 200': (r) => r.status === 200,
    });
  }
  
  sleep(1);
}
```

---

## Testes de Regressão Visual (Percy)

### Configuração

Os testes de regressão visual utilizam **Percy** integrado com **Playwright** para detectar quebras de layout/CSS automaticamente.

### Localização

```
e2e/visual-regression.spec.ts    # Snapshots visuais
.percyrc                         # Configuração Percy
```

### Comandos

```bash
# Executar testes visuais (sem Percy - dry run)
pnpm exec playwright test e2e/visual-regression.spec.ts

# Executar com Percy (requer PERCY_TOKEN)
PERCY_TOKEN=xxx pnpm test:visual
```

### Snapshots Capturados

1. **Homepage** - Página inicial
2. **Dashboard Principal** - Visão geral
3. **Formulário de Geração** - Tab "Gerar Prompt Jurídico"
4. **Formulário de Análise** - Tab "Analisar Prompt"
5. **Formulário de Otimização** - Tab "Otimizar Prompt"
6. **Página de Modelos** - Lista de modelos personalizados
7. **Página de Histórico** - Histórico de prompts
8. **Resultado de Geração** - Prompt gerado com resultado
9. **Modal de Criação** - Modal de criar novo modelo
10. **Snapshots Responsivos** - Desktop, Tablet, Mobile

### Breakpoints Testados

| Dispositivo | Largura | Descrição |
|-------------|---------|-----------|
| Mobile | 375px | iPhone SE, Galaxy S8 |
| Tablet | 768px | iPad Mini, tablets |
| Desktop Small | 1024px | Laptops pequenos |
| Desktop Medium | 1366px | Laptops comuns |
| Desktop Large | 1920px | Monitores Full HD |

### Configuração Percy (`.percyrc`)

```json
{
  "version": 2,
  "snapshot": {
    "widths": [375, 768, 1024, 1366, 1920],
    "minHeight": 1024,
    "enableJavaScript": true,
    "waitForTimeout": 5000
  }
}
```

### Exemplo de Snapshot Visual

```typescript
import percySnapshot from '@percy/playwright';

test('deve capturar snapshot do dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Capturar snapshot em múltiplas resoluções
  await percySnapshot(page, 'Dashboard Principal', {
    widths: [375, 768, 1024, 1920],
  });
});
```

### Fluxo de Aprovação

1. **Primeira execução:** Percy cria baseline (referência)
2. **Execuções seguintes:** Percy compara com baseline
3. **Diferenças detectadas:** Percy notifica no dashboard
4. **Aprovação:** Desenvolvedor aprova ou rejeita mudanças visuais

---

## Cobertura de Código

### Configuração

A cobertura de código é medida usando **c8** (ferramenta de cobertura do V8).

### Thresholds

| Métrica | Threshold |
|---------|-----------|
| Lines | 70% |
| Functions | 70% |
| Branches | 70% |
| Statements | 70% |

### Comandos

```bash
# Executar testes com cobertura
pnpm test:coverage

# Visualizar relatório HTML
open coverage/index.html
```

### Relatórios Gerados

- `coverage/index.html` - Relatório visual interativo
- `coverage/lcov.info` - Formato LCOV (para CI/CD)
- `coverage/coverage-final.json` - Formato JSON

---

## CI/CD

### GitHub Actions (Recomendado)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Run visual tests
        run: pnpm test:visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Melhores Práticas

### 1. Testes Unitários
- ✅ Testar funções isoladamente
- ✅ Usar mocks para dependências externas
- ✅ Cobrir casos de sucesso e erro
- ✅ Manter testes rápidos (< 100ms cada)

### 2. Testes E2E
- ✅ Focar em fluxos críticos de usuário
- ✅ Usar seletores semânticos (`getByRole`, `getByLabel`)
- ✅ Evitar timeouts fixos (usar `waitFor`)
- ✅ Limpar estado entre testes

### 3. Testes de Performance
- ✅ Executar em ambiente similar à produção
- ✅ Monitorar métricas ao longo do tempo
- ✅ Definir thresholds realistas
- ✅ Testar cenários de carga real

### 4. Testes Visuais
- ✅ Capturar snapshots de componentes críticos
- ✅ Revisar mudanças visuais cuidadosamente
- ✅ Atualizar baseline quando necessário
- ✅ Testar em múltiplos breakpoints

---

## Troubleshooting

### Testes E2E falhando localmente

```bash
# Reinstalar navegadores do Playwright
pnpm exec playwright install --with-deps
```

### k6 não encontrado

```bash
# Instalar k6 no Ubuntu/Debian
sudo apt-get update
sudo apt-get install k6
```

### Percy não capturando snapshots

```bash
# Verificar se PERCY_TOKEN está configurado
echo $PERCY_TOKEN

# Executar sem Percy (dry run)
pnpm exec playwright test e2e/visual-regression.spec.ts
```

---

## Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Percy Documentation](https://docs.percy.io/)
- [MSW Documentation](https://mswjs.io/)

---

## Contato

Para dúvidas sobre testes, consulte a equipe de desenvolvimento ou abra uma issue no repositório.
