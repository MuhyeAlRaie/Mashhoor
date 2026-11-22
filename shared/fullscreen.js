/* ============================================================
   Mashhoor Games Suite — Fullscreen helpers + screen wake lock
   Uses the standard Fullscreen API with vendor fallbacks.
   Note: iPhone Safari does not support element fullscreen for
   regular pages — installed PWAs still run standalone.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = document;
  var rootEl = doc.documentElement;

  function isSupported() {
    return !!(rootEl.requestFullscreen || rootEl.webkitRequestFullscreen || rootEl.msRequestFullscreen);
  }

  function el() {
    return doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || null;
  }

  function isFullscreen() { return !!el(); }

  function enter(target) {
    target = target || rootEl;
    var fn = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
    if (!fn) return Promise.resolve(false);
    try {
      var r = fn.call(target);
      return r && typeof r.then === 'function' ? r.catch(function () { return false; }) : Promise.resolve(true);
    } catch (e) { return Promise.resolve(false); }
  }

  function exit() {
    var fn = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (!fn) return Promise.resolve(false);
    try {
      var r = fn.call(doc);
      return r && typeof r.then === 'function' ? r.catch(function () { return false; }) : Promise.resolve(true);
    } catch (e) { return Promise.resolve(false); }
  }

  function toggle(target) { return isFullscreen() ? exit() : enter(target); }

  function onChange(cb) {
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      doc.addEventListener(ev, function () { cb(isFullscreen()); });
    });
  }

  /* ---------- screen wake lock (kiosk friendliness) ---------- */
  var wakeLock = null;

  function requestWakeLock() {
    try {
      if (global.navigator && navigator.wakeLock && typeof navigator.wakeLock.request === 'function') {
        navigator.wakeLock.request('screen').then(function (wl) { wakeLock = wl; }).catch(function () { /* unsupported */ });
      }
    } catch (e) { /* ignore */ }
  }

  function releaseWakeLock() {
    try { if (wakeLock) wakeLock.release(); } catch (e) { /* ignore */ }
    wakeLock = null;
  }

  doc.addEventListener('visibilitychange', function () {
    if (doc.visibilityState === 'visible' && wakeLock === null && isFullscreen()) requestWakeLock();
  });

  global.MashhoorFS = {
    isSupported: isSupported,
    isFullscreen: isFullscreen,
    enter: enter,
    exit: exit,
    toggle: toggle,
    onChange: onChange,
    requestWakeLock: requestWakeLock,
    releaseWakeLock: releaseWakeLock
  };
})(window);
