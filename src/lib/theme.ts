import type { ResolvedTheme, ThemePref } from "./types";

export function resolveTheme(pref: ThemePref, systemDark: boolean): ResolvedTheme {
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return systemDark ? "dark" : "light";
}

export function applyTheme(pref: ThemePref, resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePref = pref;
}

export function cycleTheme(pref: ThemePref): ThemePref {
  if (pref === "system") return "dark";
  if (pref === "dark") return "light";
  return "system";
}

export function prefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
