import { useEffect, useRef } from "react";
import { useStore } from "../state/store";

/** Horizontal tabs used when the side rail is hidden. */
export function TabStrip() {
  const { doc, selectTab } = useStore();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[aria-current='page']")?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [doc.activeTabId]);

  return (
    <nav className="tab-strip scroll-region" aria-label="Command tabs" ref={ref}>
      {doc.tabs.map((tab) => {
        const active = doc.activeTabId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`chip ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => selectTab(tab.id)}
          >
            {tab.name}
            <span className="count">{tab.commands.length}</span>
          </button>
        );
      })}
    </nav>
  );
}
