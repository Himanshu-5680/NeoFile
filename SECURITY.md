# Security policy

NeoFile is an offline file viewer and editor. It does not have an account, a
sync service, or a backend. The security boundary is the device: the app parses
files the user opens, and it stores recent files and snapshots in on-device
IndexedDB.

## Reporting a vulnerability

Please report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/Himanshu-5680/NeoFile/security/advisories/new).

Do not open a public issue for a suspected vulnerability, and do not attach a
keystore, password, or exploit file to a public ticket. A report should describe
the affected platform, the NeoFile version, and the impact. Maintainer
[@Himanshu-5680](https://github.com/Himanshu-5680) will acknowledge reports that
include enough detail to reproduce the impact.

## Supported versions

| Version | Status |
| --- | --- |
| 1.0.x | Supported |

## What is in scope

- Script execution or HTML injection through the Word, PowerPoint, Markdown, or spreadsheet preview. Preview HTML is passed through `sanitizeHtml` in `packages/core`.
- Path or filename handling that writes outside the file the user chose, including `safeFileName` in `packages/core`.
- The desktop shell reading or writing paths the user did not select. Tauri file-system scope is limited to the home, download, document, and desktop directories.
- The Android share inbox accepting content the user did not share into NeoFile, or the app regaining a network permission. The manifest removes `INTERNET`.
- Denial of service that a crafted local file reliably triggers, such as unbounded expansion while reading a pptx or xlsx the user opened.
- A release artifact that contains a keystore, private key, or signing password.

## What is out of scope

- SmartScreen or Gatekeeper warnings on the unsigned Windows and macOS installers. Those warnings are documented in the README.
- The iOS IPA being unsigned. It is not a normal install, and the web desk is the separate browser copy.
- An APK signed by the throwaway CI key when repository signing secrets are not configured. The release notes call that out. It is not a Play Store identity.
- Missing spreadsheet formula recalculation, Word editing, or PowerPoint layout. Those are product limits, not vulnerabilities.
- A request to add accounts, sync, or analytics.

## Signing secrets

Release signing material is not stored in git. `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, and `ANDROID_KEY_ALIAS`
are GitHub Actions secrets when a maintainer configures them. If they are
absent, the Android job generates a throwaway key on the runner, signs the APK
so it can be installed, and discards the key. Do not commit a `.keystore`,
`.jks`, `.p12`, or private key to replace that behavior.

## Spreadsheet parser

SheetJS Community Edition stopped publishing to npm at 0.18.5. That release is
affected by CVE-2023-30533 (prototype pollution while reading a workbook) and
CVE-2024-22363 (regular-expression denial of service while reading). NeoFile
reads workbooks the person opens, including in a background worker, so those
bugs are on a user-controlled path.

The web package depends on SheetJS CE 0.20.3 from the SheetJS CDN
(`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`). That is the community
release that includes the fixes for those two advisories. The lockfile records
the tarball integrity. npm's `xlsx` package is not the dependency.

This does not make every future spreadsheet file safe to open. Formula
recalculation is still absent. Saving still writes cell values and drops
charts, macros, and most formatting.

## Test runner

`vitest` is pinned at 4.1.12. That release depends on `@vitest/mocker` 4.1.12,
which includes the fixes for GHSA-82fw-gwwq-j7x9 and GHSA-qxg6-89mg-rqv8.
Vitest 3.2.7 pulled `tinypool` 1.1.1 (GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr).
Vitest 4.1.12 does not depend on `tinypool`, so that package is not installed.
These packages are used by `vitest run`. They are not in the web, desktop, or
mobile bundles. Vitest 5.x was not required for those advisories.

## PDF viewer

`pdfjs-dist` is pinned at 6.2.108, the first release outside the affected range
of GHSA-hq66-cqwq-w95j (`>=5.6.83 <6.2.108`). The installed build still enables
PDF scripting only when `enableScripting` is exactly true. NeoFile draws pages
to a canvas and a text layer. It does not build an annotation layer. Production
and desktop Content-Security-Policy set `script-src 'self'`. A later 6.x
release was not required to leave that advisory range. This is not a claim that
every PDF is safe to open.
