/* ============================================================
   Mashhoor XO — Fried Chicken vs. Chicken Burger
   Classic tic-tac-toe with real product images as marks.
   Modes: 2 players (same screen) or vs Computer (minimax).
   ============================================================ */
(function () {
  'use strict';

  var I = MashhoorI18N, B = MashhoorBranding, St = MashhoorStore,
      S = MashhoorSound, F = MashhoorFX, FS = MashhoorFS;

  /* inject static icons */
  document.querySelectorAll('.ic-slot').forEach(function (el) {
    el.innerHTML = MashhoorIcons.svg(el.getAttribute('data-icon'));
  });

  var COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],   /* rows */
    [0, 3, 6], [1, 4, 7], [2, 5, 8],   /* cols */
    [0, 4, 8], [2, 4, 6]               /* diagonals */
  ];

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    brandLogo: $('brandLogo'),
    p1Img: $('p1Img'), p2Img: $('p2Img'),
    p1Name: $('p1Name'), p2Name: $('p2Name'),
    chip1: $('chip1'), chip2: $('chip2'),
    p1Label: document.querySelector('#chip1 .p1-label'),
    p2Label: document.querySelector('#chip2 .p2-label'),
    score1: $('score1'), score2: $('score2'), scoreDraw: $('scoreDraw'),
    turnImg: $('turnImg'), turnText: $('turnText'),
    board: $('board'),
    scrMenu: $('scrMenu'), scrGame: $('scrGame'),
    resultOverlay: $('resultOverlay'),
    resultImg: $('resultImg'), resultTitle: $('resultTitle'), resultSub: $('resultSub'),
    toast: $('toast')
  };

  var board = new Array(9).fill(null);
  var current = 'chicken';
  var over = false;
  var busy = false;
  var mode = 'pvp';
  var cpuLevel = B.get().xo.cpuLevel || 'normal';
  var cells = [];

  function prod(k) { return B.get().products[k]; }
  function src(k) { return B.resolve(prod(k).image); }
  function pname(k) { return prod(k).name; }

  function toast(msg, isErr) {
    els.toast.textContent = msg;
    els.toast.classList.toggle('error', !!isErr);
    els.toast.classList.add('show');
    clearTimeout(els.toast._h);
    els.toast._h = setTimeout(function () { els.toast.classList.remove('show'); }, 2400);
  }

  /* ---------- board ---------- */
  function initBoard() {
    for (var i = 0; i < 9; i++) {
      var c = document.createElement('button');
      c.className = 'cell';
      c.type = 'button';
      c.setAttribute('aria-label', 'Cell ' + (i + 1));
      c.innerHTML = '<span class="cell-mark"></span>';
      (function (idx, el) {
        el.addEventListener('click', function () { tapCell(idx); });
      })(i, c);
      els.board.appendChild(c);
      cells.push(c);
    }
  }

  function showScreen(id) {
    els.scrMenu.classList.toggle('active', id === 'scrMenu');
    els.scrGame.classList.toggle('active', id === 'scrGame');
  }

  function startRound() {
    board.fill(null);
    current = 'chicken';
    over = false;
    busy = false;
    cells.forEach(function (c) {
      c.classList.remove('win', 'dim');
      c.disabled = false;
      c.querySelector('.cell-mark').innerHTML = '';
    });
    els.resultOverlay.classList.remove('open');
    updateTurnUI();
    showScreen('scrGame');
    FS.requestWakeLock();
  }

  function updateTurnUI() {
    els.turnImg.src = src(current);
    els.turnText.textContent = I.t('turnOf') + ': ' + pname(current);
    els.chip1.classList.toggle('on', current === 'chicken');
    els.chip2.classList.toggle('on', current === 'burger');
  }

  function tapCell(i) {
    if (over || busy || board[i]) return;
    if (mode === 'cpu' && current === 'burger') return; /* computer's cell */
    move(i);
  }

  function move(i) {
    board[i] = current;
    cells[i].querySelector('.cell-mark').innerHTML =
      '<img alt="" src="' + src(current) + '">';
    S.play('place');
    var win = winnerOf(board);
    if (win) { endRound(win); return; }
    var full = true;
    for (var j = 0; j < 9; j++) if (!board[j]) { full = false; break; }
    if (full) { endRound(null); return; }
    current = (current === 'chicken') ? 'burger' : 'chicken';
    updateTurnUI();
    if (mode === 'cpu' && current === 'burger') cpuTurn();
  }

  /* ---------- computer opponent (minimax with alpha-beta) ---------- */
  function empties(bd) {
    var r = [];
    for (var i = 0; i < 9; i++) if (!bd[i]) r.push(i);
    return r;
  }

  function winnerOf(bd) {
    for (var i = 0; i < COMBOS.length; i++) {
      var c = COMBOS[i];
      if (bd[c[0]] && bd[c[0]] === bd[c[1]] && bd[c[1]] === bd[c[2]]) {
        return { combo: c, who: bd[c[0]] };
      }
    }
    return null;
  }

  function bestMove(bd, depthCap) {
    function mm(b, isMax, depth, alpha, beta) {
      var w = winnerOf(b);
      if (w) return w.who === 'burger' ? 10 - depth : depth - 10;
      var es = empties(b);
      if (!es.length || depth >= depthCap) return 0;
      var best = isMax ? -Infinity : Infinity;
      for (var i = 0; i < es.length; i++) {
        b[es[i]] = isMax ? 'burger' : 'chicken';
        var v = mm(b, !isMax, depth + 1, alpha, beta);
        b[es[i]] = null;
        if (isMax) { if (v > best) best = v; if (v > alpha) alpha = v; }
        else { if (v < best) best = v; if (v < beta) beta = v; }
        if (beta <= alpha) break;
      }
      return best;
    }
    var es = empties(bd);
    var bestVal = -Infinity, bests = [];
    for (var j = 0; j < es.length; j++) {
      bd[es[j]] = 'burger';
      var v = mm(bd, false, 1, -Infinity, Infinity);
      bd[es[j]] = null;
      if (v > bestVal + 0.0001) { bestVal = v; bests = [es[j]]; }
      else if (v > bestVal - 0.0001) bests.push(es[j]);
    }
    return bests[Math.floor(Math.random() * bests.length)];
  }

  function pickCpuMove() {
    var es = empties(board);
    if (!es.length) return null;
    if (cpuLevel === 'easy') return es[Math.floor(Math.random() * es.length)];
    if (cpuLevel === 'normal') {
      if (Math.random() < 0.35) return es[Math.floor(Math.random() * es.length)];
      return bestMove(board.slice(), 3);
    }
    return bestMove(board.slice(), 9);
  }

  function cpuTurn() {
    busy = true;
    setTimeout(function () {
      busy = false;
      if (over) return;
      var mv = pickCpuMove();
      if (mv != null) move(mv);
    }, 560);
  }

  /* ---------- round end ---------- */
  function endRound(win) {
    over = true;
    cells.forEach(function (c) { c.disabled = true; });
    var sc = St.xoScore();
    if (win) {
      win.combo.forEach(function (idx) { cells[idx].classList.add('win'); });
      cells.forEach(function (c, idx) {
        if (win.combo.indexOf(idx) < 0) c.classList.add('dim');
      });
      if (win.who === 'chicken') sc.p1++; else sc.p2++;
      St.setXoScore(sc);
      renderScores();
      F.confetti(els.scrGame, { count: 110 });
      S.play('win');
      showResult(win.who, pname(win.who) + ' ' + I.t('winsRound'));
    } else {
      cells.forEach(function (c) { c.classList.add('dim'); });
      sc.draw++;
      St.setXoScore(sc);
      renderScores();
      S.play('draw');
      showResult(null, I.t('itsADraw'));
    }
  }

  function showResult(who, title) {
    els.resultTitle.textContent = title;
    if (who) {
      els.resultImg.style.display = '';
      els.resultImg.src = src(who);
    } else {
      els.resultImg.style.display = 'none';
    }
    var sc = St.xoScore();
    els.resultSub.textContent =
      pname('chicken') + ' ' + sc.p1 + ' — ' + sc.p2 + ' ' + pname('burger');
    setTimeout(function () { els.resultOverlay.classList.add('open'); }, 850);
  }

  function renderScores() {
    var sc = St.xoScore();
    els.score1.textContent = sc.p1;
    els.score2.textContent = sc.p2;
    els.scoreDraw.textContent = sc.draw;
    els.p1Label.textContent = pname('chicken');
    els.p2Label.textContent = pname('burger');
  }

  /* ---------- branding ---------- */
  function updateBrandUI() {
    els.brandLogo.src = B.resolve(B.get().brand.logoLightBg);
    els.p1Img.src = src('chicken');
    els.p2Img.src = src('burger');
    document.querySelector('#chip1 img').src = src('chicken');
    document.querySelector('#chip2 img').src = src('burger');
    renderScores();
    updateTurnUI();
  }

  /* ---------- topbar buttons ---------- */
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
    if (!FS.isFullscreen()) FS.requestWakeLock();
  });
  FS.onChange(paintTopbar);
  B.onChange(function () { paintTopbar(); updateBrandUI(); });

  /* ---------- wiring ---------- */
  $('btnPvp').addEventListener('click', function () { mode = 'pvp'; S.play('click'); startRound(); });
  $('btnCpu').addEventListener('click', function () { mode = 'cpu'; S.play('click'); startRound(); });

  var segButtons = document.querySelectorAll('#segLevel button');
  segButtons.forEach(function (b) {
    b.classList.toggle('on', b.getAttribute('data-level') === cpuLevel);
    b.addEventListener('click', function () {
      cpuLevel = b.getAttribute('data-level');
      B.updatePath('xo.cpuLevel', cpuLevel);
      segButtons.forEach(function (x) { x.classList.toggle('on', x === b); });
      S.play('tap');
    });
  });

  $('btnRestart').addEventListener('click', function () { S.play('click'); startRound(); });
  $('btnMenu').addEventListener('click', function () { S.play('tap'); showScreen('scrMenu'); });
  $('btnAgain').addEventListener('click', function () { S.play('click'); startRound(); });
  $('btnToMenu').addEventListener('click', function () { S.play('tap'); showScreen('scrMenu'); });

  $('btnResetScores').addEventListener('click', function () {
    St.setXoScore({ p1: 0, p2: 0, draw: 0 });
    renderScores();
    S.play('tap');
    toast(I.t('resetScores'));
  });

  window.addEventListener('mashhoor:lang', function () {
    updateTurnUI();
    renderScores();
  });

  /* ---------- boot ---------- */
  initBoard();
  updateBrandUI();
  paintTopbar();
  showScreen('scrMenu');
})();
