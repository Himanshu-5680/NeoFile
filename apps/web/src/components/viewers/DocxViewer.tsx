import { renderMarkdown, sanitizeHtml } from "@neofile/core";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { toArrayBuffer } from "@/lib/bytes";
import { registry } from "@/state/registry";

export function DocxViewer({
  docId,
  onText,
  onExportHtml,
}: {
  docId: string;
  onText: (text: string) => void;
  onExportHtml: (html: string) => void;
}) {
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"preview" | "text">("preview");
  const [error, setError] = useState<string | null>(null);
  const onTextRef = useRef(onText);
  const onExportRef = useRef(onExportHtml);
  onTextRef.current = onText;
  onExportRef.current = onExportHtml;

  useEffect(() => {
    let cancel = false;
    (async () => {
      const mammoth = await import("mammoth");
      const buffer = toArrayBuffer(registry.getBytes(docId));
      const [preview, raw] = await Promise.all([
        mammoth.convertToHtml({ arrayBuffer: buffer }),
        mammoth.extractRawText({ arrayBuffer: buffer }),
      ]);
      if (cancel) return;
      const clean = sanitizeHtml(preview.value);
      setHtml(clean);
      setText(raw.value);
      onTextRef.current(raw.value);
    })().catch((reason: unknown) => {
      if (!cancel) setError(reason instanceof Error ? reason.message : "Could not preview this document");
    });
    return () => {
      cancel = true;
    };
  }, [docId]);

  return (
    <div className="editor-fill" style={{ display: "flex", flexDirection: "column" }}>
      <div className="pane-bar">
        <div className="seg">
          <button className="brut" type="button" onClick={() => setMode("preview")} style={{ padding: "4px 8px" }}>Preview</button>
          <button className="brut" type="button" onClick={() => setMode("text")} style={{ padding: "4px 8px" }}>Text</button>
        </div>
        <div className="seg">
          <button className="brut" type="button" style={{ padding: "4px 8px" }} onClick={() => void navigator.clipboard.writeText(text)}>Copy text</button>
          <button className="brut" type="button" style={{ padding: "4px 8px" }} onClick={() => onExportRef.current(html)}>Export HTML</button>
        </div>
      </div>
      {error ? <div className="pane-message">{error}</div> : null}
      <div className="preview-scroll">
        {mode === "preview" ? (
          <article className="docx-html" dangerouslySetInnerHTML={{ __html: html || "<p>Reading the document…</p>" }} onClick={blockLinks} />
        ) : (
          <article className="docx-html"><pre>{text || "No text extracted."}</pre></article>
        )}
      </div>
    </div>
  );
}

function blockLinks(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest("a");
  if (!link) return;
  event.preventDefault();
  const href = link.getAttribute("href");
  if (href) void navigator.clipboard.writeText(href);
}

export function MarkdownPreview({ source }: { source: string }) {
  return (
    <article
      className="md-preview"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
      onClick={blockLinks}
    />
  );
}
