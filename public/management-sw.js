self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// El panel trabaja siempre contra la red para no mostrar stock o ventas desactualizados.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request))
})
