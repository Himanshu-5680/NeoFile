import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../../node_modules/pdfjs-dist/", import.meta.url);

describe("pdf.js pin", () => {
  it("uses 6.2.108 and keeps scripting opt-in", () => {
    const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8")) as { version: string };
    expect(pkg.version).toBe("6.2.108");
    const source = readFileSync(new URL("build/pdf.mjs", root), "utf8");
    expect(source).toContain("enableScripting: params.enableScripting === true");
    expect(existsSync(new URL("build/pdf.worker.min.mjs", root))).toBe(true);
  });
});