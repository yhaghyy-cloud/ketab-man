// Bump this version string on every future update. It's the ONLY reason the
// previously-broken behavior kept appearing even after fixes were shipped:
// this file used a permanently cache-first strategy under a cache name that
// never changed, so the phone kept serving the very first version it ever
// downloaded, forever, no matter how many times index.html was updated.
const CACHE_NAME = 'ketab-man-v2';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest version first. Only fall
// back to the cached copy if there's no internet connection right now.
// This means future edits will always show up immediately instead of being
// silently hidden behind a stale cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
