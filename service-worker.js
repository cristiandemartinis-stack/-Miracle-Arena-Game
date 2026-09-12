self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))))) });
self.addEventListener('activate',event=>{event.waitUntil((async()=>{await caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))));await self.registration.unregister();const clients=await self.clients.matchAll({type:'window'});for(const c of clients)c.navigate(c.url);})())});
self.addEventListener('fetch',()=>{});
