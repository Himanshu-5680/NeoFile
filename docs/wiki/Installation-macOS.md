# Install on macOS

Pick the disk image that matches the Mac:

| Mac | File |
| --- | --- |
| Apple silicon (M1 or later) | `NeoFile_<version>_aarch64.dmg` |
| Intel | `NeoFile_<version>_x64.dmg` |

For 1.0.1 those names are `NeoFile_1.0.1_aarch64.dmg` and `NeoFile_1.0.1_x64.dmg`.

The app is not notarized and is not signed with an Apple Developer ID. Open the disk image and drag NeoFile to Applications.

## Gatekeeper

Gatekeeper can block the app. These instructions do not include a command to remove that block, and they do not ask you to turn Gatekeeper off. The [web desk](Installation-Web) is the copy that does not go through Gatekeeper.

An Apple silicon Mac can run the x64 image under Rosetta, but the arm64 image is the one to install. An Intel Mac cannot run the arm64 image.

## Remove

Drag NeoFile out of Applications into the Trash. Local snapshots live in the app's web storage and are removed with the app data, not by deleting a document you opened.
