import { detectDelimiter, parseCsv, searchDocuments, type Delimiter, type SearchDoc, type SearchHit } from "@neofile/core";
import { workbookRejection } from "../lib/sheets";
import * as XLSX from "xlsx";

type Request =
  | { id: string; type: "csv"; bytes: Uint8Array }
  | { id: string; type: "xlsx"; bytes: Uint8Array }
  | { id: string; type: "search"; docs: SearchDoc[]; query: string; limit?: number };

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

self.onmessage = (event: MessageEvent<Request>) => {
  const message = event.data;
  try {
    if (message.type === "csv") {
      const text = new TextDecoder().decode(message.bytes);
      const delimiter: Delimiter = detectDelimiter(text);
      self.postMessage({ id: message.id, ok: true, delimiter, rows: parseCsv(text, delimiter) });
      return;
    }
    if (message.type === "xlsx") {
      const rejection = workbookRejection(message.bytes);
      if (rejection) throw new Error(rejection);
      const workbook = XLSX.read(message.bytes, { type: "array", cellDates: true });
      const sheets =
        workbook.SheetNames.length === 0
          ? [{ name: "Sheet1", rows: [[""]] }]
          : workbook.SheetNames.map((name) => {
              const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
                header: 1,
                raw: true,
                defval: "",
              });
              const rows = grid.map((row) => (Array.isArray(row) ? row.map((cell) => cellToString(cell)) : []));
              return { name, rows: rows.length ? rows : [[""]] };
            });
      self.postMessage({ id: message.id, ok: true, sheets });
      return;
    }
    const hits: SearchHit[] = searchDocuments(message.docs, message.query, message.limit ?? 40);
    self.postMessage({ id: message.id, ok: true, hits });
  } catch (error) {
    self.postMessage({
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : "Could not read that file",
    });
  }
};
