export function decodeXmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => safeCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => safeCodePoint(Number.parseInt(num, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function safeCodePoint(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return "";
  try {
    return String.fromCodePoint(value);
  } catch {
    return "";
  }
}

/** Pull visible text runs from a PowerPoint slide XML document. Layout is ignored. */
export function extractSlideText(xml: string): string[] {
  const out: string[] = [];
  const pattern = /<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml))) {
    const text = decodeXmlEntities(match[1]).replace(/\s+/g, " ").trim();
    if (text) out.push(text);
  }
  return out;
}

export function slideNumber(path: string): number {
  const match = path.match(/slide(\d+)\.xml$/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function resolveZipPath(baseFile: string, target: string): string {
  const stack = baseFile.split("/").filter(Boolean).slice(0, -1);
  for (const part of target.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}
