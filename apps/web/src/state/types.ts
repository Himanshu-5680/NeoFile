import type { EditMode, FileKind, LanguageId } from "@neofile/core";

export type Origin = "disk" | "sample" | "share" | "recent";
export type SaveState = "idle" | "saving" | "local" | "disk" | "error";
export type Shell = "web" | "desktop" | "android";

export interface DocMeta {
  id: string;
  name: string;
  kind: FileKind;
  mode: EditMode;
  highlighter: LanguageId | null;
  displayLanguage: string;
  limit: string | null;
  size: number;
  dirty: boolean;
  saveState: SaveState;
  saveDetail: string;
  error: string | null;
  loading: boolean;
  origin: Origin;
  identity: string;
  path: string | null;
  epoch: number;
  openedAt: number;
  treeNodeId: string | null;
  locked: boolean;
}

export interface TreeNode {
  id: string;
  name: string;
  kind: "file" | "dir";
  path?: string;
  uri?: string;
  children: TreeNode[] | null;
}

export interface InboxItem {
  id: string;
  name: string;
  size: number;
}

export interface Toast {
  id: string;
  message: string;
}

export interface IngestInput {
  name: string;
  blob: Blob;
  path?: string | null;
  origin: Origin;
  handle?: FileSystemFileHandle;
  treeNodeId?: string | null;
}
