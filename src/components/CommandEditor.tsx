import { useEffect, useMemo, useState } from "react";
import { createId } from "../lib/ids";
import { fillPlaceholders } from "../lib/placeholders";
import { OS_KINDS, type Command, type OsKind } from "../lib/types";
import { useStore } from "../state/store";

interface CommandEditorProps {
  tabId: string;
  command: Command | null;
  onClose: () => void;
}

export function CommandEditor({ tabId, command, onClose }: CommandEditorProps) {
  const { doc, saveCommand } = useStore();
  const isNew = !command;
  const [title, setTitle] = useState(command?.title ?? "");
  const [notes, setNotes] = useState(command?.notes ?? "");
  const [tags, setTags] = useState(command?.tags.join(", ") ?? "");
  const [os, setOs] = useState<OsKind>(command?.os ?? "linux");
  const [body, setBody] = useState(command?.body ?? "");
  const [favorite, setFavorite] = useState(command?.favorite ?? false);
  const preview = useMemo(() => fillPlaceholders(body, doc.placeholders), [body, doc.placeholders]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [title, notes, tags, os, body, favorite, onClose]);

  function submit() {
    const next: Command = {
      id: command?.id ?? createId("cmd"),
      title: title.trim() || "Untitled command",
      notes: notes.trim(),
      tags: tags
        .split(/[,\s]+/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      os,
      body,
      favorite,
    };
    saveCommand(tabId, next, isNew);
    onClose();
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-hd">
          <h2 id="editor-title">{isNew ? "New command" : "Edit command"}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-bd">
          <div className="fields">
            <label className="field">
              Title
              <input value={title} autoFocus onChange={(event) => setTitle(event.target.value)} />
            </label>
            <div className="row-2">
              <label className="field">
                OS badge
                <select value={os} onChange={(event) => setOs(event.target.value as OsKind)}>
                  {OS_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Tags
                <input
                  value={tags}
                  placeholder="ssh, disk, dns"
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>
            </div>
            <label className="field">
              Command body
              <textarea
                className="body-input"
                spellCheck={false}
                value={body}
                placeholder={"ping -c 4 {{host}}\nssh ${USER}@{{host}} -p {{port:22}}"}
                onChange={(event) => setBody(event.target.value)}
              />
            </label>
            <label className="field">
              Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} />
              Favorite (Quick area)
            </label>
            <p className="preview">
              <span style={{ color: "var(--text-faint)" }}>preview · </span>
              {preview.text}
              {preview.missing.length > 0 ? (
                <span style={{ color: "var(--warn)" }}> · empty: {preview.missing.join(", ")}</span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-accent" type="button" onClick={submit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
