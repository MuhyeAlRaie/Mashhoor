/* ============================================================
   Mashhoor Chicken Dash — PWA endless runner
   Original mascot + Mashhoor products. Portrait mobile-first.
   Controls: swipe up/down/left/right, on-screen buttons,
   or keyboard (arrows / WASD / space) for desktop testing.
   All branding comes from the shared branding config.
   ============================================================ */
(function () {
  'use strict';

  var I = MashhoorI18N, B = MashhoorBranding, St = MashhoorStore,
      S = MashhoorSound, FS = MashhoorFS;

  /* inject static icons */
  document.querySelectorAll('.ic-slot').forEach(function (el) {
    el.innerHTML = MashhoorIcons.svg(el.getAttribute('data-icon'));
  });

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    app: $('dashApp'), canvas: $('game'),
    hud: $('hud'), hudScore: $('hudScore'), hudBest: $('hudBest'),
    touchButtons: $('touchButtons'),
    dsMenu: $('dsMenu'), dsChars: $('dsChars'), dsHow: $('dsHow'),
    dsPause: $('dsPause'), dsOver: $('dsOver'),
    dsLogo: $('dsLogo'), dsTitle: $('dsTitle'),
    charsRow: $('charsRow'),
    overImg: $('overImg'), overScore: $('overScore'), overBest: $('overBest'),
    newBestBadge: $('newBestBadge'), tbToggle: $('tbToggle')
  };

  var canvas = els.canvas;
  var ctx = canvas.getContext('2d');

  /* ---------- geometry ---------- */
  var dpr = 1, W = 0, H = 0;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildSkyline();
  }

  function laneX(i) { return W * (0.2 + 0.3 * i); }
  function groundY() { return H * 0.76; }
  function playerH() { return Math.max(66, Math.min(132, W * 0.27)); }
  function baseSpeed() { return Math.max(250, H * 0.52); }
  function GRAV() { return 3400 * (H / 740); }
  /* P.y = height above ground (positive = up). Jump launches upward, gravity pulls back. */
  function JUMPV() { return 1250 * (H / 740); }
  function GOLD_POINTS() { return 50; }

  /* ---------- state ---------- */
  var ST = { MENU: 'menu', CHARS: 'chars', HOW: 'how', PLAY: 'play', PAUSE: 'pause', OVER: 'over' };
  var state = ST.MENU;

  var G = { dist: 0, picked: 0, nextSpawn: 0, obstacles: [], items: [], parts: [], shake: 0, flash: 0, clouds: [] };
  var P = { lane: 1, x: 0, y: 0, vy: 0, jumping: false, sliding: false, slideT: 0, runT: 0 };

  var skinId = St.get('dash_skin', null);
  var best = St.dashBest();

  /* ---------- images ---------- */
  var imgs = {};
  function img(key, src) {
    if (!src) { delete imgs[key]; return; }
    if (imgs[key] && imgs[key]._src === src) return;
    var im = new Image();
    im._src = src;
    im.onload = function () { imgs[key] = im; };
    im.onerror = function () { delete imgs[key]; };
    im.src = src;
  }

  function skinById(id) {
    var skins = B.get().dash.skins || [];
    for (var i = 0; i < skins.length; i++) if (skins[i].id === id) return skins[i];
    return skins[0] || null;
  }

  function loadBrandingAssets() {
    var c = B.get();
    ['chicken', 'burger', 'fries'].forEach(function (k) {
      img('prod_' + k, B.resolve(c.products[k].image));
    });
    var sk = skinById(skinId || (c.dash.skins[0] || {}).id);
    img('skin', sk ? B.resolve(sk.image) : '');
  }

  /* ---------- music ---------- */
  var musicEl = null;
  function syncMusic() {
    var src = B.get().dash.music;
    if (!src) {
      if (musicEl) { musicEl.pause(); musicEl = null; }
      return;
    }
    if (!musicEl) musicEl = new Audio();
    var abs = B.resolve(src);
    if (musicEl.src !== abs) { musicEl.src = abs; musicEl.loop = true; }
    musicEl.volume = 0.45;
  }
  function musicStart() { if (musicEl && B.get().sounds.enabled) musicEl.play().catch(function () {}); }
  function musicStop() { if (musicEl) musicEl.pause(); }

  /* ---------- background scenery ---------- */
  var skyline = [];
  function buildSkyline() {
    skyline = [];
    var x = -40;
    while (x < W + 80) {
      var w = 40 + Math.random() * 90;
      var h = 60 + Math.random() * 110;
      skyline.push({ x: x, w: w, h: h, win: Math.random() > 0.5 });
      x += w + 10 + Math.random() * 26;
    }
    G.clouds = [];
    for (var i = 0; i < 4; i++) {
      G.clouds.push({ x: Math.random() * W, y: H * (0.08 + Math.random() * 0.22), s: 0.6 + Math.random() * 0.9 });
    }
  }

  /* ============================================================
     GAME FLOW
     ============================================================ */
  function showScreen(id) {
    [els.dsMenu, els.dsChars, els.dsHow, els.dsPause, els.dsOver].forEach(function (s) {
      s.classList.toggle('show', s === id);
    });
    els.hud.classList.toggle('hidden', state !== ST.PLAY && state !== ST.PAUSE);
    var tbOn = B.get().dash.touchButtons !== false;
    var touchy = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    els.touchButtons.classList.toggle('hidden', !(state === ST.PLAY && tbOn));
    if (state === ST.PLAY && !touchy && !tbOn) els.touchButtons.classList.add('hidden');
  }

  function paintMenu() {
    var c = B.get();
    els.dsLogo.src = B.resolve(c.brand.logoLightBg);
    els.dsTitle.textContent = c.dash.gameName || 'Chicken Dash';
    els.hudBest.textContent = best;
  }

  function startRun() {
    G.dist = 0; G.picked = 0; G.nextSpawn = H * 1.15;
    G.obstacles = []; G.items = []; G.parts = []; G.shake = 0; G.flash = 0;
    P.lane = 1; P.x = laneX(1); P.y = 0; P.vy = 0;
    P.jumping = false; P.sliding = false; P.slideT = 0; P.runT = 0;
    state = ST.PLAY;
    els.newBestBadge.classList.add('hidden');
    showScreen(null);
    FS.enter().then(function () { FS.requestWakeLock(); });
    S.ensure();
    musicStart();
    game.last = performance.now();
  }

  function toMenu() {
    state = ST.MENU;
    musicStop();
    FS.releaseWakeLock();
    showScreen(els.dsMenu);
    paintMenu();
  }

  function gameOver() {
    state = ST.OVER;
    musicStop();
    FS.releaseWakeLock();
    S.play('hit');
    S.vibrate([90, 50, 90]);
    G.shake = 0.5;
    G.flash = 0.6;
    var score = currentScore();
    var isNew = score > best;
    if (isNew) {
      best = score;
      St.setDashBest(best);
      S.play('best');
    }
    els.overScore.textContent = score;
    els.overBest.textContent = best;
    els.overImg.src = (imgs.skin && imgs.skin.src) || '';
    els.newBestBadge.classList.toggle('hidden', !isNew);
    els.hud.classList.add('hidden');
    els.touchButtons.classList.add('hidden');
    setTimeout(function () { showScreen(els.dsOver); }, 620);
  }

  function currentScore() {
    return Math.floor(G.dist / 60) + G.picked;
  }

  /* ============================================================
     INPUT
     ============================================================ */
  function jump() {
    if (state !== ST.PLAY || P.jumping) return;
    P.jumping = true;
    P.vy = JUMPV();
    P.sliding = false;
    S.play('jump');
    S.vibrate(18);
  }
  function slide() {
    if (state !== ST.PLAY) return;
    if (P.jumping) { P.vy = Math.min(P.vy, -520 * (H / 740)); return; } /* fast-fall (downward) */
    if (!P.sliding) { P.sliding = true; P.slideT = 0.62; S.play('slide'); }
    else P.slideT = 0.62;
  }
  function moveLane(dir) {
    if (state !== ST.PLAY) return;
    var n = Math.max(0, Math.min(2, P.lane + dir));
    if (n !== P.lane) { P.lane = n; S.play('lane'); }
  }

  var swipe = null;
  var slideHeld = false, slidePid = null; /* slide button/key held: stay down + dive */
  canvas.addEventListener('pointerdown', function (e) {
    if (state !== ST.PLAY) return;
    swipe = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  canvas.addEventListener('pointerup', function (e) {
    if (state !== ST.PLAY || !swipe) return;
    var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    var adx = Math.abs(dx), ady = Math.abs(dy);
    if (Math.max(adx, ady) < 26) {
      jump(); /* quick tap = jump */
    } else if (ady >= adx) {
      if (dy < 0) jump(); else slide();
    } else {
      moveLane(dx > 0 ? 1 : -1);
    }
    swipe = null;
  });
  canvas.addEventListener('pointercancel', function () { swipe = null; });

  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowDown' || k === 's' || k === 'S') { slideHeld = true; slide(); e.preventDefault(); return; } /* repeats extend the slide */
    if (e.repeat) return;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') { jump(); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { moveLane(-1); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { moveLane(1); }
    else if (k === 'p' || k === 'P' || k === 'Escape') {
      if (state === ST.PLAY) pauseGame();
      else if (state === ST.PAUSE) resumeGame();
    }
  });
  document.addEventListener('keyup', function (e) {
    var k = e.key;
    if (k === 'ArrowDown' || k === 's' || k === 'S') { slideHeld = false; slidePid = null; }
  });

  function bindHold(el, fn) {
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
  }
  bindHold($('tbLeft'), function () { moveLane(-1); });
  bindHold($('tbRight'), function () { moveLane(1); });
  bindHold($('tbJump'), jump);
  /* slide button: hold to stay down (and dive while airborne) */
  $('tbSlide').addEventListener('pointerdown', function (e) {
    e.preventDefault(); e.stopPropagation();
    slideHeld = true; slidePid = e.pointerId; slide();
  }, { passive: false });
  document.addEventListener('pointerup', function (e) {
    if (slidePid !== null && e.pointerId === slidePid) { slideHeld = false; slidePid = null; }
  });
  document.addEventListener('pointercancel', function (e) {
    if (slidePid !== null && e.pointerId === slidePid) { slideHeld = false; slidePid = null; }
  });
  window.addEventListener('blur', function () { slideHeld = false; slidePid = null; });

  /* ============================================================
     SPAWNING
     ============================================================ */
  function unlocked() {
    var d = G.dist;
    return {
      crate: true,
      items: true,
      double: d > H * 0.7,
      bar: d > H * 1.7,
      stack: d > H * 2.9
    };
  }

  function spawnItem(x, y, isGolden) {
    var types = [];
    var c = B.get().products;
    ['chicken', 'burger', 'fries'].forEach(function (k) {
      if (c[k].enabled !== false) types.push({ k: k, points: c[k].points });
    });
    if (!types.length) types.push({ k: 'chicken', points: c.chicken.points });
    var t = types[Math.floor(Math.random() * types.length)];
    G.items.push({
      x: x, y: y, k: isGolden ? 'chicken' : t.k, points: isGolden ? GOLD_POINTS() : t.points,
      golden: !!isGolden, phase: Math.random() * 6.28, dead: false
    });
  }

  function spawnPattern(speed) {
    var u = unlocked();
    var pool = ['crate', 'items', 'items'];
    if (u.double) pool.push('double');
    if (u.bar) pool.push('bar');
    if (u.stack) pool.push('stack');
    var kind = pool[Math.floor(Math.random() * pool.length)];
    var ph = playerH();
    var gy = groundY();

    if (kind === 'crate' || kind === 'stack') {
      var lane = Math.floor(Math.random() * 3);
      var oh = kind === 'stack' ? ph * 1.55 : ph * 0.78;
      G.obstacles.push({ type: kind, lane: lane, x: W + 80, w: ph * 0.62, h: oh, dead: false });
      if (Math.random() < 0.5) {
        spawnItem(W + 80, gy - oh - ph * 0.55, Math.random() < 0.12);
      }
    } else if (kind === 'double') {
      var lanes = [0, 1, 2];
      var free = Math.floor(Math.random() * 3);
      lanes.splice(lanes.indexOf(free), 1);
      lanes.forEach(function (l, i) {
        var t2 = Math.random() < 0.5 ? 'crate' : 'cone';
        G.obstacles.push({
          type: t2, lane: l, x: W + 80 + i * ph * 0.2, w: ph * 0.62,
          h: t2 === 'cone' ? ph * 0.42 : ph * 0.78, dead: false
        });
      });
      spawnItem(W + 80 + (free - 1) * ph * 0.3, gy - ph * 0.55, Math.random() < 0.1);
    } else if (kind === 'bar') {
      G.obstacles.push({ type: 'bar', lane: -1, x: W + 80, w: W * 0.96, h: 0, dead: false });
      /* reward placed AFTER the barrier — never under it (no death lure) */
      spawnItem(W + 80 + W * 1.06, gy - ph * 0.55, Math.random() < 0.12);
    } else { /* items line or arc */
      var lane2 = Math.floor(Math.random() * 3);
      var n = 3 + Math.floor(Math.random() * 2);
      var arc = Math.random() < 0.45;
      for (var i = 0; i < n; i++) {
        var yy = arc
          ? gy - ph * (0.18 + Math.sin((i / (n - 1)) * Math.PI) * 0.34)
          : gy - ph * 0.55;
        spawnItem(W + 80 + i * ph * 0.75, yy, false);
      }
    }
    /* Spacing must stay fair as speed rises: never shorter than a full
       jump arc + reaction time; extra room after bars and lane-forcing
       doubles; a bar also needs room for its own width so nothing ever
       spawns overlapping its slide-under zone. */
    var gap = Math.max(H * 0.85, speed * 0.9);
    if (kind === 'bar') gap = Math.max(gap, speed * 1.3, W * 0.96 + ph * 1.3);
    if (kind === 'double') gap = Math.max(gap, speed * 1.1);
    G.nextSpawn = gap * (0.95 + Math.random() * 0.35);
  }

  /* ============================================================
     UPDATE
     ============================================================ */
  var game = { last: 0 };

  function update(dt) {
    var c = B.get();
    var speedMul = c.dash.speed || 1;
    var speed = state === ST.PLAY
      ? Math.min(baseSpeed() * 2.2, baseSpeed() * speedMul * (1 + G.dist / (H * 2.4)))
      : baseSpeed() * 0.28;

    G.dist += speed * dt;
    P.runT += dt * (speed / baseSpeed());

    /* player physics */
    if (state === ST.PLAY) {
      if (P.jumping) {
        if (slideHeld) P.vy = Math.min(P.vy, -520 * (H / 740)); /* holding slide = dive */
        P.y += P.vy * dt;
        P.vy -= GRAV() * dt; /* gravity decelerates the upward motion */
        if (P.y <= 0 && P.vy < 0) { P.y = 0; P.vy = 0; P.jumping = false; }
      }
      if (P.sliding) {
        if (slideHeld) P.slideT = Math.max(P.slideT, 0.1); /* holding keeps the slide alive */
        P.slideT -= dt;
        if (P.slideT <= 0) P.sliding = false;
      }
      var tx = laneX(P.lane);
      P.x += (tx - P.x) * Math.min(1, dt * 11);
    }

    /* scenery */
    for (var ci = 0; ci < G.clouds.length; ci++) {
      var cl = G.clouds[ci];
      cl.x -= speed * 0.1 * dt;
      if (cl.x < -90) { cl.x = W + 60; cl.y = H * (0.06 + Math.random() * 0.24); }
    }

    if (state !== ST.PLAY) return;

    /* spawning */
    G.nextSpawn -= speed * dt;
    if (G.nextSpawn <= 0) spawnPattern(speed);

    /* obstacles */
    var ph = playerH();
    var gy = groundY();
    for (var i = G.obstacles.length - 1; i >= 0; i--) {
      var o = G.obstacles[i];
      o.x -= speed * dt;
      if (o.x + o.w < -60) { G.obstacles.splice(i, 1); continue; }
      if (!o.dead && hitObstacle(o, ph, gy)) { o.dead = true; gameOver(); return; }
    }

    /* items */
    for (var j = G.items.length - 1; j >= 0; j--) {
      var it = G.items[j];
      it.x -= speed * dt;
      if (it.x < -60) { G.items.splice(j, 1); continue; }
      var px = P.x, py = gy - P.y - (P.sliding ? ph * 0.3 : ph * 0.52);
      var dx = it.x - px, dy = it.y - py;
      if (dx * dx + dy * dy < (ph * 0.52) * (ph * 0.52)) {
        it.dead = true;
        G.picked += it.points;
        G.parts.push({ x: it.x, y: it.y, vx: 0, vy: -140, life: 0.5, t: 0, col: '#FFC53D', txt: '+' + it.points });
        S.play('collect');
        S.vibrate(15);
        G.items.splice(j, 1);
        continue;
      }
    }

    /* particles */
    for (var k2 = G.parts.length - 1; k2 >= 0; k2--) {
      var p = G.parts[k2];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.t > p.life) G.parts.splice(k2, 1);
    }

    if (G.shake > 0) G.shake -= dt;
    if (G.flash > 0) G.flash -= dt;

    els.hudScore.textContent = currentScore();
  }

  function hitObstacle(o, ph, gy) {
    var pw = ph * 0.6;
    var standH = P.sliding ? ph * 0.42 : ph * 0.94; /* crouch hitbox matches the visual */
    var px0 = P.x - pw / 2 + pw * 0.12;
    var px1 = P.x + pw / 2 - pw * 0.12;
    var py1 = gy - P.y - ph * 0.06;              /* feet */
    var py0 = py1 - standH;                       /* head */
    var ox0, ox1, oy0, oy1;
    if (o.type === 'bar') {
      ox0 = o.x; ox1 = o.x + o.w;
      oy0 = gy - ph * 1.5;
      oy1 = gy - ph * 0.68;
    } else {
      var ocx = laneX(o.lane);
      ox0 = ocx - o.w / 2 + o.w * 0.14;
      ox1 = ocx + o.w / 2 - o.w * 0.14;
      oy0 = gy - o.h;
      oy1 = gy;
    }
    return px1 > ox0 && px0 < ox1 && py1 > oy0 && py0 < oy1;
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function drawSky(gy) {
    var c = B.get();
    var g = ctx.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, '#2b0a0d');
    g.addColorStop(0.35, '#A3121C');
    g.addColorStop(0.75, c.brand.colors.primary);
    g.addColorStop(1, '#FF8A5C');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, gy + 2);

    /* sun */
    var sx = W * 0.78, sy = H * 0.16, sr = W * 0.09;
    var rg = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.2);
    rg.addColorStop(0, 'rgba(255,220,150,.95)');
    rg.addColorStop(0.25, 'rgba(255,197,61,.55)');
    rg.addColorStop(1, 'rgba(255,197,61,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 2.2, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#FFE9B8';
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, 6.3);
    ctx.fill();

    /* clouds */
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    G.clouds.forEach(function (cl) {
      var s = cl.s;
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, 44 * s, 15 * s, 0, 0, 6.3);
      ctx.ellipse(cl.x + 30 * s, cl.y - 8 * s, 30 * s, 12 * s, 0, 0, 6.3);
      ctx.ellipse(cl.x - 28 * s, cl.y - 4 * s, 26 * s, 10 * s, 0, 0, 6.3);
      ctx.fill();
    });

    /* skyline */
    ctx.fillStyle = 'rgba(52, 10, 14, .55)';
    skyline.forEach(function (b2) {
      var bx = (b2.x - (G.dist * 0.18) % (W + 200));
      if (bx < -b2.w - 100) bx += (W + 200);
      ctx.fillRect(bx, gy - b2.h, b2.w, b2.h);
      if (b2.win) {
        ctx.fillStyle = 'rgba(255,197,61,.25)';
        for (var wy = gy - b2.h + 12; wy < gy - 14; wy += 22) {
          for (var wx = bx + 8; wx < bx + b2.w - 10; wx += 18) {
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
        ctx.fillStyle = 'rgba(52, 10, 14, .55)';
      }
    });
  }

  function drawGround(gy, speed) {
    ctx.fillStyle = '#26262c';
    ctx.fillRect(0, gy, W, H - gy);
    /* curbs: red / white segments */
    var off = (G.dist * 0.9) % 56;
    for (var x = -56 + -off; x < W + 56; x += 56) {
      ctx.fillStyle = '#EE2231';
      ctx.fillRect(x, gy, 28, 7);
      ctx.fillStyle = '#F4F0EC';
      ctx.fillRect(x + 28, gy, 28, 7);
    }
    /* lane dashes */
    ctx.fillStyle = 'rgba(255,197,61,.75)';
    var doff = (G.dist % 72);
    [0.35, 0.65].forEach(function (lx) {
      for (var y = gy + 14 - doff; y < H; y += 72) {
        ctx.fillRect(W * lx - 3, y, 6, 34);
      }
    });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawObstacle(o, gy, ph) {
    if (o.type === 'bar') {
      /* visible band must match the collision zone: top 1.5ph, bottom 0.68ph */
      var y0 = gy - ph * 1.5, bh = ph * 0.82;
      ctx.save();
      ctx.fillStyle = '#3a2225';
      ctx.fillRect(o.x + o.w * 0.04, y0 - 6, 8, gy - y0 + 6);
      ctx.fillRect(o.x + o.w * 0.92, y0 - 6, 8, gy - y0 + 6);
      ctx.fillStyle = B.get().brand.colors.primary;
      roundRect(o.x, y0, o.w, bh, 10);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (var x = o.x + 16; x < o.x + o.w - 16; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, y0 + bh / 2 - 9);
        ctx.lineTo(x + 14, y0 + bh / 2);
        ctx.lineTo(x, y0 + bh / 2 + 9);
        ctx.lineTo(x + 5, y0 + bh / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    var cx = laneX(o.lane);
    var x0 = cx - o.w / 2, y0 = gy - o.h;
    if (o.type === 'cone') {
      ctx.fillStyle = '#FF7A2F';
      ctx.beginPath();
      ctx.moveTo(cx, y0);
      ctx.lineTo(cx + o.w / 2, gy);
      ctx.lineTo(cx - o.w / 2, gy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - o.w * 0.26, y0 + o.h * 0.45, o.w * 0.52, o.h * 0.16);
      ctx.fillStyle = '#D95A17';
      ctx.fillRect(cx - o.w * 0.62, gy - 8, o.w * 1.24, 8);
    } else {
      /* crate (single or stacked) */
      var h2 = o.type === 'stack' ? o.h / 2 : o.h;
      for (var yy = gy - h2; yy > y0 - 1; yy -= h2) {
        ctx.fillStyle = '#C08A54';
        roundRect(x0, yy, o.w, h2 - 3, 8);
        ctx.fill();
        ctx.strokeStyle = '#8a5a30';
        ctx.lineWidth = 3;
        roundRect(x0, yy, o.w, h2 - 3, 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x0 + 6, yy + h2 / 2 - 3);
        ctx.lineTo(x0 + o.w - 6, yy + h2 / 2 - 3);
        ctx.stroke();
        ctx.fillStyle = B.get().brand.colors.primary;
        ctx.font = '800 ' + Math.round(h2 * 0.4) + 'px "Baloo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('M', cx, yy + h2 * 0.42);
      }
    }
  }

  function drawItems(gy) {
    var now = performance.now();
    G.items.forEach(function (it) {
      var im = imgs['prod_' + it.k];
      if (!im) return;
      var s = playerH() * 0.52;
      var bob = Math.sin(now / 300 + it.phase) * 5;
      if (it.golden) {
        ctx.save();
        ctx.shadowColor = '#FFC53D';
        ctx.shadowBlur = 22;
        try { ctx.filter = 'saturate(2.6) brightness(1.5) hue-rotate(-18deg)'; } catch (e) { /* old browsers */ }
        ctx.drawImage(im, it.x - s / 2, it.y - s / 2 + bob, s, s * (im.height / im.width));
        ctx.restore();
      } else {
        ctx.drawImage(im, it.x - s / 2, it.y - s / 2 + bob, s, s * (im.height / im.width));
      }
    });
  }

  function drawPlayer(gy) {
    var ph = playerH();
    var shadow = ctx.createRadialGradient(P.x, gy - 6, 4, P.x, gy - 6, ph * 0.4);
    shadow.addColorStop(0, 'rgba(0,0,0,.32)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(P.x, gy - 6, ph * 0.4, ph * 0.12, 0, 0, 6.3);
    ctx.fill();

    var im = imgs.skin;
    var bob = (!P.jumping && !P.sliding) ? Math.sin(P.runT * 15) * ph * 0.035 : 0;
    ctx.save();
    ctx.translate(P.x, gy - P.y + bob);
    if (P.jumping) ctx.rotate(Math.max(-0.35, Math.min(0.35, -P.vy * 0.00035)));
    if (P.sliding) { ctx.scale(1.18, 0.6); ctx.translate(0, ph * 0.32); }
    if (im && im.complete && im.naturalWidth) {
      var w = ph * (im.width / im.height);
      ctx.drawImage(im, -w / 2, -ph, w, ph);
    } else {
      /* fallback vector chicken (brand colors) */
      var r = ph * 0.3;
      ctx.fillStyle = '#F6F2EC';
      ctx.beginPath();
      ctx.ellipse(0, -r * 1.1, r, r * 1.15, 0, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = B.get().brand.colors.primary;
      ctx.beginPath();
      ctx.arc(0, -r * 2.05, r * 0.42, 0, 6.3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 2.3);
      ctx.lineTo(0, -r * 2.75);
      ctx.lineTo(r * 0.4, -r * 2.3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FF9A2F';
      ctx.beginPath();
      ctx.moveTo(r * 0.3, -r * 1.85);
      ctx.lineTo(r * 0.85, -r * 1.7);
      ctx.lineTo(r * 0.3, -r * 1.55);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#22242B';
      ctx.beginPath();
      ctx.arc(r * 0.12, -r * 2.1, r * 0.08, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    G.parts.forEach(function (p) {
      var a = 1 - p.t / p.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 + a * 4, 0, 6.3);
      ctx.fill();
      if (p.txt) {
        ctx.fillStyle = '#fff';
        ctx.font = '800 18px "Baloo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.txt, p.x, p.y - 14 - (1 - a) * 22);
      }
      ctx.globalAlpha = 1;
    });
  }

  function drawSpeedLines(speed) {
    if (speed < baseSpeed() * 1.35) return;
    var n = 6;
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 3;
    for (var i = 0; i < n; i++) {
      var y = ((G.dist * 1.7 + i * 173) % (H * 0.8));
      ctx.beginPath();
      ctx.moveTo(W - (i * 97 + (G.dist * 0.4) % 160) % W, y + H * 0.1);
      ctx.lineTo(W - ((i * 97 + (G.dist * 0.4) % 160) % W) + 46, y + H * 0.1);
      ctx.stroke();
    }
  }

  function render() {
    var gy = groundY();
    var speed = baseSpeed() * (state === ST.PLAY ? 1 : 0.28);
    ctx.save();
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 14 * G.shake * 2, (Math.random() - 0.5) * 14 * G.shake * 2);
    }
    drawSky(gy);
    drawGround(gy, speed);
    drawItems(gy);
    G.obstacles.forEach(function (o) { drawObstacle(o, gy, playerH()); });
    drawPlayer(gy);
    drawParticles();
    drawSpeedLines(speed);
    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(238,34,49,' + (G.flash * 0.5) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function loop(now) {
    var dt = Math.min(0.033, (now - game.last) / 1000 || 0.016);
    game.last = now;
    if (state !== ST.PAUSE) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  /* ============================================================
     PAUSE / SCREENS wiring
     ============================================================ */
  function pauseGame() {
    if (state !== ST.PLAY) return;
    state = ST.PAUSE;
    slideHeld = false; slidePid = null;
    musicStop();
    els.tbToggle.checked = B.get().dash.touchButtons !== false;
    showScreen(els.dsPause);
    S.play('click');
  }
  function resumeGame() {
    if (state !== ST.PAUSE) return;
    state = ST.PLAY;
    showScreen(null);
    game.last = performance.now();
    musicStart();
    S.play('click');
  }

  $('btnPlay').addEventListener('click', function () { S.play('go'); startRun(); });
  $('btnChars').addEventListener('click', function () { state = ST.CHARS; buildChars(); showScreen(els.dsChars); S.play('tap'); });
  $('btnHow').addEventListener('click', function () { state = ST.HOW; showScreen(els.dsHow); S.play('tap'); });
  $('btnCharBack').addEventListener('click', function () { toMenu(); S.play('tap'); });
  $('btnHowBack').addEventListener('click', function () { S.play('go'); startRun(); });
  $('btnCharOk').addEventListener('click', function () { S.play('go'); startRun(); });
  $('btnPauseHud').addEventListener('click', pauseGame);
  $('btnResume').addEventListener('click', resumeGame);
  $('btnRestartP').addEventListener('click', function () { S.play('go'); startRun(); });
  $('btnQuitP').addEventListener('click', function () { toMenu(); });
  $('btnRetry').addEventListener('click', function () { S.play('go'); startRun(); });
  $('btnOverMenu').addEventListener('click', function () { toMenu(); });

  els.tbToggle.addEventListener('change', function () {
    B.updatePath('dash.touchButtons', els.tbToggle.checked);
    showScreen(els.dsPause);
  });

  function buildChars() {
    var skins = B.get().dash.skins || [];
    if (!skinId) skinId = (skins[0] || {}).id;
    els.charsRow.innerHTML = '';
    skins.forEach(function (sk) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'char-card' + (sk.id === skinId ? ' sel' : '');
      card.innerHTML = '<img alt="" src="' + B.resolve(sk.image) + '"><span class="cname"></span>';
      card.querySelector('.cname').textContent = sk.name || sk.id;
      card.addEventListener('click', function () {
        skinId = sk.id;
        St.set('dash_skin', skinId);
        img('skin', B.resolve(sk.image));
        els.charsRow.querySelectorAll('.char-card').forEach(function (c2) {
          c2.classList.toggle('sel', c2 === card);
        });
        S.play('tap');
      });
      els.charsRow.appendChild(card);
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && state === ST.PLAY) pauseGame();
  });

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 250); });

  window.addEventListener('mashhoor:lang', paintMenu);
  B.onChange(function () { loadBrandingAssets(); paintMenu(); buildChars(); });

  /* ---------- boot ---------- */
  resize();
  loadBrandingAssets();
  paintMenu();
  P.x = laneX(1);
  showScreen(els.dsMenu);
  game.last = performance.now();
  requestAnimationFrame(loop);
  MashhoorPWA.register('../../service-worker.js');
})();
