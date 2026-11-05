import { useSyncExternalStore } from "react";
import { GridHistory, applyCellPatch, type CellChange, type Delimiter } from "@neofile/core";

export interface SheetModel {
  origin: "csv" | "xlsx";
  delimiter: Delimiter;
  active: number;
  sheets: { name: string; rows: string[][] }[];
}

type Listener = () => void;

class Registry {
  private texts = new Map<string, string>();
  private bytes = new Map<string, Uint8Array>();
  private mimes = new Map<string, string>();
  private urls = new Map<string, string>();
  private sheets = new Map<string, SheetModel>();
  private history = new Map<string, GridHistory>();
  private previews = new Map<string, string>();
  private versions = new Map<string, number>();
  private listeners = new Map<string, Set<Listener>>();
  private jumps = new Map<string, { line: number; column: number; nonce: number }>();

  version(id: string): number {
    return this.versions.get(id) ?? 0;
  }

  subscribe(id: string, fn: Listener): () => void {
    const set = this.listeners.get(id) ?? new Set<Listener>();
    set.add(fn);
    this.listeners.set(id, set);
    return () => set.delete(fn);
  }

  private bump(id: string) {
    this.versions.set(id, (this.versions.get(id) ?? 0) + 1);
    this.listeners.get(id)?.forEach((fn) => fn());
  }

  setText(id: string, text: string) {
    this.texts.set(id, text);
  }

  getText(id: string): string {
    return this.texts.get(id) ?? "";
  }

  setBytes(id: string, bytes: Uint8Array, mime = "application/octet-stream") {
    this.bytes.set(id, bytes);
    this.mimes.set(id, mime);
    const url = this.urls.get(id);
    if (url) URL.revokeObjectURL(url);
    this.urls.delete(id);
  }

  getBytes(id: string): Uint8Array {
    return this.bytes.get(id) ?? new Uint8Array();
  }

  objectUrl(id: string): string {
    const existing = this.urls.get(id);
    if (existing) return existing;
    const bytes = this.getBytes(id);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const url = URL.createObjectURL(new Blob([copy], { type: this.mimes.get(id) ?? "application/octet-stream" }));
    this.urls.set(id, url);
    return url;
  }

  setSheet(id: string, model: SheetModel) {
    this.sheets.set(id, model);
    if (!this.history.has(id)) this.history.set(id, new GridHistory());
    this.bump(id);
  }

  getSheet(id: string): SheetModel | null {
    return this.sheets.get(id) ?? null;
  }

  private stack(id: string): GridHistory {
    const existing = this.history.get(id);
    if (existing) return existing;
    const created = new GridHistory();
    this.history.set(id, created);
    return created;
  }

  canUndo(id: string): boolean {
    return this.history.get(id)?.canUndo ?? false;
  }

  canRedo(id: string): boolean {
    return this.history.get(id)?.canRedo ?? false;
  }

  editCell(id: string, row: number, col: number, value: string): boolean {
    const model = this.sheets.get(id);
    if (!model) return false;
    const before = model.sheets[model.active]?.rows[row]?.[col] ?? "";
    if (before === value) return false;
    const change: CellChange = { sheet: model.active, row, col, before, after: value };
    this.apply(id, [change], "redo");
    this.stack(id).push({ label: "cell", changes: [change] });
    return true;
  }

  paste(id: string, row: number, col: number, block: string[][]) {
    const model = this.sheets.get(id);
    if (!model) return;
    const current = model.sheets[model.active]?.rows ?? [];
    const changes: CellChange[] = [];
    block.forEach((line, r) => {
      line.forEach((cell, c) => {
        const before = current[row + r]?.[col + c] ?? "";
        if (before !== cell) {
          changes.push({ sheet: model.active, row: row + r, col: col + c, before, after: cell });
        }
      });
    });
    if (changes.length === 0) return;
    this.apply(id, changes, "redo");
    this.stack(id).push({ label: "paste", changes });
  }

