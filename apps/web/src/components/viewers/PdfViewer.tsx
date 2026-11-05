import { useEffect, useRef, useState } from "react";
import { toArrayBuffer } from "@/lib/bytes";
import { registry } from "@/state/registry";
import { Input } from "@/components/ui/input";

interface PdfPage {
  page: number;
  width: number;
  height: number;
}

export function PdfViewer({ docId, onText }: { docId: string; onText: (text: string) => void }) {
  const bytes = registry.getBytes(docId);
  const host = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Opening PDF");
  const [match, setMatch] = useState(0);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    let cancel = false;
    const rendered = new Set<number>();
    const pageText: string[] = [];
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      const doc = await pdfjs.getDocument({ data: toArrayBuffer(bytes) }).promise;
      if (cancel) return;
      const next: PdfPage[] = [];
      for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
        const page = await doc.getPage(pageNo);
        const viewport = page.getViewport({ scale: 1.2 });
        next.push({ page: pageNo, width: viewport.width, height: viewport.height });
      }
      if (cancel) return;
      setPages(next);
      setStatus(`${doc.numPages} page${doc.numPages === 1 ? "" : "s"} · view only`);

      const root = host.current;
      if (!root) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const pageNo = Number((entry.target as HTMLElement).dataset.page);
            if (rendered.has(pageNo)) continue;
            rendered.add(pageNo);
            void renderPage(doc, pageNo, entry.target as HTMLElement, pageText, () => {
              if (!cancel) onTextRef.current(pageText.filter(Boolean).join("\n\n"));
            });
          }
        },
        { root, rootMargin: "400px" },
      );
      root.querySelectorAll<HTMLElement>("[data-page]").forEach((node) => observer.observe(node));
    })().catch((reason: unknown) => {
      if (!cancel) setError(reason instanceof Error ? reason.message : "Could not open this PDF");
    });
    return () => {
      cancel = true;
    };
  }, [docId, bytes]);

  useEffect(() => {
    host.current?.querySelectorAll<HTMLElement>("[data-page]").forEach((page) => {
      page.dataset.query = query;
      paintHits(page);
    });
  }, [query, pages]);

  function jump(delta: number) {
    const hits = [...host.current?.querySelectorAll<HTMLElement>(".pdf-hit") ?? []];
    if (!hits.length) return;
    const next = (match + delta + hits.length) % hits.length;
    setMatch(next);
    hits[next]?.scrollIntoView({ block: "center" });
  }

  return (
    <div className="editor-fill" style={{ display: "flex", flexDirection: "column" }}>
      <div className="pane-bar">
        <Input value={query} placeholder="Search this PDF" onChange={(event) => setQuery(event.target.value)} aria-label="Search this PDF" />
        <button className="brut" style={{ padding: "6px 8px" }} onClick={() => jump(-1)} type="button">Prev</button>
        <button className="brut" style={{ padding: "6px 8px" }} onClick={() => jump(1)} type="button">Next</button>
        <span className="tiny">{status}</span>
      </div>
      {error ? <div className="pane-message">{error}</div> : null}
      <div ref={host} className="pdf-scroll">
        {pages.map((page) => (
          <div key={page.page} className="pdf-page" data-page={page.page} data-query={query} style={{ width: page.width, height: page.height }} />
        ))}
      </div>
    </div>
  );
}

async function renderPage(
  doc: import("pdfjs-dist").PDFDocumentProxy,
  pageNo: number,
  shell: HTMLElement,
  pageText: string[],
  onText: () => void,
) {
  const pdfjs = await import("pdfjs-dist");
  const page = await doc.getPage(pageNo);
  const viewport = page.getViewport({ scale: 1.2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  const textLayer = document.createElement("div");
  textLayer.className = "pdf-text";
  const content = await page.getTextContent();
  const chunks: string[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str) continue;
    chunks.push(item.str);
    const transform = pdfjs.Util.transform(viewport.transform, item.transform);
    const fontSize = Math.hypot(transform[2], transform[3]) || 12;
    const span = document.createElement("span");
    span.textContent = item.str;
    span.style.left = `${transform[4]}px`;
    span.style.top = `${transform[5] - fontSize}px`;
    span.style.fontSize = `${fontSize}px`;
    span.style.fontFamily = "sans-serif";
    textLayer.appendChild(span);
  }
  pageText[pageNo - 1] = chunks.join(" ");
  shell.replaceChildren(canvas, textLayer);
  paintHits(shell);
  onText();
}

function paintHits(shell: HTMLElement) {
  const query = (shell.dataset.query || "").trim().toLowerCase();
  shell.querySelectorAll("span").forEach((span) => {
    const hit = query.length > 0 && (span.textContent || "").toLowerCase().includes(query);
    span.classList.toggle("pdf-hit", hit);
  });
}
