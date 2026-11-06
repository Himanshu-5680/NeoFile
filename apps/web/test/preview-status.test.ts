import { describe, expect, it } from "vitest";
import { docxPreviewMarkup } from "../src/components/viewers/DocxViewer";
import { pptxStatusMessage } from "../src/components/viewers/PptxViewer";

describe("document preview status", () => {
  it("does not leave an empty deck on the reading message", () => {
    expect(pptxStatusMessage("loading", 0)).toBe("Reading slides…");
    expect(pptxStatusMessage("ready", 0)).toBe("This deck has no slides.");
    expect(pptxStatusMessage("ready", 2)).toBeNull();
  });

  it("does not leave an empty Word preview on the reading message", () => {
    expect(docxPreviewMarkup("loading", "")).toBe("<p>Reading the document…</p>");
    expect(docxPreviewMarkup("ready", "")).toBe("<p>No preview text.</p>");
    expect(docxPreviewMarkup("ready", "<p>Hi</p>")).toBe("<p>Hi</p>");
  });
});
