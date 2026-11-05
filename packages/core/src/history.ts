export interface CellChange {
  sheet: number;
  row: number;
  col: number;
  before: string;
  after: string;
}

export interface GridPatch {
  label: string;
  changes: CellChange[];
}

export class GridHistory {
  private undoStack: GridPatch[] = [];
  private redoStack: GridPatch[] = [];

  constructor(private readonly limit = 100) {}

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  push(patch: GridPatch): void {
    const changes = patch.changes.filter((change) => change.before !== change.after);
    if (changes.length === 0) return;
    this.undoStack.push({ label: patch.label, changes });
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(): GridPatch | null {
    const patch = this.undoStack.pop();
    if (!patch) return null;
    this.redoStack.push(patch);
    return patch;
  }

  redo(): GridPatch | null {
    const patch = this.redoStack.pop();
    if (!patch) return null;
    this.undoStack.push(patch);
    return patch;
  }
}

export class HistoryStack<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private current: T | null = null;

  constructor(private readonly limit = 50) {}

  reset(value: T): void {
    this.current = value;
    this.undoStack = [];
    this.redoStack = [];
  }

  push(value: T): void {
    if (this.current !== null && sameValue(this.current, value)) return;
    if (this.current !== null) {
      this.undoStack.push(this.current);
      if (this.undoStack.length > this.limit) this.undoStack.shift();
    }
    this.current = value;
    this.redoStack = [];
  }

  undo(): T | null {
    const prev = this.undoStack.pop();
    if (prev === undefined || this.current === null) return null;
    this.redoStack.push(this.current);
    this.current = prev;
    return prev;
  }

  redo(): T | null {
    const next = this.redoStack.pop();
    if (next === undefined || this.current === null) return null;
    this.undoStack.push(this.current);
    this.current = next;
    return next;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

function sameValue<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a === "string" && typeof b === "string") return a === b;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function applyCellPatch(
  rows: string[][],
  changes: CellChange[],
  direction: "undo" | "redo",
): string[][] {
  const next = rows.map((row) => row.slice());
  for (const change of changes) {
    while (next.length <= change.row) next.push([]);
    while (next[change.row].length <= change.col) next[change.row].push("");
    next[change.row][change.col] = direction === "undo" ? change.before : change.after;
  }
  return next;
}
