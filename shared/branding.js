/* ============================================================
   Mashhoor Games Suite — Branding configuration
   Single source of truth for the whole suite. Defaults live in
   DEFAULTS (this file); overrides are persisted in localStorage
   by the Admin panel and merged over the defaults at runtime.
   Assets are referenced with paths relative to the suite root
   and resolved with resolve() so GitHub Pages subpaths work.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'mashhoor_branding_v1';

  /* Suite root URL (parent of /shared/), computed from this script's src —
     works on any GitHub Pages subpath such as /<user>.github.io/<repo>/ */
  var BASE = (function () {
    try {
      if (document.currentScript && document.currentScript.src) {
        return new URL('../', document.currentScript.src).href;
      }
    } catch (e) { /* fall through */ }
    return new URL('.', location.href).href;
  })();

  var DEFAULTS = {
    version: 1,
    updatedAt: null,
    brand: {
      name: 'Mashhoor',
      tagline: 'Fried Chicken',
      logoLightBg: 'assets/branding/logo-red.png',    /* used on white/light surfaces */
      logoDarkBg: 'assets/branding/logo-white.png',   /* used on red/dark surfaces    */
      colors: { primary: '#EE2231', dark: '#1A1B20', gold: '#FFC53D' }
    },
    sounds: { enabled: true, volume: 0.8 },
    language: 'en',
    products: {
      chicken: { name: 'Fried Chicken', image: 'assets/products/chicken.png', size: 110, points: 10, enabled: true },
      burger:  { name: 'Chicken Burger', image: 'assets/products/burger.png', size: 110, points: 25, enabled: true },
      fries:   { name: 'French Fries',   image: 'assets/products/fries.png',  size: 110, points: 15, enabled: true }
    },
    xo: { mode: 'pvp', cpuLevel: 'normal' },
    motion: { mode: 'single', duration: 60, difficulty: 'normal', showSkeleton: true },
    dash: {
      gameName: 'Chicken Dash',
      speed: 1,               /* 0.8 – 1.5 */
      touchButtons: true,
      backgroundImage: null,  /* optional dataURL or path */
      music: null,            /* optional dataURL */
      skins: [
        { id: 'classic', name: 'Mashy Classic', image: 'assets/characters/skin-classic.png' },
        { id: 'chef',    name: 'Chef Mashy',    image: 'assets/characters/skin-chef.png' },
        { id: 'spicy',   name: 'Spicy Mashy',   image: 'assets/characters/skin-spicy.png' }
      ]
    }
  };

  var listeners = [];
  var state = null;

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  function deepClone(v) {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(deepClone);
    var o = {};
    Object.keys(v).forEach(function (k) { o[k] = deepClone(v[k]); });
    return o;
  }

  function deepMerge(target, patch) {
    Object.keys(patch || {}).forEach(function (k) {
      var pv = patch[k];
      if (pv === undefined) return;
      if (isObj(pv) && isObj(target[k])) deepMerge(target[k], pv);
      else target[k] = (isObj(pv) || Array.isArray(pv)) ? deepClone(pv) : pv;
    });
    return target;
  }

  function load() {
    var stored = {};
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) stored = JSON.parse(raw) || {};
    } catch (e) { stored = {}; }
    state = deepMerge(deepClone(DEFAULTS), stored);
    return state;
  }

  function save() {
    try {
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      global.dispatchEvent(new CustomEvent('mashhoor:storage-error', { detail: { reason: 'quota' } }));
    }
  }

  function setByPath(obj, path, val) {
    var parts = path.split('.');
    var o = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!isObj(o[parts[i]])) o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = val;
  }

  function get() { if (!state) load(); return state; }

  function update(patch) { deepMerge(state, patch); save(); notify(); }

  function updatePath(path, val) { setByPath(state, path, val); save(); notify(); }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    state = deepClone(DEFAULTS);
    notify();
  }

  function resolve(p) {
    if (!p) return '';
    if (/^(data:|https?:|blob:)/.test(p)) return p;
    if (p.charAt(0) === '/') return p;
    return BASE + p;
  }

  function hexToRgb(hex) {
    var c = String(hex || '').replace('#', '');
    if (c.length === 3) c = c.split('').map(function (ch) { return ch + ch; }).join('');
    var n = parseInt(c, 16);
    if (isNaN(n)) return { r: 238, g: 34, b: 49 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function shade(hex, amt) {
    var c = hexToRgb(hex);
    var f = function (v) { return Math.round(Math.min(255, Math.max(0, v + amt * 255))); };
    return 'rgb(' + f(c.r) + ',' + f(c.g) + ',' + f(c.b) + ')';
  }

  function applyCSSVars() {
    var s = get();
    var root = document.documentElement.style;
    root.setProperty('--brand-primary', s.brand.colors.primary);
    root.setProperty('--brand-primary-deep', shade(s.brand.colors.primary, -0.18));
    root.setProperty('--brand-dark', s.brand.colors.dark);
    root.setProperty('--brand-gold', s.brand.colors.gold);
  }

  function notify() {
    applyCSSVars();
    listeners.forEach(function (cb) { try { cb(get()); } catch (e) { console.error(e); } });
    global.dispatchEvent(new CustomEvent('mashhoor:branding', { detail: get() }));
  }

  function onChange(cb) { listeners.push(cb); }

  function exportJSON() { return JSON.stringify(get(), null, 2); }

  function importJSON(str) {
    var data = JSON.parse(str);
    if (!data || typeof data !== 'object') throw new Error('invalid');
    deepMerge(state, data);
    save();
    notify();
  }

  load();
  applyCSSVars();

  global.MashhoorBranding = {
    get: get, update: update, updatePath: updatePath, reset: reset,
    resolve: resolve, applyCSSVars: applyCSSVars, onChange: onChange,
    exportJSON: exportJSON, importJSON: importJSON,
    DEFAULTS: DEFAULTS, BASE: BASE
  };
})(window);
