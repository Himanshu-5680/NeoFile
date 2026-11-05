import { extractSlideText, resolveZipPath, slideNumber } from "@neofile/core";
import { useEffect, useRef, useState } from "react";
import { toArrayBuffer } from "@/lib/bytes";
import { registry } from "@/state/registry";

interface Slide {
  index: number;
  texts: string[];
  images: string[];
}

export function PptxViewer({ docId, onText }: { docId: string; onText: (text: string) => void }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [error, setError] = useState<string | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    const urls: string[] = [];
    let cancel = false;
    (async () => {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(toArrayBuffer(registry.getBytes(docId)));
      const names = Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
        .sort((a, b) => slideNumber(a) - slideNumber(b));
      const next: Slide[] = [];
      for (const name of names) {
        const xml = await zip.file(name)?.async("string");
        const texts = xml ? extractSlideText(xml) : [];
        const images: string[] = [];
        const rels = await zip.file(name.replace("slides/", "slides/_rels/") + ".rels")?.async("string");
        if (rels) {
          for (const match of rels.matchAll(/Target="([^"]+)"/g)) {
            const target = resolveZipPath(name, match[1]);
            if (!/\/media\//.test(`/${target}`)) continue;
            const file = zip.file(target);
            if (!file) continue;
            const blob = await file.async("blob");
            const url = URL.createObjectURL(blob);
            urls.push(url);
            images.push(url);
          }
        }
        next.push({ index: slideNumber(name), texts, images });
      }
      if (cancel) return;
      setSlides(next);
      onTextRef.current(next.map((slide) => `Slide ${slide.index}\n${slide.texts.join("\n")}`).join("\n\n"));
    })().catch((reason: unknown) => {
      if (!cancel) setError(reason instanceof Error ? reason.message : "Could not read this deck");
    });
    return () => {
      cancel = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [docId]);

  if (error) return <div className="pane-message">{error}</div>;
  if (!slides.length) return <div className="pane-message">Reading slides…</div>;
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
