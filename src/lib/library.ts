import starter from "../../examples/commands.json";
import { createId } from "./ids";
import {
  DOCUMENT_KEY,
  OS_KINDS,
  SCHEMA_VERSION,
  STANDARD_PLACEHOLDERS,
  type AppDocument,
  type Command,
  type OsKind,
  type StarterLibrary,
  type ListDensity,
  type ScrollMotion,
  type Tab,
  type ThemePref,
} from "./types";

const DEFAULT_TAB_NAMES = [
  "Diagnostics",
  "Networking",
  "Troubleshooting",
  "System Info",
  "Disk/Storage",
  "Users/Auth",
  "Services",
  "Logs",
] as const;

function emptyPlaceholders(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of STANDARD_PLACEHOLDERS) {
    values[key] = "";
  }
  return values;
}

function isOsKind(value: string): value is OsKind {
  return (OS_KINDS as readonly string[]).includes(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeCommand(input: Partial<Command> & Pick<Command, "title" | "body">): Command {
  const os = typeof input.os === "string" && isOsKind(input.os) ? input.os : "generic";
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => tag.trim()).filter(Boolean)
    : [];
  return {
    id: input.id && input.id.length > 0 ? input.id : createId("cmd"),
    title: input.title.trim() || "Untitled command",
    notes: (input.notes ?? "").trim(),
    tags,
    os,
    body: input.body,
    favorite: Boolean(input.favorite),
  };
}

export function createEmptyTab(name: string, commands: Command[] = []): Tab {
  return {
    id: createId("tab"),
    name: name.trim() || "New tab",
    commands,
  };
}

export function buildStarterDocument(): AppDocument {
  const source = starter as StarterLibrary;
  const byName = new Map(source.tabs.map((tab) => [tab.name, tab]));
  const tabs: Tab[] = DEFAULT_TAB_NAMES.map((name) => {
    const found = byName.get(name);
    const commands = (found?.commands ?? []).map((command) =>
      normalizeCommand({
        title: command.title,
        notes: command.notes,
        tags: command.tags,
        os: command.os,
        body: command.body,
        favorite: command.favorite,
      }),
    );
    return createEmptyTab(name, commands);
  });

  for (const extra of source.tabs) {
    if ((DEFAULT_TAB_NAMES as readonly string[]).includes(extra.name)) continue;
    tabs.push(
      createEmptyTab(
        extra.name,
        extra.commands.map((command) =>
          normalizeCommand({
            title: command.title,
            notes: command.notes,
            tags: command.tags,
            os: command.os,
            body: command.body,
            favorite: command.favorite,
          }),
        ),
      ),
    );
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    theme: "system",
    scrollMotion: "system",
    listDensity: "comfortable",
    activeTabId: tabs[0]?.id ?? "",
    placeholders: emptyPlaceholders(),
    tabs,
    lastCopiedId: null,
    updatedAt: nowIso(),
  };
}

export function defaultDocument(): AppDocument {
  return buildStarterDocument();
}

export function findTab(doc: AppDocument, tabId: string): Tab | undefined {
  return doc.tabs.find((tab) => tab.id === tabId);
}

export function findCommand(
  doc: AppDocument,
  commandId: string,
): { tab: Tab; command: Command; tabIndex: number; commandIndex: number } | undefined {
  for (let tabIndex = 0; tabIndex < doc.tabs.length; tabIndex += 1) {
    const tab = doc.tabs[tabIndex];
    if (!tab) continue;
    const commandIndex = tab.commands.findIndex((command) => command.id === commandId);
    if (commandIndex >= 0) {
      const command = tab.commands[commandIndex];
      if (command) return { tab, command, tabIndex, commandIndex };
    }
  }
  return undefined;
}

export function allCommands(doc: AppDocument): Array<{ tab: Tab; command: Command }> {
  const out: Array<{ tab: Tab; command: Command }> = [];
  for (const tab of doc.tabs) {
    for (const command of tab.commands) {
      out.push({ tab, command });
    }
  }
  return out;
}

export function favoriteCommands(doc: AppDocument): Array<{ tab: Tab; command: Command }> {
  return allCommands(doc).filter(({ command }) => command.favorite);
}

export function touch(doc: AppDocument): AppDocument {
  return { ...doc, updatedAt: nowIso() };
}

export function setTheme(doc: AppDocument, theme: ThemePref): AppDocument {
  return touch({ ...doc, theme });
}

export function setScrollMotion(doc: AppDocument, scrollMotion: ScrollMotion): AppDocument {
  return touch({ ...doc, scrollMotion });
}

export function setListDensity(doc: AppDocument, listDensity: ListDensity): AppDocument {
  return touch({ ...doc, listDensity });
}

export function setActiveTab(doc: AppDocument, tabId: string): AppDocument {
  if (!doc.tabs.some((tab) => tab.id === tabId)) return doc;
  return touch({ ...doc, activeTabId: tabId });
}

export function setPlaceholders(
  doc: AppDocument,
  patch: Record<string, string>,
): AppDocument {
  const placeholders = { ...doc.placeholders };
  for (const [key, value] of Object.entries(patch)) {
    placeholders[key.trim().toLowerCase()] = value;
  }
  return touch({ ...doc, placeholders });
}

export function addTab(doc: AppDocument, name: string): AppDocument {
  const tab = createEmptyTab(name);
  return touch({
    ...doc,
    tabs: [...doc.tabs, tab],
    activeTabId: tab.id,
  });
}

export function renameTab(doc: AppDocument, tabId: string, name: string): AppDocument {
  const trimmed = name.trim();
  if (!trimmed) return doc;
  return touch({
    ...doc,
    tabs: doc.tabs.map((tab) => (tab.id === tabId ? { ...tab, name: trimmed } : tab)),
  });
}

export function deleteTab(doc: AppDocument, tabId: string): AppDocument {
  if (doc.tabs.length <= 1) return doc;
  const tabs = doc.tabs.filter((tab) => tab.id !== tabId);
  const activeTabId = doc.activeTabId === tabId ? (tabs[0]?.id ?? "") : doc.activeTabId;
  return touch({ ...doc, tabs, activeTabId });
}

export function moveTab(doc: AppDocument, tabId: string, toIndex: number): AppDocument {
  const from = doc.tabs.findIndex((tab) => tab.id === tabId);
  if (from < 0) return doc;
  const next = [...doc.tabs];
  const [tab] = next.splice(from, 1);
  if (!tab) return doc;
  const clamped = Math.max(0, Math.min(toIndex, next.length));
  next.splice(clamped, 0, tab);
  return touch({ ...doc, tabs: next });
}

export function addCommand(doc: AppDocument, tabId: string, input: Partial<Command> & Pick<Command, "title" | "body">): AppDocument {
  const command = normalizeCommand(input);
  return touch({
    ...doc,
    tabs: doc.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, commands: [command, ...tab.commands] } : tab,
    ),
  });
}

