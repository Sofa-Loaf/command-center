import yaml from "js-yaml";
import type { AppDocument, Tab } from "./types";

export function libraryForExport(doc: AppDocument) {
  return {
    schemaVersion: doc.schemaVersion,
    tabs: doc.tabs.map((tab) => ({
      name: tab.name,
      commands: tab.commands.map((command) => ({
        title: command.title,
        notes: command.notes,
        tags: command.tags,
        os: command.os,
        body: command.body,
        favorite: command.favorite,
      })),
    })),
  };
}

export function tabForExport(tab: Tab) {
  return {
    schemaVersion: 1,
    tabs: [
      {
        name: tab.name,
        commands: tab.commands.map((command) => ({
          title: command.title,
          notes: command.notes,
          tags: command.tags,
          os: command.os,
          body: command.body,
          favorite: command.favorite,
        })),
      },
    ],
  };
}

export function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function toYaml(value: unknown): string {
  return yaml.dump(value, { lineWidth: 100, noRefs: true });
}

export function downloadText(filename: string, contents: string, mime = "application/json"): void {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "export";
}
