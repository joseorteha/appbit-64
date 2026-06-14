const CACHE = 'appbit64-v1'
const STATIC = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  // Only cache GET requests; skip API calls
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('localhost:8000')) return

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        if (res.ok) {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
        }
        return res
      })
      return cached ?? network
    })
  )
})
