# PocketBuilder — Google Play publishing steps

The PWA itself is now store-ready: valid manifest (id, 192/512 + maskable icons), offline service worker, standalone display. A PWA ships to Play as a Trusted Web Activity (TWA) wrapper:

1. **Host it (HTTPS, free).** Netlify manual deploy (drag this folder onto app.netlify.com), or GitHub Pages / Cloudflare Pages. netlify.toml is already included.
2. **Package.** pwabuilder.com → enter your live URL → download the signed .aab + assetlinks.json. KEEP THE SIGNING KEY — same key required for every future update.
3. **Asset links** (removes the browser bar). A template lives at [`.well-known/assetlinks.json`](.well-known/assetlinks.json) with the correct `package_name` (`construction.ridgeline.pocketbuilder`) already filled in — you only need to supply the signing-key fingerprint and host the file at the **domain root**.
   - **Get the SHA-256 fingerprint** from whichever key actually signs the app:
     - Play App Signing (recommended): Play Console → your app → **Test and release → App integrity → App signing** → copy the *SHA-256 certificate fingerprint*.
     - A local keystore: `keytool -list -v -keystore android.keystore -alias android` → copy the SHA-256 line.
   - Paste it (the `AA:BB:...` colon-separated form is fine) in place of `REPLACE_WITH_YOUR_SIGNING_KEY_SHA256_FINGERPRINT`.
   - **Host it at the domain root:** the file must be served from `https://<your-domain>/.well-known/assetlinks.json` — the *root*, not a subpath.
     - ⚠️ On a GitHub **project** page the site lives at `.../pocketbuilder/`, so this repo's copy is served at `.../pocketbuilder/.well-known/…`, which Android does **not** check. To control the root you must either deploy to **Netlify / Cloudflare Pages** (where this repo's root *is* the domain root — `netlify.toml` is already set up), or put the file in a `<user>.github.io` user-site repo.
   - Verify with Google's tester: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://<your-domain>&relation=delegate_permission/common.handle_all_urls`
4. **Play Console** (one-time $25): listing (title, descriptions, 2+ phone screenshots, 512 icon, 1024x500 feature graphic), privacy policy URL (required — "no data collected, all data stays on device" page hosted next to the app works), content rating + data safety forms.
5. **Closed testing gate:** personal dev accounts created after Nov 13, 2023 need 12 opted-in testers for 14 consecutive days before production access.
6. **Updates:** web changes go live via the hosted site instantly — no Play review. Only re-upload the wrapper if icons/name change.
