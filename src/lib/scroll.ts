import type { ListDensity, ScrollMotion } from "./types";

/** CSSOM value. "auto" is an instant jump. */
export type ScrollBehaviorSetting = "smooth" | "auto";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function resolveScrollBehavior(pref: ScrollMotion, reducedMotion: boolean): ScrollBehaviorSetting {
  if (pref === "instant") return "auto";
  if (pref === "smooth") return "smooth";
  return reducedMotion ? "auto" : "smooth";
}

export function applyScroll(pref: ScrollMotion, behavior: ScrollBehaviorSetting, density: ListDensity): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.scroll = pref;
  root.dataset.scrollBehavior = behavior;
  root.dataset.density = density;
}
