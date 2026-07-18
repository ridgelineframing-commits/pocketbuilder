# PocketBuilder

Builder's tape calculator & notepad — feet-inch fractions, area/volume math, roof and stair solvers, board feet. Installable PWA; packages to Android via TWA.

## Features
- Ledger-notepad UI: full-window ruled tape with line numbers — every entry stays on the tape, tap any line to edit it and the whole chain recalculates
- CalcTape-style flow: press = to rule off a total, then press an operator to carry it forward (↳) into the next block
- Undo / Redo in the toolbar (Ctrl+Z / Ctrl+Y)
- Feet / inch / fraction entry (1/8 · 1/16 · 1/32 precision), yards, full metric mode
- Dimension-aware math: length × length = area, area × length = volume, with unit-safe errors
- Roof solver (enter any two of pitch / rise / run / diag → all solved incl. hip/valley and angle)
- Stair solver (total rise → risers, treads, stringer, landing heights)
- Board feet, circle calc, percent, memory, unit conversion
- Notes on any line, blocks with carried-forward totals, tape export (.txt), share/copy
- Tape tabs (multiple scratchpads) on every device
- Construction-Master-style raised keypad (Feet / Inch / fraction on the pad, hold ⌫ to clear); 6 paper colors, light/dark chrome
- Fully offline (service worker), no data leaves the device

## Run it
Open `index.html` in a browser — that's it. For the installable PWA experience it must be served over HTTPS (see Deploy).

## Tests
The calculator engine has a unit-test suite (no dependencies). Run it with:

```
node --test
```

CI (`.github/workflows/ci.yml`) runs the same suite on every pull request and push to `main`.

## Deploy (GitHub Pages)
This repo ships with a Pages workflow (`.github/workflows/deploy-pages.yml`).

1. Push to GitHub
2. Repo **Settings → Pages → Source: GitHub Actions**
3. Your app goes live at `https://<user>.github.io/<repo>/` on every push to `main`

(Netlify Drop also works — drag the folder onto app.netlify.com. `netlify.toml` is included.)

## Build the Android app (.apk / .aab)
1. Deploy first (above) — packaging needs a live HTTPS URL
2. Go to **pwabuilder.com**, enter the live URL, choose **Android**
   - **.aab** — for the Google Play Store
   - **.apk** — for direct install/sideloading on a phone
3. Keep the generated **signing key** — the same key is required for every future update
4. For a fully chromeless app (no browser bar), host `assetlinks.json` at `https://<origin>/.well-known/assetlinks.json`. A ready-to-fill template is included at [`.well-known/assetlinks.json`](.well-known/assetlinks.json) — add your signing-key SHA-256 fingerprint and host it at the domain **root** (see `PLAY-STORE-STEPS.md` for the exact steps).
   - ⚠️ On GitHub *project* pages that path sits at the domain root, which you only control via a repo named `<user>.github.io`. Easiest fixes: put `.well-known/assetlinks.json` in that user-site repo, or deploy to Netlify where you control the root.

Full Play Store checklist: see `PLAY-STORE-STEPS.md`.

## Updating
Web changes go live on push (Pages) — installed users get them automatically (network-first service worker). Bump `CACHE` in `sw.js` when you want to force-refresh cached assets. Only rebuild the Android wrapper when the name or icons change.

---
© Ridgeline Construction. All rights reserved.
