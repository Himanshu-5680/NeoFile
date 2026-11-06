#!/usr/bin/env bash
# Build a release APK. Signs with the configured keystore when the password is
# set, otherwise generates a throwaway key in a temp directory so the APK can
# still be installed. The throwaway key is never committed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
if [[ ! -d "$ANDROID_HOME/platforms" ]]; then
  echo "Android SDK not found at $ANDROID_HOME" >&2
  exit 1
fi

if [[ -z "${ANDROID_KEY_ALIAS:-}" ]]; then
  export ANDROID_KEY_ALIAS="neofile"
fi
export ANDROID_KEYSTORE_PATH="${ANDROID_KEYSTORE_PATH:-$ROOT/apps/web/signing/neofile-release.keystore}"
SIGNING_MODE="configured"

if [[ -z "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  SIGNING_MODE="throwaway"
  echo "ANDROID_KEYSTORE_PASSWORD is not set."
  echo "Generating a throwaway signing key for this build."
  echo "The APK will install. The key is discarded with the temp directory and is not a Play Store identity."
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  export ANDROID_KEYSTORE_PATH="$tmp/neofile-throwaway.keystore"
  # Random password for this process only. It is not printed and not stored.
  pass="$(openssl rand -base64 24 | tr -d '\n')"
  export ANDROID_KEYSTORE_PASSWORD="$pass"
  export ANDROID_KEY_PASSWORD="$pass"
  keytool -genkeypair -keystore "$ANDROID_KEYSTORE_PATH" -storetype PKCS12 \
    -alias "$ANDROID_KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$ANDROID_KEYSTORE_PASSWORD" -keypass "$ANDROID_KEY_PASSWORD" \
    -dname "CN=NeoFile CI, OU=NeoFile, O=NeoFile, L=None, ST=None, C=US"
else
  if [[ ! -f "$ANDROID_KEYSTORE_PATH" ]]; then
    echo "Release keystore not found at $ANDROID_KEYSTORE_PATH" >&2
    echo "In GitHub Actions, decode the ANDROID_KEYSTORE_BASE64 secret into that path." >&2
    exit 1
  fi
  export ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-$ANDROID_KEYSTORE_PASSWORD}"
fi

mkdir -p "$ROOT/artifacts"
printf '%s\n' "$SIGNING_MODE" > "$ROOT/artifacts/android-signing-mode.txt"

cd "$ROOT"
npm run build --workspace @neofile/web
npm run cap:sync --workspace @neofile/web
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > "$ROOT/apps/web/android/local.properties"
cd "$ROOT/apps/web/android"
chmod +x ./gradlew
./gradlew assembleRelease --no-daemon
APK="$ROOT/apps/web/android/app/build/outputs/apk/release/app-release.apk"
cp "$APK" "$ROOT/artifacts/NeoFile-release.apk"
echo "APK: $ROOT/artifacts/NeoFile-release.apk"
echo "Signing: $SIGNING_MODE"
if [[ -x "$ANDROID_HOME/build-tools/35.0.0/aapt" ]]; then
  "$ANDROID_HOME/build-tools/35.0.0/aapt" dump permissions "$ROOT/artifacts/NeoFile-release.apk" || true
fi
