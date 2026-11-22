/* ============================================================
   Mashhoor Games — Admin panel logic
   Binds UI controls to the shared branding config, handles
   image/music uploads (downscaled to dataURLs in localStorage),
   export/import JSON, and danger-zone actions.
   ============================================================ */
(function () {
  'use strict';

  var I = MashhoorI18N, B = MashhoorBranding, St = MashhoorStore,
      S = MashhoorSound, FS = MashhoorFS;

  /* inject static icons */
  document.querySelectorAll('.ic-slot').forEach(function (el) {
    el.innerHTML = MashhoorIcons.svg(el.getAttribute('data-icon'));
  });

  var toastEl = document.getElementById('toast');
  function toast(msg, isErr) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('error', !!isErr);
    toastEl.classList.add('show');
    clearTimeout(toastEl._h);
    toastEl._h = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  window.addEventListener('mashhoor:storage-error', function () {
    toast(I.t('quotaWarning'), true);
  });

  function getPath(obj, path) {
    var parts = path.split('.');
    var o = obj;
    for (var i = 0; i < parts.length; i++) {
      if (o == null) return undefined;
      o = o[parts[i]];
    }
    return o;
  }

  var saveTimer = null;
  function savedToast() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { toast(I.t('saved')); }, 400);
  }

  /* ============================================================
     Tabs
     ============================================================ */
  document.querySelectorAll('#tabs .tab').forEach(function (t) {
    t.addEventListener('click', function () {
      var id = t.getAttribute('data-tab');
      document.querySelectorAll('#tabs .tab').forEach(function (x) { x.classList.toggle('on', x === t); });
      document.querySelectorAll('.tab-panel').forEach(function (p) {
        p.classList.toggle('show', p.id === 'tab-' + id);
      });
      S.play('tap');
    });
  });

  /* ============================================================
     Generic bound controls (text / select / switch / range / color)
     ============================================================ */
  function fmtRange(el) {
    var v = Number(el.value);
    var out = '';
    switch (el.getAttribute('data-fmt')) {
      case 'percent': out = Math.round(v * 100) + '%'; break;
      case 'sec': out = v + I.t('seconds'); break;
      case 'x': out = Number(v).toFixed(2) + 'x'; break;
      default: out = String(v);
    }
    var lab = document.querySelector('[data-rv="' + el.getAttribute('data-bind') + '"]');
    if (lab) lab.textContent = out;
    return out;
  }

  function refreshControl(el) {
    var path = el.getAttribute('data-bind');
    var v = getPath(B.get(), path);
    if (el.type === 'checkbox') el.checked = v !== false;
    else el.value = v === undefined || v === null ? '' : v;
    if (el.type === 'range') fmtRange(el);
  }

  function bindControls(root) {
    root.querySelectorAll('[data-bind]').forEach(function (el) {
      if (el._bound) { refreshControl(el); return; }
      refreshControl(el);
      var ev = (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'range' || el.type === 'color') ? 'change' : 'input';
      el.addEventListener(ev, function () {
        var path = el.getAttribute('data-bind');
        var v;
        if (el.type === 'checkbox') v = el.checked;
        else if (el.type === 'range' || el.type === 'number') v = Number(el.value);
        else v = el.value;
        B.updatePath(path, v);
        if (el.type === 'range') fmtRange(el);
        if (path === 'language') { I.set(v); langLabel(); }
        if (el.type === 'color') paintColorCodes();
        savedToast();
      });
      el._bound = true;
    });
  }

  function paintColorCodes() {
    var c = B.get().brand.colors;
    document.getElementById('colPrimary').textContent = c.primary;
    document.getElementById('colDark').textContent = c.dark;
    document.getElementById('colGold').textContent = c.gold;
  }

  /* ============================================================
     Image / music upload widgets
     ============================================================ */
  function downscale(file, maxSide, format) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) { reject(new Error('type')); return; }
      if (file.size > 4 * 1024 * 1024) { reject(new Error('size')); return; }
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var w = im.naturalWidth, h = im.naturalHeight;
          var scale = Math.min(1, maxSide / Math.max(w, h));
          var cv = document.createElement('canvas');
          cv.width = Math.round(w * scale);
          cv.height = Math.round(h * scale);
          var cx = cv.getContext('2d');
          cx.drawImage(im, 0, 0, cv.width, cv.height);
          var mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
          try {
            resolve(cv.toDataURL(mime, 0.86));
          } catch (e) {
            resolve(fr.result);
          }
        };
        im.onerror = function () { reject(new Error('decode')); };
        im.src = fr.result;
      };
      fr.onerror = function () { reject(new Error('read')); };
      fr.readAsDataURL(file);
    });
  }

  function refreshUpload(box) {
    var path = box.getAttribute('data-bind-img') || box.getAttribute('data-bind-music');
    var v = getPath(B.get(), path);
    var preview = box.querySelector('.preview img');
    var fname = box.querySelector('.file-name');
    if (v) {
      var disp = B.resolve(v);
      if (box.hasAttribute('data-bind-img')) {
        if (!preview) {
          preview = document.createElement('img');
          box.querySelector('.preview').appendChild(preview);
        }
        preview.src = disp;
        preview.style.display = '';
      }
      var icon = box.querySelector('.preview .ic-slot');
      if (icon && box.hasAttribute('data-bind-music')) icon.style.display = 'none';
      fname.textContent = v.indexOf('data:') === 0 ? '(uploaded file · ' + Math.round(v.length * 0.75 / 1024) + ' KB)' : v;
    } else {
      if (preview) { preview.removeAttribute('src'); preview.style.display = 'none'; }
      var ic = box.querySelector('.preview .ic-slot');
      if (ic) ic.style.display = '';
      fname.textContent = '';
    }
  }

  function bindUploads(root) {
    root.querySelectorAll('[data-bind-img], [data-bind-music]').forEach(function (box) {
      if (box._ubound) { refreshUpload(box); return; }
      box._ubound = true;
      var isMusic = box.hasAttribute('data-bind-music');
      var path = box.getAttribute(isMusic ? 'data-bind-music' : 'data-bind-img');
      var fileInput = box.querySelector('input[type=file]');
      var optional = box.hasAttribute('data-optional');

      box.querySelector('.up-btn').addEventListener('click', function () {
        fileInput.value = '';
        fileInput.click();
      });

      if (box.querySelector('.rm-btn')) {
        box.querySelector('.rm-btn').addEventListener('click', function () {
          B.updatePath(path, null);
          refreshUpload(box);
          savedToast();
        });
      }
      if (box.querySelector('.df-btn')) {
        box.querySelector('.df-btn').addEventListener('click', function () {
          B.updatePath(path, getPath(B.DEFAULTS, path));
          refreshUpload(box);
          savedToast();
        });
      }

      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (isMusic) {
          if (file.size > 2 * 1024 * 1024) { toast(I.t('imageTooBig'), true); return; }
          var fr = new FileReader();
          fr.onload = function () {
            B.updatePath(path, fr.result);
            refreshUpload(box);
            savedToast();
          };
          fr.readAsDataURL(file);
          return;
        }
        var fmt = box.getAttribute('data-img-format') || 'png';
        var maxSide = parseInt(box.getAttribute('data-img-max') || '512', 10);
        downscale(file, maxSide, fmt).then(function (dataURL) {
          B.updatePath(path, dataURL);
          refreshUpload(box);
          savedToast();
        }).catch(function (err) {
          if (err && err.message === 'size') toast(I.t('imageTooBig'), true);
          else toast(I.t('invalidFile'), true);
        });
      });

      refreshUpload(box);
    });
  }

  /* ============================================================
     Dynamic cards: products + skins
     ============================================================ */
  function buildProductCards() {
    var host = document.getElementById('productCards');
    host.innerHTML = '';
    var keys = ['chicken', 'burger', 'fries'];
    keys.forEach(function (k) {
      var p = B.get().products[k];
      var card = document.createElement('div');
      card.className = 'card product-card';
      card.innerHTML =
        '<div class="product-head"><img alt=""><span class="pkey">' + k + '</span></div>' +
        '<div class="img-upload" data-bind-img="products.' + k + '.image">' +
          '<div class="preview"><img alt=""></div>' +
          '<div class="actions">' +
            '<div class="btn-row">' +
              '<button class="btn btn-sm btn-ghost up-btn" type="button"><span class="ic-slot" data-icon="upload"></span><span></span></button>' +
              '<button class="btn btn-sm btn-outline df-btn" type="button"><span class="ic-slot" data-icon="refresh"></span><span></span></button>' +
            '</div><span class="file-name"></span>' +
          '</div>' +
          '<input type="file" accept="image/*" class="hidden">' +
        '</div>' +
        '<div class="grid-2">' +
          '<div class="field"><label></label><input class="input" type="text" data-bind="products.' + k + '.name"></div>' +
          '<div class="field"><label></label><input type="range" min="60" max="200" step="5" data-bind="products.' + k + '.size" data-fmt="plain"></div>' +
          '<div class="field"><label></label><input class="input" type="number" min="1" max="999" data-bind="products.' + k + '.points"></div>' +
          '<div class="field"><label class="switch"><input type="checkbox" data-bind="products.' + k + '.enabled"><span class="track"></span><span></span></label></div>' +
        '</div>';
      /* localized labels */
      card.querySelector('.field:nth-child(1) > label').textContent = I.t('productName');
      card.querySelector('.field:nth-child(2) > label').textContent = I.t('productSize') + ' (px)';
      card.querySelector('.field:nth-child(3) > label').textContent = I.t('productPoints') + ' (' + I.t('points') + ')';
      var sw = card.querySelector('.field:nth-child(4) .switch > span:last-child');
      if (sw) sw.textContent = I.t('showInMotion');
      card.querySelector('.up-btn span:last-child').textContent = I.t('uploadImage');
      card.querySelector('.df-btn span:last-child').textContent = I.t('restoreImg');
      card.querySelector('.product-head img').src = B.resolve(p.image);
      card.querySelector('.product-head .pkey').textContent = p.name || k;

      host.appendChild(card);
      bindControls(card);
      bindUploads(card);
    });
  }

  function buildSkinCards() {
    var host = document.getElementById('skinCards');
    host.innerHTML = '';
    var skins = B.get().dash.skins || [];
    skins.forEach(function (sk, idx) {
      var card = document.createElement('div');
      card.className = 'img-upload skin-card';
      card.setAttribute('data-bind-img', 'dash.skins.' + idx + '.image');
      card.innerHTML =
        '<div class="preview"><img alt=""></div>' +
        '<div class="actions">' +
          '<div class="skin-title">' + (sk.id || ('skin ' + (idx + 1))) + '</div>' +
          '<div class="btn-row">' +
            '<button class="btn btn-sm btn-ghost up-btn" type="button"><span class="ic-slot" data-icon="upload"></span><span>' + I.t('uploadImage') + '</span></button>' +
            '<button class="btn btn-sm btn-outline df-btn" type="button"><span class="ic-slot" data-icon="refresh"></span><span>' + I.t('restoreImg') + '</span></button>' +
          '</div>' +
          '<input class="input" type="text" data-bind="dash.skins.' + idx + '.name" style="min-height:44px;max-width:240px">' +
          '<span class="file-name"></span>' +
        '</div>' +
        '<input type="file" accept="image/*" class="hidden">';
      host.appendChild(card);
      bindControls(card);
      bindUploads(card);
    });
  }

  /* ============================================================
     Data tab
     ============================================================ */
  function paintUsage() {
    var bytes = St.usageBytes();
    document.getElementById('usageLine').textContent =
      I.t('score') + ': ' + (bytes / 1024).toFixed(1) + ' KB / ~5 MB (localStorage)';
  }

  document.getElementById('btnExport').addEventListener('click', function () {
    var blob = new Blob([B.exportJSON()], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mashhoor-settings.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    S.play('click');
  });

  document.getElementById('btnImport').addEventListener('click', function () {
    var fi = document.getElementById('importFile');
    fi.value = '';
    fi.click();
  });
  document.getElementById('importFile').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        B.importJSON(String(fr.result));
        initAll();
        toast(I.t('saved'));
      } catch (e) {
        toast(I.t('invalidJson'), true);
      }
    };
    fr.readAsText(f);
  });

  document.getElementById('btnClearScores').addEventListener('click', function () {
    St.clearScores();
    toast(I.t('clearScores'));
    S.play('tap');
  });

  document.getElementById('btnResetAll').addEventListener('click', function () {
    if (!window.confirm(I.t('confirmResetAll'))) return;
    B.reset();
    location.reload();
  });

  /* ============================================================
     Topbar + boot
     ============================================================ */
  var langBtn = document.getElementById('langBtn');
  var soundBtn = document.getElementById('soundBtn');
  function langLabel() {
    langBtn.querySelector('.lang-label').textContent = I.lang === 'en' ? 'ع' : 'EN';
  }
  langBtn.addEventListener('click', function () {
    var next = I.lang === 'en' ? 'ar' : 'en';
    I.set(next);
    B.updatePath('language', next);
    langLabel();
    initAll();
    S.play('tap');
  });
  soundBtn.addEventListener('click', function () {
    var on = !(B.get().sounds.enabled !== false);
    B.updatePath('sounds.enabled', on);
    paintSoundBtn();
    if (on) S.play('tap');
  });
  function paintSoundBtn() {
    soundBtn.innerHTML = MashhoorIcons.svg(B.get().sounds.enabled !== false ? 'sound' : 'mute');
  }
  FS.onChange(function () { /* noop hook for future kiosk controls */ });

  function paintBrand() {
    document.getElementById('brandLogo').src = B.resolve(B.get().brand.logoLightBg);
  }

  function initAll() {
    paintBrand();
    paintColorCodes();
    buildProductCards();
    buildSkinCards();
    bindControls(document.querySelector('.admin-main')); /* skips already-bound dynamic nodes */
    bindUploads(document.querySelector('.admin-main'));   /* guards against double-binding */
    refreshAllControls();
    paintUsage();
  }

  function refreshAllControls() {
    document.querySelectorAll('[data-bind]').forEach(refreshControl);
    document.querySelectorAll('[data-bind-img], [data-bind-music]').forEach(refreshUpload);
  }

  window.addEventListener('mashhoor:lang', function () {
    /* re-render localized labels of dynamic cards */
    initAll();
  });

  langLabel();
  paintSoundBtn();
  initAll();
  MashhoorPWA.register('../service-worker.js');
})();
