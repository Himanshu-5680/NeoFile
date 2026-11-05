import { describe, expect, it } from "vitest";
import { MemorySnapshotDb, SnapshotStore, bytesEqual } from "../src/index";

const enc = new TextEncoder();

describe("snapshots", () => {
  it("stores, skips identical payloads, and restores", async () => {
    const store = new SnapshotStore(new MemorySnapshotDb(), 5);
    const first = await store.push({
      docKey: "doc",
      payload: enc.encode("one"),
      kind: "auto",
      now: 1,
      id: "a",
    });
    const skipped = await store.push({
      docKey: "doc",
      payload: enc.encode("one"),
      kind: "auto",
      now: 2,
      id: "b",
    });
    const second = await store.push({
      docKey: "doc",
      payload: enc.encode("two"),
      kind: "manual",
      label: "Before rewrite",
      now: 3,
      id: "c",
    });
    expect(first?.id).toBe("a");
    expect(skipped).toBeNull();
    expect(second?.label).toBe("Before rewrite");
    const list = await store.list("doc");
    expect(list.map((item) => item.id)).toEqual(["c", "a"]);
    const restored = await store.restore("a");
    expect(restored && new TextDecoder().decode(restored.payload)).toBe("one");
  });

  it("drops the oldest auto snapshot before manuals", async () => {
    const store = new SnapshotStore(new MemorySnapshotDb(), 2);
    await store.push({ docKey: "doc", payload: enc.encode("a"), kind: "auto", now: 1, id: "auto" });
    await store.push({ docKey: "doc", payload: enc.encode("b"), kind: "manual", now: 2, id: "manual" });
    await store.push({ docKey: "doc", payload: enc.encode("c"), kind: "manual", now: 3, id: "manual-2" });
    const ids = (await store.list("doc")).map((item) => item.id);
    expect(ids).not.toContain("auto");
    expect(ids).toEqual(["manual-2", "manual"]);
  });

  it("compares bytes exactly", () => {
    expect(bytesEqual(enc.encode("ab"), enc.encode("ab"))).toBe(true);
    expect(bytesEqual(enc.encode("ab"), enc.encode("a"))).toBe(false);
  });
});
