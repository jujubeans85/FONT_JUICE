const VERSION='font-juice-route-v9';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('font-juice-')).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.mode!=='navigate')return;
  const url=new URL(event.request.url);
  if(!url.pathname.includes('/FONT_JUICE/'))return;
  if(url.pathname.endsWith('/FONT_JUICE/')||url.pathname.endsWith('/FONT_JUICE/index.html')){
    const target=new URL('./working.html',url);
    target.search=url.search;
    target.hash=url.hash;
    event.respondWith(Response.redirect(target.href,302));
  }
});
