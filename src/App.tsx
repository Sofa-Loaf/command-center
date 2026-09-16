import { useEffect, useMemo, useState } from "react";
import { CommandCard } from "./components/CommandCard";
import { CommandEditor } from "./components/CommandEditor";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { FavoritesRail } from "./components/FavoritesRail";
import { LibraryMenu } from "./components/LibraryMenu";
import { PlaceholderBar } from "./components/PlaceholderBar";
import { SearchPalette } from "./components/SearchPalette";
import { TabList } from "./components/TabList";
import { ThemeToggle } from "./components/ThemeToggle";
import { Toasts } from "./components/Toasts";
import { allCommands, findTab } from "./lib/library";
import type { Command, OsKind } from "./lib/types";
import { useStore } from "./state/store";

type OsFilter = "all" | OsKind | "favorite";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export default function App() {
  const { doc, createTab, rename, restoreStarter } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [editor, setEditor] = useState<{ tabId: string; command: Command | null } | null>(null);
  const [osFilter, setOsFilter] = useState<OsFilter>("all");
  const [resetOpen, setResetOpen] = useState(false);
  const active = findTab(doc, doc.activeTabId) ?? doc.tabs[0];
  const stats = useMemo(() => {
    const commands = allCommands(doc);
    return {
      commands: commands.length,
      favorites: commands.filter(({ command }) => command.favorite).length,
    };
  }, [doc]);

  const visible = useMemo(() => {
    const commands = active?.commands ?? [];
    if (osFilter === "all") return commands;
    if (osFilter === "favorite") return commands.filter((command) => command.favorite);
    return commands.filter((command) => command.os === osFilter);
  }, [active, osFilter]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function addTabPrompt() {
    const name = window.prompt("New tab name", "Runbooks");
    if (name?.trim()) createTab(name.trim());
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark" aria-hidden>
            &gt;
          </div>
          <div>
            <h1>Command Center</h1>
            <p>Clipboard command palette</p>
          </div>
        </div>
        <span className="safety">
          <i />
          Clipboard only · never executes remotely
        </span>
        <div className="spacer" />
        <button className="btn search-launch" type="button" onClick={() => setSearchOpen(true)}>
          <span>Search commands</span>
          <span>
            <kbd>/</kbd> <kbd>Ctrl</kbd>+<kbd>K</kbd>
          </span>
        </button>
        <ThemeToggle />
        <LibraryMenu onReset={() => setResetOpen(true)} />
      </header>

      <PlaceholderBar />

      <div className="workspace">
        <aside className="rail">
          <FavoritesRail />
          <TabList onRename={rename} />
          <div style={{ padding: "8px 12px 12px" }}>
            <button className="btn" type="button" onClick={addTabPrompt} style={{ width: "100%" }}>
              + New tab
            </button>
          </div>
        </aside>

        <main className="main">
          <div className="toolbar">
            <strong>{active?.name ?? "No tab"}</strong>
            <span className="notes">{visible.length} shown</span>
            <div className="chips">
              {(
                [
                  ["all", "All"],
                  ["linux", "Linux"],
                  ["windows", "Windows"],
                  ["macos", "macOS"],
                  ["generic", "Generic"],
                  ["favorite", "Favorites"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  className={`chip ${osFilter === id ? "active" : ""}`}
                  type="button"
                  onClick={() => setOsFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="spacer" />
            <button
              className="btn btn-accent"
              type="button"
              onClick={() => active && setEditor({ tabId: active.id, command: null })}
              disabled={!active}
            >
              + Command
            </button>
            <button className="btn" type="button" onClick={addTabPrompt}>
              + Tab
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="empty">
              No commands in this view. Add one, import a library, or clear the OS filter.
            </div>
          ) : (
            <div className="grid">
              {visible.map((command) => (
                <CommandCard
                  key={command.id}
                  command={command}
                  onEdit={(item) => active && setEditor({ tabId: active.id, command: item })}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="statusbar">
        <span>
          {stats.commands} commands · {doc.tabs.length} tabs · {stats.favorites} favorites · localStorage key{" "}
          <span className="mono">command-center:document</span>
        </span>
        <span>
          {active ? <span>Active: {active.name}</span> : null}
          Paste into SSH / RDP / iLO · free forever · offline
        </span>
      </footer>

      <Toasts />
      {searchOpen ? <SearchPalette onClose={() => setSearchOpen(false)} /> : null}
      {editor && active ? (
        <CommandEditor
          tabId={editor.tabId}
          command={editor.command}
          onClose={() => setEditor(null)}
        />
      ) : null}
      {resetOpen ? (
        <ConfirmDialog
          title="Reset library?"
          body="Replace the current local library with the starter Linux/Windows/Networking/Diagnostics pack. You can undo from the toast."
          confirmLabel="Reset"
          onCancel={() => setResetOpen(false)}
          onConfirm={() => {
            restoreStarter();
            setResetOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
