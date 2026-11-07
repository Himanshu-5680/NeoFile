import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("public Android signing", () => {
  const script = readFileSync(new URL("../../../scripts/build-android.sh", import.meta.url), "utf8");
  const release = readFileSync(new URL("../../../.github/workflows/release.yml", import.meta.url), "utf8");

  it("fails a public release when the keystore password is absent and does not generate a key", () => {
    const env = { ...process.env, NEOFILE_ANDROID_SIGNING: "required" };
    delete env.ANDROID_KEYSTORE_PASSWORD;
    delete env.ANDROID_KEYSTORE_BASE64;
    const result = spawnSync("bash", ["scripts/build-android.sh"], {
      cwd: new URL("../../..", import.meta.url),
      env,
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("will not generate a signing key");
    expect(result.stderr).not.toContain("PRIVATE KEY");
    expect(script).toContain('NEOFILE_ANDROID_SIGNING:-}" == "required"');
    expect(script).toContain("NeoFile-debug.apk");
  });

  it("refuses to upload a public APK unless the configured keystore was used", () => {
    expect(release).toContain("NEOFILE_ANDROID_SIGNING: required");
    expect(release).toContain("Refusing to upload an APK signed as");
    expect(release).toContain("Refusing to publish an APK whose signing mode is not configured.");
    expect(release).not.toContain("The APK will be signed with a throwaway key.");
  });
});
