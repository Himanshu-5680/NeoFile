# Install on iOS

The release asset is `NeoFile-<version>-unsigned.ipa`. iOS will not install that file from the Files app. AltStore or Sideloadly re-signs it with your Apple ID. A free Apple ID works.

The IPA is built with code signing turned off. It contains the app bundle and no provisioning profile.

## Sideloadly

1. Install [Sideloadly](https://sideloadly.io/) on a computer.
2. Connect the iPhone and trust the computer.
3. Drop `NeoFile-<version>-unsigned.ipa` into Sideloadly and sign in with an Apple ID.
4. On the phone, open **Settings → General → VPN & Device Management** and trust the developer certificate.
5. Open NeoFile.

## AltStore

1. Install [AltServer](https://altstore.io/) on a computer and AltStore on the phone.
2. In AltStore, use **My Apps → +** and pick the IPA. Sign in with an Apple ID.
3. Trust the certificate under **VPN & Device Management**.

## The seven-day limit

A free Apple ID signature lasts about 7 days. When the app stops opening, refresh it from Sideloadly or AltStore. A paid Apple Developer account lasts longer. NeoFile does not include a refresh service of its own.

## What you get

The iOS shell is the same UI as Android, loaded by Capacitor. File pickers use the system document picker. There is no App Store build in this repository.
