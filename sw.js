const CACHE_NAME = "src-cache-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./fonts/bebas-neue-400.woff2",
  "./fonts/inter-400.woff2",
  "./fonts/inter-500.woff2",
  "./fonts/inter-600.woff2",
  "./fonts/inter-700.woff2",
  "./fonts/ibm-plex-mono-400.woff2",
  "./fonts/ibm-plex-mono-500.woff2"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
