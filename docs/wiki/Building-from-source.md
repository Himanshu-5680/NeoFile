# Building from source

Requirements for the shared UI: Node.js 22.

```bash
npm install
npm test
npm run dev
```

`npm run dev` serves the UI at <http://127.0.0.1:47321>.

| Target | Command | Machine |
| --- | --- | --- |
| Browser bundle | `npm run build` | Any, with Node.js 22 |
| Android APK | `bash scripts/build-android.sh` | Linux, macOS, or Windows with JDK 21 and Android SDK 35. `ANDROID_HOME` must be set. |
| Linux deb and AppImage | `npm run desktop:build` | Linux with WebKitGTK 4.1, GTK 3, and the Tauri Linux packages |
| Windows exe and msi | `powershell -File scripts/build-windows.ps1` | Windows with Rust and the Visual Studio C++ tools |
| macOS dmg | `cd apps/desktop && npx tauri build --target aarch64-apple-darwin --bundles dmg` | macOS. Use `x86_64-apple-darwin` for Intel. |
| iOS unsigned IPA | `bash scripts/build-ios-unsigned.sh` | macOS with Xcode and CocoaPods |

## Checks

```bash
npm run typecheck
npm test
npm run build --workspace @neofile/web
node scripts/size-budget.mjs
node scripts/check-no-secrets.mjs
```

`npm run typecheck` checks `packages/core` and `apps/web`. The web build runs `tsc` and Vite. The size script fails if first-party source exceeds 10 MB.

## Android signing when you build locally

`scripts/build-android.sh` builds an APK.

- `NEOFILE_ANDROID_SIGNING=required` is the public release path. It expects `ANDROID_KEYSTORE_PASSWORD` and a keystore at `ANDROID_KEYSTORE_PATH` (default `apps/web/signing/neofile-release.keystore`). If either is missing, the script exits and does not generate a key.
- A local run without the password writes `artifacts/NeoFile-debug.apk` with a temporary key, then deletes that key. Do not publish that file.

The release workflow sets `NEOFILE_ANDROID_SIGNING=required` and stops when the four Android signing secrets are absent. See [Install on Android](Installation-Android).

## Release workflow

Pushing a tag that matches `v*` runs `.github/workflows/release.yml`. That workflow builds the APK, the Windows installers, both macOS DMGs, the Linux deb and AppImage, and the unsigned IPA, then attaches them to the GitHub Release. You can also run it with `workflow_dispatch` and a tag name.

## Website

The site in `website/` is static. GitHub Pages publishes that directory. It does not run the Vite app.

The Pages workflow cannot turn the site on. `actions/configure-pages` with `enablement: true` and the default `GITHUB_TOKEN` fails with `Resource not accessible by integration`, because creating a Pages site needs a separate token with administration rights. A repository admin has to open Settings → Pages → Build and deployment → Source and choose GitHub Actions once. After that, a push to `main` that changes `website/` or `.github/workflows/pages.yml` can deploy. Asset URLs in the page are relative, which matches a project site at `/NeoFile/`.
