import { describe, expect, it } from "vitest";
import { DEFAULT_ACCENT, contrastRatio, inkForAccent, normalizeHex, readableAccentText, resolveTheme, toggleMode } from "../src/index";

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

  it("keeps built-in accent text at 4.5:1 and records the dark-mode inherit failure", () => {
    const accents = ["#c6ff3d", "#ff4d2e", "#ffe14a", "#5ec8ff", "#c4a1ff", "#ffffff", "#000000", "#0000ff"];
    for (const accent of accents) {
      expect(contrastRatio(accent, inkForAccent(accent))).toBeGreaterThanOrEqual(4.5);
    }
    const light = resolveTheme({ mode: "light", accent: null });
    const dark = resolveTheme({ mode: "dark", accent: null });
    expect(contrastRatio(light.accent, light.accentInk)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.accent, dark.accentInk)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.ink, dark.accent)).toBeLessThan(1.2);
    expect(contrastRatio(readableAccentText(light.accent, light.surface), light.surface)).toBeGreaterThanOrEqual(4.5);
    expect(readableAccentText(dark.accent, dark.surface)).toBe(dark.accent);
    expect(contrastRatio(light.muted, light.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.muted, dark.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.ink, light.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.ink, dark.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("ignores a broken accent and toggles mode", () => {
    const theme = resolveTheme({ mode: "light", accent: "nope" });
    expect(theme.accent).toBe(DEFAULT_ACCENT.light);
    expect(toggleMode("light")).toBe("dark");
  });
});
