/* ============================================================
   Mashhoor Games Suite — Service Worker
   Cache-first shell with background refresh, offline-capable.
   IMPORTANT: bump VERSION whenever you release changed files,
   then the new cache takes over on the next visit.
   ============================================================ */
var VERSION = 'mashhoor-v1.0.0';

var CORE = [
  './',
  './index.html',
  './favicon.png',
  './manifest.webmanifest',
  './admin/index.html',
  './admin/admin.css',
  './admin/admin.js',
  './shared/ui.css',
  './shared/i18n.js',
  './shared/branding.js',
  './shared/storage.js',
  './shared/sound.js',
  './shared/fullscreen.js',
  './shared/fx.js',
  './shared/icons.js',
  './shared/pwa.js',
  './games/mashhoor-xo/index.html',
  './games/mashhoor-xo/xo.css',
  './games/mashhoor-xo/xo.js',
  './games/mashhoor-motion/index.html',
  './games/mashhoor-motion/motion.css',
  './games/mashhoor-motion/motion.js',
  './games/mashhoor-motion/vendor/vision_bundle.mjs',
  './games/mashhoor-motion/vendor/wasm/vision_wasm_internal.js',
  './games/mashhoor-motion/vendor/wasm/vision_wasm_internal.wasm',
  './games/mashhoor-motion/vendor/hand_landmarker.task',
  './games/chicken-dash/index.html',
  './games/chicken-dash/manifest.webmanifest',
  './games/chicken-dash/dash.css',
  './games/chicken-dash/dash.js',
  './assets/branding/logo-red.png',
  './assets/branding/logo-white.png',
  './assets/products/chicken.png',
  './assets/products/burger.png',
  './assets/products/fries.png',
  './assets/characters/skin-classic.png',
  './assets/characters/skin-chef.png',
  './assets/characters/skin-spicy.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/fonts/Baloo2-600.woff2',
  './assets/fonts/Baloo2-700.woff2',
  './assets/fonts/Baloo2-800.woff2'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION).then(function (cache) {
      /* Install one-by-one so a single missing file never breaks the SW */
      return Promise.allSettled(CORE.map(function (u) {
        return cache.add(new Request(u, { cache: 'reload' })).catch(function (err) {
          console.warn('[SW] precache miss:', u, err && err.message);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k !== VERSION ? caches.delete(k) : null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; /* never intercept cross-origin */

  event.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone());
          }
          return res;
        }).catch(function () { return null; });

        if (hit) {
          net.catch(function () { /* background refresh failed — cache still valid */ });
          return hit;
        }
        return net.then(function (res) {
          if (res) return res;
          if (req.mode === 'navigate') {
            return cache.match('./index.html').then(function (shell) { return shell || Response.error(); });
          }
          return Response.error();
        });
      });
    })
  );
});
