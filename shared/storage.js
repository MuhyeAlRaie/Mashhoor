/* ============================================================
   Mashhoor Games Suite — local storage wrapper
   Safe access to localStorage (private-mode/quota aware) plus
   score helpers. Every key is prefixed with "mashhoor_".
   NOTE: data is device-local by design (GitHub Pages is static).
   The public API below is the seam where a remote backend
   (Supabase / Firebase) can be plugged in later — see README.
   ============================================================ */
(function (global) {
  'use strict';

  var PREFIX = 'mashhoor_';

  function k(key) { return PREFIX + key; }

  var available = (function () {
    try {
      localStorage.setItem(k('__probe__'), '1');
      localStorage.removeItem(k('__probe__'));
      return true;
    } catch (e) { return false; }
  })();

  function get(key, fallback) {
    if (!available) return fallback;
    try {
      var raw = localStorage.getItem(k(key));
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }

  function set(key, val) {
    try {
      localStorage.setItem(k(key), JSON.stringify(val));
      return true;
    } catch (e) {
      global.dispatchEvent(new CustomEvent('mashhoor:storage-error', { detail: { key: key } }));
      return false;
    }
  }

  function remove(key) { try { localStorage.removeItem(k(key)); } catch (e) { /* ignore */ } }

  /* ---------- scores ---------- */
  function xoScore() { return get('score_xo', { p1: 0, p2: 0, draw: 0 }); }
  function setXoScore(s) { return set('score_xo', s); }
  function motionBest(mode) { return get('best_motion_' + (mode || 'single'), 0); }
  function setMotionBest(mode, v) { return set('best_motion_' + (mode || 'single'), v); }
  function dashBest() { return get('best_dash', 0); }
  function setDashBest(v) { return set('best_dash', v); }

  function clearScores() {
    ['score_xo', 'best_motion_single', 'best_motion_two', 'best_dash', 'dash_skin'].forEach(remove);
  }

  function clearAll() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(PREFIX) === 0) keys.push(key);
      }
      keys.forEach(function (key) { localStorage.removeItem(key); });
    } catch (e) { /* ignore */ }
  }

  function usageBytes() {
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(PREFIX) === 0) {
          total += (localStorage.getItem(key) || '').length * 2 + key.length * 2;
        }
      }
    } catch (e) { /* ignore */ }
    return total;
  }

  global.MashhoorStore = {
    available: available,
    get: get, set: set, remove: remove,
    xoScore: xoScore, setXoScore: setXoScore,
    motionBest: motionBest, setMotionBest: setMotionBest,
    dashBest: dashBest, setDashBest: setDashBest,
    clearScores: clearScores, clearAll: clearAll,
    usageBytes: usageBytes, PREFIX: PREFIX
  };
})(window);
