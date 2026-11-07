import { safeFileName } from "@neofile/core";
import { base64ToBytes, bytesToBase64, downloadBytes, mimeFor, toArrayBuffer } from "@/lib/bytes";
import { nodeId, sortNodes } from "@/state/external";
import type { InboxItem, TreeNode } from "@/state/types";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function isAndroid(): boolean {
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return cap?.getPlatform?.() === "android";
}

export function shellName(): "web" | "desktop" | "android" {
  if (isAndroid()) return "android";
  if (isTauri()) return "desktop";
  return "web";
}

function cancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export interface PickedFile {
  name: string;
  blob: Blob;
  path?: string;
  handle?: FileSystemFileHandle;
}

interface NeoPlugin {
  pendingShares(): Promise<{ files: InboxItem[] }>;
  readShare(opts: { id: string }): Promise<{ name: string; base64: string }>;
  dismissShare(opts: { id: string }): Promise<void>;
  pickFiles(): Promise<{ files: { name: string; base64: string }[] }>;
  pickFolder(): Promise<{ uri: string; name: string } | null>;
  listDir(opts: { uri: string }): Promise<{ entries: { name: string; uri: string; dir: boolean; size: number }[] }>;
  readUri(opts: { uri: string }): Promise<{ name: string; base64: string }>;
  saveFile(opts: { name: string; mime: string; base64: string }): Promise<{ location: string }>;
  addListener(event: "shareReceived", cb: () => void): Promise<{ remove: () => Promise<void> }>;
}

let androidPlugin: NeoPlugin | null = null;

/**
 * Capacitor plugin proxies are thenable. Returning one from an async function
 * makes the caller await a native "then" method, which this plugin does not have,
 * and the desk never finishes opening.
 */
export function holdPlugin<T extends object>(plugin: T): { plugin: T } {
  return { plugin };
}

async function android(): Promise<{ plugin: NeoPlugin }> {
  if (!androidPlugin) {
    const { registerPlugin } = await import("@capacitor/core");
    androidPlugin = registerPlugin<NeoPlugin>("NeoFile");
  }
  return holdPlugin(androidPlugin);
}

export async function pickOpenFiles(): Promise<PickedFile[] | "fallback"> {
  if (isAndroid()) {
    const { plugin } = await android();
    const result = await plugin.pickFiles();
    return result.files.map((file) => ({
      name: file.name,
      blob: new Blob([toArrayBuffer(base64ToBytes(file.base64))]),
    }));
  }
  if (isTauri()) {
    const dialog = await import("@tauri-apps/plugin-dialog");
    const fs = await import("@tauri-apps/plugin-fs");
    const picked = await dialog.open({ multiple: true, directory: false });
    if (!picked) return [];
    const paths = Array.isArray(picked) ? picked : [picked];
    const files: PickedFile[] = [];
    for (const path of paths) {
      const bytes = await fs.readFile(path);
      const name = path.split(/[/\\]/).pop() || "file";
      files.push({ name, path, blob: new Blob([toArrayBuffer(bytes)]) });
    }
    return files;
  }
  if (typeof window.showOpenFilePicker === "function") {
    try {
      const handles = await window.showOpenFilePicker({ multiple: true });
      const files: PickedFile[] = [];
      for (const handle of handles) {
        const file = await handle.getFile();
        files.push({ name: file.name, blob: file, handle });
      }
      return files;
    } catch (error) {
      if (cancelled(error)) return [];
      return "fallback";
    }
  }
  return "fallback";
}

export async function pickDirectoryWeb(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window.showDirectoryPicker !== "function") return null;
  try {
    return await window.showDirectoryPicker();
  } catch (error) {
    if (cancelled(error)) return null;
    return null;
  }
}

export async function directoryToTree(dir: FileSystemDirectoryHandle, remember: (id: string, handle: FileSystemHandle) => void): Promise<TreeNode> {
  const id = nodeId("dir");
  remember(id, dir);
  return { id, name: dir.name, kind: "dir", children: null };
}

export async function readDirectoryHandle(dir: FileSystemDirectoryHandle, remember: (id: string, handle: FileSystemHandle) => void): Promise<TreeNode[]> {
  const nodes: TreeNode[] = [];
  for await (const [name, handle] of dir.entries()) {
    const id = nodeId(handle.kind);
    remember(id, handle);
    nodes.push({
      id,
      name,
      kind: handle.kind === "directory" ? "dir" : "file",
      children: null,
    });
  }
  return sortNodes(nodes);
}

