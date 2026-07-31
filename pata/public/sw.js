/* PATA service worker — full offline.
   Two tiers:
     - SHELL: precached on install, so a cold load works with the network off.
     - Everything else (OCR worker, WASM core, the 12 language models): cached
       the first time it is used, then available offline. In the Android APK
       these files ship on disk, so OCR is offline from the moment it installs.
*/
const CACHE = 'pata-v2';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './assets/app.js',
  './assets/index.css',
  // Lazy chunks the SDK pulls in — precached so an offline cold load
  // never hits a missing import.
  './assets/web.js',
  './assets/web2.js',
  './assets/web3.js',
  './assets/node.browser.js',
  './assets/__vite-browser-external.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // Add individually: one 404 must not abort the whole install.
      await Promise.all(
        SHELL.map((url) => cache.add(url).catch(() => undefined))
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch the API

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(async () => {
            // Offline and uncached: fall back to the shell for navigations.
            if (req.mode === 'navigate') {
              return (await caches.match('./index.html')) ?? Response.error();
            }
            return Response.error();
          })
    )
  );
});
