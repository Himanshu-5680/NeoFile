import { detectDelimiter, parseCsv, searchDocuments, type Delimiter, type SearchDoc, type SearchHit } from "@neofile/core";
import { decodeText } from "@/lib/bytes";
import { sheetsFromXlsx } from "@/lib/sheets";

interface OkPayload {
  id: string;
  ok: boolean;
  error?: string;
  delimiter?: Delimiter;
  rows?: string[][];
  sheets?: { name: string; rows: string[][] }[];
  hits?: SearchHit[];
}

let worker: Worker | null = null;
let workerBroken = false;
const pending = new Map<string, { resolve: (value: OkPayload) => void; reject: (error: Error) => void }>();

function ensureWorker(): Worker | null {
  if (workerBroken || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./heavy.worker.ts", import.meta.url), { type: "module" });
  } catch {
    workerBroken = true;
    return null;
  }
  worker.onmessage = (event: MessageEvent<OkPayload>) => {
    const waiter = pending.get(event.data.id);
    if (!waiter) return;
    pending.delete(event.data.id);
    if (event.data.ok) waiter.resolve(event.data);
    else waiter.reject(new Error(event.data.error || "Could not read that file"));
  };
  worker.onerror = () => {
    workerBroken = true;
    for (const waiter of pending.values()) waiter.reject(new Error("Background reader stopped"));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function call(body: Record<string, unknown>): Promise<OkPayload> {
  const reader = ensureWorker();
  if (!reader) return Promise.reject(new Error("no-worker"));
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    reader.postMessage({ id, ...body });
  });
}

export async function parseTable(bytes: Uint8Array): Promise<{ delimiter: Delimiter; rows: string[][] }> {
  if (bytes.byteLength < 48_000 || workerBroken) {
    const text = decodeText(bytes);
    const delimiter = detectDelimiter(text);
    return { delimiter, rows: parseCsv(text, delimiter) };
  }
  try {
    const result = await call({ type: "csv", bytes });
    return { delimiter: result.delimiter ?? ",", rows: result.rows ?? [[""]] };
  } catch (error) {
    if (workerBroken || (error instanceof Error && error.message === "no-worker")) {
      const text = decodeText(bytes);
      const delimiter = detectDelimiter(text);
      return { delimiter, rows: parseCsv(text, delimiter) };
    }
    throw error;
  }
}

export async function parseWorkbook(bytes: Uint8Array): Promise<{ name: string; rows: string[][] }[]> {
  if (!workerBroken) {
    try {
      const result = await call({ type: "xlsx", bytes });
      return result.sheets ?? [{ name: "Sheet1", rows: [[""]] }];
    } catch (error) {
      if (!(workerBroken || (error instanceof Error && error.message === "no-worker"))) throw error;
    }
  }
  return sheetsFromXlsx(bytes);
}

export async function searchDesk(docs: SearchDoc[], query: string): Promise<SearchHit[]> {
  const size = docs.reduce((sum, doc) => sum + doc.text.length, 0);
  if (size < 120_000 || workerBroken) return searchDocuments(docs, query);
  try {
    const result = await call({ type: "search", docs, query, limit: 40 });
    return result.hits ?? [];
  } catch {
    return searchDocuments(docs, query);
  }
}
