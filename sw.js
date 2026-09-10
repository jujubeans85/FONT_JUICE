// Retirement worker for old installed copies. No fetch handler or new registration.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith('font-juice-')).map(name => caches.delete(name)));
  await self.registration.unregister();
})()));
