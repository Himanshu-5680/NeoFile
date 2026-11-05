import { resolveTheme, type ThemePrefs } from "@neofile/core";

export function applyTheme(prefs: ThemePrefs) {
  const theme = resolveTheme(prefs);
  const root = document.documentElement;
  root.dataset.theme = theme.mode;
  const tokens: Record<string, string> = {
    "--bg": theme.bg,
    "--surface": theme.surface,
    "--ink": theme.ink,
    "--muted": theme.muted,
    "--line": theme.line,
    "--shadow": theme.shadow,
    "--accent": theme.accent,
    "--accent-ink": theme.accentInk,
  };
  for (const [key, value] of Object.entries(tokens)) root.style.setProperty(key, value);
  localStorage.setItem("neofile-theme", JSON.stringify({ mode: prefs.mode, accent: prefs.accent }));
  return theme;
}
