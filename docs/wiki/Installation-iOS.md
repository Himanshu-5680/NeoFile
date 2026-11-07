# Native iOS package

The release also contains `NeoFile-<version>-unsigned.ipa`, for example `NeoFile-1.0.1-unsigned.ipa`. The published 1.0.1 file is a device build (`iphoneos`). Its bundle version is 1.0, build 1. The source tree now says 1.0.1, but that published file was not rebuilt.

That file is not a normal install. iOS will not install it from the Files app. It is built with code signing turned off and it contains no provisioning profile. There is no free path in this project that installs this native package on every iPhone.

The free phone install is the [web desk](Installation-Web). In Safari, open the project site, choose Share, then Add to Home Screen. That icon is the browser app, not this IPA.

## What the native package would be

The iOS project is the Capacitor shell around the same UI. File pickers in that shell use the system document picker. There is no App Store build in this repository.
