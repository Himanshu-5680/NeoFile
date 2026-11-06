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
- The iOS IPA being unsigned. It is meant to be re-signed with AltStore or Sideloadly.
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

## Known dependency constraint

The `xlsx` package is SheetJS community edition. npm does not receive further
security releases of that package. NeoFile uses it only on files the person
using the app chooses to open. There is no server that parses uploads. Opening
a spreadsheet from someone you do not trust is the same tradeoff as opening it
in any local tool that uses this parser.
