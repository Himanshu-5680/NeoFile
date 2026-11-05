import { describe, expect, it } from "vitest";
import { extractSlideText, renderMarkdown, resolveZipPath, sanitizeHtml, slideNumber } from "../src/index";

describe("pptx text", () => {
  it("extracts text runs and decodes entities", () => {
    const xml = `<p:sld><a:t>Hello &amp; welcome</a:t><a:t> </a:t><a:t>Slide &#65;</a:t></p:sld>`;
    expect(extractSlideText(xml)).toEqual(["Hello & welcome", "Slide A"]);
    expect(slideNumber("ppt/slides/slide12.xml")).toBe(12);
  });

  it("resolves media paths from slide relationships", () => {
    expect(resolveZipPath("ppt/slides/slide1.xml", "../media/image1.png")).toBe("ppt/media/image1.png");
  });
});

describe("markdown and sanitize", () => {
  it("renders markdown without executing raw html", () => {
    const html = renderMarkdown("# Title\n\nHello **world**\n\n<script>alert(1)</script>\n\n- one");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<ul><li>one</li></ul>");
  });

  it("strips active content from office html", () => {
    const dirty = `<p onclick="alert(1)">Hi</p><script>bad()</script><img src="https://evil.test/a.png"><a href="javascript:alert(1)">x</a><a href="https://example.com">ok</a>`;
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("evil.test");
    expect(clean).not.toContain("javascript:");
    expect(clean).toContain("https://example.com");
    expect(clean).toContain("<p>Hi</p>");
  });
});
