import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ url }) => url.href.includes('supabase.co'),
  new NetworkFirst({ cacheName: 'supabase-cache', networkTimeoutSeconds: 10 })
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
)

self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try { data = event.data.json() } catch { return }

  const isRestaurant = data.urgent === true
  const isAdmin = data.admin_urgent === true
  const isUrgent = isRestaurant || isAdmin
  const options = {
    body: data.body,
    icon: '/icons/pwa-192x192.png',
    badge: '/icons/pwa-64x64.png',
    data: { url: data.url || '/' },
    vibrate: isAdmin
      ? [300, 100, 300, 100, 600, 200, 300, 100, 300, 100, 600]
      : isRestaurant
        ? [500, 200, 500, 200, 500, 200, 500, 200, 500]
        : [200, 100, 200],
    requireInteraction: isUrgent,
    tag: isRestaurant ? 'nuevo-pedido' : isAdmin ? 'nueva-recarga' : undefined,
    renotify: isUrgent,
    actions: isRestaurant
      ? [{ action: 'view', title: '👀 Ver pedido ahora' }]
      : isAdmin
        ? [{ action: 'view', title: '💰 Ver recarga' }]
        : [],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const hit = list.find((c) => c.url.includes(self.location.origin))
      if (hit) { hit.navigate(url); return hit.focus() }
      return clients.openWindow(url)
    })
  )
})

self.addEventListener('notificationclose', (event) => {
  // fired when notification is dismissed — no action needed
})
