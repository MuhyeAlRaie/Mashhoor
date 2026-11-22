# Mashhoor Interactive Games Suite

Official interactive games for **Mashhoor Fried Chicken** — built as a 100% static website, ready to publish on **GitHub Pages** with no backend, no build step and no Node.js server.

| Game | Path | What it is |
|---|---|---|
| **Mashhoor XO** | `games/mashhoor-xo/` | Tic-tac-toe between real Mashhoor products (Fried Chicken vs Chicken Burger). 2 players on one touchscreen or vs Computer (minimax AI, 3 levels). |
| **Mashhoor Motion Challenge** | `games/mashhoor-motion/` | Catch flying products with your hands. Real-time hand tracking via MediaPipe Hand Landmarker + camera. Single player or two players on a split screen. Touch/mouse fallback included. |
| **Mashhoor Chicken Dash** | `games/chicken-dash/` | Portrait endless-runner PWA with the original Mashhoor chicken mascot. Swipe controls, 3 lanes, collectibles, obstacles, speed ramp, best-score saving. Installable on phones. |
| **Admin Panel** | `admin/` | Rebrand the whole suite: logos, colors, product images/names/sizes/points, character skins, background/music, durations, difficulty. |
| **Hub** | `index.html` | Landing page listing the three games + kiosk fullscreen button. |

---

## Project structure

```
mashhoor-games/
├── index.html                  ← hub / landing page
├── manifest.webmanifest        ← PWA manifest for the whole suite
├── service-worker.js           ← offline cache for the whole suite
├── favicon.png
├── README.md
├── ARABIC.md                   ← this file in Arabic
├── admin/                      ← admin & customization panel
│   ├── index.html  admin.css  admin.js
├── shared/                     ← modules used by every page
│   ├── branding.js             ← config: defaults + localStorage overrides
│   ├── storage.js              ← safe localStorage wrapper + score helpers
│   ├── sound.js                ← Web-Audio synthesized sound effects
│   ├── fullscreen.js           ← Fullscreen API + screen wake lock
│   ├── fx.js                   ← confetti / bursts / floating text
│   ├── i18n.js                 ← EN + AR translations (RTL aware)
│   ├── icons.js                ← inline SVG icon set
│   ├── pwa.js                  ← service-worker registration helper
│   └── ui.css                  ← shared design system (CSS variables)
├── games/
│   ├── mashhoor-xo/            (index.html, xo.css, xo.js)
│   ├── mashhoor-motion/        (index.html, motion.css, motion.js, vendor/)
│   └── chicken-dash/           (index.html, dash.css, dash.js, manifest.webmanifest)
└── assets/
    ├── branding/               ← Mashhoor logos (light-bg + dark-bg versions)
    ├── products/               ← chicken / burger / fries cutouts
    ├── characters/             ← chicken mascot skins
    ├── icons/                  ← PWA icons (192/512 + maskable + apple-touch)
    ├── fonts/                  ← Baloo 2 (woff2, bundled offline)
    ├── audio/  backgrounds/    ← optional custom files (see notes below)
```

Every path in the code is **relative**, so the suite works at:

- `https://<user>.github.io/` (user site / root repo)
- `https://<user>.github.io/<repo>/` (project site / subpath) ✅
- any other static host subfolder

---

## Run locally

Opening `index.html` directly with `file://` is **not recommended** (ES-module loading for MediaPipe and camera permissions need a real origin). Use any tiny static server:

```bash
# Python (built in on most systems)
python3 -m http.server 8080
# then open http://localhost:8080

# or Node
npx serve .
```

VS Code users: the **Live Server** extension works as-is.

> The camera game needs `localhost` or **HTTPS** to get camera permission — both are fine locally.

---

## Publish on GitHub Pages (step by step)

