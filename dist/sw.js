const CACHE = 'graphite-v1';

// Только реально существующие файлы. Раньше здесь был ./config.json,
// из-за которого install падал и service worker вообще не запускался.
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

// Кэшируем только успешные ответы (или opaque для кросс-доменных ресурсов)
function cachePut(request, response) {
  if (!response || (!response.ok && response.type !== 'opaque')) return Promise.resolve();
  return caches.open(CACHE).then((c) => c.put(request, response));
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // JSON (клиентские конфиги): network-first, чтобы клиенты всегда видели
  // свежие данные; офлайн — последний закэшированный вариант.
  if (url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => { cachePut(e.request, res.clone()); return res; })
        .catch(() => caches.match(e.request).then((cached) => cached || Response.error()))
    );
    return;
  }

  // Остальное (бандл, картинки, шрифты): cache-first
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request).then((res) => {
        cachePut(e.request, res.clone());
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});