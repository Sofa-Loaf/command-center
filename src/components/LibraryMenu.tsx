import { useEffect, useRef, useState } from "react";
import { detectAndParse, importedToTabs } from "../lib/import";
import { downloadText, libraryForExport, slugify, tabForExport, toJson, toYaml } from "../lib/export";
import { findTab } from "../lib/library";
import { useStore } from "../state/store";

interface LibraryMenuProps {
  onReset: () => void;
}

export function LibraryMenu({ onReset }: LibraryMenuProps) {
  const { doc, importTabs, pushToast } = useStore();
  const [open, setOpen] = useState(false);
  const [importer, setImporter] = useState(false);
  const [draft, setDraft] = useState("");
  const [filename, setFilename] = useState("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const active = findTab(doc, doc.activeTabId);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  function exportLibrary() {
    downloadText("command-center-library.json", toJson(libraryForExport(doc)));
    setOpen(false);
  }

  function exportTab() {
    if (!active) return;
    downloadText(`command-center-${slugify(active.name)}.json`, toJson(tabForExport(active)));
    setOpen(false);
  }

  function exportYaml() {
    downloadText("command-center-library.yaml", toYaml(libraryForExport(doc)), "text/yaml");
    setOpen(false);
  }

  function runImport(text: string, name: string) {
    const parsed = detectAndParse(text, name);
    const tabs = importedToTabs(parsed);
    const count = tabs.reduce((sum, tab) => sum + tab.commands.length, 0);
    if (count === 0) {
      pushToast({ tone: "warn", message: "Nothing to import from that file." });
      return;
    }
    importTabs(tabs, mode);
    pushToast({ message: `Imported ${count} commands (${parsed.format}, ${mode})` });
    setImporter(false);
    setOpen(false);
    setDraft("");
  }

  return (
    <>
      <div className="menu" ref={menuRef}>
        <button className="btn" type="button" onClick={() => setOpen((value) => !value)}>
          Library
        </button>
        {open ? (
          <div className="dropdown">
            <button type="button" onClick={() => setImporter(true)}>
              Import JSON / YAML / MD / text
            </button>
            <button type="button" onClick={exportLibrary}>
              Export library JSON
            </button>
            <button type="button" onClick={exportTab} disabled={!active}>
              Export this tab JSON
            </button>
            <button type="button" onClick={exportYaml}>
              Export library YAML
            </button>
            <button type="button" onClick={onReset}>
              Reset to starter pack
            </button>
          </div>
        ) : null}
      </div>
      {importer ? (
        <div className="overlay" onMouseDown={() => setImporter(false)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-hd">
              <h2>Import commands</h2>
              <button className="icon-btn" type="button" onClick={() => setImporter(false)}>
                ×
              </button>
            </div>
            <div className="modal-bd">
              <div
                className="drop"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files[0];
                  if (!file) return;
                  void file.text().then((text) => {
                    setFilename(file.name);
                    setDraft(text);
                  });
                }}
              >
                Drop a .json / .yaml / .md / .txt file, or{" "}
                <button className="btn" type="button" onClick={() => fileRef.current?.click()}>
                  browse
                </button>
                <input
                  ref={fileRef}
                  className="hidden-file"
                  type="file"
                  accept=".json,.yaml,.yml,.md,.markdown,.txt,application/json,text/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void file.text().then((text) => {
                      setFilename(file.name);
                      setDraft(text);
                    });
                  }}
                />
              </div>
              <label className="field">
                Or paste
                <textarea
                  className="body-input"
                  value={draft}
                  placeholder="tabs: ... or markdown headings + fenced commands"
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              <label className="field">
                On import
                <select value={mode} onChange={(event) => setMode(event.target.value as "merge" | "replace")}>
                  <option value="merge">Merge tabs by name</option>
                  <option value="replace">Replace entire library</option>
                </select>
              </label>
            </div>
            <div className="modal-ft">
              <button className="btn" type="button" onClick={() => setImporter(false)}>
                Cancel
              </button>
              <button
                className="btn btn-accent"
                type="button"
                onClick={() => runImport(draft, filename)}
                disabled={!draft.trim()}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
