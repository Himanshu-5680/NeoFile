# Install on Android

The recommended file is `NeoFile-<version>.apk`, for example `NeoFile-1.0.1.apk`.

## Install the APK

1. Download the APK on the phone, or copy it from a computer.
2. Open the file in the Files app or your browser's download list.
3. If Android says the install is blocked, allow your files or browser app to install unknown apps. The system asks once per source app.
4. Confirm the install. The icon is the neon-green NeoFile mark.

The APK does not request the `INTERNET` permission. The manifest removes it.

## Signing

When the repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, and `ANDROID_KEY_ALIAS` are set, the release workflow signs the APK with that keystore.

When they are not set, the workflow generates a throwaway key on the GitHub-hosted runner, signs the APK so it can be installed, and discards the key. The release notes say which of the two happened. A throwaway key is not a Play Store signing key. An update signed with a different key will not install over the app until you uninstall the previous copy.

Do not use the throwaway key for a store listing. There is no keystore in the git repository.

## Updates and removal

Uninstall from the Android app info screen. That removes the app. Snapshots stored inside the app go with it. Files you saved to Downloads or another folder you picked stay where you saved them.

## What the app can open

Share a file into NeoFile from another app, or pick a file or folder from the system picker. The share inbox is on device. See the [FAQ](FAQ) for which formats are editors and which are previews.
