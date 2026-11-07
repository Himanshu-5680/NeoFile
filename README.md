<p align="center">
  <img src="assets/logo.svg" width="128" height="128" alt="NeoFile logo">
</p>

<h1 align="center">NeoFile</h1>

<p align="center">
  An offline file desk for Android, Windows, macOS, iOS, and Linux.<br>
  Text and CSV are editable. Word, PowerPoint, PDF, and media are honest previews.
</p>

<p align="center">
  <a href="https://github.com/Himanshu-5680/NeoFile/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Himanshu-5680/NeoFile/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/Himanshu-5680/NeoFile/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/Himanshu-5680/NeoFile?display_name=tag"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/Himanshu-5680/NeoFile"></a>
  <a href="https://himanshu-5680.github.io/NeoFile/"><img alt="Website" src="https://img.shields.io/website?url=https%3A%2F%2Fhimanshu-5680.github.io%2FNeoFile%2F&label=docs&up_message=online&down_message=offline"></a>
</p>

<p align="center">
  <img alt="Android" src="https://img.shields.io/badge/Android-APK-3DDC84?logo=android&logoColor=white">
  <img alt="iOS" src="https://img.shields.io/badge/iOS-unsigned%20IPA-000000?logo=apple&logoColor=white">
  <img alt="Windows" src="https://img.shields.io/badge/Windows-exe%20%7C%20msi-0078D6?logo=windows&logoColor=white">
  <img alt="macOS" src="https://img.shields.io/badge/macOS-arm64%20%7C%20x64-111111?logo=apple&logoColor=white">
  <img alt="Linux" src="https://img.shields.io/badge/Linux-deb%20%7C%20AppImage-FCC624?logo=linux&logoColor=black">
</p>

<p align="center">
  <img src="docs/screenshots/desktop-light.png" width="720" alt="NeoFile on a desktop in light mode, editing a Markdown file">
  <img src="docs/screenshots/desktop-dark.png" width="720" alt="NeoFile on a desktop in dark mode">
</p>

<p align="center">
  <img src="docs/screenshots/mobile-light.png" width="240" alt="NeoFile on a phone in light mode">
  <img src="docs/screenshots/mobile-dark.png" width="240" alt="NeoFile on a phone in dark mode">
</p>

## Download

