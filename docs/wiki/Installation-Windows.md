# Install on Windows

The release has two installers:

| File | What it is |
| --- | --- |
| `NeoFile_<version>_x64-setup.exe` | NSIS setup |
| `NeoFile_<version>_x64.msi` | MSI package |

Both are 64-bit. The app is not Authenticode-signed.

## SmartScreen

Windows may show **Windows protected your PC**. That is SmartScreen reacting to an unsigned installer.

1. Choose **More info**.
2. Choose **Run anyway**.
3. Finish the setup wizard, or continue the MSI.

If your organization blocks unsigned apps with AppLocker or WDAC, a local admin has to allow the file. NeoFile cannot bypass that policy.

## After install

Closing the window hides NeoFile in the system tray. Quit from the tray menu. The tray is created when the shell can show an icon. If the tray is unavailable, closing the window quits the app.

## Remove

Uninstall from **Settings → Apps**, or run the uninstaller that the NSIS setup adds. The MSI uninstalls from the same Apps list.
