#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
if [[ ! -d "$ANDROID_HOME/platforms" ]]; then
  echo "Android SDK not found at $ANDROID_HOME" >&2
  exit 1
fi
: "${ANDROID_KEYSTORE_PASSWORD:?Set ANDROID_KEYSTORE_PASSWORD}"
: "${ANDROID_KEY_PASSWORD:?Set ANDROID_KEY_PASSWORD}"
export ANDROID_KEY_ALIAS="${ANDROID_KEY_ALIAS:-neofile}"
export ANDROID_KEYSTORE_PATH="${ANDROID_KEYSTORE_PATH:-$ROOT/apps/web/signing/neofile-release.keystore}"
if [[ ! -f "$ANDROID_KEYSTORE_PATH" ]]; then
  echo "Release keystore not found at $ANDROID_KEYSTORE_PATH" >&2
  echo "In GitHub Actions, decode the ANDROID_KEYSTORE_BASE64 secret into that path." >&2
  exit 1
fi
cd "$ROOT"
npm run build --workspace @neofile/web
npm run cap:sync --workspace @neofile/web
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > "$ROOT/apps/web/android/local.properties"
cd "$ROOT/apps/web/android"
chmod +x ./gradlew
./gradlew assembleRelease --no-daemon
APK="$ROOT/apps/web/android/app/build/outputs/apk/release/app-release.apk"
mkdir -p "$ROOT/artifacts"
cp "$APK" "$ROOT/artifacts/NeoFile-release.apk"
echo "APK: $ROOT/artifacts/NeoFile-release.apk"
"$ANDROID_HOME/build-tools/35.0.0/aapt" dump permissions "$ROOT/artifacts/NeoFile-release.apk" || true
