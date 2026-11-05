import { FILE_LIMITS, columnLabel, parseCsv, type Delimiter } from "@neofile/core";
import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { registry, useDocVersion, type SheetModel } from "@/state/registry";

const COL_W = 132;
const ROW_H = 32;
const GUTTER = 52;

export function SheetGrid({ docId, onDirty }: { docId: string; onDirty: () => void }) {
  const version = useDocVersion(docId);
  const model = registry.getSheet(docId);
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(400);
  const [sel, setSel] = useState({ row: 0, col: 0 });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [rename, setRename] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setHeight(el.clientHeight || 400);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!model) return <div className="pane-message">This sheet is not loaded.</div>;
  const sheet = model.sheets[model.active] ?? model.sheets[0];
  const rows = sheet?.rows ?? [[""]];
  const usedCols = Math.max(1, ...rows.map((row) => row.length));
  const cols = Math.min(FILE_LIMITS.maxSheetCols, usedCols + (usedCols < FILE_LIMITS.maxSheetCols ? 1 : 0));
  const rowCount = rows.length + 1;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - 4);
  const end = Math.min(rowCount, Math.ceil((scrollTop + height) / ROW_H) + 6);

  function valueAt(row: number, col: number) {
    return rows[row]?.[col] ?? "";
  }

  function commit(value: string) {
    if (registry.editCell(docId, sel.row, sel.col, value)) onDirty();
    setEditing(false);
  }

  function move(rowDelta: number, colDelta: number) {
    setSel((current) => ({
      row: Math.max(0, Math.min(rowCount - 1, current.row + rowDelta)),
      col: Math.max(0, Math.min(cols - 1, current.col + colDelta)),
    }));
    setEditing(false);
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const meta = event.ctrlKey || event.metaKey;
    if (meta && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.stopPropagation();
      const changed = event.shiftKey ? registry.redoSheet(docId) : registry.undoSheet(docId);
      if (changed) onDirty();
      return;
    }
    if (meta && event.key.toLowerCase() === "y") {
      event.preventDefault();
      if (registry.redoSheet(docId)) onDirty();
      return;
    }
    if (editing) return;
    if (event.key === "Enter") {
      setDraft(valueAt(sel.row, sel.col));
      setEditing(true);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      move(0, event.shiftKey ? -1 : 1);
      return;
    }
    if (event.key === "ArrowDown") move(1, 0);
    if (event.key === "ArrowUp") move(-1, 0);
    if (event.key === "ArrowLeft") move(0, -1);
    if (event.key === "ArrowRight") move(0, 1);
    if (event.key === "Delete" || event.key === "Backspace") {
      if (registry.editCell(docId, sel.row, sel.col, "")) onDirty();
      return;
    }
    if (event.key.length === 1 && !meta) {
      setDraft(event.key);
      setEditing(true);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLDivElement>) {
    const text = event.clipboardData.getData("text/plain");
    if (!text) return;
    event.preventDefault();
    const delimiter: Delimiter = text.includes("\t") ? "\t" : text.includes(";") && !text.includes(",") ? ";" : ",";
    registry.paste(docId, sel.row, sel.col, parseCsv(text, delimiter));
    onDirty();
  }

  return (
    <div className="editor-fill" style={{ display: "flex", flexDirection: "column" }} data-version={version}>
      <div
        ref={scroller}
        className="sheet-scroll"
        data-swipe-ignore="true"
        tabIndex={0}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        onKeyDown={onKey}
        onPaste={onPaste}
      >
        <div style={{ width: GUTTER + cols * COL_W }}>
          <div style={{ display: "grid", gridTemplateColumns: `${GUTTER}px repeat(${cols}, ${COL_W}px)`, position: "sticky", top: 0, zIndex: 3 }}>
            <div className="sheet-corner" style={{ height: ROW_H }} />
            {Array.from({ length: cols }, (_, col) => (
              <div key={col} className="sheet-head" style={{ height: ROW_H, padding: "6px" }}>
                {columnLabel(col)}
              </div>
            ))}
          </div>
          <div style={{ height: rowCount * ROW_H, position: "relative" }}>
            {Array.from({ length: Math.max(0, end - start) }, (_, offset) => {
              const row = start + offset;
              return (
                <div
                  key={row}
                  style={{
                    position: "absolute",
                    top: row * ROW_H,
                    height: ROW_H,
                    left: 0,
                    display: "grid",
                    gridTemplateColumns: `${GUTTER}px repeat(${cols}, ${COL_W}px)`,
                  }}
                >
                  <div className="sheet-cell sheet-gutter" style={{ height: ROW_H, padding: "6px" }}>
                    {row + 1}
                  </div>
                  {Array.from({ length: cols }, (_, col) => {
                    const active = sel.row === row && sel.col === col;
                    return (
                      <div
                        key={col}
                        className={active ? "sheet-cell active" : "sheet-cell"}
                        style={{ height: ROW_H, padding: editing && active ? 0 : "6px 6px", overflow: "hidden", whiteSpace: "nowrap" }}
                        onMouseDown={() => {
                          setSel({ row, col });
                          setEditing(false);
                          scroller.current?.focus();
                        }}
                        onDoubleClick={() => {
                          setSel({ row, col });
                          setDraft(valueAt(row, col));
                          setEditing(true);
                        }}
                      >
                        {editing && active ? (
                          <input
                            autoFocus
                            className="cell-input"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onBlur={() => commit(draft)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                commit(draft);
                                move(1, 0);
                              } else if (event.key === "Tab") {
                                event.preventDefault();
                                commit(draft);
                                move(0, event.shiftKey ? -1 : 1);
                              } else if (event.key === "Escape") {
                                event.preventDefault();
                                setEditing(false);
                              }
                            }}
                          />
                        ) : (
                          valueAt(row, col)
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <SheetTabs model={model} docId={docId} rename={rename} setRename={setRename} onDirty={onDirty} />
    </div>
  );
}

function SheetTabs({
  model,
  docId,
  rename,
  setRename,
  onDirty,
}: {
  model: SheetModel;
  docId: string;
  rename: boolean;
  setRename: (value: boolean) => void;
  onDirty: () => void;
}) {
  if (model.origin !== "xlsx" && model.sheets.length < 2) {
    return (
      <div className="sheet-tabs">
        <span className="tiny">Click a cell and type. Ctrl+Z undoes cell edits. Trailing empty rows are dropped on save.</span>
        <button className="brut" style={{ marginLeft: "auto", padding: "4px 8px" }} onClick={() => { registry.addRow(docId); onDirty(); }}>
          Add row
        </button>
      </div>
    );
  }
  return (
    <div className="sheet-tabs">
      {model.sheets.map((sheet, index) => (
        <button
          key={`${sheet.name}-${index}`}
          className="tab"
          style={{ background: index === model.active ? "var(--accent)" : "var(--surface)", color: index === model.active ? "var(--accent-ink)" : "var(--ink)" }}
          onClick={() => registry.setActiveSheet(docId, index)}
          onDoubleClick={() => setRename(true)}
        >
          {rename && index === model.active ? (
            <input
              autoFocus
              defaultValue={sheet.name}
              className="cell-input"
              onBlur={(event) => {
                registry.renameSheet(docId, event.target.value);
                setRename(false);
                onDirty();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") (event.target as HTMLInputElement).blur();
              }}
            />
          ) : (
            sheet.name
          )}
        </button>
      ))}
      <button className="brut" style={{ padding: "4px 8px" }} onClick={() => { registry.addSheet(docId); onDirty(); }}>
        Add sheet
      </button>
      <button className="brut" style={{ padding: "4px 8px" }} onClick={() => { registry.addRow(docId); onDirty(); }}>
        Add row
      </button>
    </div>
  );
}
