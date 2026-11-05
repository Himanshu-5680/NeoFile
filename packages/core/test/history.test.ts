import { describe, expect, it } from "vitest";
import { GridHistory, HistoryStack, applyCellPatch } from "../src/index";

describe("history", () => {
  it("undoes and redoes cell edits, including paste batches", () => {
    const history = new GridHistory();
    let rows = [
      ["a", "b"],
      ["c", "d"],
    ];
    history.push({
      label: "edit",
      changes: [{ sheet: 0, row: 0, col: 1, before: "b", after: "B" }],
    });
    rows = applyCellPatch(rows, history.undo()!.changes, "undo");
    expect(rows[0][1]).toBe("b");
    rows = applyCellPatch(rows, history.redo()!.changes, "redo");
    expect(rows[0][1]).toBe("B");

    history.push({
      label: "paste",
      changes: [
        { sheet: 0, row: 1, col: 0, before: "c", after: "1" },
        { sheet: 0, row: 1, col: 1, before: "d", after: "2" },
      ],
    });
    const undone = history.undo()!;
    rows = applyCellPatch(rows, undone.changes, "undo");
    expect(rows[1]).toEqual(["c", "d"]);
  });

  it("ignores no-op patches and caps the stack", () => {
    const history = new GridHistory(2);
    history.push({ label: "noop", changes: [{ sheet: 0, row: 0, col: 0, before: "a", after: "a" }] });
    expect(history.canUndo).toBe(false);
    history.push({ label: "1", changes: [{ sheet: 0, row: 0, col: 0, before: "a", after: "b" }] });
    history.push({ label: "2", changes: [{ sheet: 0, row: 0, col: 0, before: "b", after: "c" }] });
    history.push({ label: "3", changes: [{ sheet: 0, row: 0, col: 0, before: "c", after: "d" }] });
    expect(history.undo()?.label).toBe("3");
    expect(history.undo()?.label).toBe("2");
    expect(history.undo()).toBeNull();
  });

  it("tracks a generic undo stack", () => {
    const stack = new HistoryStack<string>();
    stack.reset("one");
    stack.push("one");
    stack.push("two");
    expect(stack.undo()).toBe("one");
    expect(stack.redo()).toBe("two");
    expect(stack.canRedo).toBe(false);
  });
});
