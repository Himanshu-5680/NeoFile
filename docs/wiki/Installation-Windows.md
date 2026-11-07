# Install on Windows

The recommended file is `NeoFile_<version>_x64.msi`, for example `NeoFile_1.0.1_x64.msi`. It is a 64-bit MSI. The release also has `NeoFile_<version>_x64-setup.exe`, which is the same unsigned app.

No Visual Studio, Rust, or Node install is required.

## SmartScreen

The installer is not Authenticode-signed. Windows can show **Windows protected your PC**. NeoFile cannot remove that warning, and these steps do not ask you to turn SmartScreen off.

If your organization blocks unsigned apps with AppLocker or WDAC, a local admin has to allow the file. NeoFile cannot bypass that policy.

## After install

Closing the window hides NeoFile in the system tray. Quit from the tray menu. The tray is created when the shell can show an icon. If the tray is unavailable, closing the window quits the app.

## Remove

Uninstall from **Settings → Apps**. The MSI and the NSIS setup both register there.
