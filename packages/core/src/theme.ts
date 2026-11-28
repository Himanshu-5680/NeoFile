export type ThemeMode = "light" | "dark";

export interface ThemePrefs {
  mode: ThemeMode;
  /** Null uses the built-in accent for the active mode. */
  accent: string | null;
}

export interface ResolvedTheme {
  mode: ThemeMode;
  accent: string;
  accentInk: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  shadow: string;
  customAccent: boolean;
}

export const DEFAULT_ACCENT: Record<ThemeMode, string> = {
  light: "#b8ff00",
  dark: "#c6ff3d",
};

const LIGHT_INK = "#171715";
const LIGHT_PAPER = "#fffdf7";

export function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split("")
      .map((ch) => ch + ch)
      .join("")
      .toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return null;
}

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const normalized = normalizeHex(hex);
  if (!normalized) return 0;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const left = luminance(a);
  const right = luminance(b);
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
}

export function inkForAccent(accent: string): string {
  const onBlack = contrastRatio(accent, LIGHT_INK);
  const onPaper = contrastRatio(accent, LIGHT_PAPER);
  return onBlack >= onPaper ? LIGHT_INK : LIGHT_PAPER;
}

export function resolveTheme(prefs: ThemePrefs): ResolvedTheme {
  const custom = prefs.accent ? normalizeHex(prefs.accent) : null;
  const accent = custom ?? DEFAULT_ACCENT[prefs.mode];
  const dark = prefs.mode === "dark";
  return {
    mode: prefs.mode,
    accent,
    accentInk: inkForAccent(accent),
    bg: dark ? "#111318" : "#f8f2e4",
    surface: dark ? "#1b1e25" : "#fffdf7",
    ink: dark ? "#f8f5eb" : "#171715",
    muted: dark ? "#c0c1bf" : "#5b584f",
    line: dark ? "#e8e4d8" : "#1a1a18",
    shadow: dark ? "#07080a" : "#171715",
    customAccent: custom !== null,
  };
}

export function toggleMode(mode: ThemeMode): ThemeMode {
  return mode === "light" ? "dark" : "light";
}
