import type { SnapshotPersistence, SnapshotRecord, SnapshotMeta } from "./snapshots";

const DB_NAME = "neofile";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("snapshots")) {
        const store = db.createObjectStore("snapshots", { keyPath: "id" });
        store.createIndex("docKey", "docKey", { unique: false });
      }
      if (!db.objectStoreNames.contains("recents")) {
        db.createObjectStore("recents", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB failed to open"));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export class IdbSnapshotDb implements SnapshotPersistence {
  constructor(private readonly db: IDBDatabase) {}

  static async open(): Promise<IdbSnapshotDb> {
    return new IdbSnapshotDb(await openDatabase());
  }

  async put(record: SnapshotRecord): Promise<void> {
    const tx = this.db.transaction("snapshots", "readwrite");
    tx.objectStore("snapshots").put({
      ...record,
      payload: record.payload.slice(),
    });
    await transactionDone(tx);
  }

  async get(id: string): Promise<SnapshotRecord | null> {
    const tx = this.db.transaction("snapshots", "readonly");
    const result = await requestToPromise(tx.objectStore("snapshots").get(id));
    return (result as SnapshotRecord | undefined) ?? null;
  }

  async list(docKey: string): Promise<SnapshotMeta[]> {
    const tx = this.db.transaction("snapshots", "readonly");
    const index = tx.objectStore("snapshots").index("docKey");
    const rows = (await requestToPromise(index.getAll(docKey))) as SnapshotRecord[];
    return rows.map((row) => ({
      id: row.id,
      docKey: row.docKey,
      createdAt: row.createdAt,
      label: row.label,
      kind: row.kind,
      bytes: row.bytes,
    }));
  }

  async delete(id: string): Promise<void> {
    const tx = this.db.transaction("snapshots", "readwrite");
    tx.objectStore("snapshots").delete(id);
    await transactionDone(tx);
  }

  async kvGet<T>(key: string): Promise<T | null> {
    const tx = this.db.transaction("kv", "readonly");
    const result = await requestToPromise(tx.objectStore("kv").get(key));
    return (result as T | undefined) ?? null;
  }

  async kvSet(key: string, value: unknown): Promise<void> {
    const tx = this.db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    await transactionDone(tx);
  }

  async kvDel(key: string): Promise<void> {
    const tx = this.db.transaction("kv", "readwrite");
    tx.objectStore("kv").delete(key);
    await transactionDone(tx);
  }

  async putRecent(record: RecentRecord): Promise<void> {
    const tx = this.db.transaction("recents", "readwrite");
    tx.objectStore("recents").put(record);
    await transactionDone(tx);
  }

  async listRecents(): Promise<RecentRecord[]> {
    const tx = this.db.transaction("recents", "readonly");
    const rows = (await requestToPromise(tx.objectStore("recents").getAll())) as RecentRecord[];
    return rows.sort((a, b) => b.openedAt - a.openedAt);
  }

  async deleteRecent(id: string): Promise<void> {
    const tx = this.db.transaction("recents", "readwrite");
    tx.objectStore("recents").delete(id);
    await transactionDone(tx);
  }

  async eraseAll(): Promise<void> {
    const tx = this.db.transaction(["snapshots", "recents", "kv"], "readwrite");
    tx.objectStore("snapshots").clear();
    tx.objectStore("recents").clear();
    tx.objectStore("kv").clear();
    await transactionDone(tx);
  }
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export interface RecentRecord {
  id: string;
  name: string;
  kind: string;
  mode: string;
  displayLanguage: string;
  highlighter: string | null;
  size: number;
  openedAt: number;
  preview: string;
  payload?: Uint8Array;
  path?: string;
  delimiter?: string;
}
