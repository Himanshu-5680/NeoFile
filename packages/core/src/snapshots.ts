export interface SnapshotMeta {
  id: string;
  docKey: string;
  createdAt: number;
  label: string;
  kind: "auto" | "manual";
  bytes: number;
}

export interface SnapshotRecord extends SnapshotMeta {
  payload: Uint8Array;
}

export interface SnapshotPersistence {
  put(record: SnapshotRecord): Promise<void>;
  get(id: string): Promise<SnapshotRecord | null>;
  list(docKey: string): Promise<SnapshotMeta[]>;
  delete(id: string): Promise<void>;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export class MemorySnapshotDb implements SnapshotPersistence {
  private records = new Map<string, SnapshotRecord>();

  async put(record: SnapshotRecord): Promise<void> {
    this.records.set(record.id, {
      ...record,
      payload: record.payload.slice(),
    });
  }

  async get(id: string): Promise<SnapshotRecord | null> {
    const found = this.records.get(id);
    if (!found) return null;
    return { ...found, payload: found.payload.slice() };
  }

  async list(docKey: string): Promise<SnapshotMeta[]> {
    const metas: SnapshotMeta[] = [];
    for (const record of this.records.values()) {
      if (record.docKey !== docKey) continue;
      metas.push({
        id: record.id,
        docKey: record.docKey,
        createdAt: record.createdAt,
        label: record.label,
        kind: record.kind,
        bytes: record.bytes,
      });
    }
    return metas;
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }
}

export class SnapshotStore {
  constructor(
    private readonly db: SnapshotPersistence,
    private readonly limit = 20,
  ) {}

  async push(input: {
    docKey: string;
    payload: Uint8Array;
    kind: "auto" | "manual";
    label?: string;
    now?: number;
    id?: string;
  }): Promise<SnapshotMeta | null> {
    const existing = await this.db.list(input.docKey);
    const newest = [...existing].sort((a, b) => b.createdAt - a.createdAt)[0];
    if (newest) {
      const prev = await this.db.get(newest.id);
      if (prev && bytesEqual(prev.payload, input.payload)) return null;
    }

    const record: SnapshotRecord = {
      id: input.id ?? cryptoRandom(),
      docKey: input.docKey,
      createdAt: input.now ?? Date.now(),
      label: input.label ?? (input.kind === "auto" ? "Auto-save" : "Snapshot"),
      kind: input.kind,
      bytes: input.payload.byteLength,
      payload: input.payload,
    };
    await this.db.put(record);
    await this.prune(input.docKey);
    return {
      id: record.id,
      docKey: record.docKey,
      createdAt: record.createdAt,
      label: record.label,
      kind: record.kind,
      bytes: record.bytes,
    };
  }

  async list(docKey: string): Promise<SnapshotMeta[]> {
    const all = await this.db.list(docKey);
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }

  async restore(id: string): Promise<SnapshotRecord | null> {
    return this.db.get(id);
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(id);
  }

  private async prune(docKey: string): Promise<void> {
    let all = await this.db.list(docKey);
    while (all.length > this.limit) {
      const oldestAuto = [...all]
        .filter((item) => item.kind === "auto")
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      const victim =
        oldestAuto ??
        [...all].sort((a, b) => a.createdAt - b.createdAt)[0];
      if (!victim) break;
      await this.db.delete(victim.id);
      all = all.filter((item) => item.id !== victim.id);
    }
  }
}

function cryptoRandom(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") return cryptoObj.randomUUID();
  return `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
