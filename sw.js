const CACHE = 'shopping-memo-v15';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './dela.woff2', './zun-normal.png', './zun-surprise.png', './zun-smile.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// HTML はネット優先（更新がすぐ反映される）。画像・書体・アイコンはキャッシュ優先（移動のたびに何度も問い合わせない。変えるときはキャッシュ名を上げる）
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  const isPage = r.mode === 'navigate' || /(^|\/)(index\.html)?$/.test(u.pathname) || u.pathname.endsWith('.webmanifest');
  if (isPage) {
    e.respondWith(
      fetch(r, { cache: 'no-cache' }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy));
        return res;
      }).catch(() => caches.match(r).then(x => x || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(r).then(x => x || fetch(r).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy));
        return res;
      }))
    );
  }
});
