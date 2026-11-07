import { useState } from "react";
import type { FileKind } from "@neofile/core";
import { decodeText } from "@/lib/bytes";
import { registry } from "@/state/registry";
import { CodeEditor } from "@/components/CodeEditor";

export function MediaViewer({
  docId,
  kind,
  name,
  mode,
  accent,
}: {
  docId: string;
  kind: FileKind;
  name: string;
  mode: "light" | "dark";
  accent: string;
}) {
  const url = registry.objectUrl(docId);
  const [source, setSource] = useState(false);
  const [broken, setBroken] = useState(false);
  return (
    <div className="editor-fill" style={{ display: "flex", flexDirection: "column" }}>
      {kind === "image" && name.toLowerCase().endsWith(".svg") ? (
        <div className="pane-bar">
          <button className="brut" type="button" style={{ padding: "4px 8px" }} onClick={() => setSource((value) => !value)}>
            {source ? "Show image" : "View markup"}
          </button>
          <span className="tiny">Read only</span>
        </div>
      ) : null}
      {source ? (
        <CodeEditor text={decodeText(registry.getBytes(docId))} highlighter="xml" readOnly mode={mode} accent={accent} onChange={() => undefined} />
      ) : (
        <div className="media-stage">
          {kind === "image" ? <img src={url} alt={name} onError={() => setBroken(true)} /> : null}
          {broken ? <p>This image could not be decoded.</p> : null}
          {kind === "audio" ? <audio src={url} controls /> : null}
          {kind === "video" ? <video src={url} controls playsInline /> : null}
        </div>
      )}
    </div>
  );
}
