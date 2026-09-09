/* TANK — service worker : le site s'ouvre hors ligne (réseau d'abord,
   cache en secours). À déployer à côté de index.html. */
const CACHE='tank-v1';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.add('./')).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      return r;
    }).catch(()=>caches.match(e.request,{ignoreSearch:true})
      .then(m=>m||caches.match('./')))
  );
});
