/**
 * Testes de integração do Sentry
 * 
 * Verifica que a configuração do Sentry está correta tanto no
 * backend (Express/tRPC) quanto no frontend (React).
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const projectRoot = path.resolve(__dirname, "../..");

describe("Sentry Backend Integration", () => {
  it("deve ter o arquivo server/_core/sentry.ts com initSentry", () => {
    const sentryPath = path.join(projectRoot, "server/_core/sentry.ts");
    expect(fs.existsSync(sentryPath)).toBe(true);
    
    const content = fs.readFileSync(sentryPath, "utf-8");
    expect(content).toContain("export function initSentry()");
    expect(content).toContain("Sentry.init(");
    expect(content).toContain("process.env.SENTRY_DSN");
  });

  it("deve exportar funções essenciais de captura", () => {
    const sentryPath = path.join(projectRoot, "server/_core/sentry.ts");
    const content = fs.readFileSync(sentryPath, "utf-8");
    
    expect(content).toContain("export function captureException");
    expect(content).toContain("export function captureMessage");
    expect(content).toContain("export function setUserContext");
    expect(content).toContain("export function clearUserContext");
    expect(content).toContain("export function addBreadcrumb");
    expect(content).toContain("export function handleTRPCError");
    expect(content).toContain("export function getSentryStatus");
    expect(content).toContain("export function isSentryActive");
  });

  it("deve filtrar dados sensíveis no beforeSend", () => {
    const sentryPath = path.join(projectRoot, "server/_core/sentry.ts");
    const content = fs.readFileSync(sentryPath, "utf-8");
    
    // Verificar que cookies e authorization são removidos
    expect(content).toContain('delete event.request.cookies');
    expect(content).toContain('delete event.request.headers["authorization"]');
    expect(content).toContain('delete event.request.headers["cookie"]');
  });

  it("deve ter handleTRPCError que ignora UNAUTHORIZED e NOT_FOUND", () => {
    const sentryPath = path.join(projectRoot, "server/_core/sentry.ts");
    const content = fs.readFileSync(sentryPath, "utf-8");
    
    // Verificar que erros esperados não são capturados
    expect(content).toContain('"UNAUTHORIZED"');
    expect(content).toContain('"FORBIDDEN"');
    expect(content).toContain('"NOT_FOUND"');
  });

  it("deve ter initSentry chamado no index.ts antes de tudo", () => {
    const indexPath = path.join(projectRoot, "server/_core/index.ts");
    const content = fs.readFileSync(indexPath, "utf-8");
    
    // initSentry deve ser importado
    expect(content).toContain('import { initSentry }');
    // initSentry deve ser chamado no início do startServer
    expect(content).toContain("initSentry()");
    
    // Verificar que initSentry é chamado antes de app = express()
    const initSentryIndex = content.indexOf("initSentry()");
    const expressAppIndex = content.indexOf("express()");
    expect(initSentryIndex).toBeLessThan(expressAppIndex);
  });

  it("deve ter onError handler no createExpressMiddleware", () => {
    const indexPath = path.join(projectRoot, "server/_core/index.ts");
    const content = fs.readFileSync(indexPath, "utf-8");
    
    expect(content).toContain("onError: handleTRPCError");
  });

  it("deve ter setupExpressErrorHandler como último middleware", () => {
    const indexPath = path.join(projectRoot, "server/_core/index.ts");
    const content = fs.readFileSync(indexPath, "utf-8");
    
    expect(content).toContain("Sentry.setupExpressErrorHandler(app)");
  });

  it("deve ter contexto de usuário no context.ts", () => {
    const contextPath = path.join(projectRoot, "server/_core/context.ts");
    const content = fs.readFileSync(contextPath, "utf-8");
    
    expect(content).toContain("setUserContext");
    expect(content).toContain("clearUserContext");
  });

  it("deve ter endpoint sentryStatus no router admin modular de performance", () => {
    const performancePath = path.join(projectRoot, "server/routers/admin/performance.ts");
    const content = fs.readFileSync(performancePath, "utf-8");
    
    expect(content).toContain("sentryStatus:");
    expect(content).toContain("getSentryStatus()");
  });
});

describe("Sentry Frontend Integration", () => {
  it("deve ter o arquivo client/src/_core/sentry.ts com initSentry", () => {
    const sentryPath = path.join(projectRoot, "client/src/_core/sentry.ts");
    expect(fs.existsSync(sentryPath)).toBe(true);
    
    const content = fs.readFileSync(sentryPath, "utf-8");
    expect(content).toContain("export function initSentry()");
    expect(content).toContain("Sentry.init(");
    expect(content).toContain("import.meta.env.VITE_SENTRY_DSN");
  });

  it("deve exportar funções essenciais de captura no frontend", () => {
    const sentryPath = path.join(projectRoot, "client/src/_core/sentry.ts");
    const content = fs.readFileSync(sentryPath, "utf-8");
    
    expect(content).toContain("export function captureException");
    expect(content).toContain("export function captureMessage");
    expect(content).toContain("export function setUserContext");
    expect(content).toContain("export function clearUserContext");
    expect(content).toContain("export function addBreadcrumb");
    expect(content).toContain("export function isSentryActive");
    expect(content).toContain("export function getSentryStatus");
  });

  it("deve manter Session Replay desabilitado para evitar consumo excessivo de memória", () => {
    const sentryPath = path.join(projectRoot, "client/src/_core/sentry.ts");
    const content = fs.readFileSync(sentryPath, "utf-8");
    
    expect(content).toContain("replaysSessionSampleRate: 0");
    expect(content).toContain("replaysOnErrorSampleRate: 0");
    expect(content).not.toContain("replayIntegration");
  });

  it("deve documentar a remoção do Session Replay por risco operacional", () => {
    const sentryPath = path.join(projectRoot, "client/src/_core/sentry.ts");
    const content = fs.readFileSync(sentryPath, "utf-8");
    
    expect(content).toContain("Session Replay: DESABILITADO");
    expect(content).toContain("Out of Memory");
  });

  it("deve filtrar erros de extensões de navegador", () => {
    const sentryPath = path.join(projectRoot, "client/src/_core/sentry.ts");
    const content = fs.readFileSync(sentryPath, "utf-8");
    
    expect(content).toContain("chrome-extension://");
  });

  it("deve ignorar erros comuns (rede, auth, resize)", () => {
    const sentryPath = path.join(projectRoot, "client/src/_core/sentry.ts");
    const content = fs.readFileSync(sentryPath, "utf-8");
    
    expect(content).toContain("ignoreErrors");
    expect(content).toContain("Failed to fetch");
    expect(content).toContain("UNAUTHORIZED");
    expect(content).toContain("ResizeObserver loop");
  });

  it("deve ter initSentry chamado no main.tsx antes de createRoot", () => {
    const mainPath = path.join(projectRoot, "client/src/main.tsx");
    const content = fs.readFileSync(mainPath, "utf-8");
    
    expect(content).toContain("initSentry()");
    
    // initSentry deve ser chamado antes de createRoot
    const initIndex = content.indexOf("initSentry()");
    const createRootIndex = content.indexOf("createRoot(");
    expect(initIndex).toBeLessThan(createRootIndex);
  });

  it("deve ter React 19 error handlers integrados com Sentry", () => {
    const mainPath = path.join(projectRoot, "client/src/main.tsx");
    const content = fs.readFileSync(mainPath, "utf-8");
    
    expect(content).toContain("onUncaughtError: Sentry.reactErrorHandler");
    expect(content).toContain("onCaughtError: Sentry.reactErrorHandler");
    expect(content).toContain("onRecoverableError: Sentry.reactErrorHandler");
  });

  it("deve capturar erros de tRPC no Sentry via query/mutation cache", () => {
    const mainPath = path.join(projectRoot, "client/src/main.tsx");
    const content = fs.readFileSync(mainPath, "utf-8");
    
    expect(content).toContain("captureException");
    expect(content).toContain("trpc_query_error");
    expect(content).toContain("trpc_mutation_error");
  });

  it("deve usar SentryErrorBoundary no App.tsx", () => {
    const appPath = path.join(projectRoot, "client/src/App.tsx");
    const content = fs.readFileSync(appPath, "utf-8");
    
    expect(content).toContain("SentryErrorBoundary");
    expect(content).not.toContain("<ErrorBoundary>");
  });

  it("deve ter ErrorBoundary com fallback UI em português", () => {
    const ebPath = path.join(projectRoot, "client/src/components/ErrorBoundary.tsx");
    const content = fs.readFileSync(ebPath, "utf-8");
    
    expect(content).toContain("Ocorreu um erro inesperado");
    expect(content).toContain("Recarregar Página");
    expect(content).toContain("Ir para Início");
    expect(content).toContain("Detalhes do Erro");
  });

  it("deve ter SentryErrorBoundary que usa Sentry.ErrorBoundary quando ativo", () => {
    const ebPath = path.join(projectRoot, "client/src/components/ErrorBoundary.tsx");
    const content = fs.readFileSync(ebPath, "utf-8");
    
    expect(content).toContain("export function SentryErrorBoundary");
    expect(content).toContain("isSentryActive()");
    expect(content).toContain("Sentry.ErrorBoundary");
  });
});

describe("Sentry Package Installation", () => {
  it("deve ter @sentry/node instalado", () => {
    const pkgPath = path.join(projectRoot, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    
    expect(pkg.dependencies["@sentry/node"]).toBeDefined();
  });

  it("deve ter @sentry/react instalado", () => {
    const pkgPath = path.join(projectRoot, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    
    expect(pkg.dependencies["@sentry/react"]).toBeDefined();
  });
});
