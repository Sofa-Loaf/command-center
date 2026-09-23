import { useEffect, useMemo, useRef, useState } from "react";
import { allCommands } from "../lib/library";
import { searchCommands } from "../lib/search";
import { useStore } from "../state/store";

interface SearchPaletteProps {
  onClose: () => void;
}

export function SearchPalette({ onClose }: SearchPaletteProps) {
  const { doc, copyCommand, selectTab } = useStore();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const items = useMemo(() => allCommands(doc), [doc]);
  const hits = useMemo(() => searchCommands(items, query).slice(0, 30), [items, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [index, hits]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIndex((current) => Math.min(current + 1, Math.max(hits.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIndex((current) => Math.max(current - 1, 0));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const hit = hits[index];
        if (hit) {
          void copyCommand(hit.command, "filled");
          selectTab(hit.tab.id);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copyCommand, hits, index, onClose, selectTab]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Search commands, tags, notes, bodies…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="results scroll-region">
          {hits.length === 0 ? (
            <p className="empty">No matches.</p>
          ) : (
            hits.map((hit, hitIndex) => (
              <button
                key={hit.command.id}
                ref={hitIndex === index ? activeRef : undefined}
                className={`result ${hitIndex === index ? "active" : ""}`}
                type="button"
                onMouseEnter={() => setIndex(hitIndex)}
                onClick={() => {
                  void copyCommand(hit.command, "filled");
                  selectTab(hit.tab.id);
                  onClose();
                }}
              >
                <strong>{hit.command.title}</strong>
                <span className="meta">
                  <span className={`os ${hit.command.os}`}>{hit.command.os}</span>
                  <span>{hit.tab.name}</span>
                  <span className="mono" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {hit.command.body.split("\n")[0]}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
        <div className="statusbar" style={{ borderTop: "1px solid var(--line)" }}>
          <span>
            <kbd>Enter</kbd> copy filled · <kbd>Esc</kbd> close · <kbd>↑↓</kbd> move
          </span>
          <span>{hits.length} shown</span>
        </div>
      </div>
    </div>
  );
}
