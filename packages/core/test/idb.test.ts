import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { IdbSnapshotDb, SnapshotStore, docIdentity, safeFileName } from "../src/index";

describe("indexedDB snapshots and file identity", () => {
  it("round-trips a snapshot through IndexedDB", async () => {
    const db = await IdbSnapshotDb.open();
    const store = new SnapshotStore(db, 5);
    const payload = new TextEncoder().encode("local only");
    await store.push({ docKey: "k", payload, kind: "manual", label: "Kept", now: 10, id: "s1" });
    const restored = await store.restore("s1");
    expect(new TextDecoder().decode(restored!.payload)).toBe("local only");
    await db.eraseAll();
    expect(await store.list("k")).toEqual([]);
  });

  it("keeps a stable identity and a safe download name", () => {
    const head = new Uint8Array([1, 2, 3, 4]);
    expect(docIdentity("Notes.md", 4, head)).toBe(docIdentity("notes.md", 4, head));
    expect(docIdentity("Notes.md", 5, head)).not.toBe(docIdentity("Notes.md", 4, head));
    expect(safeFileName("../weird:/name?.md")).toBe("name_.md");
    expect(safeFileName("report:final*.txt")).toBe("report_final_.txt");
    expect(safeFileName("   ")).toBe("untitled");
  });
});
