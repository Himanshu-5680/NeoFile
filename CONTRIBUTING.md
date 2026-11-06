# Contributing

NeoFile stays offline. A change that needs a server, an account, analytics, or a
remote font does not belong here. Text and CSV can be real editors. Spreadsheet
workbooks edit cell values only. PDF, Word, PowerPoint, and media are viewers.

## Setup

Requirements: Node.js 22.

```bash
npm install
npm test
npm run dev
```

The app is at <http://127.0.0.1:47321>. `npm run dev` serves the shared UI in
`apps/web`. Android and iOS load that UI through Capacitor. Windows, macOS, and
Linux load it through Tauri.

## Checks before you open a pull request

```bash
npm run typecheck
npm test
npm run build --workspace @neofile/web
node scripts/size-budget.mjs
```

`npm run typecheck` is the lint step. Core behavior lives in `packages/core`
and has Vitest coverage. Add or update a test when you change parsing,
snapshots, search, theme, HTML sanitizing, or file names. The web build runs
`tsc` again and writes `apps/web/dist`. First-party source stays under the
10 MB budget enforced by `scripts/size-budget.mjs`.

Platform installers are built by `.github/workflows/release.yml` when a `v*`
tag is pushed. You do not need to build every installer locally to contribute
a UI or core change.

## What to know before you edit

- Do not add a control that implies Word or PowerPoint editing unless it writes that format.
- SheetJS community edition does not recalculate formulas. Saving a workbook writes cell values and drops charts, pivot tables, macros, images, comments, and most formatting.
- Preview HTML from Office documents goes through `sanitizeHtml`. Keep the allow-list. Do not pass raw HTML to the DOM.
- The Android manifest removes `INTERNET`. Do not add it back.
- The desktop shell may only touch files the user picked, inside the Tauri filesystem scope in `apps/desktop/src-tauri/capabilities/default.json`.
- Heavy CSV and spreadsheet reads go through `apps/web/src/workers`. Keep that work off the UI thread.

## Secrets

Never commit a keystore, `.jks`, `.p12`, private key, or signing password.
Android release secrets, when a maintainer has them, live in GitHub Actions
secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_PASSWORD`, `ANDROID_KEY_ALIAS`). When those secrets are absent,
`scripts/build-android.sh` generates a throwaway key on the runner so the APK
still installs. That key is not a Play Store identity and must not be committed.

## Pull requests

- Use the pull request template.
- Describe the platform you tried (browser, Android, desktop) and the file type if the change is about opening or saving.
- Keep the diff limited to the behavior you are changing.
- CI runs typecheck, tests, the web build, the size budget, and a scan that rejects committed keystores.

## Code style

TypeScript and TSX use two-space indentation. Rust and Java follow the existing
files. Line endings are LF except for Windows scripts (`.ps1`, `.bat`, `.cmd`).
See `.editorconfig`.

## Conduct

This project uses the [Contributor Covenant](CODE_OF_CONDUCT.md). Report
security issues through [SECURITY.md](SECURITY.md), not a public pull request.
