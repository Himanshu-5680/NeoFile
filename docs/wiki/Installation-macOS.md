# Install on macOS

Pick the disk image that matches the Mac:

| Mac | File |
| --- | --- |
| Apple silicon (M1 or later) | `NeoFile_<version>_aarch64.dmg` |
| Intel | `NeoFile_<version>_x64.dmg` |

The app is not notarized and is not signed with an Apple Developer ID.

## Gatekeeper

1. Open the DMG and drag NeoFile to Applications.
2. Right-click NeoFile in Applications and choose **Open**.
3. Choose **Open** again in the dialog.

The first launch from the dock or Spotlight can fail until that right-click Open has been accepted once.

If Gatekeeper still refuses the app, clear the quarantine flag and try the right-click again:

```bash
xattr -cr /Applications/NeoFile.app
```

## Apple silicon and Intel

An Apple silicon Mac can run the x64 image under Rosetta, but the arm64 image is the one to install. An Intel Mac cannot run the arm64 image.

## Remove

Drag NeoFile out of Applications into the Trash. Local snapshots live in the app's web storage and are removed with the app data, not by deleting a document you opened.
