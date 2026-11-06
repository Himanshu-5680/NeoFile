# Install on Linux

The release has two packages:

| File | What it is |
| --- | --- |
| `NeoFile_<version>_amd64.deb` | Debian package for Ubuntu and Debian |
| `NeoFile_<version>_amd64.AppImage` | One-file build |

Both are x86_64.

## Debian and Ubuntu

The `.deb` depends on WebKitGTK 4.1, which Ubuntu 24.04 provides.

```bash
sudo apt install ./NeoFile_<version>_amd64.deb
```

Replace `<version>` with the release, for example `1.0.0`.

## AppImage

```bash
chmod +x NeoFile_<version>_amd64.AppImage
./NeoFile_<version>_amd64.AppImage
```

Video playback inside the AppImage needs the system GStreamer plugins. On Debian and Ubuntu that package is `gstreamer1.0-plugins-good`.

## Tray

Closing the window hides NeoFile in the tray when the desktop can show a tray icon. Quit from the tray menu. On a session without a tray, closing the window quits the app.
