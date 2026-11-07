import type { Delimiter } from "@neofile/core";
import { trimSheet } from "@neofile/core";
import type { SheetModel } from "@/state/registry";

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

function coerce(value: string): string | number | boolean {
  if (value === "TRUE") return true;
  if (value === "FALSE") return false;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return value;
}

function sheetName(name: string, used: Set<string>, index: number): string {
  const base = name.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || `Sheet${index + 1}`;
  let next = base;
  let n = 2;
  while (used.has(next)) {
    const suffix = ` ${n++}`;
    next = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(next);
  return next;
}

export function workbookRejection(bytes: Uint8Array): string | null {
  if (bytes.byteLength === 0) return "This spreadsheet file is empty.";
  const zip = bytes.byteLength >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
  const ole = bytes.byteLength >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  if (!zip && !ole) return "This file is not a spreadsheet workbook.";
  return null;
}

export async function sheetsFromXlsx(bytes: Uint8Array): Promise<{ name: string; rows: string[][] }[]> {
  const rejection = workbookRejection(bytes);
  if (rejection) throw new Error(rejection);
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(bytes, { type: "array", cellDates: true });
  if (workbook.SheetNames.length === 0) return [{ name: "Sheet1", rows: [[""]] }];
  return workbook.SheetNames.map((name) => {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
      header: 1,
      raw: true,
      defval: "",
    });
    const rows = (Array.isArray(grid) ? grid : []).map((row) =>
      (Array.isArray(row) ? row : []).map((cell) => cellToString(cell)),
    );
    return { name, rows: rows.length ? rows : [[""]] };
  });
}

export async function sheetsToXlsx(model: SheetModel): Promise<Uint8Array> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const used = new Set<string>();
  model.sheets.forEach((sheet, index) => {
    const rows = trimSheet(sheet.rows).map((row) => row.map((cell) => coerce(cell ?? "")));
    const worksheet = XLSX.utils.aoa_to_sheet(rows.length ? rows : [[""]]);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName(sheet.name, used, index));
  });
  const out = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Uint8Array(out);
}

export function sheetTooBig(rows: string[][], maxRows: number, maxCols: number): boolean {
  if (rows.length > maxRows) return true;
  return rows.some((row) => row.length > maxCols);
}

export type ParsedCsv = { delimiter: Delimiter; rows: string[][] };
