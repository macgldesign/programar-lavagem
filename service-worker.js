const CACHE_NAME = 'programar-lavagem-v1'; // Altere a versão aqui a cada update

self.addEventListener('install', event => {
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
