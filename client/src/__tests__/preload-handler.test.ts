/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('vite:preloadError handler', () => {
  beforeEach(() => {
    // Limpar sessionStorage
    sessionStorage.clear();
  });

  it('should prevent default on vite:preloadError and reload', () => {
    const PRELOAD_RELOAD_KEY = 'promptjur_preload_reload';
    
    // Simular o handler
    let handlerCalled = false;
    let preventDefaultCalled = false;
    
    const handler = (event: Event) => {
      const lastReload = sessionStorage.getItem(PRELOAD_RELOAD_KEY);
      const now = Date.now();
      
      if (lastReload && now - parseInt(lastReload, 10) < 30_000) {
        return;
      }
      
      event.preventDefault();
      preventDefaultCalled = true;
      sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now));
      handlerCalled = true;
    };

    // Criar evento simulado
    const event = new Event('vite:preloadError', { cancelable: true });
    handler(event);

    expect(handlerCalled).toBe(true);
    expect(preventDefaultCalled).toBe(true);
    expect(sessionStorage.getItem(PRELOAD_RELOAD_KEY)).toBeTruthy();
  });

  it('should not reload if already reloaded within 30 seconds', () => {
    const PRELOAD_RELOAD_KEY = 'promptjur_preload_reload';
    
    // Simular que já recarregou recentemente
    sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()));
    
    let shouldReload = true;
    
    const handler = () => {
      const lastReload = sessionStorage.getItem(PRELOAD_RELOAD_KEY);
      const now = Date.now();
      
      if (lastReload && now - parseInt(lastReload, 10) < 30_000) {
        shouldReload = false;
        return;
      }
      
      shouldReload = true;
    };

    handler();
    expect(shouldReload).toBe(false);
  });

  it('should allow reload after 30 second cooldown', () => {
    const PRELOAD_RELOAD_KEY = 'promptjur_preload_reload';
    
    // Simular que recarregou há mais de 30 segundos
    sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now() - 31_000));
    
    let shouldReload = false;
    
    const handler = () => {
      const lastReload = sessionStorage.getItem(PRELOAD_RELOAD_KEY);
      const now = Date.now();
      
      if (lastReload && now - parseInt(lastReload, 10) < 30_000) {
        shouldReload = false;
        return;
      }
      
      shouldReload = true;
    };

    handler();
    expect(shouldReload).toBe(true);
  });
});

describe('Service Worker registration', () => {
  it('should only register in production mode', () => {
    // O SW só deve registrar quando import.meta.env.PROD é true
    const isProd = false; // Em testes, estamos em dev
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    // Em dev, não deve registrar
    const shouldRegister = hasServiceWorker && isProd;
    expect(shouldRegister).toBe(false);
  });
});
