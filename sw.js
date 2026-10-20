// App shell cache so Nest List opens instantly and works offline. Bump VERSION on every release.
const VERSION = 'nest-v5';
const SHELL = ['./', 'index.html', 'app.css?v=5', 'app.js?v=5', 'config.js', 'starter.json', 'vendor/supabase.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // database and fonts go straight to the network
  // Network first for the app files, falling back to the cache when offline.
  // Skip the browser's HTTP cache so a new release shows up on the next open.
  e.respondWith(fetch(new Request(e.request.url, {cache: 'no-cache', credentials: 'same-origin'})).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html'))));
});
