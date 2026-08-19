const CACHE_NAME = 'gestao-op-v1.1.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instalação: Armazena recursos estáticos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não sejam GET ou para extensões de navegador
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Atualiza o cache com a nova resposta da rede
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
          // Se a rede falhar e não houver cache, podemos retornar um fallback aqui se necessário
        });

        // Retorna o cache imediatamente (stale) e atualiza em background (revalidate)
        return cachedResponse || fetchPromise;
      });
    })
  );
});

