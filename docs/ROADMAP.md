# Roadmap

NeoFile 1.0 is the offline desk: one UI, five platform packages, and a public site. This list is the work that follows. It is not a promise of dates.

## Shipped in 1.0

- Edit text, code, and CSV. Edit spreadsheet cell values.
- Preview PDF, Word, and PowerPoint. Play images, audio, and video.
- Light and dark neo-brutalist themes, tabs, split view, search, and local snapshots.
- Android APK with no network permission and a share inbox.
- Windows NSIS and MSI, macOS DMGs for Apple silicon and Intel, Linux deb and AppImage, unsigned iOS IPA.
- Release workflow that still produces an installable APK when signing secrets are not configured.

## Next

1. **Stable Android signing key.** A maintainer stores `ANDROID_KEYSTORE_BASE64` and the password secrets through GitHub's secret settings. Later public APKs can then share one identity. That key cannot update the published v1.0.0 or v1.0.1 installs, because those throwaway keys were discarded. The release job fails instead of minting another key.
2. **Install friction.** Keep the SmartScreen and Gatekeeper descriptions accurate. Trusted Windows and macOS signing needs paid certificates, which are out of scope. The free phone path is the web desk. Do not document a command that turns an OS protection off.
3. **Parser limits in the UI.** When a sheet, deck, or document hits a known limit, the message should name the limit (formulas, charts, slide positions) in the same words as the FAQ.
4. **Tests around the shells.** Core tests cover parsing and the sanitizer. The Android plugin and the Tauri tray still need a device or a desktop session to verify. A scripted check that the release workflow's expected filenames exist would catch a rename before a tag is pushed.

## Out of scope

- Accounts, sync, analytics, or a NeoFile server.
- Recalculating spreadsheet formulas.
- Editing Word or PowerPoint layout.
- An App Store or Play Store listing that depends on a private signing key being committed.

## How to pick something up

Issues and pull requests use the forms in `.github/ISSUE_TEMPLATE`. A change that needs a network call does not fit. Say which platform you can test.