export async function pickDirectoryTauri(): Promise<TreeNode | null> {
  const dialog = await import("@tauri-apps/plugin-dialog");
  const picked = await dialog.open({ directory: true, multiple: false });
  if (!picked || Array.isArray(picked)) return null;
  const name = picked.split(/[/\\]/).pop() || picked;
  return { id: nodeId("dir"), name, kind: "dir", path: picked, children: null };
}

export async function readDirPath(path: string): Promise<TreeNode[]> {
  const fs = await import("@tauri-apps/plugin-fs");
  const entries = await fs.readDir(path);
  return sortNodes(
    entries.map((entry) => {
      const child = joinPath(path, entry.name);
      const dir = Boolean(entry.isDirectory);
      return {
        id: nodeId(dir ? "dir" : "file"),
        name: entry.name,
        kind: dir ? "dir" : "file",
        path: child,
        children: dir ? null : null,
      };
    }),
  );
}

export async function readFilePath(path: string): Promise<Uint8Array> {
  const fs = await import("@tauri-apps/plugin-fs");
  return fs.readFile(path);
}

export async function writeFilePath(path: string, bytes: Uint8Array): Promise<void> {
  const fs = await import("@tauri-apps/plugin-fs");
  await fs.writeFile(path, bytes);
}

export async function savePathDialog(name: string): Promise<string | null> {
  const dialog = await import("@tauri-apps/plugin-dialog");
  const picked = await dialog.save({ defaultPath: safeFileName(name) });
  return picked;
}

function joinPath(parent: string, name: string): string {
  if (parent.endsWith("/") || parent.endsWith("\\")) return `${parent}${name}`;
  const sep = parent.includes("\\") && !parent.includes("/") ? "\\" : "/";
  return `${parent}${sep}${name}`;
}

export async function pickDirectoryAndroid(): Promise<TreeNode | null> {
  const { plugin } = await android();
  const picked = await plugin.pickFolder();
  if (!picked?.uri) return null;
  return { id: nodeId("dir"), name: picked.name || "Folder", kind: "dir", uri: picked.uri, children: null };
}

export async function readDirUri(uri: string): Promise<TreeNode[]> {
  const { plugin } = await android();
  const result = await plugin.listDir({ uri });
  return sortNodes(
    result.entries.map((entry) => ({
      id: nodeId(entry.dir ? "dir" : "file"),
      name: entry.name || "untitled",
      kind: entry.dir ? "dir" : "file",
      uri: entry.uri,
      children: entry.dir ? null : null,
    })),
  );
}

export async function readUriBytes(uri: string): Promise<{ name: string; bytes: Uint8Array }> {
  const { plugin } = await android();
  const result = await plugin.readUri({ uri });
  return { name: result.name, bytes: base64ToBytes(result.base64) };
}

export async function pendingShares(): Promise<InboxItem[]> {
  if (!isAndroid()) return [];
  const { plugin } = await android();
  const result = await plugin.pendingShares();
  return result.files ?? [];
}

export async function readShare(id: string): Promise<{ name: string; bytes: Uint8Array }> {
  const { plugin } = await android();
  const result = await plugin.readShare({ id });
  return { name: result.name, bytes: base64ToBytes(result.base64) };
}

export async function dismissShare(id: string): Promise<void> {
  const { plugin } = await android();
  await plugin.dismissShare({ id });
}

export async function listenForShares(onShare: () => void): Promise<() => void> {
  if (!isAndroid()) return () => undefined;
  const { plugin } = await android();
  const handle = await plugin.addListener("shareReceived", onShare);
  return () => {
    void handle.remove();
  };
}

export async function saveBytes(name: string, bytes: Uint8Array, path?: string | null): Promise<"disk" | "download" | "android"> {
  if (path && isTauri()) {
    await writeFilePath(path, bytes);
    return "disk";
  }
  if (isAndroid()) {
    const { plugin } = await android();
    await plugin.saveFile({ name: safeFileName(name), mime: mimeFor(name), base64: bytesToBase64(bytes) });
    return "android";
  }
  downloadBytes(bytes, name);
  return "download";
}

export async function windowAction(action: "minimize" | "toggle" | "hide"): Promise<void> {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const current = getCurrentWindow();
  if (action === "minimize") await current.minimize();
  if (action === "toggle") await current.toggleMaximize();
  if (action === "hide") await current.hide();
}

export async function writeHandle(handle: FileSystemFileHandle, bytes: Uint8Array): Promise<void> {
  const current = await handle.queryPermission({ mode: "readwrite" });
  if (current !== "granted") {
    const next = await handle.requestPermission({ mode: "readwrite" });
    if (next !== "granted") throw new Error("NeoFile does not have permission to write that file.");
  }
  const writable = await handle.createWritable();
  await writable.write(new Blob([toArrayBuffer(bytes)]));
  await writable.close();
}
