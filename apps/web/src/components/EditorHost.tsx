import { useState } from "react";
import { readableAccentText, resolveTheme } from "@neofile/core";
import { registry, useDocVersion } from "@/state/registry";
import type { DocMeta } from "@/state/types";
import { useStore } from "@/state/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CodeEditor } from "@/components/CodeEditor";
import { SheetGrid } from "@/components/SheetGrid";
import { PdfViewer } from "@/components/viewers/PdfViewer";
import { DocxViewer, MarkdownPreview } from "@/components/viewers/DocxViewer";
import { PptxViewer } from "@/components/viewers/PptxViewer";
import { MediaViewer } from "@/components/viewers/MediaViewer";
import { BinaryViewer } from "@/components/viewers/BinaryViewer";

export function EditorHost({ doc, pane }: { doc: DocMeta | null; pane: "primary" | "secondary" }) {
  const store = useStore();
  const [hiddenLimit, setHiddenLimit] = useState(false);
  const [mdMode, setMdMode] = useState<"edit" | "preview" | "split">("edit");
  const [wrap, setWrap] = useState(false);
  if (!doc) {
    return (
      <section className={`editor-pane ${store.focus === pane ? "focused" : ""}`} onMouseDown={() => store.setFocus(pane)}>
        <div className="pane-message">
          <div>
            <h2>Empty pane</h2>
            <p className="muted">Open another file, then pick it for this side.</p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className={`editor-pane ${store.focus === pane ? "focused" : ""}`} onMouseDown={() => store.setFocus(pane)}>
      <div className="pane-bar">
        <div>
          <strong>{doc.name}</strong>
          <div className="tiny">
            {doc.displayLanguage} · {doc.mode === "edit" ? "Editing" : doc.mode === "values" ? "Editing values" : "View only"}
            {doc.saveDetail ? ` · ${doc.saveDetail}` : ""}
          </div>
        </div>
        <div className="pane-actions">
          {doc.highlighter === "markdown" ? (
            <div className="seg">
              {(["edit", "preview", "split"] as const).map((mode) => (
                <button key={mode} className="brut" type="button" style={{ padding: "4px 8px" }} onClick={() => setMdMode(mode)}>
                  {mode}
                </button>
              ))}
            </div>
          ) : null}
          {doc.kind === "text" ? <Switch checked={wrap} onCheckedChange={setWrap} label="Wrap" /> : null}
          {pane === "secondary" ? (
            <select aria-label="File in this pane" value={doc.id} onChange={(event) => store.setSecondary(event.target.value)}>
              {store.docs.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          ) : null}
          <Button size="sm" onClick={() => void store.save(doc.id)}>{doc.mode === "view" ? "Save original" : "Save"}</Button>
          <Button size="sm" onClick={() => void store.saveAs(doc.id)}>Save as</Button>
          {doc.mode !== "view" ? <Button size="sm" onClick={() => void store.showHistory(doc.id)}>Snapshots</Button> : null}
          {doc.mode === "view" ? <Button size="sm" onClick={() => void store.exportOriginal(doc.id)}>Download original</Button> : null}
        </div>
      </div>
      {doc.limit && !hiddenLimit ? (
        <div className="limit-banner">
          {doc.limit}{" "}
          <button type="button" onClick={() => setHiddenLimit(true)} style={{ border: 0, background: "transparent", fontWeight: 700 }}>
            Hide
          </button>
        </div>
      ) : null}
      <div className="editor-fill">
        {doc.loading ? <div className="pane-message">Reading {doc.name}…</div> : null}
        {!doc.loading && doc.error ? (
          <div className="pane-message">
            <div>
              <h2>Could not open this file</h2>
              <p>{doc.error}</p>
            </div>
          </div>
        ) : null}
        {!doc.loading && !doc.error ? <Body doc={doc} mdMode={mdMode} wrap={wrap} /> : null}
      </div>
    </section>
  );
}

function Body({ doc, mdMode, wrap }: { doc: DocMeta; mdMode: "edit" | "preview" | "split"; wrap: boolean }) {
  const store = useStore();
  useDocVersion(doc.id);
  const theme = resolveTheme(store.prefs);
  const themeMode = theme.mode;
  const accent = readableAccentText(theme.accent, theme.surface);
  if (doc.locked && (doc.kind === "csv" || doc.kind === "xlsx")) return <BinaryViewer docId={doc.id} />;
  if (doc.kind === "text") {
    const text = registry.getText(doc.id);
    const editor = (
      <CodeEditor
        key={`${doc.id}:${doc.epoch}`}
        text={text}
        highlighter={doc.highlighter}
        wrap={wrap}
        mode={themeMode}
        accent={accent}
        jump={registry.jump(doc.id)}
        onChange={(value) => {
          registry.setText(doc.id, value);
          store.markDirty(doc.id);
        }}
      />
    );
    if (doc.highlighter === "markdown" && mdMode === "preview") return <div className="preview-scroll"><MarkdownPreview source={text} /></div>;
    if (doc.highlighter === "markdown" && mdMode === "split") {
      return (
        <div className="split-grid on" style={{ height: "100%" }}>
          {editor}
          <div className="preview-scroll"><MarkdownPreview source={text} /></div>
        </div>
      );
    }
    return editor;
  }
  if (doc.kind === "csv" || doc.kind === "xlsx") return <SheetGrid key={`${doc.id}:${doc.epoch}`} docId={doc.id} onDirty={() => store.markDirty(doc.id)} />;
  if (doc.kind === "pdf") return <PdfViewer key={`${doc.id}:${doc.epoch}`} docId={doc.id} onText={(text) => store.noteText(doc.id, text)} />;
  if (doc.kind === "docx") {
    return <DocxViewer key={`${doc.id}:${doc.epoch}`} docId={doc.id} onText={(text) => store.noteText(doc.id, text)} onExportHtml={(html) => void store.exportHtml(doc.id, html)} />;
  }
  if (doc.kind === "pptx") return <PptxViewer key={`${doc.id}:${doc.epoch}`} docId={doc.id} onText={(text) => store.noteText(doc.id, text)} />;
  if (doc.kind === "image" || doc.kind === "audio" || doc.kind === "video") {
    return <MediaViewer docId={doc.id} kind={doc.kind} name={doc.name} mode={themeMode} accent={accent} />;
  }
  return <BinaryViewer docId={doc.id} />;
}
