import { useEffect, useMemo, useState, type ReactNode } from "react";
import { fillPlaceholders } from "../lib/placeholders";
import type { Command } from "../lib/types";
import { useStore } from "../state/store";

interface CommandCardProps {
  command: Command;
  onEdit: (command: Command) => void;
}

function highlightPreview(text: string, original: string): ReactNode[] {
  if (text === original) return [text];
  const parts: ReactNode[] = [];
  const tokenRe = /(\{\{[A-Za-z_][A-Za-z0-9_]*(?::[^{}]*)?\}\}|\$\{[A-Za-z_][A-Za-z0-9_]*(?::[^}]*)?\})/g;
  let last = 0;
  let match: RegExpExecArray | null;
  const source = text;
  // Highlight leftover tokens in the filled output.
  while ((match = tokenRe.exec(source)) !== null) {
    if (match.index > last) parts.push(source.slice(last, match.index));
    parts.push(
      <span className="missing" key={`${match.index}-${match[0]}`}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < source.length) parts.push(source.slice(last));
  return parts.length ? parts : [text];
}

export function CommandCard({ command, onEdit }: CommandCardProps) {
  const { doc, copyCommand, copiedId, starCommand, dupCommand, removeCommand } = useStore();
  const [menu, setMenu] = useState(false);
  const filled = useMemo(
    () => fillPlaceholders(command.body, doc.placeholders),
    [command.body, doc.placeholders],
  );

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  return (
    <article className={`card ${copiedId === command.id ? "flash" : ""}`}>
      <div className="card-hd">
        <span className={`os ${command.os}`}>{command.os}</span>
        <h3>{command.title}</h3>
        <button
          className="icon-btn"
          type="button"
          title={command.favorite ? "Unfavorite" : "Favorite"}
          onClick={() => starCommand(command.id)}
        >
          {command.favorite ? "★" : "☆"}
        </button>
      </div>
      {command.notes ? <p className="notes">{command.notes}</p> : null}
      {command.tags.length > 0 ? (
        <div className="tags">
          {command.tags.map((tag) => (
            <span className="tag" key={tag}>
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      <pre
        className="body scroll-region"
        title="Click to copy filled command"
        onClick={() => void copyCommand(command, "filled")}
      >
        {command.body}
      </pre>
      <p className="preview">
        <span style={{ color: "var(--text-faint)" }}>preview · </span>
        {highlightPreview(filled.text, command.body)}
      </p>
      <div className="card-actions">
        <button className="btn btn-accent" type="button" onClick={() => void copyCommand(command, "filled")}>
          Copy filled
        </button>
        <button className="btn" type="button" onClick={() => void copyCommand(command, "raw")}>
          Copy raw
        </button>
        <div className="menu">
          <button
            className="icon-btn"
            type="button"
            aria-label="Command menu"
            onClick={(event) => {
              event.stopPropagation();
              setMenu((open) => !open);
            }}
          >
            ⋯
          </button>
          {menu ? (
            <div className="menu-pop" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  onEdit(command);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  dupCommand(command.id);
                }}
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  starCommand(command.id);
                }}
              >
                {command.favorite ? "Remove favorite" : "Add to favorites"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  removeCommand(command);
                }}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
