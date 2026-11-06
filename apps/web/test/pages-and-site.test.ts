import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("pages workflow", () => {
  const yaml = readFileSync(new URL("../../../.github/workflows/pages.yml", import.meta.url), "utf8");

  it("does not ask the default token to create the Pages site", () => {
    expect(yaml).not.toMatch(/^\s*enablement:\s*true\s*$/m);
    expect(yaml).toContain("Resource not accessible by integration");
    expect(yaml).toContain("administration:write");
    expect(yaml).toContain("https://api.github.com/repos/${GITHUB_REPOSITORY}/pages");
  });
});

describe("production CSP meta policy", () => {
  const source = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

  it("does not set frame-ancestors, which a meta policy cannot enforce", () => {
    expect(source).not.toMatch(/["']frame-ancestors/);
    expect(source).toContain("script-src 'self'");
  });
});

describe("website theme control", () => {
  const html = readFileSync(new URL("../../../website/index.html", import.meta.url), "utf8");

  it("sets aria-pressed from the current theme before a click", () => {
    expect(html).toContain('function sync(){button.setAttribute("aria-pressed"');
    expect(html).toMatch(/sync\(\);button\.addEventListener/);
  });

  it("keeps site assets relative so a project-site base path can resolve them", () => {
    expect(html).not.toMatch(/(?:src|href)="\/(?:fonts|media|favicon)/);
    expect(html).toContain('href="fonts/space-grotesk-latin-700-normal.woff2"');
    expect(html).toContain('src="media/logo.svg"');
  });
});
