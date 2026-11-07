# Install on Android

The recommended file is `NeoFile-<version>.apk`, for example `NeoFile-1.0.1.apk`.

## Install the APK

1. Download the APK on the phone, or copy it from a computer.
2. Open the file in the Files app or your browser's download list.
3. If Android says the install is blocked, allow your files or browser app to install unknown apps. The system asks once per source app.
4. Confirm the install. The icon is the neon-green NeoFile mark.

The APK does not request the `INTERNET` permission. The manifest removes it.

## Signing

A public release signs the APK only when the repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, and `ANDROID_KEY_ALIAS` are set. If they are missing, the release job stops. It does not generate a key and it does not upload an APK.

The published v1.0.0 and v1.0.1 files were signed with two different throwaway keys. Those keys were not stored. A keystore created now can sign a future release only. It cannot update either published install.

There is no keystore in the git repository. A local debug build without the password writes `NeoFile-debug.apk` and deletes its temporary key. That file is not a release.

## Already installed copies

Android will not install v1.0.1 over v1.0.0, or a later differently signed APK over either of them. Recents and snapshots live in the app's private IndexedDB database `neofile`. Saving or exporting a document writes that document to a folder you pick, and those files stay. The [web desk](Installation-Web) is a separate browser copy and does not contain the Android app's snapshots. Keep the installed app if you still need those snapshots. Removing the app also removes that private database. These notes do not ask you to remove the app.

## What the app can open

Share a file into NeoFile from another app, or pick a file or folder from the system picker. The share inbox is on device. See the [FAQ](FAQ) for which formats are editors and which are previews.
