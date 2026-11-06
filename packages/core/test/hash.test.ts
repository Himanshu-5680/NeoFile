import { describe, expect, it } from "vitest";
import { docIdentity, fnv1a, safeFileName } from "../src/hash";

describe("fnv1a", () => {
  it("returns a stable 8 digit hex digest", () => {
    expect(fnv1a("")).toBe("811c9dc5");
    expect(fnv1a("NeoFile")).toMatch(/^[0-9a-f]{8}$/);
    expect(fnv1a("NeoFile")).toBe(fnv1a("NeoFile"));
    expect(fnv1a("NeoFile")).not.toBe(fnv1a("neofile"));
  });

  it("hashes each UTF-16 code unit as two bytes", () => {
    expect(fnv1a("a")).toBe(fnv1a(new Uint8Array([0x61, 0x00])));
    expect(fnv1a(new Uint8Array([0x61]))).not.toBe(fnv1a("a"));
    expect(fnv1a(new Uint8Array([0x00, 0xff]))).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("docIdentity", () => {
  it("changes when the name, length, or head bytes change", () => {
    const head = new Uint8Array([1, 2, 3, 4]);
    const id = docIdentity("Notes.md", 4, head);
    expect(id).toBe(docIdentity("notes.md", 4, head));
    expect(id).not.toBe(docIdentity("Other.md", 4, head));
    expect(id).not.toBe(docIdentity("Notes.md", 5, head));
    expect(id).not.toBe(docIdentity("Notes.md", 4, new Uint8Array([1, 2, 3, 5])));
  });

  it("only uses the first 64 KiB of the head", () => {
    const short = new Uint8Array(10).fill(7);
    const long = new Uint8Array(80_000).fill(7);
    expect(docIdentity("a.bin", 10, short)).toBe(docIdentity("a.bin", 10, long.subarray(0, 10)));
    expect(docIdentity("a.bin", 80_000, long)).toBe(docIdentity("a.bin", 80_000, long.subarray(0, 65_536)));
  });
});

describe("safeFileName", () => {
  it("drops directories and reserved characters", () => {
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName("folder\\report:final?.txt")).toBe("report_final_.txt");
    expect(safeFileName("C:/Users/me/notes.md")).toBe("notes.md");
  });

  it("rejects empty, dot, and parent names", () => {
    expect(safeFileName("")).toBe("untitled");
    expect(safeFileName(".")).toBe("untitled");
    expect(safeFileName("..")).toBe("untitled");
    expect(safeFileName("   ")).toBe("untitled");
    expect(safeFileName("..\\..\\..")).toBe("untitled");
  });

  it("strips control characters and caps the length", () => {
    expect(safeFileName("bad\u0000name.txt")).toBe("bad_name.txt");
    expect(safeFileName(`${"a".repeat(400)}.txt`).length).toBe(180);
    expect(safeFileName("..", "draft.txt")).toBe("draft.txt");
    expect(safeFileName("notes.txt", "draft.txt")).toBe("notes.txt");
  });
});
