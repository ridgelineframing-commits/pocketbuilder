/* Pocket Builder service worker — offline shell, network-first page so updates propagate */
const CACHE='pocketbuilder-v15';
const ASSETS=['./','./index.html','./privacy.html','./styles.css','./js/engine.js','./js/app.js','./js/share.js','./js/edit-ops.js','./js/scale.js','./js/desktop.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(rr=>{const cc=rr.clone();caches.open(CACHE).then(c=>{try{c.put('./index.html',cc);}catch(x){}});return rr;}).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>{
    const net=fetch(e.request).then(rr=>{const cc=rr.clone();caches.open(CACHE).then(c=>{try{c.put(e.request,cc);}catch(x){}});return rr;}).catch(()=>r);
    return r||net;
  }));
});
