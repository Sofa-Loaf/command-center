import { useStore } from "../state/store";

export function ThemeToggle() {
  const { doc, cycleColorMode } = useStore();
  const label =
    doc.theme === "system" ? "System theme" : doc.theme === "dark" ? "Dark mode" : "Light mode";
  const glyph = doc.theme === "system" ? "SYS" : doc.theme === "dark" ? "☾" : "☀";
  return (
    <button className="btn-ghost" onClick={cycleColorMode} title={`${label} · click to cycle`} type="button">
      <span aria-hidden>{glyph}</span>
      {label}
    </button>
  );
}
