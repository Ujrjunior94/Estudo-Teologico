const CACHE_NAME = 'estudo-biblico-pro-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline essentials');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing stale cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass service worker cache entirely in development mode to prevent stale chunk/module conflicts
  const isDev = 
    url.hostname === 'localhost' || 
    url.hostname === '127.0.0.1' || 
    url.hostname.includes('-dev-') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/.vite/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@id/') ||
    url.pathname.includes('/@fs/');

  if (isDev) {
    // Direct network pass-through for development assets
    event.respondWith(fetch(request));
    return;
  }

  // If it's a call to the local dictionary or verse API, use Network-First, falling back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response and cache it
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(() => {
          // If network failed, try cache
          console.log('[Service Worker] API network offline, loading from Cache:', url.pathname);
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            
            // Return JSON indicating offline fallback if cache missed
            return new Response(
              JSON.stringify({
                error: 'Você está offline.',
                message: 'Informação não disponível offline no momento.',
                isOffline: true
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Otherwise, use Cache-First with Network-Fallback for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        // Cache newly fetched assets dynamically
        if (response.ok && request.method === 'GET') {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseCopy);
          });
        }
        return response;
      }).catch(() => {
        // Ultimate fallback for navigation requests (HTML page)
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});

// Background Sync Event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-theology-studies') {
    console.log('[Service Worker] Background Syncing pending notes/favorites...');
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          // Inform client that network has been restored and background sync completed
          client.postMessage({
            type: 'SYNC_COMPLETED',
            message: 'Sincronização offline concluída com sucesso!'
          });
        });
      })
    );
  }
});
