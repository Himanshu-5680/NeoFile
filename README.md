# NeoFile

NeoFile is an offline file desk for a Windows PC and an Android phone. One web UI opens text, code, CSV, and spreadsheet values, and it previews PDF, Word, PowerPoint, and media. Files stay on the device. There is no account, no sync, and no analytics.

The app you can run in a browser is the same UI the Android WebView and the desktop window load.

## Run it locally

```bash
npm install
npm test
npm run dev
```

Open [http://127.0.0.1:47321](http://127.0.0.1:47321). Drop a file, or start from the samples on the desk. `npm run build` writes the static app to `apps/web/dist`.

## Repository

```
packages/core          file types, CSV, snapshots, search, theme, history, tests
apps/web               shared React UI (editor, sheets, viewers)
apps/web/android       Capacitor Android project, offline manifest, share inbox
apps/web/signing       local test keystore (password is public, not a production secret)
apps/desktop           Tauri 2 window, tray, and folder access
scripts                Android APK, Windows installer, source-size check
.github/workflows      tests on every push; Windows installer on demand
artifacts              signed release APK
```

`packages/core` has no UI and no network. Vitest covers detection, CSV round-trips, snapshot pruning, search ranking, theme contrast, undo, PowerPoint text extraction, Markdown escaping, and IndexedDB snapshots.

## Privacy

- No telemetry, no accounts, no crash uploader.
- Fonts are bundled (Space Grotesk and IBM Plex Mono, SIL Open Font License). Nothing is loaded from a CDN.
- The production page sets a Content-Security-Policy that does not allow ordinary web requests. `connect-src` only names Tauri's local IPC hosts.
- Android manifest removes `INTERNET`. The release APK's permission list does not include it.
- Recent files and snapshots live in IndexedDB on this device. Erase them from Privacy. That does not delete the originals in your folders.
- Save writes a file only when the system gave NeoFile a writable handle, a desktop path, or an Android Downloads export. Otherwise Save downloads a copy.

## Feature matrix

| Formats | Mode | Save | Limit |
| --- | --- | --- | --- |
| txt, md, html, css, js, jsx, ts, tsx, py, java, json, xml, yaml, sql, other text | Edit | Overwrite when the OS gave a writable file. Otherwise download a copy. Auto-save keeps a local snapshot. | Syntax colors for JavaScript, TypeScript, JSX, Python, HTML, CSS, JSON, XML, Java, and Markdown. Other code is still editable. Markdown has a basic preview. |
| csv, tsv, semicolon-separated | Edit | Writes the grid back, including quoted commas and line breaks. | Full cell edit, paste, and undo. |
| xlsx, xlsm, xls | Values | Saves a new workbook of cell values. | SheetJS community edition. Formulas are not recalculated. Charts, pivots, macros, images, comments, and most formatting are dropped on save. |
| pdf | View | Save original downloads the file you opened. | Select and search text. No annotations, forms, or page edits. Scanned pages without a text layer can be viewed but not searched. |
| docx | View | Save original keeps the .docx bytes. Export HTML writes the preview, not a Word file. | Mammoth HTML preview and plain text. Not a Word editor. Text boxes, comments, tracked changes, and complex layout can be missing. |
| pptx, pptm | View | Save original exports the file unchanged. | Slide text and embedded pictures. Layout, animation, charts, and SmartArt are not rendered or edited. |
| png, jpg, gif, webp, bmp, avif, svg | View | Save original only. | No crop, draw, or filters. SVG markup can be viewed read-only. |
| mp3, wav, ogg, m4a, flac, aac | View | Save original only. | Playback only. Codec support depends on the device. |
| mp4, webm, ogv, mov | View | Save original only. | Playback only. No trim or transcode. |
| anything else | View | Save original. | Hex preview of the start of the file. |

The same table is in `packages/core/src/matrix.ts` and in the in-app About panel.

## Desk features

- Tabs, split view, and a recent-files launcher.
- Search across open files and the text kept for recent files. Large searches run in a worker.
- Drag and drop, including a folder tree. Ctrl/Shift click selects more than one file.
- Light and dark themes, plus an optional accent. Dark mode is one tap. Built-in accents are coral (`#ff4d2e`) and neon green (`#c6ff3d`).
- Auto-save snapshots in IndexedDB (20 per file). Cell edits also undo with Ctrl+Z. CodeMirror keeps its own edit history.
- Keyboard shortcuts on the desktop (Ctrl+O, Ctrl+S, Ctrl+Shift+S, Ctrl+W, Ctrl+\, Ctrl+Shift+F, Ctrl+H, Ctrl+Shift+L). The list is under Accent → Shortcuts.
- Windows/Linux shell: borderless window, drag region, minimize, maximize, and close-to-tray. The tray menu can show the window or quit.
- Android: swipe or the bottom bar moves to the next file in the open folder. The share sheet copies incoming files into an offline inbox. Save exports to Downloads without a network permission.

Sheets larger than 20,000 rows or 100 columns are not opened for editing. Snapshots skip payloads over 2 MB (auto) or 8 MB (manual).

## Android APK

The signed release APK in this repo is `artifacts/NeoFile-release.apk` (4.3 MB, version 0.1.0). It is signed with the test keystore below so it can be installed for local testing. It is not a Play Store key. `aapt dump permissions` lists no `INTERNET` permission.

```bash
export ANDROID_HOME="$HOME/android-sdk"   # SDK 35, build-tools 35
bash scripts/build-android.sh
```

Install on a device or emulator:

```bash
adb install -r artifacts/NeoFile-release.apk
```

Test keystore (committed on purpose):

- File: `apps/web/signing/neofile-release.keystore`
- Alias: `neofile`
- Store and key password: ``

Do not reuse this key for a public release.

## Windows installer

This Linux environment cannot cross-compile the Windows installer. The desktop shell is Tauri 2, which produces an NSIS installer on Windows.

On a Windows machine with Node 22, Rust, the Visual Studio C++ build tools, and WebView2:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1
```

The installer is written under `apps/desktop/src-tauri/target/release/bundle`.

GitHub Actions builds that installer when you run the `NeoFile CI` workflow manually, or when you push a `v*` tag. Tests and the web build run on every push. See `.github/workflows/ci.yml`.

A Linux package was built on this machine:

- `artifacts/NeoFile_0.1.0_amd64.deb` (2.9 MB)
- `artifacts/neofile-linux` (the same release binary; it needs the system WebKitGTK libraries, which the `.deb` declares)

Rebuild it with:

```bash
npm run desktop:build
```

Closing the desktop window hides it to the system tray when the tray icon was created. Quit is on the tray menu.

## Size budget

`node scripts/size-budget.mjs` measures first-party source (TypeScript, Rust, Java, styles, scripts) and fails above 10 MB. The current tree is about 4.0 MB. Toolchain folders, `node_modules`, build output, and lockfiles are not counted.

The budget stays under the cap because:

- PDF.js, SheetJS community (`xlsx`), Mammoth, JSZip, and CodeMirror are npm dependencies, loaded in separate chunks, and not copied into the git tree.
- Only the Latin font files are bundled.
- CSV parsing, search, snapshots, theme, and PowerPoint text extraction are small modules in `packages/core`.
- The Android release build does not turn on R8. The APK is still about 4.3 MB because the web assets are split and the shell is Capacitor's WebView bridge, not a second copy of a browser.

## Tests

```bash
npm test
```

## License

MIT. Third-party libraries keep their own licenses (Apache-2.0 for PDF.js and SheetJS community, BSD for Mammoth, MIT for CodeMirror and JSZip, OFL for the fonts).
