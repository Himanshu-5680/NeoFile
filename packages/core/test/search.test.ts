import { describe, expect, it } from "vitest";
import { searchDocuments } from "../src/index";

const docs = [
  { id: "1", name: "readme.md", text: "NeoFile stays on this computer.\nSearch the notes.", kind: "text", where: "open" as const },
  { id: "2", name: "budget.csv", text: "rent,1200\nsearch party,40", kind: "csv", where: "recent" as const },
];

describe("searchDocuments", () => {
  it("returns nothing for a blank query", () => {
    expect(searchDocuments(docs, "   ")).toEqual([]);
  });

  it("ranks a file-name hit above a later content hit", () => {
    const hits = searchDocuments(
      [
        { id: "a", name: "notes.txt", text: "nothing", kind: "text", where: "open" },
        { id: "b", name: "other.txt", text: "see the notes later", kind: "text", where: "recent" },
      ],
      "notes",
    );
    expect(hits[0].docId).toBe("a");
    expect(hits[0].snippet).toBe("notes.txt");
  });

  it("reports the line and a snippet", () => {
    const hits = searchDocuments(docs, "search");
    const content = hits.find((hit) => hit.docId === "1" && hit.line === 2);
    expect(content).toBeTruthy();
    expect(content?.column).toBe(1);
    expect(content?.snippet.toLowerCase()).toContain("search");
  });

  it("caps the result list", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `file-${i}.txt`,
      text: "alpha alpha alpha",
      kind: "text",
      where: "open" as const,
    }));
    expect(searchDocuments(many, "alpha", 5)).toHaveLength(5);
  });
});
