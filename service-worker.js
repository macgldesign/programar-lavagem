const CACHE_NAME = 'programar-lavagem-v3'; // Altere a versão aqui a cada update
const ARQUIVOS_APP = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS_APP))
  );
  self.skipWaiting(); // Força o novo Service Worker a ativar imediatamente
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Apaga os caches antigos
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Fontes do Google: usa o cache e atualiza em segundo plano
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const emCache = await cache.match(request);
        const daRede = fetch(request).then(resposta => {
          if (resposta.ok || resposta.type === 'opaque') cache.put(request, resposta.clone());
          return resposta;
        }).catch(() => emCache);
        return emCache || daRede;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Arquivos do app: tenta a rede primeiro (para receber atualizações) e cai no cache se estiver offline
  event.respondWith(
    fetch(request).then(resposta => {
      if (resposta.ok) {
        const copia = resposta.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copia));
      }
      return resposta;
    }).catch(async () => {
      const emCache = await caches.match(request, { ignoreSearch: true });
      if (emCache) return emCache;
      if (request.mode === 'navigate') return caches.match('/index.html');
      return Response.error();
    })
  );
});

// Ao tocar no lembrete, abre (ou foca) o app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(janelas => {
      if (janelas.length) return janelas[0].focus();
      return self.clients.openWindow('/');
    })
  );
});
