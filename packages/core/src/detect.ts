export type FileKind =
  | "text"
  | "csv"
  | "xlsx"
  | "pdf"
  | "docx"
  | "pptx"
  | "image"
  | "audio"
  | "video"
  | "binary";

export type EditMode = "edit" | "values" | "view";

export type LanguageId =
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "python"
  | "html"
  | "css"
  | "json"
  | "xml"
  | "markdown"
  | "java"
  | "plain";

export interface FileProfile {
  kind: FileKind;
  mode: EditMode;
  highlighter: LanguageId | null;
  displayLanguage: string;
  label: string;
  /** Short, honest limit shown in the viewer. Null when the editor is full-fidelity for that type. */
  limit: string | null;
}

const TEXT_EXT: Record<string, { highlighter: LanguageId; display: string }> = {
  js: { highlighter: "javascript", display: "JavaScript" },
  mjs: { highlighter: "javascript", display: "JavaScript" },
  cjs: { highlighter: "javascript", display: "JavaScript" },
  jsx: { highlighter: "jsx", display: "JSX" },
  ts: { highlighter: "typescript", display: "TypeScript" },
  mts: { highlighter: "typescript", display: "TypeScript" },
  cts: { highlighter: "typescript", display: "TypeScript" },
  tsx: { highlighter: "tsx", display: "TSX" },
  py: { highlighter: "python", display: "Python" },
  html: { highlighter: "html", display: "HTML" },
  htm: { highlighter: "html", display: "HTML" },
  css: { highlighter: "css", display: "CSS" },
  scss: { highlighter: "css", display: "SCSS" },
  json: { highlighter: "json", display: "JSON" },
  jsonc: { highlighter: "json", display: "JSON" },
  xml: { highlighter: "xml", display: "XML" },
  svg: { highlighter: "xml", display: "SVG" },
  md: { highlighter: "markdown", display: "Markdown" },
  markdown: { highlighter: "markdown", display: "Markdown" },
  java: { highlighter: "java", display: "Java" },
  txt: { highlighter: "plain", display: "Plain text" },
  log: { highlighter: "plain", display: "Log" },
  csv: { highlighter: "plain", display: "CSV" },
  tsv: { highlighter: "plain", display: "TSV" },
  yaml: { highlighter: "plain", display: "YAML" },
  yml: { highlighter: "plain", display: "YAML" },
  toml: { highlighter: "plain", display: "TOML" },
  ini: { highlighter: "plain", display: "INI" },
  sql: { highlighter: "plain", display: "SQL" },
  sh: { highlighter: "plain", display: "Shell" },
  bash: { highlighter: "plain", display: "Shell" },
  zsh: { highlighter: "plain", display: "Shell" },
  rs: { highlighter: "plain", display: "Rust" },
  go: { highlighter: "plain", display: "Go" },
  c: { highlighter: "plain", display: "C" },
  h: { highlighter: "plain", display: "C header" },
  cpp: { highlighter: "plain", display: "C++" },
  hpp: { highlighter: "plain", display: "C++ header" },
  cs: { highlighter: "plain", display: "C#" },
  rb: { highlighter: "plain", display: "Ruby" },
  php: { highlighter: "plain", display: "PHP" },
  vue: { highlighter: "plain", display: "Vue" },
  svelte: { highlighter: "plain", display: "Svelte" },
  env: { highlighter: "plain", display: "Env" },
  gitignore: { highlighter: "plain", display: "Ignore file" },
  editorconfig: { highlighter: "plain", display: "EditorConfig" },
};

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "avif", "svg"]);
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "flac", "aac", "opus"]);
const VIDEO_EXT = new Set(["mp4", "webm", "ogv", "mov", "m4v"]);

export function extensionOf(name: string): string {
  const base = name.trim().toLowerCase().replace(/\\/g, "/").split("/").pop() ?? "";
  if (base.startsWith(".") && !base.slice(1).includes(".")) return base.slice(1);
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1);
}

export function detectFile(name: string, mime = ""): FileProfile {
  const ext = extensionOf(name);
  const type = mime.toLowerCase();

  if (ext === "csv" || ext === "tsv") {
    return {
      kind: "csv",
      mode: "edit",
      highlighter: null,
      displayLanguage: ext === "tsv" ? "TSV" : "CSV",
      label: ext === "tsv" ? "TSV spreadsheet" : "CSV spreadsheet",
      limit: null,
    };
  }

  if (ext === "xlsx" || ext === "xlsm" || ext === "xls") {
    return {
      kind: "xlsx",
      mode: "values",
      highlighter: null,
      displayLanguage: ext.toUpperCase(),
      label: "Excel workbook",
      limit:
        "Cell values only. SheetJS community edition does not recalculate formulas and drops charts, pivots, macros, images, comments, and most formatting when you save.",
    };
  }

  if (ext === "pdf" || type === "application/pdf") {
    return {
      kind: "pdf",
      mode: "view",
      highlighter: null,
      displayLanguage: "PDF",
      label: "PDF",
      limit: "View, select, and search text. Page markup and form filling are not edited. Save exports the original file.",
    };
  }

  if (ext === "docx" || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return {
      kind: "docx",
      mode: "view",
      highlighter: null,
      displayLanguage: "Word",
      label: "Word document",
      limit:
        "HTML preview and extracted text. This is not a Word editor. Save original exports the .docx unchanged. Export HTML writes the preview only.",
    };
  }

  if (ext === "pptx" || ext === "pptm") {
    return {
      kind: "pptx",
      mode: "view",
      highlighter: null,
      displayLanguage: "PowerPoint",
      label: "PowerPoint deck",
      limit:
        "Slide text and embedded pictures only. Positions, animations, charts, and SmartArt are not rendered. Save exports the original file.",
    };
  }

  if (IMAGE_EXT.has(ext) || type.startsWith("image/")) {
    return {
      kind: "image",
      mode: "view",
      highlighter: ext === "svg" ? "xml" : null,
      displayLanguage: ext === "svg" ? "SVG" : "Image",
      label: "Image",
      limit: "View and save only. NeoFile does not edit images.",
    };
  }

  if (AUDIO_EXT.has(ext) || type.startsWith("audio/")) {
    return {
      kind: "audio",
      mode: "view",
      highlighter: null,
      displayLanguage: "Audio",
      label: "Audio",
      limit: "Playback and save only. NeoFile does not edit audio.",
    };
  }

  if (VIDEO_EXT.has(ext) || type.startsWith("video/")) {
    return {
      kind: "video",
      mode: "view",
      highlighter: null,
      displayLanguage: "Video",
      label: "Video",
      limit: "Playback and save only. NeoFile does not edit video.",
    };
  }

  const textMeta = TEXT_EXT[ext];
  if (textMeta) {
    return {
      kind: "text",
      mode: "edit",
      highlighter: textMeta.highlighter,
      displayLanguage: textMeta.display,
      label: textMeta.display,
      limit: textMeta.highlighter === "plain" && !["txt", "log"].includes(ext)
        ? "Editable as text. Syntax colors are not available for this language."
        : null,
    };
  }

  if (type.startsWith("text/") || type === "application/json" || type === "application/xml") {
    return {
      kind: "text",
      mode: "edit",
      highlighter: type.includes("json") ? "json" : type.includes("xml") ? "xml" : "plain",
      displayLanguage: "Text",
      label: "Text",
      limit: null,
    };
  }

  return {
    kind: "binary",
    mode: "view",
    highlighter: null,
    displayLanguage: "Binary",
    label: "Binary",
    limit: "Hex preview of the start of the file. Save exports the original bytes.",
  };
}
