import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FILE_LIMITS,
  IdbSnapshotDb,
  MemorySnapshotDb,
  SnapshotStore,
  detectFile,
  docIdentity,
  extensionOf,
  serializeCsv,
  trimSheet,
  normalizeHex,
  uid,
  type SearchHit,
  type SnapshotMeta,
  type ThemePrefs,
} from "@neofile/core";
import { decodeText, encodeText, looksBinary, mimeFor } from "@/lib/bytes";
import { sheetTooBig, sheetsToXlsx } from "@/lib/sheets";
import { filesFromDataTransfer, type DroppedFile } from "@/platform/drop";
import { buildDroppedTree } from "@/state/dropped-tree";
import {
  directoryToTree,
  dismissShare,
  isAndroid,
  isTauri,
  listenForShares,
  pendingShares,
  pickDirectoryAndroid,
  pickDirectoryTauri,
  pickDirectoryWeb,
  pickOpenFiles,
  readDirPath,
  readDirUri,
  readDirectoryHandle,
  readFilePath,
  readShare,
  readUriBytes,
  saveBytes,
  savePathDialog,
  shellName,
  writeFilePath,
  writeHandle,
  type PickedFile,
} from "@/platform/bridge";
import { SAMPLES } from "@/samples";
import { applyTheme } from "@/theme/apply";
import { findNode, nodeBlobs, nodeDirs, parentChildren, visibleNodeIds } from "@/state/external";
import { registry, type SheetModel } from "@/state/registry";
import type { DocMeta, InboxItem, IngestInput, Shell, Toast, TreeNode } from "@/state/types";
import { parseTable, parseWorkbook, searchDesk } from "@/workers/client";

interface SessionDoc {
  meta: DocMeta;
  text?: string;
  sheet?: SheetModel;
  bytes?: Uint8Array;
}

interface Desk {
  snapshots: SnapshotStore;
  idb: IdbSnapshotDb | null;
}

const handles = new Map<string, FileSystemFileHandle>();
let desk: Desk | null = null;
let bootData: Promise<BootPayload> | null = null;
let shareListening = false;
let onInbox: ((files: InboxItem[]) => void) | null = null;

interface BootPayload {
  recents: StoreApi["recents"];
  session: SessionDoc[] | null;
  inbox: InboxItem[];
  shell: Shell;
}

export interface StoreApi {
  boot: "loading" | "ready" | "error";
  bootError: string | null;
  docs: DocMeta[];
  tabs: string[];
  activeId: string | null;
  secondaryId: string | null;
  split: boolean;
  focus: "primary" | "secondary";
  sidebar: boolean;
  prefs: ThemePrefs;
  recents: Awaited<ReturnType<IdbSnapshotDb["listRecents"]>>;
  tree: TreeNode | null;
  expanded: string[];
  selected: string[];
  inbox: InboxItem[];
  toasts: Toast[];
  search: string;
  searchHits: SearchHit[];
  searchOpen: boolean;
  historyFor: string | null;
  snapshots: SnapshotMeta[];
  about: boolean;
  privacy: boolean;
  shortcuts: boolean;
  confirmClose: DocMeta | null;
  dragging: boolean;
  shell: Shell;
  retryBoot: () => void;
  setSearch: (value: string) => void;
  closeSearch: () => void;
  openSearch: () => void;
  openFiles: () => Promise<void>;
  openFolder: () => Promise<void>;
  openSample: (name: string) => Promise<void>;
  openRecent: (id: string) => Promise<void>;
  openInboxItem: (id: string) => Promise<void>;
  dismissInboxItem: (id: string) => Promise<void>;
  activate: (id: string) => void;
  closeTab: (id: string) => void;
  discardClose: () => void;
  saveAndClose: () => Promise<void>;
  cancelClose: () => void;
  save: (id?: string) => Promise<void>;
  saveAs: (id?: string) => Promise<void>;
  exportOriginal: (id: string) => Promise<void>;
  exportHtml: (id: string, html: string) => Promise<void>;
  toggleSplit: () => void;
  setSecondary: (id: string) => void;
  setFocus: (pane: "primary" | "secondary") => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  toggleTheme: () => void;
  setAccent: (hex: string) => void;
  resetAccent: () => void;
  toggleExpand: (id: string) => Promise<void>;
  selectNode: (id: string, mods: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }) => void;
  openSelection: () => Promise<void>;
  openNode: (id: string) => Promise<void>;
  markDirty: (id: string) => void;
  noteText: (id: string, text: string) => void;
  showHistory: (id: string) => Promise<void>;
  takeSnapshot: (id: string) => Promise<void>;
  restoreSnapshot: (snapId: string) => Promise<void>;
  closeHistory: () => void;
  setAbout: (open: boolean) => void;
  setPrivacy: (open: boolean) => void;
  setShortcuts: (open: boolean) => void;
  eraseDesk: () => Promise<void>;
  dismissToast: (id: string) => void;
  jumpToHit: (hit: SearchHit) => Promise<void>;
  sibling: (delta: number) => Promise<void>;
  canSibling: (delta: number) => boolean;
  focusedDoc: () => DocMeta | null;
  setDragging: (value: boolean) => void;
  onDropTransfer: (transfer: DataTransfer) => Promise<void>;
  onKey: (event: KeyboardEvent) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function initialPrefs(): ThemePrefs {
  try {
    const raw = JSON.parse(localStorage.getItem("neofile-theme") || "null") as { mode?: string; accent?: string } | null;
    if (raw && (raw.mode === "light" || raw.mode === "dark")) {
      return { mode: raw.mode, accent: typeof raw.accent === "string" ? raw.accent : null };
    }
  } catch {
    /* keep the default theme */
  }
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return { mode: dark ? "dark" : "light", accent: null };
}

