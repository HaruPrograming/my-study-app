/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST ?? [])

registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
  new NetworkOnly(),
  'GET'
)
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
  new NetworkOnly(),
  'POST'
)
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
  new NetworkOnly(),
  'PATCH'
)
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
  new NetworkOnly(),
  'DELETE'
)

self.addEventListener('push', (event: PushEvent) => {
  console.log('[SW] push event received', event)
  if (!event.data) {
    console.log('[SW] push event has no data')
    return
  }
  let title = '🎯 ときトレ'
  let body = ''
  try {
    const data = event.data.json() as { title?: string; body?: string }
    title = data.title ?? title
    body = data.body ?? ''
  } catch {
    body = event.data.text()
  }
  console.log('[SW] showing notification:', title, body)
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    }).then(() => {
      console.log('[SW] notification shown')
    }).catch((err: unknown) => {
      console.error('[SW] showNotification error:', err)
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const focused = clients.find(c => c.focused)
      if (focused) return focused.focus()
      if (clients.length > 0) return clients[0].focus()
      return self.clients.openWindow('/')
    })
  )
})
