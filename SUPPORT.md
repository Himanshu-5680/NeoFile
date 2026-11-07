# Support

NeoFile is maintained as an open source project. There is no paid support plan
and no remote session that can see the files on your device. The app does not
upload them.

## Install and usage questions

Read the install notes in the [README](README.md) and the wiki pages under
[docs/wiki](docs/wiki/Home.md):

- [Web desk](docs/wiki/Installation-Web.md)
- [Android](docs/wiki/Installation-Android.md)
- [Windows](docs/wiki/Installation-Windows.md)
- [macOS](docs/wiki/Installation-macOS.md)
- [Linux](docs/wiki/Installation-Linux.md)
- [iOS package](docs/wiki/Installation-iOS.md)

Windows SmartScreen and macOS Gatekeeper warnings are expected on the unsigned
native packages. The docs do not include a command to turn those protections
off. The iPhone path that does not need a native package is the web desk.

For a question that the docs do not answer, open a GitHub issue and choose the
question form. If repository Discussions are enabled, prefer a discussion for
open-ended questions and an issue for a defect.

## Bugs

Use the bug report form. Include the platform, the NeoFile version from the
release tag, the file extension, and what you expected. Do not attach the
original document if it contains private data. A small synthetic file that
shows the same failure is enough.

## Feature requests

Use the feature request form. Changes that need an account, a server, or a
network call do not fit this project. Word and PowerPoint stay previews unless
a change truly writes those formats.

## Security

Suspected vulnerabilities go through [SECURITY.md](SECURITY.md), not a public
issue.

## Builds

[Building from source](docs/wiki/Building-from-source.md) lists the toolchain
for each platform. The release workflow builds the public installers when a
`v*` tag is pushed.