Current release: [v1.0.1](https://github.com/Himanshu-5680/NeoFile/releases/tag/v1.0.1). One recommended file for each system is below. The project site also hosts [NeoFile web desk](https://himanshu-5680.github.io/NeoFile/desk/), which is the browser app. It is not the native iOS app.

| System | Recommended file | What to expect |
| --- | --- | --- |
| Browser, including iPhone | [Web desk](https://himanshu-5680.github.io/NeoFile/desk/) | Open the page. On iPhone, use Safari, Share, Add to Home Screen. The first open needs a network connection. Later opens can work offline until the browser removes the saved copy. |
| Android | [NeoFile-1.0.1.apk](https://github.com/Himanshu-5680/NeoFile/releases/download/v1.0.1/NeoFile-1.0.1.apk) | Open the APK. Android can ask you to allow that app to install unknown apps. Not a store install, and not zero steps. |
| Windows 64-bit | [NeoFile_1.0.1_x64.msi](https://github.com/Himanshu-5680/NeoFile/releases/download/v1.0.1/NeoFile_1.0.1_x64.msi) | SmartScreen can say "Windows protected your PC" because the installer is not Authenticode-signed. NeoFile cannot clear that warning. |
| macOS Apple silicon | [NeoFile_1.0.1_aarch64.dmg](https://github.com/Himanshu-5680/NeoFile/releases/download/v1.0.1/NeoFile_1.0.1_aarch64.dmg) | Not notarized. Gatekeeper can block the app. |
| macOS Intel | [NeoFile_1.0.1_x64.dmg](https://github.com/Himanshu-5680/NeoFile/releases/download/v1.0.1/NeoFile_1.0.1_x64.dmg) | Same notarization limit as Apple silicon. |
| Linux x86_64 | [NeoFile_1.0.1_amd64.deb](https://github.com/Himanshu-5680/NeoFile/releases/download/v1.0.1/NeoFile_1.0.1_amd64.deb) | `sudo apt install ./NeoFile_1.0.1_amd64.deb`. Depends on `libwebkit2gtk-4.1-0`, `libgtk-3-0`, and `libayatana-appindicator3-1`. |

Other files on the same release, not the recommended install: `NeoFile_1.0.1_x64-setup.exe`, `NeoFile_1.0.1_amd64.AppImage`, and `NeoFile-1.0.1-unsigned.ipa`. The IPA is an unsigned device build, not a one-tap iPhone install, and not a simulator build. Inside that published file the bundle version is 1.0, build 1. iOS will not install it from Files.

The logo is [assets/logo.svg](assets/logo.svg). A 1024 px PNG is attached to the release as `logo-1024.png`.

## Install notes

### Web desk

The hosted page is the same editor UI, running in the browser. Add to Home Screen saves that web app. It does not become the native iOS or Android package. File picking uses the browser. The first visit downloads the page. Offline use starts after that save, and the browser can delete it later.

### Android

The APK requests no `INTERNET` permission. The published v1.0.0 and v1.0.1 APKs were signed with two different throwaway keys, and both keys were discarded on the build runner. Android will refuse to install one over the other. A new key cannot make that update seamless. Recents and snapshots live in the app's private IndexedDB database `neofile`. Saving a document writes that file to a folder you pick; those files stay. The web desk is a separate browser copy and does not contain the Android app's snapshots. Keep the installed app if you still need those snapshots.

### Windows

The MSI is the recommended installer. The exe is the same unsigned app. Closing the window hides NeoFile in the system tray. Quit from the tray menu. SmartScreen appears because the installer is not Authenticode-signed. These notes do not ask you to turn SmartScreen off.

### macOS

Open the DMG and drag NeoFile to Applications. The app is not notarized. Gatekeeper can block it. These notes do not include a command to strip that protection. Use the web desk if you need a copy that does not go through Gatekeeper.

### Linux

No Node, Rust, or SDK is required for the deb. Ubuntu 24.04 provides the three libraries named above. The AppImage is the other file: `chmod +x NeoFile_1.0.1_amd64.AppImage` and run it. Video playback in the AppImage needs `gstreamer1.0-plugins-good` on Debian and Ubuntu.

### iOS

There is no free universal install of the native iOS package. The unsigned IPA has no provisioning profile. The free phone path is the web desk.

## What it does

- Edit text and code, with syntax colors for JavaScript, TypeScript, JSX, Python, HTML, CSS, JSON, XML, Java, and Markdown.
- Edit CSV and TSV, including quoted commas.
- Edit spreadsheet **values** in xlsx, xlsm, and xls.
- View PDF with text selection and search.
- Preview Word as HTML plus extracted text. Export HTML is not a Word file.
- Preview PowerPoint as slide text and embedded pictures. Layout is not rendered.
- Play images, audio, and video. Save exports the original. There is no media editor.
- Tabs, split view, search, drag-and-drop, a folder tree with multi-select, and local snapshots.
- Light mode uses a coral accent. Dark mode is one tap and uses neon green. You can set a custom accent.
- Android: swipe between files in a folder, and an offline inbox for files received from the share sheet.

## Known limits

SheetJS community edition does not recalculate formulas. Saving a workbook writes cell values and drops charts, pivot tables, macros, images, comments, and most formatting.

Mammoth’s Word preview can miss text boxes, comments, tracked changes, and complex layout. PowerPoint does not show slide positions, animation, charts, or SmartArt.

Sheets larger than 20,000 rows or 100 columns open as a download-only file. Auto snapshots skip payloads over 2 MB.

## Privacy

NeoFile does not have an account, sync, or analytics. Fonts are bundled. The production page’s Content-Security-Policy does not allow ordinary web requests. Recent files and snapshots stay in on-device IndexedDB. Erase them from the Privacy panel. That does not delete the original files in your folders.

## Build from source

Requirements: Node.js 22.

```bash
npm install
npm test
npm run dev
```

| Target | Command | Machine |
| --- | --- | --- |
| Browser bundle | `npm run build` | Any |
| Android APK | `bash scripts/build-android.sh` | Linux, macOS, or Windows with JDK 21 and Android SDK 35. `ANDROID_HOME` must be set. |
| Linux deb and AppImage | `npm run desktop:build` | Linux with the Tauri WebKitGTK packages |
| Windows exe and msi | `powershell -File scripts/build-windows.ps1` | Windows with Rust and the Visual Studio C++ tools |
| macOS dmg | `cd apps/desktop && npx tauri build --target aarch64-apple-darwin --bundles dmg` | macOS. Use `x86_64-apple-darwin` for Intel. |
| iOS unsigned IPA | `bash scripts/build-ios-unsigned.sh` | macOS with Xcode |

Pushing a `v*` tag runs `.github/workflows/release.yml`, which builds all of the above and attaches them to a GitHub Release.

A public release signs the APK only when these GitHub Actions secrets are set: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, and `ANDROID_KEY_ALIAS`. None of those values are stored in git. If they are missing, the release job stops and does not generate a key or upload an APK. A local `bash scripts/build-android.sh` without the password still writes `NeoFile-debug.apk` with a temporary key and deletes that key. That debug file is not a release. A keystore created later can sign future releases only. It cannot update the published v1.0.0 or v1.0.1 installs, because those keys are gone.

## Tech stack

First-party source is about 0.3 MB (`node scripts/size-budget.mjs`), under a 10 MB cap. PDF.js, SheetJS, and CodeMirror are npm dependencies loaded in separate chunks, not copied into the git tree.

One React, TypeScript, and Vite UI. CodeMirror 6 edits text. A small grid edits CSV. SheetJS reads and writes spreadsheet values. PDF.js draws PDFs. Mammoth previews docx. JSZip plus a small XML reader previews pptx. Tauri 2 is the desktop shell. Capacitor 7 is the Android and iOS shell. Vitest covers the local core.

## Folder structure

```
assets/                 master logo SVG and PNG
apps/web                shared UI
apps/web/android        Android project
apps/web/ios            iOS project
apps/desktop            Tauri shell
packages/core           parsing, snapshots, search, theme, tests
docs/screenshots        captures of the running app
docs/wiki               install, build, FAQ, and architecture pages
website                 static project site
scripts                 icon render, APK, unsigned IPA, Windows installer
.github/workflows       CI, Pages, and the multi-platform release
```

## Docs

The project site is [himanshu-5680.github.io/NeoFile](https://himanshu-5680.github.io/NeoFile/). Wiki-ready pages are in [docs/wiki](docs/wiki/Home.md): install steps per platform, [building from source](docs/wiki/Building-from-source.md), the [FAQ](docs/wiki/FAQ.md), and [architecture](docs/wiki/Architecture.md). The [roadmap](docs/ROADMAP.md) lists what 1.0 ships and what is intentionally out of scope.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Changes that need a network service do not fit this app. Community expectations are in the [code of conduct](CODE_OF_CONDUCT.md). Vulnerability reports go through [SECURITY.md](SECURITY.md). Install questions start at [SUPPORT.md](SUPPORT.md).

## Credit

[Himanshu Pathak](https://github.com/Himanshu-5680) (`Himanshu-5680`) is the project owner.

[pavitra-prabhakar](https://github.com/pavitra-prabhakar) and [vectornomadhp88](https://github.com/vectornomadhp88) are other GitHub accounts of the same person. They are not separate maintainers, and they did not open the pull requests in this repository.

The app implementation was AI-assisted in [Cursor](https://cursor.com), including work built with Grok Bot. Those commits stay attributed to the agent that wrote them. That assistance is not project ownership.

## License

[MIT](LICENSE). PDF.js and SheetJS community are Apache-2.0. Mammoth is BSD. CodeMirror and JSZip are MIT. The bundled fonts are SIL Open Font License. The website layout pass credits unslop by Damir Sokolovsky, CC BY 4.0, in the site footer.
