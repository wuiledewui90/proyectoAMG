const CACHE_PREFIX = "amg-gestion"
const STATIC_CACHE = `${CACHE_PREFIX}-static-v3`
const IMAGE_CACHE = `${CACHE_PREFIX}-images-v2`
const OFFLINE_PAGE = "/management-offline.html"
const PRECACHE = [
  OFFLINE_PAGE,
  "/images/amg-gestion-192.png",
  "/images/amg-gestion-512.png",
  "/images/documents/amg-logo-ui.webp",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && ![STATIC_CACHE, IMAGE_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

async function trimCache(cache, maximumEntries) {
  const keys = await cache.keys()
  if (keys.length <= maximumEntries) return
  await Promise.all(keys.slice(0, keys.length - maximumEntries).map((key) => cache.delete(key)))
}

async function cacheFirst(request, cacheName, maximumEntries) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone())
    await trimCache(cache, maximumEntries)
  }
  return response
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok || response.type === "opaque") {
        await cache.put(request, response.clone())
        await trimCache(cache, 180)
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    event.waitUntil(network.then(() => undefined))
    return cached
  }

  return (await network) || Response.error()
}

// Los datos sensibles siempre usan la red. Solo se guardan recursos visuales y estáticos.
self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_PAGE)))
    return
  }

  if (url.pathname.startsWith("/api/") || request.headers.has("RSC")) return

  if (url.origin === self.location.origin && (request.destination === "image" || url.pathname === "/_next/image")) {
    event.respondWith(staleWhileRevalidate(request, event))
    return
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, 80))
  }
})