  undoSheet(id: string): boolean {
    const patch = this.stack(id).undo();
    if (!patch) return false;
    this.apply(id, patch.changes, "undo");
    return true;
  }

  redoSheet(id: string): boolean {
    const patch = this.stack(id).redo();
    if (!patch) return false;
    this.apply(id, patch.changes, "redo");
    return true;
  }

  private apply(id: string, changes: CellChange[], direction: "undo" | "redo") {
    const model = this.sheets.get(id);
    if (!model) return;
    const grouped = new Map<number, CellChange[]>();
    for (const change of changes) {
      const list = grouped.get(change.sheet) ?? [];
      list.push(change);
      grouped.set(change.sheet, list);
    }
    for (const [index, list] of grouped) {
      const sheet = model.sheets[index];
      if (!sheet) continue;
      model.sheets[index] = { ...sheet, rows: applyCellPatch(sheet.rows, list, direction) };
    }
    this.bump(id);
  }

  setActiveSheet(id: string, index: number) {
    const model = this.sheets.get(id);
    if (!model || !model.sheets[index]) return;
    model.active = index;
    this.bump(id);
  }

  renameSheet(id: string, name: string) {
    const model = this.sheets.get(id);
    if (!model) return;
    const clean = name.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31);
    if (!clean) return;
    const sheet = model.sheets[model.active];
    model.sheets[model.active] = { ...sheet, name: clean };
    this.bump(id);
  }

  addSheet(id: string) {
    const model = this.sheets.get(id);
    if (!model || model.origin !== "xlsx") return;
    model.sheets = [...model.sheets, { name: `Sheet${model.sheets.length + 1}`, rows: [[""]] }];
    model.active = model.sheets.length - 1;
    this.bump(id);
  }

  addRow(id: string) {
    const model = this.sheets.get(id);
    if (!model) return;
    const sheet = model.sheets[model.active];
    const width = sheet.rows.reduce((max, row) => Math.max(max, row.length), 1);
    model.sheets[model.active] = {
      ...sheet,
      rows: [...sheet.rows, Array.from({ length: width }, () => "")],
    };
    this.bump(id);
  }

  setPreview(id: string, text: string) {
    this.previews.set(id, text.slice(0, 80_000));
  }

  searchText(id: string): string {
    if (this.texts.has(id)) return this.texts.get(id) ?? "";
    const sheet = this.sheets.get(id);
    if (sheet) {
      return sheet.sheets.map((item) => item.rows.map((row) => row.join("\t")).join("\n")).join("\n");
    }
    return this.previews.get(id) ?? "";
  }

  setJump(id: string, line: number, column: number) {
    const prev = this.jumps.get(id);
    this.jumps.set(id, { line, column, nonce: (prev?.nonce ?? 0) + 1 });
    this.bump(id);
  }

  jump(id: string) {
    return this.jumps.get(id) ?? null;
  }

  drop(id: string) {
    const url = this.urls.get(id);
    if (url) URL.revokeObjectURL(url);
    this.texts.delete(id);
    this.bytes.delete(id);
    this.mimes.delete(id);
    this.urls.delete(id);
    this.sheets.delete(id);
    this.history.delete(id);
    this.previews.delete(id);
    this.versions.delete(id);
    this.listeners.delete(id);
    this.jumps.delete(id);
  }

  clear() {
    for (const url of this.urls.values()) URL.revokeObjectURL(url);
    this.texts.clear();
    this.bytes.clear();
    this.mimes.clear();
    this.urls.clear();
    this.sheets.clear();
    this.history.clear();
    this.previews.clear();
    this.versions.clear();
    this.listeners.clear();
    this.jumps.clear();
  }
}

export const registry = new Registry();

export function useDocVersion(id: string): number {
  return useSyncExternalStore(
    (cb) => registry.subscribe(id, cb),
    () => registry.version(id),
    () => registry.version(id),
  );
}
