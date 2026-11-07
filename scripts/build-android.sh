#!/usr/bin/env bash
# Build an APK.
# NEOFILE_ANDROID_SIGNING=required is the public release path. It signs only
# with a keystore the caller already supplied, and it exits if that keystore
# is missing. It does not generate a key.
# Any other call is a local debug build. A missing password creates a
# temporary key, writes NeoFile-debug.apk, and deletes the key. That file
# must not be published.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "${NEOFILE_ANDROID_SIGNING:-}" == "required" && -z "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  echo "Refusing to build a public Android release." >&2
  echo "ANDROID_KEYSTORE_PASSWORD is not set." >&2
  echo "Set the GitHub Actions secrets ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_PASSWORD, and ANDROID_KEY_ALIAS." >&2
  echo "This build will not generate a signing key." >&2
  exit 1
fi

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

OUT_NAME="NeoFile-release.apk"
if [[ "${NEOFILE_ANDROID_SIGNING:-}" == "required" || -n "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  if [[ ! -f "$ANDROID_KEYSTORE_PATH" ]]; then
    echo "Release keystore not found at $ANDROID_KEYSTORE_PATH" >&2
    echo "Decode ANDROID_KEYSTORE_BASE64 into that path. This build will not generate a signing key." >&2
    exit 1
  fi
  export ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-$ANDROID_KEYSTORE_PASSWORD}"
else
  SIGNING_MODE="debug-throwaway"
  OUT_NAME="NeoFile-debug.apk"
  echo "ANDROID_KEYSTORE_PASSWORD is not set."
  echo "Building a local debug APK with a temporary key. Do not publish this file."
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  export ANDROID_KEYSTORE_PATH="$tmp/neofile-debug.keystore"
  # Random password for this process only. It is not printed and not stored.
  pass="$(openssl rand -base64 24 | tr -d '\n')"
  export ANDROID_KEYSTORE_PASSWORD="$pass"
  export ANDROID_KEY_PASSWORD="$pass"
  keytool -genkeypair -keystore "$ANDROID_KEYSTORE_PATH" -storetype PKCS12 \
    -alias "$ANDROID_KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$ANDROID_KEYSTORE_PASSWORD" -keypass "$ANDROID_KEY_PASSWORD" \
    -dname "CN=NeoFile debug, OU=NeoFile, O=NeoFile, L=None, ST=None, C=US" >/dev/null
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
cp "$APK" "$ROOT/artifacts/$OUT_NAME"
echo "APK: $ROOT/artifacts/$OUT_NAME"
echo "Signing: $SIGNING_MODE"
if [[ -x "$ANDROID_HOME/build-tools/35.0.0/aapt" ]]; then
  "$ANDROID_HOME/build-tools/35.0.0/aapt" dump permissions "$ROOT/artifacts/$OUT_NAME" || true
fi
