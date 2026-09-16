import { STANDARD_PLACEHOLDERS } from "../lib/types";
import { collectLibraryPlaceholders } from "../lib/placeholders";
import { allCommands } from "../lib/library";
import { useStore } from "../state/store";

const LABELS: Record<string, string> = {
  host: "Host",
  ip: "IP",
  user: "User",
  port: "Port",
  path: "Path",
  service: "Service",
  pid: "PID",
  interface: "Iface",
  days: "Days",
};

export function PlaceholderBar() {
  const { doc, updatePlaceholders } = useStore();
  const extras = collectLibraryPlaceholders(
    allCommands(doc).map(({ command }) => command.body),
    STANDARD_PLACEHOLDERS,
  );
  const keys = [...STANDARD_PLACEHOLDERS, ...extras];

  return (
    <div className="phbar" aria-label="Placeholder values">
      {keys.map((key) => (
        <label className={`ph-field ${key === "path" || key === "host" ? "wide" : ""}`} key={key}>
          <span>{LABELS[key] ?? key}</span>
          <input
            value={doc.placeholders[key] ?? ""}
            spellCheck={false}
            placeholder={key === "port" ? "22" : `{{${key}}}`}
            onChange={(event) => updatePlaceholders({ [key]: event.target.value })}
          />
        </label>
      ))}
    </div>
  );
}
