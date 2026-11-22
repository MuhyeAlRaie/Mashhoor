/* ============================================================
   Mashhoor Games Suite — synthesized sound effects
   No audio files needed: every effect is generated with the
   Web Audio API, so the suite stays 100% offline-capable and
   tiny. Volume / on-off come from the shared branding config.
   ============================================================ */
(function (global) {
  'use strict';

  var ctx = null, master = null;
  var enabled = true, volume = 0.8;

  function ensure() {
    try {
      if (!ctx) {
        var AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain();
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      if (master) master.gain.value = enabled ? volume : 0;
      return true;
    } catch (e) { return false; }
  }

  function tone(f0, f1, dur, type, vol, delay) {
    if (!ensure()) return;
    try {
      var t0 = ctx.currentTime + (delay || 0);
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(Math.max(1, f0), t0);
      if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + dur + 0.03);
    } catch (e) { /* ignore */ }
  }

  function noise(dur, freq, vol, delay) {
    if (!ensure()) return;
    try {
      var t0 = ctx.currentTime + (delay || 0);
      var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = 0.8;
      var g = ctx.createGain(); g.gain.value = vol || 0.3;
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t0);
    } catch (e) { /* ignore */ }
  }

  var LIB = {
    tap:     function () { tone(760, 880, 0.06, 'sine', 0.5); },
    click:   function () { tone(980, 900, 0.05, 'triangle', 0.4); },
    place:   function () { tone(340, 190, 0.14, 'triangle', 0.75); noise(0.06, 1400, 0.18); },
    win:     function () { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, f, 0.16, 'sine', 0.6, i * 0.12); }); tone(1567.98, 1567.98, 0.3, 'sine', 0.35, 0.5); },
    draw:    function () { tone(392, 392, 0.14, 'sine', 0.5); tone(311.13, 311.13, 0.2, 'sine', 0.5, 0.15); },
    lose:    function () { tone(330, 165, 0.4, 'sawtooth', 0.35); },
    collect: function () { tone(1318.5, 1318.5, 0.07, 'square', 0.32); tone(1760, 1760, 0.09, 'square', 0.26, 0.06); },
    golden:  function () { [1046.5, 1318.5, 1567.98].forEach(function (f, i) { tone(f, f, 0.09, 'square', 0.3, i * 0.06); }); },
    jump:    function () { tone(240, 720, 0.18, 'sawtooth', 0.28); },
    slide:   function () { noise(0.2, 900, 0.32); tone(500, 220, 0.18, 'sine', 0.18); },
    lane:    function () { tone(500, 640, 0.06, 'sine', 0.3); },
    hit:     function () { tone(160, 55, 0.3, 'sawtooth', 0.55); noise(0.18, 400, 0.5); },
    count:   function () { tone(880, 880, 0.09, 'square', 0.4); },
    go:      function () { tone(1318.5, 1318.5, 0.22, 'square', 0.45); tone(1760, 1760, 0.3, 'square', 0.32, 0.1); },
    best:    function () { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) { tone(f, f, 0.12, 'triangle', 0.5, i * 0.09); }); },
    swap:    function () { tone(600, 900, 0.08, 'sine', 0.3); tone(900, 1200, 0.08, 'sine', 0.25, 0.07); }
  };

  function play(name) {
    var fn = LIB[name];
    if (fn) fn();
  }

  function setEnabled(v) { enabled = !!v; if (master) master.gain.value = enabled ? volume : 0; }
  function setVolume(v) { volume = Math.max(0, Math.min(1, Number(v) || 0)); if (master) master.gain.value = enabled ? volume : 0; }

  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }

  function syncFromBranding() {
    var b = global.MashhoorBranding && global.MashhoorBranding.get();
    if (b) { setEnabled(b.sounds.enabled !== false); setVolume(b.sounds.volume); }
  }

  if (global.MashhoorBranding) {
    syncFromBranding();
    global.MashhoorBranding.onChange(syncFromBranding);
  }

  /* Unlock audio on the first user gesture (browser autoplay policy) */
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
    var once = function () {
      ensure();
      ['pointerdown', 'touchstart', 'keydown'].forEach(function (e2) {
        global.removeEventListener(e2, once);
      });
    };
    global.addEventListener(ev, once, { passive: true });
  });

  global.MashhoorSound = {
    play: play, setEnabled: setEnabled, setVolume: setVolume,
    vibrate: vibrate, ensure: ensure,
    get enabled() { return enabled; }
  };
})(window);
