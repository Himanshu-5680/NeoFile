import { describe, expect, it } from "vitest";
import { columnLabel, detectDelimiter, parseCsv, serializeCsv, trimSheet } from "../src/index";

describe("csv", () => {
  it("round-trips quoted commas and newlines", () => {
    const rows = [
      ["name", "note"],
      ["Ada", 'says "hello", then leaves'],
      ["Lin", "line one\nline two"],
    ];
    const text = serializeCsv(rows);
    expect(parseCsv(text)).toEqual(rows);
  });

  it("does not invent a row for a trailing newline", () => {
    expect(parseCsv("a,b\n")).toEqual([["a", "b"]]);
    expect(parseCsv("a,b\n\n")).toEqual([
      ["a", "b"],
      [""],
    ]);
  });

  it("detects tabs and semicolons", () => {
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
    expect(detectDelimiter("a;b;c")).toBe(";");
    expect(detectDelimiter('a,"b,c",d')).toBe(",");
    expect(parseCsv("a\tb\n1\t2", "\t")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps escaped quotes", () => {
    expect(parseCsv('"a""b",c')).toEqual([['a"b', "c"]]);
  });

  it("trims ghost rows and trailing empty cells", () => {
    expect(
      trimSheet([
        ["a", "b", ""],
        ["", "", ""],
      ]),
    ).toEqual([["a", "b"]]);
  });

  it("labels columns like a spreadsheet", () => {
    expect(columnLabel(0)).toBe("A");
    expect(columnLabel(25)).toBe("Z");
    expect(columnLabel(26)).toBe("AA");
  });
});
