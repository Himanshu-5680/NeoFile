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

`scripts/build-android.sh` signs a release APK.

- If `ANDROID_KEYSTORE_PASSWORD` is set, the script expects a keystore at `ANDROID_KEYSTORE_PATH` (default `apps/web/signing/neofile-release.keystore`).
- If the password is not set, the script generates a throwaway PKCS12 key in a temporary directory, signs with it, and leaves the key there. The key is gitignored. The APK installs. It is not a key you can use for Play Store updates.

GitHub Actions uses the same script. Repository secrets override the throwaway path. See [Install on Android](Installation-Android).

## Release workflow

Pushing a tag that matches `v*` runs `.github/workflows/release.yml`. That workflow builds the APK, the Windows installers, both macOS DMGs, the Linux deb and AppImage, and the unsigned IPA, then attaches them to the GitHub Release. You can also run it with `workflow_dispatch` and a tag name.

## Website

The site in `website/` is static. GitHub Pages publishes that directory. It does not run the Vite app.
