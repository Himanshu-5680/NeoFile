import { describe, expect, it } from "vitest";
import { FEATURE_MATRIX, detectFile } from "../src/index";

describe("feature matrix", () => {
  it("covers every kind the detector can return", () => {
    const samples = ["a.txt", "a.csv", "a.xlsx", "a.pdf", "a.docx", "a.pptx", "a.png", "a.mp3", "a.mp4", "a.bin"];
    const ids = new Set(FEATURE_MATRIX.map((row) => row.id));
    for (const name of samples) {
      expect(ids.has(detectFile(name).kind)).toBe(true);
    }
  });

  it("does not claim office or media editing", () => {
    for (const id of ["pdf", "docx", "pptx", "image", "audio", "video"]) {
      expect(FEATURE_MATRIX.find((row) => row.id === id)?.mode).toBe("view");
    }
    expect(FEATURE_MATRIX.find((row) => row.id === "xlsx")?.mode).toBe("values");
    expect(FEATURE_MATRIX.find((row) => row.id === "csv")?.mode).toBe("edit");
  });
});
