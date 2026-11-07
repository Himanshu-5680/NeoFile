import { uid } from "@neofile/core";
import type { DroppedFile } from "@/platform/drop";
import { nodeBlobs, sortNodes } from "@/state/external";
import type { TreeNode } from "@/state/types";

/**
 * Build the sidebar tree for a drop or a directory picker.
 * The first path segment is the folder the person selected. It becomes the
 * tree root, not an extra nested directory with the same name.
 * Several top-level folders share one "Dropped items" root so they stay siblings.
 */
export function buildDroppedTree(dropped: DroppedFile[]): { root: TreeNode | null; idByFile: Map<File, string> } {
  const idByFile = new Map<File, string>();
  const rooted = dropped.some((item) => item.rel.includes("/"));
  if (!rooted) return { root: null, idByFile };

  const tops = [
    ...new Set(
      dropped
        .map((item) => item.rel.split("/").filter(Boolean)[0])
        .filter((part): part is string => Boolean(part)),
    ),
  ];
  const singleTop = tops.length === 1 ? tops[0] : null;
  const root: TreeNode = {
    id: `drop-${uid()}`,
    name: singleTop ?? "Dropped items",
    kind: "dir",
    children: [],
  };

  for (const item of dropped) {
    const parts = item.rel.split("/").filter(Boolean);
    const inner = singleTop && parts[0] === singleTop ? parts.slice(1) : parts;
    if (inner.length === 0) continue;
    let cursor = root;
    for (let index = 0; index < inner.length; index += 1) {
      const part = inner[index];
      const last = index === inner.length - 1;
      const kind = last ? "file" : "dir";
      let child = cursor.children?.find((node) => node.name === part && node.kind === kind);
      if (!child) {
        child = { id: `drop-${uid()}`, name: part, kind, children: last ? null : [] };
        cursor.children = sortNodes([...(cursor.children ?? []), child]);
      }
      if (last) {
        nodeBlobs.set(child.id, item.file);
        idByFile.set(item.file, child.id);
      } else if (child.children) {
        cursor = child;
      }
    }
  }

  return { root, idByFile };
}
