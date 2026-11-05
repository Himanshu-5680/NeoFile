import { describe, expect, it } from "vitest";
import { detectFile, extensionOf } from "../src/index";

describe("detectFile", () => {
  it("edits source and text files", () => {
    expect(detectFile("README.md")).toMatchObject({ kind: "text", mode: "edit", highlighter: "markdown" });
    expect(detectFile("App.java")).toMatchObject({ kind: "text", highlighter: "java" });
    expect(detectFile("main.tsx")).toMatchObject({ highlighter: "tsx" });
    expect(detectFile("styles.css")).toMatchObject({ highlighter: "css" });
    expect(detectFile("data.json")).toMatchObject({ highlighter: "json" });
    expect(detectFile("note.xml")).toMatchObject({ highlighter: "xml" });
    expect(detectFile("script.py")).toMatchObject({ highlighter: "python" });
    expect(detectFile("page.html")).toMatchObject({ highlighter: "html" });
    expect(detectFile("notes.txt")).toMatchObject({ mode: "edit", highlighter: "plain" });
  });

  it("treats spreadsheets differently from office documents", () => {
    expect(detectFile("budget.csv").mode).toBe("edit");
    expect(detectFile("budget.tsv").kind).toBe("csv");
    expect(detectFile("book.xlsx")).toMatchObject({ kind: "xlsx", mode: "values" });
    expect(detectFile("book.xlsx").limit).toMatch(/SheetJS/);
    expect(detectFile("deck.pptx").mode).toBe("view");
    expect(detectFile("letter.docx").mode).toBe("view");
    expect(detectFile("scan.pdf").mode).toBe("view");
  });

  it("never marks media as editable", () => {
    for (const name of ["photo.png", "clip.mp4", "song.mp3", "icon.svg"]) {
      expect(detectFile(name).mode).toBe("view");
    }
  });

  it("falls back to mime and binary", () => {
    expect(detectFile("noext", "text/plain").kind).toBe("text");
    expect(detectFile("blob.bin").kind).toBe("binary");
  });

  it("reads the last extension and dotfiles", () => {
    expect(extensionOf("folder/My.File.JSON")).toBe("json");
    expect(extensionOf(".gitignore")).toBe("gitignore");
  });
});