function patchDoc(list: DocMeta[], id: string, patch: Partial<DocMeta>): DocMeta[] {
  return list.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc));
}

function updateNode(node: TreeNode, id: string, children: TreeNode[]): TreeNode {
  if (node.id === id) return { ...node, children };
  if (!node.children) return node;
  return { ...node, children: node.children.map((child) => updateNode(child, id, children)) };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [boot, setBoot] = useState<StoreApi["boot"]>("loading");
  const [bootError, setBootError] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [secondaryId, setSecondaryId] = useState<string | null>(null);
  const [split, setSplit] = useState(false);
  const [focus, setFocus] = useState<"primary" | "secondary">("primary");
  const [sidebar, setSidebar] = useState(() => window.innerWidth > 860);
  const [prefs, setPrefs] = useState<ThemePrefs>(initialPrefs);
  const [recents, setRecents] = useState<StoreApi["recents"]>([]);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearchValue] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [about, setAbout] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [confirmClose, setConfirmClose] = useState<DocMeta | null>(null);
  const [dragging, setDragging] = useState(false);
  const [shell, setShell] = useState<Shell>("web");
  const [bootNonce, setBootNonce] = useState(0);

  const docsRef = useRef(docs);
  const tabsRef = useRef(tabs);
  const activeRef = useRef(activeId);
  const secondaryRef = useRef(secondaryId);
  const focusRef = useRef(focus);
  const treeRef = useRef(tree);
  const expandedRef = useRef(expanded);
  const prefsRef = useRef(prefs);
  const recentsRef = useRef(recents);
  docsRef.current = docs;
  tabsRef.current = tabs;
  activeRef.current = activeId;
  secondaryRef.current = secondaryId;
  focusRef.current = focus;
  treeRef.current = tree;
  expandedRef.current = expanded;
  prefsRef.current = prefs;
  recentsRef.current = recents;

  const fileRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef(0);
  const saveTimers = useRef(new Map<string, number>());
  const anchor = useRef<string | null>(null);
  const apiRef = useRef<StoreApi>(null!);

  function toast(message: string) {
    const id = uid();
    setToasts((list) => [...list.slice(-4), { id, message }]);
    window.setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 4600);
  }

  function focusedDoc(): DocMeta | null {
    const id = focusRef.current === "secondary" ? secondaryRef.current : activeRef.current;
    return docsRef.current.find((doc) => doc.id === id) ?? docsRef.current.find((doc) => doc.id === activeRef.current) ?? null;
  }

  async function buildPayload(doc: DocMeta): Promise<Uint8Array> {
    if (doc.locked || doc.mode === "view") return registry.getBytes(doc.id);
    if (doc.kind === "text") return encodeText(registry.getText(doc.id));
    if (doc.kind === "csv") {
      const sheet = registry.getSheet(doc.id);
      const rows = trimSheet(sheet?.sheets[0]?.rows ?? [[""]]);
      return encodeText(serializeCsv(rows, sheet?.delimiter ?? ","));
    }
    if (doc.kind === "xlsx") {
      const sheet = registry.getSheet(doc.id);
      if (!sheet) return registry.getBytes(doc.id);
      return sheetsToXlsx(sheet);
    }
    return registry.getBytes(doc.id);
  }

  async function remember(doc: DocMeta, bytes: Uint8Array) {
    const record = {
      id: doc.identity,
      name: doc.name,
      kind: doc.kind,
      mode: doc.mode,
      displayLanguage: doc.displayLanguage,
      highlighter: doc.highlighter,
      size: bytes.byteLength,
      openedAt: Date.now(),
      preview: registry.searchText(doc.id).slice(0, 80_000) || doc.name,
      payload: bytes.byteLength <= FILE_LIMITS.recentPayloadBytes ? bytes : undefined,
      path: doc.path ?? undefined,
    };
    if (!desk?.idb) {
      setRecents((list) => [record, ...list.filter((item) => item.id !== record.id)].slice(0, FILE_LIMITS.recentCount));
      return;
    }
    await desk.idb.putRecent(record);
    const all = await desk.idb.listRecents();
    for (const extra of all.slice(FILE_LIMITS.recentCount)) await desk.idb.deleteRecent(extra.id);
    setRecents(all.slice(0, FILE_LIMITS.recentCount));
  }

  async function persistSession() {
    if (!desk?.idb) return;
    const session: SessionDoc[] = [];
    for (const doc of docsRef.current) {
      if (doc.loading) continue;
      const bytes = doc.kind === "text" || doc.kind === "csv" || doc.kind === "xlsx" ? await buildPayload(doc) : registry.getBytes(doc.id);
      session.push({
        meta: doc,
        text: doc.kind === "text" ? registry.getText(doc.id) : undefined,
        sheet: registry.getSheet(doc.id) ?? undefined,
        bytes: bytes.byteLength <= FILE_LIMITS.recentPayloadBytes ? bytes : undefined,
      });
    }
    await desk.idb.kvSet("session", session);
  }

  async function ingestOne(input: IngestInput) {
    const bytes = new Uint8Array(await input.blob.arrayBuffer());
    const profile = detectFile(input.name, input.blob.type || "");
    const identity = input.path ? `path:${input.path}` : docIdentity(input.name, bytes.byteLength, bytes.subarray(0, 65536));
    const existing = docsRef.current.find((doc) => doc.identity === identity);
    if (existing) {
      setActiveId(existing.id);
      setFocus("primary");
      return;
    }
    const id = uid();
    if (input.handle) handles.set(id, input.handle);
    let kind = profile.kind;
    let mode = profile.mode;
    let highlighter = profile.highlighter;
    let limit = profile.limit;
    let locked = false;
    if (kind === "text" && looksBinary(bytes) && !["txt", "md", "markdown", "log"].includes(extensionOf(input.name))) {
      kind = "binary";
      mode = "view";
      highlighter = null;
      limit = "These bytes do not look like text. Showing a hex preview instead.";
      locked = true;
    }
    const meta: DocMeta = {
      id,
      name: input.name,
      kind,
      mode,
      highlighter,
      displayLanguage: profile.displayLanguage,
      limit,
      size: bytes.byteLength,
      dirty: false,
      saveState: "idle",
      saveDetail: "",
      error: null,
      loading: true,
      origin: input.origin,
      identity,
      path: input.path ?? null,
      epoch: 0,
      openedAt: Date.now(),
      treeNodeId: input.treeNodeId ?? null,
      locked,
    };
    setDocs((list) => [...list, meta]);
    setTabs((list) => [...list, id]);
    setActiveId(id);
    setFocus("primary");
    registry.setBytes(id, bytes, input.blob.type || mimeFor(input.name));
    try {
      if (meta.kind === "text") {
        registry.setText(id, decodeText(bytes));
      } else if (meta.kind === "csv") {
        const parsed = await parseTable(bytes);
        if (sheetTooBig(parsed.rows, FILE_LIMITS.maxSheetRows, FILE_LIMITS.maxSheetCols)) {
          locked = true;
          limit = `This table has more than ${FILE_LIMITS.maxSheetRows.toLocaleString()} rows or ${FILE_LIMITS.maxSheetCols} columns. NeoFile will not edit it. You can still export the original.`;
        } else {
          registry.setSheet(id, {
            origin: "csv",
            delimiter: parsed.delimiter,
            active: 0,
            sheets: [{ name: meta.displayLanguage, rows: parsed.rows }],
          });
        }
      } else if (meta.kind === "xlsx") {
        const sheets = await parseWorkbook(bytes);
        const tooBig = sheets.some((sheet) => sheetTooBig(sheet.rows, FILE_LIMITS.maxSheetRows, FILE_LIMITS.maxSheetCols));
        if (tooBig) {
          locked = true;
          limit = `A sheet in this workbook is over ${FILE_LIMITS.maxSheetRows.toLocaleString()} rows or ${FILE_LIMITS.maxSheetCols} columns. Export the original instead of editing values.`;
        } else {
          registry.setSheet(id, { origin: "xlsx", delimiter: ",", active: 0, sheets });
        }
      }
      setDocs((list) => patchDoc(list, id, { loading: false, locked, limit, error: null }));
      const saved = docsRef.current.find((doc) => doc.id === id) ?? meta;
      await remember({ ...saved, locked, limit, loading: false }, bytes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read that file";
      setDocs((list) => patchDoc(list, id, { loading: false, error: message, locked: true, mode: "view" }));
      toast(message);
    }
  }

  async function ingestMany(files: PickedFile[] | IngestInput[]) {
    const batch = files.slice(0, FILE_LIMITS.openBatch);
    for (const file of batch) {
      if ("blob" in file && "origin" in file) await ingestOne(file);
      else {
        const picked = file as PickedFile;
        await ingestOne({
          name: picked.name,
          blob: picked.blob,
          path: picked.path ?? null,
          origin: "disk",
          handle: picked.handle,
        });
      }
    }
    if (files.length > batch.length) toast(`Opened ${batch.length} of ${files.length} files. Open the rest in another drop.`);
    await persistSession();
  }

  function markDirty(id: string) {
    setDocs((list) => list.map((doc) => (doc.id === id && !doc.dirty ? { ...doc, dirty: true, saveState: "idle", saveDetail: "Unsaved" } : doc)));
    const prev = saveTimers.current.get(id);
    if (prev) window.clearTimeout(prev);
    saveTimers.current.set(
      id,
      window.setTimeout(() => {
        void autosave(id);
      }, 1200),
    );
  }

  async function autosave(id: string) {
    const doc = docsRef.current.find((item) => item.id === id);
    if (!doc || doc.mode === "view" || doc.locked) return;
    setDocs((list) => patchDoc(list, id, { saveState: "saving", saveDetail: "Saving a local snapshot" }));
    try {
      const bytes = await buildPayload(doc);
      if (bytes.byteLength <= FILE_LIMITS.autoSnapshotBytes && desk) {
        await desk.snapshots.push({ docKey: doc.identity, payload: bytes, kind: "auto", label: "Auto-save" });
      }
      let wrote = false;
      const handle = handles.get(id);
      if (handle) {
        await writeHandle(handle, bytes);
        wrote = true;
      } else if (doc.path && isTauri()) {
        await writeFilePath(doc.path, bytes);
        wrote = true;
      }
      setDocs((list) =>
        patchDoc(list, id, {
          dirty: wrote ? false : true,
          saveState: wrote ? "disk" : "local",
          saveDetail: wrote ? "Saved to the file" : "Snapshot kept on this device",
          size: bytes.byteLength,
        }),
      );
      const fresh = docsRef.current.find((item) => item.id === id);
      if (fresh) await remember({ ...fresh, size: bytes.byteLength }, bytes);
      await persistSession();
    } catch (error) {
      setDocs((list) => patchDoc(list, id, { saveState: "error", saveDetail: error instanceof Error ? error.message : "Could not snapshot" }));
    }
  }

  async function save(id?: string) {
    const doc = (id ? docsRef.current.find((item) => item.id === id) : focusedDoc()) ?? null;
    if (!doc) return;
    try {
      const bytes = await buildPayload(doc);
      if (desk && doc.mode !== "view" && bytes.byteLength <= FILE_LIMITS.manualSnapshotBytes) {
        await desk.snapshots.push({ docKey: doc.identity, payload: bytes, kind: "manual", label: "Save" });
      }
      const handle = handles.get(doc.id);
      if (handle && doc.mode !== "view" && !doc.locked) {
        await writeHandle(handle, bytes);
        setDocs((list) => patchDoc(list, doc.id, { dirty: false, saveState: "disk", saveDetail: "Saved to the file", size: bytes.byteLength }));
        return;
      }
      if (doc.path && isTauri() && doc.mode !== "view" && !doc.locked) {
        await writeFilePath(doc.path, bytes);
        setDocs((list) => patchDoc(list, doc.id, { dirty: false, saveState: "disk", saveDetail: "Saved to the file", size: bytes.byteLength }));
        return;
      }
      const where = await saveBytes(doc.name, doc.mode === "view" || doc.locked ? registry.getBytes(doc.id) : bytes, null);
      const detail =
        where === "android"
          ? "Saved a copy to Downloads"
          : where === "disk"
            ? "Saved to the file"
            : doc.mode === "view"
              ? "Downloaded the original file"
              : "Downloaded a copy";
      setDocs((list) => patchDoc(list, doc.id, { dirty: false, saveState: where === "download" ? "local" : "disk", saveDetail: detail, size: bytes.byteLength }));
      toast(detail);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not save");
    }
  }

  async function saveAs(id?: string) {
    const doc = (id ? docsRef.current.find((item) => item.id === id) : focusedDoc()) ?? null;
    if (!doc) return;
    const bytes = await buildPayload(doc);
    try {
      if (isTauri()) {
        const path = await savePathDialog(doc.name);
        if (!path) return;
        await writeFilePath(path, bytes);
        const name = path.split(/[/\\]/).pop() || doc.name;
        setDocs((list) => patchDoc(list, doc.id, { name, path, dirty: false, saveState: "disk", saveDetail: "Saved to the new file" }));
        return;
      }
      if (!isAndroid() && typeof window.showSaveFilePicker === "function") {
        const handle = await window.showSaveFilePicker({ suggestedName: doc.name });
        await writeHandle(handle, bytes);
        handles.set(doc.id, handle);
        setDocs((list) => patchDoc(list, doc.id, { name: handle.name, dirty: false, saveState: "disk", saveDetail: "Saved to the new file" }));
        return;
      }
      await save(doc.id);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast(error instanceof Error ? error.message : "Could not save a copy");
    }
  }

  async function exportOriginal(id: string) {
    const doc = docsRef.current.find((item) => item.id === id);
    if (!doc) return;
    const where = await saveBytes(doc.name, registry.getBytes(id), null);
    toast(where === "android" ? "Original saved to Downloads" : "Downloaded the original file");
  }

  async function exportHtml(id: string, html: string) {
    const doc = docsRef.current.find((item) => item.id === id);
    const name = `${(doc?.name ?? "preview").replace(/\.docx$/i, "")}.html`;
    await saveBytes(name, encodeText(`<!doctype html><meta charset="utf-8"><title>${doc?.name ?? "Preview"}</title><body>${html}</body>`), null);
    toast("Exported the HTML preview, not a Word file");
  }

  function closeTab(id: string, force = false) {
    const doc = docsRef.current.find((item) => item.id === id);
    if (!doc) return;
    if (doc.dirty && !force) {
      setConfirmClose(doc);
      return;
    }
    const timer = saveTimers.current.get(id);
    if (timer) window.clearTimeout(timer);
    registry.drop(id);
    handles.delete(id);
    const nextTabs = tabsRef.current.filter((tab) => tab !== id);
    setTabs(nextTabs);
    setDocs((list) => list.filter((item) => item.id !== id));
    if (activeRef.current === id) setActiveId(nextTabs[nextTabs.length - 1] ?? null);
    if (secondaryRef.current === id) setSecondaryId(nextTabs.find((tab) => tab !== activeRef.current) ?? null);
    void persistSession();
  }

  async function openNode(id: string) {
    const node = findNode(treeRef.current, id);
    if (!node || node.kind !== "file") return;
    const stored = nodeBlobs.get(id);
    try {
      if (stored instanceof File) {
        await ingestOne({ name: stored.name, blob: stored, origin: "disk", treeNodeId: id });
      } else if (stored && stored.kind === "file") {
        const file = await stored.getFile();
        await ingestOne({ name: file.name, blob: file, origin: "disk", handle: stored, treeNodeId: id });
      } else if (node.path && isTauri()) {
        const bytes = await readFilePath(node.path);
        const copy = new Uint8Array(bytes.byteLength);
        copy.set(bytes);
        await ingestOne({ name: node.name, blob: new Blob([copy]), path: node.path, origin: "disk", treeNodeId: id });
      } else if (node.uri && isAndroid()) {
        const read = await readUriBytes(node.uri);
        const copy = new Uint8Array(read.bytes.byteLength);
        copy.set(read.bytes);
        await ingestOne({ name: read.name || node.name, blob: new Blob([copy]), path: node.uri, origin: "disk", treeNodeId: id });
      } else {
        toast("That file is no longer available. Open it again.");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not open that file");
    }
  }

  async function loadChildren(id: string): Promise<TreeNode[]> {
    const node = findNode(treeRef.current, id);
    if (!node) return [];
    const dir = nodeDirs.get(id);
    if (dir) return readDirectoryHandle(dir, rememberHandle);
    if (node.path && isTauri()) return readDirPath(node.path);
    if (node.uri && isAndroid()) return readDirUri(node.uri);
    return node.children ?? [];
  }

  async function adoptTree(next: TreeNode) {
    setSidebar(true);
    setExpanded([next.id]);
    setTree(next);
    treeRef.current = next;
    try {
      const children = await loadChildren(next.id);
      const filled = { ...next, children };
      treeRef.current = filled;
      setTree(filled);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not read that folder");
    }
  }

  function rememberHandle(id: string, handle: FileSystemHandle) {
    if (handle.kind === "directory") nodeDirs.set(id, handle as FileSystemDirectoryHandle);
    else nodeBlobs.set(id, handle as FileSystemFileHandle);
  }

  async function showHistory(id: string) {
    const doc = docsRef.current.find((item) => item.id === id);
    if (!doc || !desk) return;
    setHistoryFor(id);
    setSnapshots(await desk.snapshots.list(doc.identity));
  }

  async function applyPayload(doc: DocMeta, bytes: Uint8Array) {
    registry.setBytes(doc.id, bytes, mimeFor(doc.name));
    if (doc.kind === "text") registry.setText(doc.id, decodeText(bytes));
    if (doc.kind === "csv") {
      const parsed = await parseTable(bytes);
      registry.setSheet(doc.id, { origin: "csv", delimiter: parsed.delimiter, active: 0, sheets: [{ name: doc.displayLanguage, rows: parsed.rows }] });
    }
    if (doc.kind === "xlsx" && !doc.locked) {
      const sheets = await parseWorkbook(bytes);
      registry.setSheet(doc.id, { origin: "xlsx", delimiter: ",", active: 0, sheets });
    }
    setDocs((list) => patchDoc(list, doc.id, { epoch: doc.epoch + 1, dirty: true, saveDetail: "Restored a local snapshot" }));
  }

  function fileSiblings(doc: DocMeta): TreeNode[] {
    if (!doc.treeNodeId) return [];
    return (parentChildren(treeRef.current, doc.treeNodeId) ?? []).filter((node) => node.kind === "file");
  }

  function canSibling(delta: number): boolean {
    const doc = focusedDoc();
    if (!doc) return false;
    const files = fileSiblings(doc);
    const index = files.findIndex((node) => node.id === doc.treeNodeId);
    return index >= 0 && Boolean(files[index + delta]);
  }

  async function runSearch(query: string) {
    const needle = query.trim();
    if (!needle) {
      setSearchHits([]);
      return;
    }
    const openIds = new Set(docsRef.current.map((doc) => doc.identity));
    const openDocs = docsRef.current.map((doc) => ({
      id: doc.id,
      name: doc.name,
      text: registry.searchText(doc.id),
      kind: doc.kind,
      where: "open" as const,
    }));
    const recentDocs = recentsRef.current
      .filter((item) => !openIds.has(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        text: item.preview,
        kind: item.kind,
        where: "recent" as const,
      }));
    setSearchHits(await searchDesk([...openDocs, ...recentDocs], needle));
  }

  useEffect(() => {
    applyTheme(prefs);
    void desk?.idb?.kvSet("theme", prefs);
  }, [prefs]);

  useEffect(() => {
    dirRef.current?.setAttribute("webkitdirectory", "");
    dirRef.current?.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    let cancel = false;
    onInbox = (files) => {
      setInbox(files);
      if (files.length) toast("A shared file was saved to the offline inbox.");
    };
    if (!bootData) bootData = loadDesk();
    void bootData
      .then((payload) => {
        if (cancel) return;
        setShell(payload.shell);
        setRecents(payload.recents);
        setInbox(payload.inbox);
        const restored = restoreSession(payload.session);
        if (restored.length) {
          setDocs(restored);
          setTabs(restored.map((doc) => doc.id));
          setActiveId(restored[0]?.id ?? null);
        }
        setBoot("ready");
      })
      .catch((error: unknown) => {
        bootData = null;
        if (!cancel) {
          setBootError(error instanceof Error ? error.message : "Could not open the local desk");
          setBoot("error");
        }
      });
    return () => {
      cancel = true;
    };
  }, [bootNonce]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => apiRef.current?.onKey(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function stageDropped(dropped: DroppedFile[]) {
    if (dropped.length === 0) return;
    const built = buildDroppedTree(dropped);
    if (built.root) {
      setTree(built.root);
      setExpanded([built.root.id]);
      setSidebar(true);
      treeRef.current = built.root;
    }
    await ingestMany(
      dropped.slice(0, FILE_LIMITS.openBatch).map((item) => ({
        name: item.file.name,
        blob: item.file,
        origin: "disk" as const,
        treeNodeId: built.idByFile.get(item.file) ?? null,
      })),
    );
  }

  const api = useMemo<StoreApi>(() => {
    const value: StoreApi = {
      boot,
      bootError,
      docs,
      tabs,
      activeId,
      secondaryId,
      split,
      focus,
      sidebar,
      prefs,
      recents,
      tree,
      expanded,
      selected,
      inbox,
      toasts,
      search,
      searchHits,
      searchOpen,
      historyFor,
      snapshots,
      about,
      privacy,
      shortcuts,
      confirmClose,
      dragging,
      shell,
      retryBoot: () => {
        bootData = null;
        setBoot("loading");
        setBootNonce((n) => n + 1);
      },
      setSearch: (next) => {
        setSearchValue(next);
        setSearchOpen(next.trim().length > 0);
        window.clearTimeout(searchTimer.current);
        searchTimer.current = window.setTimeout(() => void runSearch(next), 140);
      },
      closeSearch: () => setSearchOpen(false),
      openSearch: () => setSearchOpen(true),
      openFiles: async () => {
        try {
          const picked = await pickOpenFiles();
          if (picked === "fallback") fileRef.current?.click();
          else if (picked.length) await ingestMany(picked);
        } catch (error) {
          toast(error instanceof Error ? error.message : "Could not open files");
        }
      },
      openFolder: async () => {
        try {
          if (isAndroid()) {
            const next = await pickDirectoryAndroid();
            if (next) await adoptTree(next);
            return;
          }
          if (isTauri()) {
            const next = await pickDirectoryTauri();
            if (next) await adoptTree(next);
            return;
          }
          const handle = await pickDirectoryWeb();
          if (!handle) {
            dirRef.current?.click();
            return;
          }
          const next = await directoryToTree(handle, rememberHandle);
          await adoptTree(next);
        } catch (error) {
          toast(error instanceof Error ? error.message : "Could not open that folder");
        }
      },
      openSample: async (name) => {
        const sample = SAMPLES.find((item) => item.name === name);
        if (!sample) return;
        await ingestOne({ name: sample.name, blob: new Blob([sample.text], { type: "text/plain" }), origin: "sample" });
      },
      openRecent: async (id) => {
        const record = recentsRef.current.find((item) => item.id === id);
        if (!record?.payload) {
          toast("NeoFile did not keep a local copy of that large file. Open it from the folder again.");
          return;
        }
        const copy = new Uint8Array(record.payload.byteLength);
        copy.set(record.payload);
        await ingestOne({
          name: record.name,
          blob: new Blob([copy], { type: mimeFor(record.name) }),
          path: record.path ?? null,
          origin: "recent",
        });
      },
      openInboxItem: async (id) => {
        try {
          const read = await readShare(id);
          const copy = new Uint8Array(read.bytes.byteLength);
          copy.set(read.bytes);
          await ingestOne({ name: read.name, blob: new Blob([copy]), origin: "share", path: `share:${id}` });
        } catch (error) {
          toast(error instanceof Error ? error.message : "Could not open the shared file");
        }
      },
      dismissInboxItem: async (id) => {
        await dismissShare(id).catch(() => undefined);
        setInbox((list) => list.filter((item) => item.id !== id));
      },
      activate: (id) => {
        setActiveId(id);
        setFocus("primary");
        if (secondaryRef.current === id) setSecondaryId(tabsRef.current.find((tab) => tab !== id) ?? null);
      },
      closeTab: (id) => closeTab(id, false),
      discardClose: () => {
        if (confirmClose) closeTab(confirmClose.id, true);
        setConfirmClose(null);
      },
      saveAndClose: async () => {
        if (!confirmClose) return;
        await save(confirmClose.id);
        closeTab(confirmClose.id, true);
        setConfirmClose(null);
      },
      cancelClose: () => setConfirmClose(null),
      save,
      saveAs,
      exportOriginal,
      exportHtml,
      toggleSplit: () => {
        setSplit((on) => {
          const next = !on;
          if (next && !secondaryRef.current) {
            const other = tabsRef.current.find((tab) => tab !== activeRef.current) ?? null;
            setSecondaryId(other);
          }
          return next;
        });
      },
      setSecondary: (id) => {
        if (id === activeRef.current) {
          toast("That file is already in the other pane.");
          return;
        }
        setSecondaryId(id);
        setSplit(true);
        setFocus("secondary");
      },
      setFocus,
      toggleSidebar: () => setSidebar((open) => !open),
      setSidebar,
      toggleTheme: () => setPrefs((current) => ({ ...current, mode: current.mode === "light" ? "dark" : "light" })),
      setAccent: (hex) => {
        const next = normalizeHex(hex);
        if (!next) {
          toast("Use a hex color like #2255ff.");
          return;
        }
        setPrefs((current) => ({ ...current, accent: next }));
      },
      resetAccent: () => setPrefs((current) => ({ ...current, accent: null })),
      toggleExpand: async (id) => {
        if (expandedRef.current.includes(id)) {
          setExpanded((list) => list.filter((item) => item !== id));
          return;
        }
        setExpanded((list) => [...list, id]);
        const node = findNode(treeRef.current, id);
        if (!node || node.children) return;
        try {
          const children = await loadChildren(id);
          setTree((current) => (current ? updateNode(current, id, children) : current));
        } catch (error) {
          toast(error instanceof Error ? error.message : "Could not read that folder");
        }
      },
      selectNode: (id, mods) => {
        const rows = visibleNodeIds(treeRef.current, expandedRef.current);
        if (mods.shiftKey && anchor.current) {
          const start = rows.indexOf(anchor.current);
          const end = rows.indexOf(id);
          if (start >= 0 && end >= 0) {
            const [lo, hi] = start < end ? [start, end] : [end, start];
            setSelected(rows.slice(lo, hi + 1));
            return;
          }
        }
        if (mods.metaKey || mods.ctrlKey) {
          setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
        } else {
          setSelected([id]);
        }
        anchor.current = id;
      },
      openSelection: async () => {
        const ids = selected.filter((id) => findNode(treeRef.current, id)?.kind === "file");
        for (const id of ids.slice(0, FILE_LIMITS.openBatch)) await openNode(id);
      },
      openNode,
      markDirty,
      noteText: (id, text) => {
        registry.setPreview(id, text);
        const doc = docsRef.current.find((item) => item.id === id);
        if (doc) void remember(doc, registry.getBytes(id));
      },
      showHistory,
      takeSnapshot: async (id) => {
        const doc = docsRef.current.find((item) => item.id === id);
        if (!doc || !desk) return;
        const bytes = await buildPayload(doc);
        if (bytes.byteLength > FILE_LIMITS.manualSnapshotBytes) {
          toast("That file is too large for a local snapshot.");
          return;
        }
        await desk.snapshots.push({ docKey: doc.identity, payload: bytes, kind: "manual", label: "Manual snapshot" });
        setSnapshots(await desk.snapshots.list(doc.identity));
        toast("Snapshot kept on this device.");
      },
      restoreSnapshot: async (snapId) => {
        const doc = docsRef.current.find((item) => item.id === historyFor);
        if (!doc || !desk) return;
        const record = await desk.snapshots.restore(snapId);
        if (!record) return;
        const current = await buildPayload(doc);
        if (current.byteLength <= FILE_LIMITS.manualSnapshotBytes) {
          await desk.snapshots.push({ docKey: doc.identity, payload: current, kind: "manual", label: "Before restore" });
        }
        await applyPayload(doc, record.payload);
        setSnapshots(await desk.snapshots.list(doc.identity));
        toast("Restored a local snapshot. Save if you want it written to the file.");
      },
      closeHistory: () => setHistoryFor(null),
      setAbout,
      setPrivacy,
      setShortcuts,
      eraseDesk: async () => {
        for (const item of inbox) await dismissShare(item.id).catch(() => undefined);
        registry.clear();
        handles.clear();
        setDocs([]);
        setTabs([]);
        setActiveId(null);
        setSecondaryId(null);
        setRecents([]);
        setInbox([]);
        setSnapshots([]);
        if (desk?.idb) await desk.idb.eraseAll();
        toast("Local snapshots and recents were erased. Files outside NeoFile were not touched.");
      },
      dismissToast: (id) => setToasts((list) => list.filter((item) => item.id !== id)),
      jumpToHit: async (hit) => {
        if (hit.where === "recent") await value.openRecent(hit.docId);
        else {
          value.activate(hit.docId);
          if (hit.line > 1 || hit.column > 1) registry.setJump(hit.docId, hit.line, hit.column);
        }
        setSearchOpen(false);
      },
      sibling: async (delta) => {
        const doc = focusedDoc();
        if (!doc) return;
        const files = fileSiblings(doc);
        const index = files.findIndex((node) => node.id === doc.treeNodeId);
        const next = files[index + delta];
        if (!next) return;
        if (doc.dirty) await autosave(doc.id);
        await openNode(next.id);
        closeTab(doc.id, true);
      },
      canSibling,
      focusedDoc,
      setDragging,
      onDropTransfer: async (transfer) => {
        setDragging(false);
        try {
          const dropped = await filesFromDataTransfer(transfer);
          await stageDropped(dropped);
        } catch (error) {
          toast(error instanceof Error ? error.message : "Could not open the dropped files");
        }
      },
      onKey: (event) => {
        const meta = event.ctrlKey || event.metaKey;
        const target = event.target as HTMLElement | null;
        const typing = Boolean(target?.closest("input, textarea, [contenteditable='true']"));
        const inEditor = Boolean(target?.closest(".cm-editor, .sheet-scroll"));
        if (event.key === "Escape") {
          setSearchOpen(false);
          setHistoryFor(null);
          setAbout(false);
          setPrivacy(false);
          setShortcuts(false);
          setConfirmClose(null);
          return;
        }
        if (!meta && event.key === "?" && !typing) {
          setShortcuts(true);
          return;
        }
        if (event.altKey && !meta && !typing && !inEditor && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
          event.preventDefault();
          const list = tabsRef.current;
          const index = list.indexOf(activeRef.current ?? "");
          if (index < 0 || list.length < 2) return;
          const next = list[(index + (event.key === "ArrowRight" ? 1 : list.length - 1)) % list.length];
          setActiveId(next);
          return;
        }
        if (!meta) return;
        const key = event.key.toLowerCase();
        if (key === "s" && event.shiftKey) {
          event.preventDefault();
          void saveAs();
        } else if (key === "s") {
          event.preventDefault();
          void save();
        } else if (key === "o" && event.shiftKey) {
          event.preventDefault();
          void value.openFolder();
        } else if (key === "o") {
          event.preventDefault();
          void value.openFiles();
        } else if (key === "w") {
          event.preventDefault();
          if (activeRef.current) closeTab(activeRef.current, false);
        } else if (key === "b") {
          event.preventDefault();
          setSidebar((open) => !open);
        } else if (key === "\\") {
          event.preventDefault();
          value.toggleSplit();
        } else if (key === "f" && event.shiftKey) {
          event.preventDefault();
          setSearchOpen(true);
        } else if (key === "f" && !inEditor) {
          event.preventDefault();
          setSearchOpen(true);
        } else if (key === "h") {
          event.preventDefault();
          const doc = focusedDoc();
          if (doc) void showHistory(doc.id);
        } else if (key === "l" && event.shiftKey) {
          event.preventDefault();
          setPrefs((current) => ({ ...current, mode: current.mode === "light" ? "dark" : "light" }));
        } else if (key === "/" ) {
          event.preventDefault();
          setShortcuts((open) => !open);
        } else if (event.key === "Tab") {
          event.preventDefault();
          const list = tabsRef.current;
          const index = list.indexOf(activeRef.current ?? "");
          if (index < 0) return;
          const next = list[(index + (event.shiftKey ? list.length - 1 : 1)) % list.length];
          setActiveId(next);
        }
      },
    };
    return value;
    // The store object is rebuilt when state changes. Callbacks close over the latest render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    boot,
    bootError,
    docs,
    tabs,
    activeId,
    secondaryId,
    split,
    focus,
    sidebar,
    prefs,
    recents,
    tree,
    expanded,
    selected,
    inbox,
    toasts,
    search,
    searchHits,
    searchOpen,
    historyFor,
    snapshots,
    about,
    privacy,
    shortcuts,
    confirmClose,
    dragging,
    shell,
  ]);

  apiRef.current = api;

  return (
    <StoreContext.Provider value={api}>
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          const list = event.target.files;
          if (!list?.length) return;
          void ingestMany([...list].map((file) => ({ name: file.name, blob: file })));
          event.target.value = "";
        }}
      />
      <input
        ref={dirRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          const list = [...(event.target.files ?? [])];
          event.target.value = "";
          if (!list.length) return;
          void stageDropped(list.map((file) => ({ file, rel: file.webkitRelativePath || file.name })));
        }}
      />
      {children}
    </StoreContext.Provider>
  );
}

