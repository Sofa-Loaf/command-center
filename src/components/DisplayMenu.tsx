import { useEffect, useRef, useState } from "react";
import type { ListDensity, ScrollMotion } from "../lib/types";
import { useStore } from "../state/store";

const MOTIONS: Array<{ id: ScrollMotion; label: string }> = [
  { id: "system", label: "System" },
  { id: "smooth", label: "Smooth" },
  { id: "instant", label: "Instant" },
];

const DENSITIES: Array<{ id: ListDensity; label: string }> = [
  { id: "comfortable", label: "Comfortable" },
  { id: "compact", label: "Compact" },
];

export function DisplayMenu() {
  const { doc, resolvedScroll, setScrollMotion, setListDensity } = useStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const motionHint =
    doc.scrollMotion === "system"
      ? `System is using ${resolvedScroll === "smooth" ? "smooth" : "instant"} jumps.`
      : doc.scrollMotion === "smooth"
        ? "In-app jumps animate."
        : "In-app jumps move immediately.";

  return (
    <div className="menu" ref={menuRef}>
      <button
        className="btn"
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Scroll and list density"
        onClick={() => setOpen((value) => !value)}
      >
        Display
      </button>
      {open ? (
        <div className="dropdown display-menu" role="dialog" aria-label="Display settings">
          <p className="display-kicker">Scroll</p>
          <div className="seg" role="group" aria-label="Scroll motion">
            {MOTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={doc.scrollMotion === option.id}
                onClick={() => setScrollMotion(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="display-hint">{motionHint} Search and tab jumps follow this. Wheel scrolling stays native.</p>
          <p className="display-kicker">List</p>
          <div className="seg" role="group" aria-label="List density">
            {DENSITIES.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={doc.listDensity === option.id}
                onClick={() => setListDensity(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="display-hint">Compact shortens command previews so more cards fit. Previews still scroll.</p>
        </div>
      ) : null}
    </div>
  );
}
