import { useState } from "react";
import { useStore } from "../state/store";
import { ConfirmDialog } from "./ConfirmDialog";

interface TabListProps {
  onRename: (tabId: string, name: string) => void;
}

export function TabList({ onRename }: TabListProps) {
  const { doc, selectTab, reorderTab, removeTab } = useStore();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const pending = doc.tabs.find((tab) => tab.id === pendingDelete);

  return (
    <section className="rail-section" style={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>
      <div className="rail-hd">
        <span>Tabs</span>
        <span>{doc.tabs.length}</span>
      </div>
            <div className="tab-list" style={{ flex: 1 }}>
        {doc.tabs.map((tab, index) => (
          <div
            className="tab-row"
            key={tab.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/tab-id", tab.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const source = event.dataTransfer.getData("text/tab-id");
              if (source) reorderTab(source, index);
            }}
          >
            <span className="grip" title="Drag to reorder" aria-hidden>
              ⋮⋮
            </span>
            <button
              className={`tab ${doc.activeTabId === tab.id ? "active" : ""}`}
              type="button"
              onClick={() => selectTab(tab.id)}
              onDoubleClick={() => {
                const name = window.prompt("Rename tab", tab.name);
                if (name) onRename(tab.id, name);
              }}
            >
              <strong>{tab.name}</strong>
              <span>{tab.commands.length} commands</span>
            </button>
            <button
              className="icon-btn"
              type="button"
              title="Delete tab"
              onClick={() => {
                if (tab.commands.length > 0) setPendingDelete(tab.id);
                else removeTab(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {pending ? (
        <ConfirmDialog
          title="Delete tab?"
          body={`${pending.name} has ${pending.commands.length} command${pending.commands.length === 1 ? "" : "s"}. This removes the tab and its commands from the local library.`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeTab(pending.id);
            setPendingDelete(null);
          }}
        />
      ) : null}
    </section>
  );
}
