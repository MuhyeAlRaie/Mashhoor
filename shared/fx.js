/* ============================================================
   Mashhoor Games Suite — DOM visual effects
   Confetti bursts, floating score text and collect bursts.
   Pure Web Animations API — no dependencies.
   ============================================================ */
(function (global) {
  'use strict';

  function palette() {
    var b = global.MashhoorBranding && global.MashhoorBranding.get();
    if (b) return [b.brand.colors.primary, b.brand.colors.gold, '#FFFFFF', b.brand.colors.dark];
    return ['#EE2231', '#FFC53D', '#FFFFFF', '#1A1B20'];
  }

  function ensureStyle(id, css) {
    if (!document.getElementById(id)) {
      var st = document.createElement('style');
      st.id = id;
      st.textContent = css;
      document.head.appendChild(st);
    }
  }

  function confetti(container, opts) {
    opts = opts || {};
    var host = container || document.body;
    if (!host) return;
    ensureStyle('fx-confetti-style',
      '.fx-confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:80}');
    var overlay = document.createElement('div');
    overlay.className = 'fx-confetti';
    overlay.setAttribute('aria-hidden', 'true');
    host.appendChild(overlay);
    var colors = palette();
    var count = opts.count || 90;
    var dur = opts.duration || 2600;
    var h = host.clientHeight || 800;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      var size = 6 + Math.random() * 8;
      p.style.cssText = 'position:absolute;top:-24px;left:' + (Math.random() * 100) + '%;width:' + size +
        'px;height:' + (size * (Math.random() > 0.5 ? 1 : 1.8)) +
        'px;background:' + colors[i % colors.length] +
        ';opacity:.95;border-radius:' + (Math.random() > 0.7 ? '50%' : '2px') + ';';
      overlay.appendChild(p);
      var fall = dur + Math.random() * 1400;
      var drift = (Math.random() - 0.5) * 260;
      var anim = p.animate([
        { transform: 'translate(0,0) rotate(0deg)' },
        { transform: 'translate(' + drift + 'px,' + (h + 90) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg)' }
      ], { duration: fall, delay: Math.random() * 500, easing: 'cubic-bezier(.2,.6,.45,1)', fill: 'both' });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
    setTimeout(function () { overlay.remove(); }, dur + 2300);
  }

  function floatText(container, x, y, text, cls) {
    var host = container || document.body;
    if (!host) return;
    ensureStyle('fx-float-style',
      '.fx-float{position:absolute;pointer-events:none;z-index:70;font-family:var(--font-display);' +
      'font-weight:800;font-size:22px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.45);white-space:nowrap;}');
    var el = document.createElement('div');
    el.className = 'fx-float ' + (cls || '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    host.appendChild(el);
    var anim = el.animate([
      { opacity: 1, transform: 'translate(-50%,-50%) scale(.7)' },
      { opacity: 0, transform: 'translate(-50%,-190%) scale(1.3)' }
    ], { duration: 900, easing: 'ease-out', fill: 'both' });
    anim.onfinish = function () { el.remove(); };
  }

  function burst(container, x, y, color, count) {
    var host = container || document.body;
    if (!host) return;
    var n = count || 10;
    for (var i = 0; i < n; i++) {
      var d = document.createElement('div');
      var s = 5 + Math.random() * 6;
      d.style.cssText = 'position:absolute;width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' +
        (color || '#FFC53D') + ';pointer-events:none;z-index:70;left:' + (x - s / 2) + 'px;top:' + (y - s / 2) + 'px;';
      host.appendChild(d);
      var ang = (Math.PI * 2 * i) / n + Math.random() * 0.7;
      var dist = 34 + Math.random() * 50;
      var anim = d.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + (Math.cos(ang) * dist) + 'px,' + (Math.sin(ang) * dist) + 'px) scale(.35)', opacity: 0 }
      ], { duration: 480 + Math.random() * 220, easing: 'ease-out', fill: 'both' });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(d);
    }
  }

  global.MashhoorFX = { confetti: confetti, floatText: floatText, burst: burst };
})(window);
