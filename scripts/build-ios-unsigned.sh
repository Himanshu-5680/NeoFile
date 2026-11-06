#!/usr/bin/env bash
# Build an unsigned NeoFile iOS app and zip it as an IPA.
# Run this on macOS with Xcode. The IPA cannot be installed until Sideloadly or AltStore re-signs it.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build --workspace @neofile/web
(cd apps/web && npx cap sync ios)
DERIVED="$ROOT/apps/web/ios/DerivedData"
rm -rf "$DERIVED"
cd "$ROOT/apps/web/ios/App"
xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$DERIVED" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  build
APP="$(find "$DERIVED" -type d -name 'App.app' -path '*Release-iphoneos*' | head -1)"
if [[ -z "$APP" ]]; then
  echo "Xcode did not produce App.app" >&2
  exit 1
fi
STAGE="$(mktemp -d)"
mkdir -p "$STAGE/Payload"
cp -R "$APP" "$STAGE/Payload/App.app"
mkdir -p "$ROOT/artifacts"
OUT="$ROOT/artifacts/NeoFile-1.0.0-unsigned.ipa"
rm -f "$OUT"
(cd "$STAGE" && zip -qry "$OUT" Payload)
echo "Unsigned IPA: $OUT"
echo "Re-sign it with Sideloadly or AltStore and a free Apple ID before installing."
