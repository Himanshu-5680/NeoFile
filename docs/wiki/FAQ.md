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

The Windows and macOS installers are not signed with a Microsoft or Apple certificate. NeoFile cannot clear those warnings. The install pages do not include a command to turn the protection off: [Windows](Installation-Windows), [macOS](Installation-macOS). The [web desk](Installation-Web) does not go through those checks.

## Can I install NeoFile on an iPhone?

The native package is an unsigned IPA. iOS will not install it from Files, and there is no free universal install of that native app. The free path is the [web desk](Installation-Web): Safari, Share, Add to Home Screen. That icon is the browser app.

## Why will an Android update not install over the app I have?

The published v1.0.0 and v1.0.1 APKs were signed with two different throwaway keys. Both keys were discarded on the build runner. Android refuses the update, and no new key can make it seamless. Recents and snapshots are in that install's private IndexedDB database `neofile`. They are not a file you can copy to another signature. Use Save or Export on a document you still need; that writes the document to a folder you pick. The [web desk](Installation-Web) is a separate browser copy and does not contain those snapshots. Keep the installed app if you still need them.

## Where do snapshots go?

In IndexedDB on the device, under the app origin. Erase them from the Privacy panel. That does not delete the original files in your folders. Auto snapshots skip payloads over 2 MB.

## Why did a large sheet open as download-only?

Sheets larger than 20,000 rows or 100 columns open as a download-only file so the grid does not try to edit them.

## Is there an account or telemetry?

No account, no sync, and no analytics.

## Who maintains it?

Himanshu Pathak ([@Himanshu-5680](https://github.com/Himanshu-5680)) owns and maintains NeoFile. The GitHub logins pavitra-prabhakar and vectornomadhp88 are other accounts of the same person, not separate maintainers. The implementation was AI-assisted. The code of conduct is the Contributor Covenant. Security reports go through the private advisory form, not a public issue.
