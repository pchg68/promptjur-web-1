/**
 * Service Worker para cache de chunks JS/CSS do Vite.
 *
 * Estratégia: Cache-First para assets com hash no nome (imutáveis),
 * Network-First para HTML e API calls.
 *
 * Assets do Vite incluem hash no nome (ex: index-BmevHOvJ.js),
 * então são seguros para cachear indefinidamente — um novo deploy
 * gera novos hashes e o SW baixa automaticamente.
 *
 * Benefícios:
 * - Carregamento instantâneo de chunks já visitados
 * - Resiliência em conexões instáveis
 * - Redução de bandwidth e latência
 */

const CACHE_NAME = 'promptjur-assets-v1';

// Padrão para identificar assets com hash do Vite
const HASHED_ASSET_PATTERN = /\/assets\/[^/]+\.[a-f0-9]{8,}\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|avif)$/i;

// Padrão para fontes do Google
const GOOGLE_FONTS_PATTERN = /fonts\.(googleapis|gstatic)\.com/;

/**
 * Install: pré-cachear nada — deixar o cache ser preenchido sob demanda.
 * Isso evita baixar assets desnecessários e mantém o SW leve.
 */
self.addEventListener('install', (event) => {
  // Ativar imediatamente sem esperar tabs antigas fecharem
  self.skipWaiting();
});

/**
 * Activate: limpar caches antigos e tomar controle de todas as tabs.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Tomar controle de todas as tabs imediatamente
      return self.clients.claim();
    })
  );
});

/**
 * Fetch handler com estratégias diferenciadas:
 * - Assets com hash: Cache-First (imutáveis)
 * - Google Fonts: Cache-First (raramente mudam)
 * - Tudo mais: Network-only (não interceptar)
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar requests não-GET
  if (event.request.method !== 'GET') return;

  // Ignorar API calls e OAuth
  if (url.pathname.startsWith('/api/')) return;

  // Assets com hash do Vite — Cache-First
  if (HASHED_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Google Fonts — Cache-First
  if (GOOGLE_FONTS_PATTERN.test(url.hostname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Tudo mais: não interceptar (comportamento padrão do browser)
});

/**
 * Cache-First: tenta o cache primeiro, se não encontrar vai para a rede.
 * Ideal para assets imutáveis (com hash no nome).
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    // Só cachear respostas válidas (200 OK)
    if (response.ok && response.status === 200) {
      // Clonar a resposta porque ela só pode ser consumida uma vez
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Se a rede falhar e não temos cache, retornar erro
    console.error('[SW] Falha ao buscar:', request.url, error);
    throw error;
  }
}

/**
 * Limpar cache antigo periodicamente.
 * Assets com hash antigo nunca serão requisitados novamente após um deploy,
 * então podemos removê-los para economizar espaço.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          // Se o cache tem mais de 200 entradas, remover as mais antigas
          if (requests.length > 200) {
            const toDelete = requests.slice(0, requests.length - 100);
            return Promise.all(toDelete.map((req) => cache.delete(req)));
          }
        });
      })
    );
  }
});
