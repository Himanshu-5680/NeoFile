const ALLOWED = new Set([
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "a",
  "code",
  "pre",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
  "img",
  "sup",
  "sub",
  "div",
]);

/** Allow-list HTML cleaner for Office preview output. Drops scripts, handlers, and remote images. */
export function sanitizeHtml(input: string): string {
  let html = input.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form)\b[^>]*\/?\s*>/gi, "");
  html = html.replace(/<\/?\s*([a-zA-Z0-9]+)([^>]*)>/g, (full, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED.has(tag)) return "";
    if (full.startsWith("</")) return `</${tag}>`;
    const attrs = sanitizeAttrs(tag, rawAttrs);
    const self = tag === "br" || tag === "img";
    return self ? `<${tag}${attrs}>` : `<${tag}${attrs}>`;
  });
  return html;
}

function sanitizeAttrs(tag: string, raw: string): string {
  const attrs: string[] = [];
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw))) {
    const key = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    if (key.startsWith("on") || key === "style" || key === "srcset") continue;
    if (tag === "a" && key === "href" && /^(https?:|mailto:|#)/i.test(value.trim())) {
      attrs.push(`href="${escapeAttr(value.trim())}" rel="noreferrer"`);
    } else if (tag === "img" && key === "src" && isSafeImage(value.trim())) {
      attrs.push(`src="${escapeAttr(value.trim())}"`);
    } else if (tag === "img" && key === "alt") {
      attrs.push(`alt="${escapeAttr(value)}"`);
    }
  }
  return attrs.length ? ` ${attrs.join(" ")}` : "";
}

function isSafeImage(value: string): boolean {
  return /^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(value);
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
