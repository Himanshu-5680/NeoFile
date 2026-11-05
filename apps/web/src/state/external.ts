import type { TreeNode } from "./types";

export const nodeBlobs = new Map<string, File | FileSystemFileHandle>();
export const nodeDirs = new Map<string, FileSystemDirectoryHandle>();

export function findNode(root: TreeNode | null, id: string): TreeNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function parentChildren(root: TreeNode | null, id: string): TreeNode[] | null {
  if (!root?.children) return null;
  if (root.children.some((child) => child.id === id)) return root.children;
  for (const child of root.children) {
    const found = parentChildren(child, id);
    if (found) return found;
  }
  return null;
}

export function visibleNodeIds(root: TreeNode | null, expanded: string[]): string[] {
  if (!root?.children) return [];
  const open = new Set(expanded);
  const ids: string[] = [];
  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.kind === "dir" && node.children && open.has(node.id)) walk(node.children);
    }
  };
  walk(root.children);
  return ids;
}

export function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

let nodeSeq = 0;
export function nodeId(prefix: string): string {
  nodeSeq += 1;
  return `${prefix}:${nodeSeq}`;
}
