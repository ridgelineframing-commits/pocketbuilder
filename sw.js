/* PocketBuilder service worker — offline shell.
   App-shell files (HTML/CSS/JS/manifest) are NETWORK-FIRST so a deploy never
   mixes fresh HTML with stale assets; the cache is only the offline fallback.
   Images stay cache-first (they change rarely and rename when they matter). */
const CACHE='pocketbuilder-v18';
const ASSETS=['./','./index.html','./privacy.html','./styles.css','./js/engine.js','./js/app.js','./js/share.js','./js/edit-ops.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  const shell = e.request.mode==='navigate' ||
    (url.origin===location.origin && /\.(css|js|webmanifest)$/.test(url.pathname));
  if(shell){
    e.respondWith(fetch(e.request).then(rr=>{
      const cc=rr.clone();
      caches.open(CACHE).then(c=>{try{c.put(e.request.mode==='navigate'?'./index.html':e.request,cc);}catch(x){}});
      return rr;
    }).catch(()=>caches.match(e.request.mode==='navigate'?'./index.html':e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>{
    const net=fetch(e.request).then(rr=>{const cc=rr.clone();caches.open(CACHE).then(c=>{try{c.put(e.request,cc);}catch(x){}});return rr;}).catch(()=>r);
    return r||net;
  }));
});
