# PocketBuilder — Google Play publishing steps

The PWA itself is now store-ready: valid manifest (id, 192/512 + maskable icons), offline service worker, standalone display. A PWA ships to Play as a Trusted Web Activity (TWA) wrapper:

1. **Host it (HTTPS, free).** Netlify manual deploy (drag this folder onto app.netlify.com), or GitHub Pages / Cloudflare Pages. netlify.toml is already included.
2. **Package.** pwabuilder.com → enter your live URL → download the signed .aab + assetlinks.json. KEEP THE SIGNING KEY — same key required for every future update.
3. **Asset links.** Upload assetlinks.json to https://<your-domain>/.well-known/assetlinks.json (removes the browser bar).
4. **Play Console** (one-time $25): listing (title, descriptions, 2+ phone screenshots, 512 icon, 1024x500 feature graphic), privacy policy URL (required — "no data collected, all data stays on device" page hosted next to the app works), content rating + data safety forms.
5. **Closed testing gate:** personal dev accounts created after Nov 13, 2023 need 12 opted-in testers for 14 consecutive days before production access.
6. **Updates:** web changes go live via the hosted site instantly — no Play review. Only re-upload the wrapper if icons/name change.
