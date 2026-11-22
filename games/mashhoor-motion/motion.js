/* ============================================================
   Mashhoor Motion Challenge
   Real-time hand tracking with MediaPipe Hand Landmarker.
   The engine + model + wasm are bundled locally in ./vendor/
   so the game works offline once the page is cached.
   Camera requires HTTPS (GitHub Pages provides it).
   A touch/mouse fallback is built in for devices without a
   working camera.
   ============================================================ */
(function () {
  'use strict';

  var I = MashhoorI18N, B = MashhoorBranding, St = MashhoorStore,
      S = MashhoorSound, F = MashhoorFX, FS = MashhoorFS;

  /* inject static icons */
  document.querySelectorAll('.ic-slot').forEach(function (el) {
    el.innerHTML = MashhoorIcons.svg(el.getAttribute('data-icon'));
  });

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    app: $('motionApp'), topbar: $('topbar'),
    scrMenu: $('scrMenu'), scrSetup: $('scrSetup'), scrPlay: $('scrPlay'),
    chipDuration: $('chipDuration'), chipDifficulty: $('chipDifficulty'),
    cam: $('cam'), camBox: $('camBox'),
    camStatus: $('camStatus'), setupSpinner: $('setupSpinner'), setupMsg: $('setupMsg'),
    handBadge: $('handBadge'), setupHint: $('setupHint'),
    screensWrap: $('screensWrap'),
    stage: $('stage'), skeleton: $('skeleton'),
    zoneLayer: $('zoneLayer'), productsLayer: $('productsLayer'),
    cursor1: $('cursor1'), cursor2: $('cursor2'),
    timeText: $('timeText'), timerPill: $('timerPill'),
    s1: $('s1'), s2: $('s2'), pill1: $('pill1'), pill2: $('pill2'),
    countdown: $('countdown'),
    pauseOverlay: $('pauseOverlay'),
    resultOverlay: $('resultOverlay'),
    resImg: $('resImg'), resTitle: $('resTitle'), resRows: $('resRows'), resBest: $('resBest'),
    toast: $('toast')
  };

  var DIFF = {
    easy:   { spawn: 1.05, speed: 26, life: [4800, 7200] },
    normal: { spawn: 0.82, speed: 44, life: [3800, 6200] },
    hard:   { spawn: 0.58, speed: 66, life: [3000, 5200] }
  };

  var HAND_LINKS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
  ];

  var game = {
    mode: 'single',           /* 'single' | 'two' */
    pointerMode: false,
    running: false,
    paused: false,
    timeLeft: 60,
    scores: [0, 0],
    products: [],
    spawnAcc: 0,
    landmarker: null,
    stream: null,
    lastVideoTime: -1,
    handSeen: false,
    handSeenAt: 0,
    startedAt: 0,
    raf: 0,
    lastFrame: 0,
    lastBeepSec: -1,
    cursors: [
      { el: els.cursor1, x: 0, y: 0, active: false, lastSeen: 0, lm: null },
      { el: els.cursor2, x: 0, y: 0, active: false, lastSeen: 0, lm: null }
    ],
    activePointers: new Map()
  };

  var video = els.cam;
  var skelCtx = els.skeleton.getContext('2d');

  function toast(msg, isErr) {
    els.toast.textContent = msg;
    els.toast.classList.toggle('error', !!isErr);
    els.toast.classList.add('show');
    clearTimeout(els.toast._h);
    els.toast._h = setTimeout(function () { els.toast.classList.remove('show'); }, 2600);
  }

  function cfg() { return B.get().motion; }

  function diff() { return DIFF[cfg().difficulty] || DIFF.normal; }

  function showScreen(id) {
    ['scrMenu', 'scrSetup', 'scrPlay'].forEach(function (s) {
      els[s === 'scrMenu' ? 'scrMenu' : s].classList.toggle('active', s === id);
    });
    els.app.classList.toggle('playing', id === 'scrPlay');
  }

  function enabledProducts() {
    var p = B.get().products;
    var list = [];
    ['chicken', 'burger', 'fries'].forEach(function (k) {
      if (p[k] && p[k].enabled !== false) list.push(p[k]);
    });
    if (!list.length) list.push(p.chicken);
    return list;
  }

  function paintMenuChips() {
    els.chipDuration.textContent = cfg().duration + I.t('seconds');
    els.chipDifficulty.textContent = I.t(cfg().difficulty);
    document.getElementById('brandLogo').src = B.resolve(B.get().brand.logoLightBg);
  }

  /* ============================================================
     ENGINE LOADING (local MediaPipe vendor files)
     ============================================================ */
  function withTimeout(p, ms, label) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error(label + ' timeout')); }, ms);
      Promise.resolve(p).then(function (v) { clearTimeout(t); resolve(v); },
        function (e) { clearTimeout(t); reject(e); });
    });
  }

  function loadEngine(numHands) {
    return withTimeout(import('./vendor/vision_bundle.mjs'), 20000, 'bundle')
      .then(function (mod) {
        return withTimeout(mod.FilesetResolver.forVisionTasks('./vendor/wasm'), 20000, 'wasm')
          .then(function (fileset) {
            var opts = function (delegate) {
              return {
                baseOptions: {
                  modelAssetPath: './vendor/hand_landmarker.task',
                  delegate: delegate
                },
                runningMode: 'VIDEO',
                numHands: numHands,
                minHandDetectionConfidence: 0.5,
                minHandPresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
              };
            };
            return withTimeout(mod.HandLandmarker.createFromOptions(fileset, opts('GPU')), 28000, 'model-gpu')
              .catch(function () {
                return withTimeout(mod.HandLandmarker.createFromOptions(fileset, opts('CPU')), 28000, 'model-cpu');
              });
          });
      });
  }

  /* ============================================================
     CAMERA FLOW
     ============================================================ */
  function setStatus(msg, spin) {
    els.camStatus.classList.remove('off');
    els.setupMsg.textContent = msg;
    els.setupMsg.classList.remove('setup-error');
    els.setupSpinner.style.display = spin ? '' : 'none';
  }

  function setError(msg) {
    els.camStatus.classList.remove('off');
    els.setupMsg.textContent = msg;
    els.setupMsg.classList.add('setup-error');
    els.setupSpinner.style.display = 'none';
    els.handBadge.classList.add('hidden');
  }

  function showSetupHint(hideVideo) {
    els.camStatus.classList.toggle('off', !hideVideo);
    if (hideVideo) els.setupSpinner.style.display = 'none';
  }

  function startFlow(mode, opts) {
    opts = opts || {};
    game.mode = mode;
    game.pointerMode = !!opts.pointer;
    game.handSeen = false;
    els.handBadge.classList.add('hidden');
    showScreen('scrSetup');

    if (game.pointerMode) {
      showSetupHint(true);
      setStatus(I.t('pointerHint'), false);
      setTimeout(function () { beginCountdown(); }, 500);
      return;
    }

    var reuse = opts.reuse && game.stream && video.srcObject === game.stream;
    if (reuse) {
      setStatus(I.t('modelLoading'), true);
      ensureEngine();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(I.t('cameraError') + ' ' + I.t('httpsHint'));
      return;
    }
    setStatus(I.t('cameraStarting'), true);
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    }).then(function (stream) {
      game.stream = stream;
      video.srcObject = stream;
      return video.play().catch(function () { /* autoplay guarded by muted */ });
    }).then(function () {
      els.app.classList.add('has-cam');
      setStatus(I.t('modelLoading'), true);
      ensureEngine();
    }).catch(function (err) {
      game.stream = null;
      video.srcObject = null;
      var name = err && err.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError(I.t('cameraDenied') + ' ' + I.t('cameraDeniedHint'));
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setError(I.t('cameraNotFound') + ' ' + I.t('playWithPointer') + '!');
      } else {
        setError(I.t('cameraError') + ' ' + I.t('httpsHint'));
      }
    });
  }

  function ensureEngine() {
    if (game.landmarker) {
      startDetectionPreview();
      return;
    }
    loadEngine(game.mode === 'two' ? 2 : 1).then(function (lm) {
      game.landmarker = lm;
      startDetectionPreview();
    }).catch(function () {
      setError(I.t('modelLoading') + ' … ' + I.t('cameraError'));
    });
  }

  function startDetectionPreview() {
    game.lastVideoTime = -1;
    showSetupHint(false);
    els.setupHint.textContent = I.t('showYourHand');
    setStatus('', false);
    els.camStatus.classList.add('off');
    clearTimeout(game._grace);
    game._grace = setTimeout(function () {
      if (!game.handSeen && !game.running) beginCountdown();
    }, 8000);

    var prevLoop = function (now) {
      if (!els.scrSetup.classList.contains('active')) return;
      detectHands(now);
      if (game.handSeen) {
        els.handBadge.classList.remove('hidden');
        if (!game._seenAt) {
          game._seenAt = now;
        } else if (now - game._seenAt > 650) {
          game._seenAt = 0;
          clearTimeout(game._grace);
          beginCountdown();
          return;
        }
      }
      requestAnimationFrame(prevLoop);
    };
    requestAnimationFrame(prevLoop);
  }

  function beginCountdown() {
    game._seenAt = 0;
    var n = 3;
    els.countdown.classList.remove('hidden');
    els.countdown.textContent = n;
    S.play('count');
    var iv = setInterval(function () {
      n--;
      if (n > 0) {
        els.countdown.textContent = n;
        S.play('count');
      } else if (n === 0) {
        els.countdown.textContent = I.t('go');
        S.play('go');
      } else {
        clearInterval(iv);
        els.countdown.classList.add('hidden');
        beginPlay();
      }
    }, 900);
  }

  /* ============================================================
     PLAY
     ============================================================ */
  function beginPlay() {
    game.running = true;
    game.paused = false;
    game.timeLeft = cfg().duration;
    game.scores = [0, 0];
    game.products.forEach(function (p) { p.el.remove(); });
    game.products = [];
    game.spawnAcc = 0;
    game.lastBeepSec = -1;

    /* move the live video into the stage */
    els.stage.insertBefore(video, els.skeleton);

    showScreen('scrPlay');
    els.zoneLayer.classList.toggle('hidden', game.mode !== 'two');
    els.cursor2.classList.toggle('hidden', game.mode !== 'two');
    els.pill2.classList.toggle('hidden', game.mode !== 'two');
    els.s1.textContent = '0';
    els.s2.textContent = '0';
    els.timerPill.classList.remove('low');
    els.timeText.textContent = String(game.timeLeft);

    sizeSkeleton();
    FS.enter().then(function () { FS.requestWakeLock(); });
    S.ensure();
    game.lastFrame = performance.now();
    cancelAnimationFrame(game.raf);
    game.raf = requestAnimationFrame(loop);
  }

  function sizeSkeleton() {
    var st = els.stage.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    els.skeleton.width = Math.max(1, Math.round(st.width * dpr));
    els.skeleton.height = Math.max(1, Math.round(st.height * dpr));
    skelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function stageSize() {
    var r = els.stage.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  function mapPoint(nx, ny) {
    var vw = video.videoWidth || 1280;
    var vh = video.videoHeight || 720;
    var st = stageSize();
    var s = Math.max(st.w / vw, st.h / vh);
    var ox = (st.w - vw * s) / 2;
    var oy = (st.h - vh * s) / 2;
    /* mirrored selfie view */
    return { x: (1 - nx) * vw * s + ox, y: ny * vh * s + oy };
  }

  function detectHands(now) {
    if (!game.landmarker) return;
    if (video.readyState < 2 || video.currentTime === game.lastVideoTime) return;
    game.lastVideoTime = video.currentTime;
    var res;
    try {
      res = game.landmarker.detectForVideo(video, now);
    } catch (e) { return; }
    var hands = res && res.landmarks ? res.landmarks : [];

    /* map to stage pixels */
    var mapped = hands.map(function (lm) {
      var tip = lm[8] || lm[0];
      var p = mapPoint(tip.x, tip.y);
      return { tip: p, lm: lm, x: p.x, y: p.y };
    });

    if (game.mode === 'two') {
      mapped.sort(function (a, b) { return a.x - b.x; });
      assignCursor(0, mapped[0], now);
      assignCursor(1, mapped[1], now);
    } else {
      assignCursor(0, mapped[0], now);
      assignCursor(1, null, now);
    }

    if (mapped.length > 0 && !game.handSeen) game.handSeen = true;
  }

  function assignCursor(idx, hand, now) {
    var c = game.cursors[idx];
    if (hand) {
      c.x = hand.x; c.y = hand.y;
      c.active = true;
      c.lastSeen = now;
      c.lm = hand.lm;
      c.el.style.transform = 'translate(' + hand.x + 'px,' + hand.y + 'px)';
      c.el.classList.add('on');
    } else {
      c.lm = null;
      if (now - c.lastSeen > 700) { c.active = false; c.el.classList.remove('on'); }
    }
  }

  function loop(now) {
    if (!game.running) return;
    var dt = Math.min(0.05, (now - game.lastFrame) / 1000);
    game.lastFrame = now;

    if (!game.paused) {
      if (!game.pointerMode) detectHands(now);
      updateTimer(dt);
      updateProducts(dt, now);
      checkCollects();
    }
    drawSkeleton();
    game.raf = requestAnimationFrame(loop);
  }

  function updateTimer(dt) {
    game.timeLeft -= dt;
    if (game.timeLeft <= 0) { game.timeLeft = 0; }
    var secs = Math.ceil(game.timeLeft);
    els.timeText.textContent = String(secs);
    els.timerPill.classList.toggle('low', game.timeLeft <= 5.05);
    if (game.timeLeft <= 5.05 && secs !== game.lastBeepSec && secs > 0) {
      game.lastBeepSec = secs;
      S.play('count');
    }
    if (game.timeLeft <= 0) endRound();
  }

  function spawnProduct(now) {
    var types = enabledProducts();
    var type = types[Math.floor(Math.random() * types.length)];
    var st = stageSize();
    var scale = Math.max(0.55, Math.min(1.5, Math.min(st.w, st.h) / 700));
    var size = Math.max(46, type.size * scale);
    var zone = game.mode === 'two' ? (Math.random() < 0.5 ? 0 : 1) : 0;
    var xr = game.mode === 'two'
      ? (zone === 0 ? [0.07, 0.40] : [0.60, 0.93])
      : [0.09, 0.91];
    var D = diff();
    game.products.push({
      el: null, img: B.resolve(type.image),
      x: st.w * (xr[0] + Math.random() * (xr[1] - xr[0])),
      y: st.h * (0.16 + Math.random() * 0.72),
      vx: (Math.random() * 2 - 1) * D.speed * scale,
      vy: (Math.random() * 2 - 1) * D.speed * 0.55 * scale,
      phase: Math.random() * 6.28,
      born: now, life: D.life[0] + Math.random() * (D.life[1] - D.life[0]),
      zone: zone, size: size, points: type.points, dead: false
    });
    var p = game.products[game.products.length - 1];
    var el = document.createElement('div');
    el.className = 'product';
    el.innerHTML = '<img alt="" src="' + p.img + '" style="width:' + size + 'px">';
    els.productsLayer.appendChild(el);
    p.el = el;
  }

  function updateProducts(dt, now) {
    var st = stageSize();
    var D = diff();
    game.spawnAcc += dt;
    if (game.spawnAcc >= D.spawn) {
      game.spawnAcc = 0;
      spawnProduct(now);
    }
    var scale = Math.max(0.55, Math.min(1.5, Math.min(st.w, st.h) / 700));
    var margin = 40 * scale;
    for (var i = game.products.length - 1; i >= 0; i--) {
      var p = game.products[i];
      if (p.dead) { game.products.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      var x0 = game.mode === 'two' ? (p.zone === 0 ? margin : st.w / 2 + margin) : margin;
      var x1 = game.mode === 'two' ? (p.zone === 0 ? st.w / 2 - margin : st.w - margin) : st.w - margin;
      if (p.x < x0) { p.x = x0; p.vx = Math.abs(p.vx); }
      if (p.x > x1) { p.x = x1; p.vx = -Math.abs(p.vx); }
      if (p.y < st.h * 0.14) { p.y = st.h * 0.14; p.vy = Math.abs(p.vy); }
      if (p.y > st.h * 0.9) { p.y = st.h * 0.9; p.vy = -Math.abs(p.vy); }
      var age = now - p.born;
      var bob = Math.sin(now / 320 + p.phase) * 9 * scale;
      var fade = age > p.life - 550 ? Math.max(0, (p.life - age) / 550) : 1;
      p.el.style.transform = 'translate(' + (p.x - p.size / 2) + 'px,' + (p.y - p.size / 2 + bob) + 'px)';
      p.el.style.opacity = String(fade);
      if (age > p.life) { p.el.remove(); game.products.splice(i, 1); }
    }
  }

  function checkCollects() {
    var st = stageSize();
    for (var i = game.products.length - 1; i >= 0; i--) {
      var p = game.products[i];
      for (var c = 0; c < 2; c++) {
        var cur = game.cursors[c];
        if (!cur.active) continue;
        /* in two-player mode each player only collects inside their own half */
        if (game.mode === 'two' && ((c === 0) !== (p.x < st.w / 2))) continue;
        var dx = cur.x - p.x, dy = cur.y - p.y;
        var r = p.size * 0.42 + 34;
        if (dx * dx + dy * dy < r * r) {
          collect(p, c);
          break;
        }
      }
    }
  }

  function collect(p, playerIdx) {
    p.dead = true;
    p.el.remove();
    var idx = game.products.indexOf(p);
    if (idx >= 0) game.products.splice(idx, 1);
    game.scores[playerIdx] += p.points;
    if (game.mode === 'two') els.s2.textContent = String(game.scores[1]);
    els.s1.textContent = String(game.scores[0]);
    F.burst(els.stage, p.x, p.y, game.mode === 'two' && playerIdx === 1 ? '#FFC53D' : undefined, 12);
    F.floatText(els.stage, p.x, p.y - p.size * 0.5, '+' + p.points);
    S.play('collect');
    S.vibrate(28);
  }

  function drawSkeleton() {
    var st = stageSize();
    skelCtx.clearRect(0, 0, st.w, st.h);
    if (game.pointerMode || !game.landmarker) return;
    if (!B.get().motion.showSkeleton) return;
    var show = false;
    game.cursors.forEach(function (c) { if (c.lm && c.active) show = true; });
    if (!show) return;
    skelCtx.lineWidth = 2.5;
    skelCtx.lineCap = 'round';
    game.cursors.forEach(function (c) {
      if (!c.lm || !c.active) return;
      var col = c === game.cursors[0] ? 'rgba(255,255,255,.75)' : 'rgba(255,213,80,.85)';
      skelCtx.strokeStyle = col;
      skelCtx.fillStyle = col;
      for (var i = 0; i < HAND_LINKS.length; i++) {
        var a = c.lm[HAND_LINKS[i][0]], b = c.lm[HAND_LINKS[i][1]];
        if (!a || !b) continue;
        var pa = mapPoint(a.x, a.y), pb = mapPoint(b.x, b.y);
        skelCtx.beginPath();
        skelCtx.moveTo(pa.x, pa.y);
        skelCtx.lineTo(pb.x, pb.y);
        skelCtx.stroke();
      }
      for (var j = 0; j < c.lm.length; j++) {
        var pt = mapPoint(c.lm[j].x, c.lm[j].y);
        skelCtx.beginPath();
        skelCtx.arc(pt.x, pt.y, 2.6, 0, 6.29);
        skelCtx.fill();
      }
    });
  }

  /* ============================================================
     ROUND END + RESULTS
     ============================================================ */
  function endRound() {
    if (!game.running) return;
    game.running = false;
    cancelAnimationFrame(game.raf);
    FS.releaseWakeLock();
    S.play(game.mode === 'two' ? 'best' : 'win');

    var rows = '';
    var title = I.t('results');
    var bestNote = '';
    if (game.mode === 'two') {
      var p1 = game.scores[0], p2 = game.scores[1];
      if (p1 === p2) {
        title = I.t('tieGame');
      } else {
        var winnerIdx = p1 > p2 ? 0 : 1;
        title = I.t('winnerIs') + ': ' + (winnerIdx === 0 ? I.t('zoneP1') : I.t('zoneP2'));
        F.confetti(els.scrPlay, { count: 120 });
      }
      var bestTwo = Math.max(p1, p2);
      var rec2 = St.motionBest('two');
      if (bestTwo > rec2) St.setMotionBest('two', bestTwo);
      rows =
        '<div class="res-row p1 ' + (p1 > p2 ? 'win-row' : '') + '"><span>' + I.t('zoneP1') + '</span><span class="num">' + p1 + '</span></div>' +
        '<div class="res-row p2 ' + (p2 > p1 ? 'win-row' : '') + '"><span>' + I.t('zoneP2') + '</span><span class="num">' + p2 + '</span></div>';
      bestNote = I.t('best') + ': ' + St.motionBest('two') + ' ' + I.t('points');
    } else {
      var sc = game.scores[0];
      var prev = St.motionBest('single');
      if (sc > prev) {
        St.setMotionBest('single', sc);
        bestNote = I.t('newBest');
        S.play('best');
        F.confetti(els.scrPlay, { count: 120 });
      } else {
        bestNote = I.t('best') + ': ' + prev + ' ' + I.t('points');
      }
      rows = '<div class="res-row"><span>' + I.t('score') + '</span><span class="num">' + sc + '</span></div>';
    }

    els.resImg.classList.add('hidden');
    els.resTitle.textContent = title;
    els.resRows.innerHTML = rows;
    els.resBest.textContent = bestNote;
    els.resultOverlay.classList.add('open');
  }

  function stopAll() {
    game.running = false;
    cancelAnimationFrame(game.raf);
    clearTimeout(game._grace);
    game.products.forEach(function (p) { if (p.el) p.el.remove(); });
    game.products = [];
    game.cursors.forEach(function (c) { c.active = false; c.el.classList.remove('on'); c.lm = null; });
    els.resultOverlay.classList.remove('open');
    els.pauseOverlay.classList.remove('open');
    FS.releaseWakeLock();
    /* return the video preview element to the setup box & free the camera */
    if (video.parentNode !== els.camBox) els.camBox.insertBefore(video, els.camBox.firstChild);
    if (game.stream) {
      game.stream.getTracks().forEach(function (t) { t.stop(); });
      game.stream = null;
      video.srcObject = null;
    }
    if (game.landmarker) {
      try { game.landmarker.close(); } catch (e) { /* ignore */ }
      game.landmarker = null;
    }
    showScreen('scrMenu');
    paintMenuChips();
  }

  /* ============================================================
     POINTER FALLBACK (touch / mouse)
     ============================================================ */
  function refreshPointers() {
    var pts = [];
    game.activePointers.forEach(function (p) { pts.push(p); });
    pts.sort(function (a, b) { return a.x - b.x; });
    var now = performance.now();
    if (game.mode === 'two') {
      assignCursor(0, pts[0] || null, now);
      assignCursor(1, pts[1] || null, now);
    } else {
      assignCursor(0, pts[0] || null, now);
      assignCursor(1, null, now);
    }
  }

  function stagePoint(e) {
    var r = els.stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  els.stage.addEventListener('pointerdown', function (e) {
    if (!game.pointerMode || !game.running) return;
    var p = stagePoint(e);
    game.activePointers.set(e.pointerId, p);
    refreshPointers();
  });
  els.stage.addEventListener('pointermove', function (e) {
    if (!game.pointerMode || !game.running) return;
    var p = stagePoint(e);
    game.activePointers.set(e.pointerId, p);
    refreshPointers();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    els.stage.addEventListener(ev, function (e) {
      game.activePointers.delete(e.pointerId);
      refreshPointers();
    });
  });

  /* ============================================================
     WIRING
     ============================================================ */
  $('btnSingle').addEventListener('click', function () { S.play('click'); startFlow('single'); });
  $('btnTwo').addEventListener('click', function () { S.play('click'); startFlow('two'); });
  $('btnPointer').addEventListener('click', function () { S.play('click'); startFlow('single', { pointer: true }); });
  $('btnPointer2').addEventListener('click', function () { S.play('click'); startFlow(game.mode, { pointer: true }); });
  $('btnRetry').addEventListener('click', function () { S.play('click'); startFlow(game.mode, { reuse: true }); });
  $('btnBack').addEventListener('click', function () { S.play('tap'); stopAll(); });

  $('btnAgain').addEventListener('click', function () {
    S.play('click');
    els.resultOverlay.classList.remove('open');
    if (game.pointerMode) startFlow(game.mode, { pointer: true });
    else startFlow(game.mode, { reuse: true });
  });
  $('btnChangeMode').addEventListener('click', function () { S.play('tap'); stopAll(); });

  $('btnPause').addEventListener('click', function () {
    if (!game.running) return;
    game.paused = true;
    els.pauseOverlay.classList.add('open');
    S.play('click');
  });
  $('btnResume').addEventListener('click', function () {
    game.paused = false;
    els.pauseOverlay.classList.remove('open');
    game.lastFrame = performance.now();
    S.play('click');
  });
  $('btnRestartRound').addEventListener('click', function () {
    els.pauseOverlay.classList.remove('open');
    game.paused = false;
    if (game.pointerMode) startFlow(game.mode, { pointer: true });
    else startFlow(game.mode, { reuse: true });
  });
  $('btnQuit').addEventListener('click', function () { S.play('tap'); stopAll(); });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && game.running && !game.paused) {
      game.paused = true;
      els.pauseOverlay.classList.add('open');
    }
  });
  window.addEventListener('resize', function () {
    if (game.running) sizeSkeleton();
  });

  /* topbar sound + fullscreen */
  var soundBtn = $('soundBtn'), fsBtn = $('fsBtn');
  function paintTopbar() {
    soundBtn.innerHTML = MashhoorIcons.svg(B.get().sounds.enabled !== false ? 'sound' : 'mute');
    fsBtn.innerHTML = MashhoorIcons.svg(FS.isFullscreen() ? 'shrink' : 'expand');
  }
  soundBtn.addEventListener('click', function () {
    var on = !(B.get().sounds.enabled !== false);
    B.updatePath('sounds.enabled', on);
    paintTopbar();
    if (on) S.play('tap');
  });
  fsBtn.addEventListener('click', function () {
    if (!FS.isSupported()) { toast(I.t('installHint')); return; }
    FS.toggle();
  });
  FS.onChange(paintTopbar);

  window.addEventListener('mashhoor:lang', paintMenuChips);
  B.onChange(paintMenuChips);

  /* ---------- boot ---------- */
  paintMenuChips();
  paintTopbar();
})();