async function loadDesk(): Promise<BootPayload> {
  const idb = await IdbSnapshotDb.open().catch(() => null);
  desk = {
    idb,
    snapshots: new SnapshotStore(idb ?? new MemorySnapshotDb(), FILE_LIMITS.perDocumentSnapshots),
  };
  const shell = shellName();
  document.documentElement.dataset.shell = shell;
  const recents = idb ? (await idb.listRecents()).slice(0, FILE_LIMITS.recentCount) : [];
  const session = idb ? await idb.kvGet<SessionDoc[]>("session") : null;
  let inbox: InboxItem[] = [];
  if (isAndroid()) {
    inbox = await pendingShares().catch(() => []);
    if (!shareListening) {
      shareListening = true;
      void listenForShares(() => {
        void pendingShares()
          .then((files) => onInbox?.(files))
          .catch(() => undefined);
      });
    }
  }
  return { recents, session, inbox, shell };
}

function restoreSession(session: SessionDoc[] | null): DocMeta[] {
  if (!session?.length) return [];
  const restored: DocMeta[] = [];
  for (const item of session) {
    if (!item.bytes && item.text == null && !item.sheet) continue;
    if (item.text != null) registry.setText(item.meta.id, item.text);
    if (item.sheet) registry.setSheet(item.meta.id, item.sheet);
    if (item.bytes) registry.setBytes(item.meta.id, item.bytes, mimeFor(item.meta.name));
    restored.push({ ...item.meta, loading: false });
  }
  return restored;
}

export function useStore(): StoreApi {
  const store = useContext(StoreContext);
  if (!store) throw new Error("NeoFile store is missing");
  return store;
}
