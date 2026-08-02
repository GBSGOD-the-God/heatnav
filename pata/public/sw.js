/* PATA service worker — full offline.
   Two tiers:
     - SHELL: precached on install, so a cold load works with the network off.
     - Everything else (OCR worker, WASM core, the 12 language models): cached
       the first time it is used, then available offline. In the Android APK
       these files ship on disk, so OCR is offline from the moment it installs.
*/
const CACHE = 'pata-v3';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './assets/app.js',
  './assets/index.css',
  // Small lazy chunks Tesseract pulls in — precached so the first offline
  // OCR run never hits a missing import.
  './assets/web.js',
  './assets/web2.js',
  './assets/web3.js',
  './assets/web4.js',
];
// scripts/check-shell.mjs fails the build if the bundler emits a chunk that is
// not listed above — this list silently drifting is how the first offline OCR
// run ends up fetching a file that was never cached.

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

/**
 * The app's own code is served NETWORK-FIRST; everything else cache-first.
 *
 * This matters more than it looks. Our filenames are not content-hashed, so a
 * cache-first app.js is served from the cache forever — install a new APK and
 * the WebView happily keeps running the previous build's JavaScript, because
 * app data survives the update and the cached response never expires. Every
 * fix would appear not to have shipped.
 *
 * Network-first costs nothing where it matters: inside the APK the "network"
 * is the local asset server, and offline it falls straight through to the
 * cache, so a cold offline load still works.
 */
function isAppCode(url, req) {
  return (
    req.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    /\/assets\/[^/]+\.js$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch the API

  const store = async (res) => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  };

  if (isAppCode(url, req)) {
    e.respondWith(
      fetch(req)
        .then(store)
        .catch(async () =>
          (await caches.match(req, { ignoreSearch: true })) ??
          (req.mode === 'navigate' ? await caches.match('./index.html') : null) ??
          Response.error()
        )
    );
    return;
  }

  // Language models, the WASM core, images: big, immutable, cache-first.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) => hit || fetch(req).then(store).catch(() => Response.error())
    )
  );
});