1. Create a repository (e.g. `mashhoor-games`).
2. Upload the **contents** of this folder to the repository root (keep the folder structure; keep file names exactly as they are).
3. Repository → **Settings** → **Pages**.
4. Under *Build and deployment* choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)` → **Save**.
6. Wait 1–2 minutes. Your site is live at `https://<username>.github.io/<repo>/`.
7. Open the site once, allow the camera when prompted (Motion game), and test all three games.

Notes:

- Everything already uses relative paths — no configuration needed for the subpath.
- The service worker is registered as `service-worker.js` inside the repo root, so its scope automatically matches the subpath.
- GitHub Pages serves HTTPS, so camera access and PWA installation work out of the box.
- **Updating the site later:** bump the `VERSION` string at the top of `service-worker.js` (e.g. `mashhoor-v1.0.1`) so returning visitors get the new files.

---

## Admin panel

Open `admin/index.html` (button in the header of every page).

- **Branding** — logos (light/dark backgrounds), brand name, tagline, primary/dark/gold colors, sound on/off + volume, default language (English/Arabic).
- **Products** — per product (Fried Chicken / Chicken Burger / French Fries): image upload, display name, in-game size, points value, show/hide in Motion Challenge.
- **XO** — default mode (2 players / vs computer), computer level.
- **Motion** — round duration (20–120s), difficulty (easy/normal/hard), show hand skeleton, default mode.
- **Chicken Dash** — game name, character skins (upload + rename), optional custom background and background music, speed multiplier, touch buttons on/off.
- **Data** — export/import all settings as JSON, clear saved scores, restore factory defaults.

### Where settings are stored

All settings and scores live in the browser's **localStorage on that specific device** (GitHub Pages has no backend). Practical consequences:

- Set up each restaurant device separately, **or**
- Configure one device, then use **Data → Export**, move the `mashhoor-settings.json` file to the other device and **Import** it there.

Uploaded images are downscaled (max 512–900px) before being stored so they fit comfortably in localStorage's ~5 MB budget.

### Replacing the default images with real photos

Two supported workflows:

1. **No code** — upload real product photos from the Admin panel (transparent PNG recommended for the Motion game, where items float over video).
2. **Recompile assets** — overwrite the files in `assets/products/`, `assets/characters/`, `assets/branding/` with same file names. Keep them transparent PNG cutouts around 500–600px for best results.

---

## Languages

English is the default. Arabic (with full RTL layout) is built in — switch from the Admin panel (Branding → language) or the language button in any header. To add another language, extend the `DICT` object in `shared/i18n.js`.

---

## PWA / installation

The **whole suite** is installable from `index.html` (manifest `manifest.webmanifest`), and **Chicken Dash** has its own portrait manifest (`games/chicken-dash/manifest.webmanifest`) so it installs as a standalone game.

- **Android (Chrome):** open the page → menu ⋮ → *Install app* / *Add to Home screen*.
- **iOS (Safari):** open the page → Share → *Add to Home Screen*. iOS installs it manually (this is a platform behavior, not a bug) — the game then runs fullscreen standalone with safe-area support.
- The service worker precaches the suite (UI, images, fonts, MediaPipe engine + model), so games keep working offline after the first visit.

---

## Motion Challenge — technical notes

- The MediaPipe **Tasks Vision** bundle, WASM runtime and `hand_landmarker.task` model are **vendored locally** in `games/mashhoor-motion/vendor/` (version 0.10.14, Apache-2.0). No CDN round-trip is needed at runtime.
- It tries the GPU delegate first and falls back to CPU automatically.
- Detection runs on the camera video each frame; the index-fingertip drives the glowing cursor. In two-player mode hands are assigned to screen halves by position.
- **Camera requires HTTPS** (or localhost). If permission is denied or the camera is missing, a clear message explains the fix and the game offers a **touch/mouse fallback** mode so play is never blocked.
- Kiosk tip: allow the camera prompt once per device; browsers remember it for the origin.

## Chicken Dash — controls

