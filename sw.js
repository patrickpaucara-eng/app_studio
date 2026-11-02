const C='atenea-v2';
const SHELL=['./','index.html','app.js?v=2','manifest.json','icon.svg','lib/ts-fsrs.umd.js','lib/marked.min.js','lib/purify.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET')return;
  if(u.pathname.endsWith('data.json'))return; // los datos van a localStorage desde la app
  e.respondWith(caches.match(e.request,{ignoreSearch:false}).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res})))});
