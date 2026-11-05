export type Delimiter = "," | "\t" | ";";

export function detectDelimiter(input: string): Delimiter {
  const sample = input.slice(0, 8000);
  let commas = 0;
  let tabs = 0;
  let semis = 0;
  let quoted = false;
  for (let i = 0; i < sample.length; i++) {
    const c = sample[i];
    if (c === '"') {
      if (quoted && sample[i + 1] === '"') {
        i++;
        continue;
      }
      quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    if (c === "\n") break;
    if (c === ",") commas++;
    else if (c === "\t") tabs++;
    else if (c === ";") semis++;
  }
  if (tabs > 0 && tabs >= commas && tabs >= semis) return "\t";
  if (semis > commas && semis > 0) return ";";
  return ",";
}

export function parseCsv(input: string, delimiter: Delimiter = ","): string[][] {
  const source = input.replace(/^\uFEFF/, "");
  if (source.length === 0) return [[""]];

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += c;
      }
      continue;
    }
    if (c === '"') {
      quoted = true;
      continue;
    }
    if (c === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }
    if (c === "\r") continue;
    if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += c;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.length > 0 ? rows : [[""]];
}

function escapeCell(cell: string, delimiter: string): string {
  if (cell.includes('"') || cell.includes("\n") || cell.includes("\r") || cell.includes(delimiter)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function serializeCsv(rows: string[][], delimiter: Delimiter = ","): string {
  return rows.map((row) => row.map((cell) => escapeCell(cell ?? "", delimiter)).join(delimiter)).join("\n");
}

export function trimSheet(rows: string[][]): string[][] {
  const copy = rows.map((row) => {
    const next = row.slice();
    while (next.length > 0 && next[next.length - 1] === "") next.pop();
    return next;
  });
  while (copy.length > 1 && copy[copy.length - 1].every((cell) => cell === "")) copy.pop();
  return copy.length > 0 ? copy : [[""]];
}

export function columnLabel(index: number): string {
  if (index < 0 || !Number.isFinite(index)) return "";
  let n = Math.floor(index) + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}
