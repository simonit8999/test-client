// Версию поднимать при изменении логики кэша: старые кэши удалятся в activate.
const CACHE = 'graphite-v2'

// Только реально существующие файлы (раньше здесь был ./config.json,
// из-за которого install падал и service worker вообще не запускался).
const ASSETS = ['./', './index.html', './manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()))
})

// Кэшируем только успешные ответы (или opaque для кросс-доменных ресурсов)
function cachePut(request, response) {
  if (!response || (!response.ok && response.type !== 'opaque')) return Promise.resolve()
  return caches.open(CACHE).then((c) => c.put(request, response))
}

/**
 * Сеть → кэш. Онлайн всегда отдаём свежий файл, офлайн — последний удачный.
 * Важно для HTML: если кэшировать index.html по cache-first, после деплоя
 * пользователь ещё долго видит старую версию сайта.
 */
function networkFirst(request, fallbackUrl) {
  return fetch(request)
    .then((res) => { cachePut(request, res.clone()); return res })
    .catch(() => caches.match(request).then((cached) => cached || (fallbackUrl ? caches.match(fallbackUrl) : undefined) || Response.error()))
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)

  // Навигация (HTML) и JSON клиентских конфигов: network-first — свежие данные.
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.json')) {
    e.respondWith(networkFirst(e.request, './index.html'))
    return
  }

  // Хэшированные бандлы, картинки, шрифты: cache-first безопасен,
  // потому что имена файлов меняются при каждой сборке.
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request).then((res) => { cachePut(e.request, res.clone()); return res })
        .catch(() => caches.match('./index.html'))
    )
  )
})
