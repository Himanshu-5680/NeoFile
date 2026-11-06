# Contributing

NeoFile stays offline. A change that needs a server, an account, or a remote font does not belong here.

## Setup

```bash
npm install
npm test
npm run dev
```

The app is at http://127.0.0.1:47321.

## What to know before you edit

- Text and CSV can be real editors. xlsx edits cell values only.
- PDF, Word, PowerPoint, and media are viewers. Do not add a control that implies Word or PowerPoint editing unless it truly writes that format.
- Core behavior lives in `packages/core` and has Vitest coverage. Add a test when you change parsing, snapshots, search, or theme.
- The UI is one React app. Android and iOS load it through Capacitor. Windows, macOS, and Linux load it through Tauri.

## Checks

```bash
npm test
npm run typecheck
node scripts/size-budget.mjs
```

Platform installers are built by `.github/workflows/release.yml` when a `v*` tag is pushed.
