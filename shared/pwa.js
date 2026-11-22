/* Mashhoor Games Suite — service worker registration helper */
(function (global) {
  'use strict';

  function register(path) {
    if (!('serviceWorker' in navigator)) return;
    var secure = location.protocol === 'https:' ||
      location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!secure) {
      console.warn('[Mashhoor] Service worker skipped — needs HTTPS (or localhost).');
      return;
    }
    global.addEventListener('load', function () {
      navigator.serviceWorker.register(path).catch(function (err) {
        console.warn('[Mashhoor] Service worker registration failed:', err);
      });
    });
  }

  global.MashhoorPWA = { register: register };
})(window);
