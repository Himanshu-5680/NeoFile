import { beforeEach, describe, expect, it } from "vitest";
import { buildDroppedTree } from "../src/state/dropped-tree";
import { nodeBlobs } from "../src/state/external";
import type { TreeNode } from "../src/state/types";

function file(name: string, body: string): File {
  return new File([body], name, { type: "text/plain" });
}

function labels(nodes: TreeNode[] | null | undefined): string[] {
  return (nodes ?? []).map((node) => `${node.kind}:${node.name}`);
}

describe("buildDroppedTree", () => {
  beforeEach(() => {
    nodeBlobs.clear();
  });

  it("uses the selected folder as the root instead of nesting it again", async () => {
    const alpha = file("a.txt", "alpha");
    const beta = file("b.txt", "beta");
    const built = buildDroppedTree([
      { file: beta, rel: "Notes/sub/b.txt" },
      { file: alpha, rel: "Notes/a.txt" },
    ]);
    expect(built.root?.name).toBe("Notes");
    expect(labels(built.root?.children)).toEqual(["dir:sub", "file:a.txt"]);
    const sub = built.root?.children?.find((node) => node.name === "sub");
    expect(labels(sub?.children)).toEqual(["file:b.txt"]);
    expect(built.root?.children?.some((node) => node.name === "Notes")).toBe(false);
    const alphaId = built.idByFile.get(alpha);
    const betaId = built.idByFile.get(beta);
    expect(alphaId).toEqual(expect.any(String));
    expect(betaId).toEqual(expect.any(String));
    expect(alphaId).not.toBe(betaId);
    expect(await (nodeBlobs.get(alphaId!) as File).text()).toBe("alpha");
    expect(await (nodeBlobs.get(betaId!) as File).text()).toBe("beta");
    const rootFile = built.root?.children?.find((node) => node.name === "a.txt");
    const nestedFile = sub?.children?.find((node) => node.name === "b.txt");
    expect(rootFile?.id).toBe(alphaId);
    expect(nestedFile?.id).toBe(betaId);
  });

  it("keeps same leaf names under different child folders", async () => {
    const left = file("x.txt", "left");
    const right = file("x.txt", "right");
    const built = buildDroppedTree([
      { file: left, rel: "Photos/a/x.txt" },
      { file: right, rel: "Photos/b/x.txt" },
    ]);
    expect(built.root?.name).toBe("Photos");
    expect(labels(built.root?.children)).toEqual(["dir:a", "dir:b"]);
    expect(await (nodeBlobs.get(built.idByFile.get(left)!) as File).text()).toBe("left");
    expect(await (nodeBlobs.get(built.idByFile.get(right)!) as File).text()).toBe("right");
  });

  it("keeps separately dropped folders as siblings, including same file names", async () => {
    const one = file("x.txt", "one");
    const two = file("x.txt", "two");
    const built = buildDroppedTree([
      { file: one, rel: "A/x.txt" },
      { file: two, rel: "B/x.txt" },
    ]);
    expect(built.root?.name).toBe("Dropped items");
    expect(labels(built.root?.children)).toEqual(["dir:A", "dir:B"]);
    const left = built.root?.children?.find((node) => node.name === "A");
    const right = built.root?.children?.find((node) => node.name === "B");
    expect(left?.children?.[0].id).not.toBe(right?.children?.[0].id);
    expect(await (nodeBlobs.get(left!.children![0].id) as File).text()).toBe("one");
    expect(await (nodeBlobs.get(right!.children![0].id) as File).text()).toBe("two");
  });

  it("does not build a tree for loose files", () => {
    const built = buildDroppedTree([{ file: file("a.txt", "a"), rel: "a.txt" }]);
    expect(built.root).toBeNull();
    expect(built.idByFile.size).toBe(0);
  });
});
