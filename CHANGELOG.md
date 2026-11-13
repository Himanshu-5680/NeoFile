# Changelog

## Unreleased

- An empty or non-workbook spreadsheet shows an error instead of a grid of the raw bytes. A downloaded Save updates the restored session. A corrupt image says it could not be decoded.
- A public Android release stops when the signing secrets are missing. It does not generate a key or upload an APK. Local builds without a password write `NeoFile-debug.apk` only.
- The install notes say v1.0.0 and v1.0.1 cannot update over each other, that those keys are gone, and that recents and snapshots stay in the installed app. They no longer tell anyone to remove the app to upgrade.
- The project site and the install docs name the v1.0.1 files, one recommended download per system, and the real signing limits. They no longer tell anyone to strip the macOS quarantine flag or to turn SmartScreen off.
- The project site can publish the existing browser UI as NeoFile web desk. That copy is labeled as a web app. It is not a native iOS install. The first open needs a network connection.

## 1.0.1

- Spreadsheet reads use SheetJS CE 0.20.3. PDF.js is 6.2.108, and PDF pages draw after the page shell is on screen.
- Dropped folders keep their real shape. The Android desk finishes opening, and the native document picker can open a file.
- GitHub Pages still needs a repository admin to choose GitHub Actions as the source. The workflow no longer pretends the default token can create the site.
- Windows, macOS, and iOS packages from the release workflow are unsigned. Android uses the release keystore only when those secrets exist; otherwise the workflow signs with a throwaway key and says so. A debug APK is not the release file.

## 1.0.0

First public release of NeoFile, an offline file desk.

- Shared editor for text, code, and CSV, with spreadsheet value editing for xlsx.
- Viewers for PDF, Word, PowerPoint, images, audio, and video. Word and PowerPoint are previews, not editors.
- Light and dark neo-brutalist themes, local snapshots, search, tabs, and split view.
- Android APK with no network permission and an offline share inbox. If the release keystore secrets are not configured, the APK is signed with a throwaway key generated during the build and the release notes say so.
- Windows NSIS and MSI installers, macOS DMGs for Apple silicon and Intel, a Linux deb and AppImage, and an unsigned iOS IPA.
- Neo-brutalist neon-green logo used as the icon on every platform.
