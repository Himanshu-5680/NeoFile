# FAQ

## Does NeoFile edit Word and PowerPoint?

No. Word opens as HTML plus extracted text. PowerPoint shows slide text and embedded pictures, not positions, animation, charts, or SmartArt. Saving exports the original file.

## What does saving a spreadsheet change?

Cell values. SheetJS community edition does not recalculate formulas. Charts, pivot tables, macros, images, comments, and most formatting are dropped on save.

## Which files are real editors?

Text and code, including Markdown, and CSV or TSV, including quoted commas. Spreadsheet files (xlsx, xlsm, xls) are value editors. Everything else in the viewer list is a preview or playback.

## Can it open a cloud drive?

Only files that are already on this device. NeoFile does not sign in anywhere.

## Does the Android app use the network?

No. The manifest removes `INTERNET`. Fonts are bundled. Recent files and snapshots stay in on-device IndexedDB.

## Why does SmartScreen or Gatekeeper complain?

The Windows and macOS installers are not signed with a Microsoft or Apple certificate. The install pages have the click path: [Windows](Installation-Windows), [macOS](Installation-macOS).

## Why does the iPhone app stop opening?

A free Apple ID sideload expires after about 7 days. Refresh it in Sideloadly or AltStore. See [Install on iOS](Installation-iOS).

## Why will an Android update not install over the app I have?

If the release notes say the APK was signed with a throwaway CI key, the next build may use a different key. Android refuses that update. Uninstall the old app first. A configured release keystore avoids that, once a maintainer stores it in the GitHub Actions secrets.

## Where do snapshots go?

In IndexedDB on the device, under the app origin. Erase them from the Privacy panel. That does not delete the original files in your folders. Auto snapshots skip payloads over 2 MB.

## Why did a large sheet open as download-only?

Sheets larger than 20,000 rows or 100 columns open as a download-only file so the grid does not try to edit them.

## Is there an account or telemetry?

No account, no sync, and no analytics.

## Who maintains it?

Himanshu Pathak ([@Himanshu-5680](https://github.com/Himanshu-5680)), with contributions credited in the README. The code of conduct is the Contributor Covenant. Security reports go through the private advisory form, not a public issue.
