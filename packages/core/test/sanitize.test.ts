import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "../src/sanitize";

describe("sanitizeHtml", () => {
  it("drops script, style, and iframe blocks", () => {
    const html = sanitizeHtml(
      '<p>ok</p><script>alert(1)</script><style>body{}</style><iframe src="https://evil.test"></iframe>',
    );
    expect(html).toBe("<p>ok</p>");
    expect(html.toLowerCase()).not.toContain("script");
    expect(html.toLowerCase()).not.toContain("iframe");
  });

  it("strips event handlers and inline style", () => {
    expect(sanitizeHtml('<p onclick="alert(1)" style="color:red">hi</p>')).toBe("<p>hi</p>");
  });

  it("keeps safe links and adds noreferrer", () => {
    expect(sanitizeHtml('<a href="https://example.com/a">docs</a>')).toBe(
      '<a href="https://example.com/a" rel="noreferrer">docs</a>',
    );
    expect(sanitizeHtml('<a href="mailto:dev@example.com">mail</a>')).toContain('href="mailto:dev@example.com"');
    expect(sanitizeHtml('<a href="#privacy">privacy</a>')).toContain('href="#privacy"');
  });

  it("drops javascript and data links", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(sanitizeHtml('<a href="data:text/html,hi">x</a>')).toBe("<a>x</a>");
  });

  it("allows data images and drops remote images", () => {
    const pixel = "data:image/png;base64,aaaa";
    expect(sanitizeHtml(`<img src="${pixel}" alt="mark">`)).toBe(`<img src="${pixel}" alt="mark">`);
    expect(sanitizeHtml('<img src="https://evil.test/a.png" alt="x">')).toBe('<img alt="x">');
    expect(sanitizeHtml('<img src="data:image/svg+xml;base64,aaaa" alt="x">')).toBe('<img alt="x">');
  });

  it("removes tags outside the allow-list and HTML comments", () => {
    expect(sanitizeHtml('<!-- secret --><div>keep</div><form action="/"><input></form>')).toBe("<div>keep</div>");
    expect(sanitizeHtml("<custom>kept text</custom><p>yes</p>")).toBe("kept text<p>yes</p>");
  });

  it("escapes ampersands and angle brackets in allowed attributes", () => {
    expect(sanitizeHtml('<img alt="a&b<c" src="data:image/gif;base64,aaaa">')).toContain('alt="a&amp;b&lt;c"');
  });
});
