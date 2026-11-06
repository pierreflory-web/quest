const CACHE = 'quest-v5';
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'js/main.js',
  'js/audio.js',
  'js/world.js',
  'js/data.js',
  'js/state.js',
  'js/ui.js',
  'js/input.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') { return; }
  // Script « Mes Jeux » (points, badges) : réseau d'abord, pour ne jamais rester
  // sur une vieille copie ; le cache ne sert que hors ligne.
  if (new URL(e.request.url).pathname.endsWith('/jeux/points.js')) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit
      || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }))
  );
});