export function updateCommand(doc: AppDocument, commandId: string, patch: Partial<Command>): AppDocument {
  return touch({
    ...doc,
    tabs: doc.tabs.map((tab) => ({
      ...tab,
      commands: tab.commands.map((command) => {
        if (command.id !== commandId) return command;
        return normalizeCommand({ ...command, ...patch, id: command.id });
      }),
    })),
  });
}

export function deleteCommand(doc: AppDocument, commandId: string): AppDocument {
  return touch({
    ...doc,
    tabs: doc.tabs.map((tab) => ({
      ...tab,
      commands: tab.commands.filter((command) => command.id !== commandId),
    })),
    lastCopiedId: doc.lastCopiedId === commandId ? null : doc.lastCopiedId,
  });
}

export function duplicateCommand(doc: AppDocument, commandId: string): AppDocument {
  const found = findCommand(doc, commandId);
  if (!found) return doc;
  const copy = normalizeCommand({
    ...found.command,
    id: createId("cmd"),
    title: `${found.command.title} (copy)`,
    favorite: false,
  });
  return touch({
    ...doc,
    tabs: doc.tabs.map((tab) => {
      if (tab.id !== found.tab.id) return tab;
      const commands = [...tab.commands];
      commands.splice(found.commandIndex + 1, 0, copy);
      return { ...tab, commands };
    }),
  });
}

export function toggleFavorite(doc: AppDocument, commandId: string): AppDocument {
  return touch({
    ...doc,
    tabs: doc.tabs.map((tab) => ({
      ...tab,
      commands: tab.commands.map((command) =>
        command.id === commandId ? { ...command, favorite: !command.favorite } : command,
      ),
    })),
  });
}

export function moveCommand(
  doc: AppDocument,
  commandId: string,
  toTabId: string,
  toIndex: number,
): AppDocument {
  const found = findCommand(doc, commandId);
  if (!found) return doc;
  const command = found.command;
  const without = doc.tabs.map((tab) => ({
    ...tab,
    commands: tab.commands.filter((item) => item.id !== commandId),
  }));
  return touch({
    ...doc,
    tabs: without.map((tab) => {
      if (tab.id !== toTabId) return tab;
      const commands = [...tab.commands];
      const clamped = Math.max(0, Math.min(toIndex, commands.length));
      commands.splice(clamped, 0, command);
      return { ...tab, commands };
    }),
  });
}

export function markCopied(doc: AppDocument, commandId: string): AppDocument {
  return touch({ ...doc, lastCopiedId: commandId });
}

export function mergeImportedTabs(doc: AppDocument, incoming: Tab[]): AppDocument {
  const tabs = clone(doc.tabs);
  for (const tab of incoming) {
    const existing = tabs.find((item) => item.name.toLowerCase() === tab.name.toLowerCase());
    if (existing) {
      existing.commands.push(...tab.commands.map((command) => normalizeCommand({ ...command, id: createId("cmd") })));
    } else {
      tabs.push({
        ...createEmptyTab(tab.name),
        commands: tab.commands.map((command) => normalizeCommand({ ...command, id: createId("cmd") })),
      });
    }
  }
  return touch({ ...doc, tabs });
}

export function replaceWithImportedTabs(doc: AppDocument, incoming: Tab[]): AppDocument {
  const tabs =
    incoming.length > 0
      ? incoming.map((tab) => ({
          ...createEmptyTab(tab.name),
          commands: tab.commands.map((command) => normalizeCommand({ ...command, id: createId("cmd") })),
        }))
      : [createEmptyTab("Imported")];
  return touch({
    ...doc,
    tabs,
    activeTabId: tabs[0]?.id ?? "",
    lastCopiedId: null,
  });
}

export function resetLibrary(current: AppDocument): AppDocument {
  return touch({
    ...buildStarterDocument(),
    theme: current.theme,
    scrollMotion: current.scrollMotion,
    listDensity: current.listDensity,
  });
}

export function snapshot(doc: AppDocument): AppDocument {
  return clone(doc);
}

export { DOCUMENT_KEY, emptyPlaceholders };
