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

  it("uses a unique Pages artifact for each workflow rerun attempt", () => {
    expect(yaml).toContain("name: github-pages-${{ github.run_attempt }}");
    expect(yaml).toContain("artifact_name: github-pages-${{ github.run_attempt }}");
  });

  it("waits for the uploaded artifact to become visible before deploying", () => {
    expect(yaml).toContain("actions: read");
    expect(yaml).toContain("actions/runs/${GITHUB_RUN_ID}/artifacts?name=${ARTIFACT_NAME}");
    expect(yaml).toContain("Wait for the Pages artifact to be indexed");
  });
});

describe("production CSP meta policy", () => {
  const source = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

  it("does not set frame-ancestors, which a meta policy cannot enforce", () => {
    expect(source).not.toMatch(/["']frame-ancestors/);
    expect(source).toContain("script-src 'self'");
  });
});

describe("web desk build", () => {
  const source = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
  const pages = readFileSync(new URL("../../../.github/workflows/pages.yml", import.meta.url), "utf8");
  const readme = readFileSync(new URL("../../../README.md", import.meta.url), "utf8");

  it("publishes the browser app at the project-site root", () => {
    expect(source).toContain('process.env.VITE_NEOFILE_PWA === "1"');
    expect(source).toContain('const webDeskBase = "/NeoFile/";');
    expect(source).toContain('url.origin!==self.location.origin');
    expect(source).toContain("Not the native iOS or Android app");
    expect(pages).toContain('VITE_NEOFILE_PWA: "1"');
    expect(pages).toContain("path: apps/web/dist");
    expect(pages).not.toContain("website/desk");
    expect(pages).toContain("apps/web/**");
    expect(readme).toContain("https://himanshu-5680.github.io/NeoFile/");
    expect(readme).not.toContain("https://himanshu-5680.github.io/NeoFile/desk/");
  });

  it("loads the mark from the build base so the hosted desk does not ask the domain root", () => {
    const titleBar = readFileSync(new URL("../src/components/TitleBar.tsx", import.meta.url), "utf8");
    expect(titleBar).toContain("${import.meta.env.BASE_URL}logo.svg");
    expect(titleBar).not.toContain('src="/logo.svg"');
  });
});
