import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { sheetsFromXlsx, sheetsToXlsx } from "../src/lib/sheets";

describe("spreadsheet parser", () => {
  it("uses SheetJS CE 0.20.3 from the CDN release", () => {
    expect(XLSX.version).toBe("0.20.3");
  });

  it("round-trips cell values and does not add keys to Object.prototype", async () => {
    const before = Object.getOwnPropertyNames(Object.prototype);
    const bytes = await sheetsToXlsx({
      origin: "xlsx",
      delimiter: ",",
      active: 0,
      sheets: [
        {
          name: "Budget:draft",
          rows: [
            ["month", "amount", "ok"],
            ["January", "12.5", "TRUE"],
          ],
        },
      ],
    });
    const sheets = await sheetsFromXlsx(bytes);
    expect(Object.getOwnPropertyNames(Object.prototype)).toEqual(before);
    expect(sheets).toHaveLength(1);
    expect(sheets[0].name.startsWith("Budget")).toBe(true);
    expect(sheets[0].name.includes(":")).toBe(false);
    expect(sheets[0].rows[0]).toEqual(["month", "amount", "ok"]);
    expect(sheets[0].rows[1]).toEqual(["January", "12.5", "TRUE"]);
  });
});