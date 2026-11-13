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
  light: "#ff4d2e",
  dark: "#c6ff3d",
};

const LIGHT_INK = "#141414";
const LIGHT_PAPER = "#fffdf8";

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

function mixHex(from: string, toward: string, amount: number): string {
  const left = normalizeHex(from);
  const right = normalizeHex(toward);
  if (!left || !right) return from;
  const channelAt = (hex: string, index: number) => Number.parseInt(hex.slice(index, index + 2), 16);
  const mix = (index: number) => Math.round(channelAt(left, index) * (1 - amount) + channelAt(right, index) * amount);
  return `#${[1, 3, 5].map((index) => mix(index).toString(16).padStart(2, "0")).join("")}`;
}

/** Accent used as text. Button fills stay bright. This darkens a color only when it fails 4.5:1 on the surface. */
export function readableAccentText(accent: string, background: string): string {
  const normalized = normalizeHex(accent) ?? accent;
  if (contrastRatio(normalized, background) >= 4.5) return normalized;
  let current = normalized;
  for (let step = 0; step < 16; step += 1) {
    current = mixHex(current, "#141414", 0.18);
    if (contrastRatio(current, background) >= 4.5) return current;
  }
  return current;
}

export function resolveTheme(prefs: ThemePrefs): ResolvedTheme {
  const custom = prefs.accent ? normalizeHex(prefs.accent) : null;
  const accent = custom ?? DEFAULT_ACCENT[prefs.mode];
  const dark = prefs.mode === "dark";
  return {
    mode: prefs.mode,
    accent,
    accentInk: inkForAccent(accent),
    bg: dark ? "#161616" : "#f3ede2",
    surface: dark ? "#222220" : "#fffdf8",
    ink: dark ? "#f4f0e6" : "#141414",
    muted: dark ? "#c8c2b4" : "#5c564e",
    line: dark ? "#f4f0e6" : "#141414",
    shadow: dark ? "#000000" : "#141414",
    customAccent: custom !== null,
  };
}

export function toggleMode(mode: ThemeMode): ThemeMode {
  return mode === "light" ? "dark" : "light";
}
