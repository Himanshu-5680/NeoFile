export interface SearchDoc {
  id: string;
  name: string;
  text: string;
  kind: string;
  where: "open" | "recent";
}

export interface SearchHit {
  docId: string;
  name: string;
  kind: string;
  where: "open" | "recent";
  score: number;
  line: number;
  column: number;
  snippet: string;
  matchStart: number;
  matchEnd: number;
}

export function searchDocuments(docs: SearchDoc[], query: string, limit = 40): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const name = doc.name.toLowerCase();
    const nameIndex = name.indexOf(needle);
    let added = 0;

    if (nameIndex >= 0) {
      hits.push({
        docId: doc.id,
        name: doc.name,
        kind: doc.kind,
        where: doc.where,
        score: 1000 - nameIndex,
        line: 1,
        column: 1,
        snippet: doc.name,
        matchStart: nameIndex,
        matchEnd: nameIndex + needle.length,
      });
      added++;
    }

    const hay = doc.text;
    const lower = hay.toLowerCase();
    let from = 0;
    while (added < 8) {
      const index = lower.indexOf(needle, from);
      if (index < 0) break;
      const loc = lineAndColumn(hay, index);
      const contextStart = Math.max(0, index - 36);
      const contextEnd = Math.min(hay.length, index + needle.length + 48);
      const snippet = hay.slice(contextStart, contextEnd).replace(/\s+/g, " ");
      const matchStart = index - contextStart;
      hits.push({
        docId: doc.id,
        name: doc.name,
        kind: doc.kind,
        where: doc.where,
        score: 200 - Math.min(index, 180) + (doc.where === "open" ? 20 : 0),
        line: loc.line,
        column: loc.column,
        snippet,
        matchStart,
        matchEnd: matchStart + needle.length,
      });
      added++;
      from = index + needle.length;
    }
  }

  hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name) || a.line - b.line);
  return hits.slice(0, limit);
}

function lineAndColumn(text: string, index: number): { line: number; column: number } {
  let line = 1;
  let lastBreak = 0;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lastBreak = i + 1;
    }
  }
  return { line, column: index - lastBreak + 1 };
}
