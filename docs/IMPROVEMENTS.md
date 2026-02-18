# Melhorias de Qualidade e Monitoramento

Este documento descreve as melhorias implementadas no PromptJur para aumentar a qualidade do código, confiabilidade e observabilidade do sistema.

---

## 1. Correção de Testes Falhando ✅

**Problema:** 17 testes unitários estavam falhando devido a mocks incorretos de banco de dados.

**Solução Implementada:**

### Testes de Auditoria (`server/audit.test.ts`)
- Corrigido mock de `logAuditoria` para retornar `[{ insertId: 1 }]`
- Corrigido mock de `listarLogs` para simular query chain completa (orderBy → limit → where)
- Renomeado `getStatsAuditoria` para `getAuditStats` (nome correto da função)
- Corrigido expectativa para aceitar `createdAt` como string ISO

### Testes de Feature Flags (`server/feature-flags.test.ts`)
- Corrigido mock de `isFeatureEnabled` para usar `boolean` ao invés de `0/1`
- Corrigido mock de `toggleFeature` para incluir `select` antes de `update`
- Corrigido mock de `criarFeature` para retornar `[{ insertId: 1 }]`

### Testes de Performance (`server/performance.test.ts`)
- Corrigido assinatura de `registrarMetrica` para aceitar objeto `{ rota, duracao, userId? }`
- Corrigido expectativa de `rotaMaisLenta` para ser objeto `{ rota, p95 }` ao invés de string
- Corrigido nome de propriedade de `totalRotas` para `rotasUnicas`

**Resultado:** 20/20 testes passando (100% de sucesso)

---

## 2. Rate Limiting por Usuário ✅

**Problema:** O rate limiter estava usando "undefined" como identificador de usuário, aplicando limites incorretos.

**Solução Implementada:**

### Middleware de Injeção de Usuário
Criado `injectUserMiddleware` em `server/_core/rateLimiter.ts` que:
1. Extrai usuário autenticado via `sdk.authenticateRequest(req)`
2. Injeta usuário no objeto `req` antes do rate limiter ser executado
3. Permite que o rate limiter acesse `req.user.email` e `req.user.openId`

### Integração no Express
Adicionado middleware na ordem correta em `server/_core/index.ts`:
```typescript
app.use("/api/trpc",
  injectUserMiddleware,  // 1. Injetar usuário
  tRPCRateLimiter,       // 2. Aplicar rate limiting
  createExpressMiddleware({ ... })
);
```

### Limites por Plano
- **Free:** 10 requisições/hora, 50/dia
- **Pro:** 100 requisições/hora, 1000/dia
- **Enterprise:** Ilimitado

**Resultado:** Logs agora mostram `[RateLimiter] User pc@hertt.com.br (plan: free) - limit: 10/hour`

---

## 3. Monitoramento de Erros com Sentry ✅

**Problema:** Sem sistema de monitoramento de erros em produção, dificultando debugging de problemas reportados por usuários.

**Solução Implementada:**

### Instalação
```bash
pnpm add @sentry/node @sentry/react
```

### Configuração do Servidor (`server/_core/sentry.ts`)
- Inicialização com `dsn`, `environment`, `release`
- Integração com Express via `expressIntegration()`
- Taxa de amostragem: 100% em dev, 10% em produção
- Filtros de privacidade: remove cookies, authorization headers
- Funções helper: `captureException`, `captureMessage`, `setUserContext`

### Configuração do Cliente (`client/src/_core/sentry.ts`)
- Inicialização com `dsn`, `environment`
- Integração com React via `browserTracingIntegration()`
- Session replay com `replaysOnErrorSampleRate: 1.0`
- Filtros de privacidade: mascara todo texto e bloqueia mídia

### Integração no Servidor (`server/_core/index.ts`)
```typescript
// Inicializar Sentry antes de tudo
initSentry();

// Middleware de erro do Sentry (último middleware)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}
```

### Integração no Cliente (`client/src/main.tsx`)
```typescript
// Inicializar Sentry antes de criar QueryClient
initSentry();
```

### Variáveis de Ambiente Necessárias
Para ativar o Sentry em produção, adicione via `webdev_request_secrets`:
- **Servidor:** `SENTRY_DSN` (DSN do projeto Node.js no Sentry)
- **Cliente:** `VITE_SENTRY_DSN` (DSN do projeto React no Sentry)

**Como obter o DSN:**
1. Criar conta em https://sentry.io
2. Criar dois projetos: um Node.js (backend) e um React (frontend)
3. Copiar os DSNs fornecidos
4. Adicionar via `webdev_request_secrets` tool

**Resultado:** Sistema pronto para capturar erros automaticamente quando DSNs forem configurados

---

## Arquivos Modificados

### Testes Corrigidos
- `server/audit.test.ts`
- `server/feature-flags.test.ts`
- `server/performance.test.ts`

### Rate Limiting
- `server/_core/rateLimiter.ts` (adicionado `injectUserMiddleware`)
- `server/_core/index.ts` (integrado middleware)

### Monitoramento Sentry
- `server/_core/sentry.ts` (novo arquivo)
- `client/src/_core/sentry.ts` (novo arquivo)
- `server/_core/index.ts` (inicialização e middleware)
- `client/src/main.tsx` (inicialização)

---

## Próximos Passos

1. **Ativar Sentry em Produção**
   - Criar conta no Sentry
   - Adicionar DSNs via `webdev_request_secrets`
   - Testar captura de erros

2. **Monitorar Métricas**
   - Acompanhar taxa de erro no dashboard Sentry
   - Analisar performance traces
   - Revisar session replays de erros

3. **Ajustar Rate Limits**
   - Monitorar uso real de usuários
   - Ajustar limites conforme necessário
   - Considerar limites por rota específica

---

## Referências

- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
