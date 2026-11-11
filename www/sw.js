// Bộ đệm ngoại tuyến cho bản web (PWA). App native không cần file này.
const CACHE = 'ptm-v1.0.0';
const FILES = ['./', 'index.html', 'config.js', 'platform.js', 'meta.js', 'meta.css', 'manifest.webmanifest', 'privacy.html',
  'fonts/fonts.css', 'fonts/baloo2-latin.woff2', 'fonts/baloo2-latin-ext.woff2', 'fonts/baloo2-vietnamese.woff2',
  'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