| Action | Touch | Keyboard |
|---|---|---|
| Jump | swipe up / tap | ↑ / W / Space |
| Slide | swipe down | ↓ / S |
| Change lane | swipe left / right | ← / → / A / D |
| Pause | HUD button | P / Esc |

On-screen buttons can be toggled from the pause menu or the Admin panel.

---

## Adding a backend later (optional)

The suite is intentionally backend-free, but the seams are prepared:

- `shared/storage.js` — all reads/writes of settings and scores funnel through `MashhoorStore.get/set`. Replace these two functions with Supabase/Firebase calls (keep the same signature) and every game picks it up.
- `shared/branding.js` — `MashhoorBranding.update/get` is the config write path; sync it with a remote table keyed by `version` if you want shared settings across devices.
- Scores keys: `mashhoor_score_xo`, `mashhoor_best_motion_single|two`, `mashhoor_best_dash`.

Sketch (Supabase example):

```js
// storage.js patch — load/save backed by Supabase
MashhoorStore.get = async (key, fallback) => (await supabase.from('kv').select('v').eq('k', key).single())?.v ?? fallback;
MashhoorStore.set = async (key, val) => { await supabase.from('kv').upsert({ k: key, v: val }); return true; };
```

The base suite must keep working **without** any backend — do not require it for normal play.

---

## What has been tested

Verified during development on Chromium (desktop 1440×900 and emulated phone 390×844) and served from a **subpath** to replicate GitHub Pages project-site URLs:

- Hub page: 3 game cards, kiosk fullscreen button, language toggle (EN↔AR with RTL), sound toggle, admin link.
- XO: both modes playable to win/draw; scores persist; win highlight + confetti; computer levels; restart; fullscreen.
- Motion: permission-denied path shows the friendly error + fallback; pointer mode collects products and finishes the round with results and best-score saving; split-screen zones in two-player mode. (Real-camera play verified structurally — the vendor engine loads, model init + GPU→CPU fallback wired; final on-device camera check should be done on the kiosk/phone itself because headless test browsers have no camera.)
- Chicken Dash: runs, jumps, slides, lane changes, collectibles with points, obstacles and game over, pause/resume/restart, best score persistence, character select, touch buttons, rotate-to-portrait hint, own manifest parsed.
- PWA: manifest links resolve (root + dash), icons present, service worker registers over HTTP localhost/HTTPS and precaches core files; offline reload of cached shell works.
- Admin: every control saves instantly; image upload + downscale works; export/import JSON; clear scores; restore defaults; storage-quota error surfaces a friendly toast.
- All assets load with relative paths from a subpath (no 404s in console).

## Known limitations (honest list)

- **Camera needs HTTPS + user permission.** GitHub Pages provides HTTPS automatically; on iOS the prompt must be confirmed per site.
- **MediaPipe hand tracking is demanding on old phones.** On very weak devices use the pointer fallback or lower the camera resolution.
- **iOS fullscreen:** iPhone Safari does not support the Fullscreen API for regular pages. Kiosk games should be installed via *Add to Home Screen* (standalone mode) or run on Android/Windows kiosks where fullscreen works.
- **Settings are per device** (localStorage). Multi-device sync requires wiring a backend as described above.
- **Sounds are synthesized** (Web Audio) — crisp and tiny, but not brand-recorded jingles. Use the custom-music slot in the Admin panel for branded audio.
- **Default product images are AI placeholders** — replace them with real Mashhoor product photos from the Admin panel for production use.
- Offline access to the *Motion* game requires the first (online) visit to have completed, so the service worker can precache the ~17 MB engine + model.

---

## Credits

- Logos © Mashhoor Fried Chicken (uploaded brand assets).
- Hand tracking: [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) — Apache 2.0 (vendored copy v0.10.14).
- Typeface: [Baloo 2](https://fonts.google.com/specimen/Baloo+2) — SIL Open Font License (bundled woff2).
- Default product/mascot images: AI-generated placeholders — replace with real photography for production.
