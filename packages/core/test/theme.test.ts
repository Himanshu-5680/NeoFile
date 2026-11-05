import { describe, expect, it } from "vitest";
import { DEFAULT_ACCENT, contrastRatio, inkForAccent, normalizeHex, resolveTheme, toggleMode } from "../src/index";

describe("theme", () => {
  it("uses coral in light mode and neon green in dark mode", () => {
    const light = resolveTheme({ mode: "light", accent: null });
    const dark = resolveTheme({ mode: "dark", accent: null });
    expect(light.accent).toBe(DEFAULT_ACCENT.light);
    expect(dark.accent).toBe(DEFAULT_ACCENT.dark);
    expect(light.bg).not.toBe(dark.bg);
    expect(dark.ink).not.toBe(light.ink);
    expect(light.customAccent).toBe(false);
  });

  it("accepts a custom accent and picks readable ink", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("zz")).toBeNull();
    const theme = resolveTheme({ mode: "dark", accent: "#FFFFFF" });
    expect(theme.customAccent).toBe(true);
    expect(theme.accent).toBe("#ffffff");
    expect(theme.accentInk).toBe("#141414");
    const ink = inkForAccent("#111111");
    expect(contrastRatio("#111111", ink)).toBeGreaterThan(4);
  });

  it("ignores a broken accent and toggles mode", () => {
    const theme = resolveTheme({ mode: "light", accent: "nope" });
    expect(theme.accent).toBe(DEFAULT_ACCENT.light);
    expect(toggleMode("light")).toBe("dark");
  });
});
