import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("release version alignment", () => {
  const pkg = JSON.parse(read("../package.json")) as { version: string };
  const gradle = read("../android/app/build.gradle");
  const tauri = JSON.parse(read("../../desktop/src-tauri/tauri.conf.json")) as { version: string };
  const project = read("../ios/App/App.xcodeproj/project.pbxproj");

  it("keeps the iOS marketing version on the same release as Android, desktop, and the web package", () => {
    expect(pkg.version).toBe("1.0.1");
    expect(gradle).toContain(`versionName "${pkg.version}"`);
    expect(tauri.version).toBe(pkg.version);
    const marketing = [...project.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]);
    expect(marketing.length).toBeGreaterThan(0);
    expect(new Set(marketing)).toEqual(new Set([pkg.version]));
  });
});
