import { extractSlideText, resolveZipPath, slideNumber } from "@neofile/core";
import { useEffect, useRef, useState } from "react";
import { toArrayBuffer } from "@/lib/bytes";
import { registry } from "@/state/registry";

interface Slide {
  index: number;
  texts: string[];
  images: string[];
}

export function pptxStatusMessage(phase: "loading" | "ready", slideCount: number): string | null {
  if (phase === "loading") return "Reading slides…";
  if (slideCount === 0) return "This deck has no slides.";
  return null;
}

export function PptxViewer({ docId, onText }: { docId: string; onText: (text: string) => void }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [error, setError] = useState<string | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    const urls: string[] = [];
    let cancel = false;
    setPhase("loading");
    setSlides([]);
    setError(null);
    const releaseUrls = () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.length = 0;
    };
    (async () => {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(toArrayBuffer(registry.getBytes(docId)));
      if (cancel) return;
      const names = Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
        .sort((a, b) => slideNumber(a) - slideNumber(b));
      const next: Slide[] = [];
      for (const name of names) {
        if (cancel) break;
        const xml = await zip.file(name)?.async("string");
        if (cancel) break;
        const texts = xml ? extractSlideText(xml) : [];
        const images: string[] = [];
        const rels = await zip.file(name.replace("slides/", "slides/_rels/") + ".rels")?.async("string");
        if (rels) {
          for (const match of rels.matchAll(/Target="([^"]+)"/g)) {
            if (cancel) break;
            const target = resolveZipPath(name, match[1]);
            if (!/\/media\//.test(`/${target}`)) continue;
            const file = zip.file(target);
            if (!file) continue;
            const blob = await file.async("blob");
            if (cancel) continue;
            const url = URL.createObjectURL(blob);
            urls.push(url);
            images.push(url);
          }
        }
        next.push({ index: slideNumber(name), texts, images });
      }
      if (cancel) {
        releaseUrls();
        return;
      }
      setSlides(next);
      setPhase("ready");
      onTextRef.current(next.map((slide) => `Slide ${slide.index}\n${slide.texts.join("\n")}`).join("\n\n"));
    })().catch((reason: unknown) => {
      if (!cancel) setError(reason instanceof Error ? reason.message : "Could not read this deck");
    });
    return () => {
      cancel = true;
      releaseUrls();
    };
  }, [docId]);

  const status = pptxStatusMessage(phase, slides.length);
  if (error) return <div className="pane-message">{error}</div>;
  if (status) return <div className="pane-message">{status}</div>;
  return (
    <div className="preview-scroll">
      <div className="pptx-list">
        {slides.map((slide) => (
          <article key={slide.index} className="pptx-slide">
            <b>Slide {slide.index}</b>
            {slide.texts.length ? slide.texts.map((text, index) => <p key={index}>{text}</p>) : <p className="muted">No text on this slide.</p>}
            {slide.images.map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}
