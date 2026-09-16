import yaml from "js-yaml";
import { createEmptyTab, normalizeCommand } from "./library";
import { OS_KINDS, type ImportResult, type ImportedCommand, type ImportedTab, type OsKind, type Tab } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseOs(value: unknown): OsKind {
  if (typeof value === "string" && (OS_KINDS as readonly string[]).includes(value.toLowerCase())) {
    return value.toLowerCase() as OsKind;
  }
  return "generic";
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function parseImportedCommand(value: unknown): ImportedCommand | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const [first, ...rest] = trimmed.split("\n");
    return {
      title: (first ?? "Untitled").replace(/^#+\s*/, "").trim() || "Untitled",
      body: rest.join("\n").trim() || trimmed,
    };
  }
  if (!isRecord(value)) return null;
  const title = asString(value.title || value.name).trim();
  const body = asString(value.body || value.command || value.script);
  if (!title && !body) return null;
  return {
    title: title || "Untitled command",
    notes: asString(value.notes || value.description),
    tags: parseTags(value.tags),
    os: parseOs(value.os || value.platform),
    body,
    favorite: Boolean(value.favorite),
  };
}

function parseImportedTab(value: unknown): ImportedTab | null {
  if (!isRecord(value)) return null;
  const name = asString(value.name || value.title || value.tab).trim();
  const rawCommands = Array.isArray(value.commands)
    ? value.commands
    : Array.isArray(value.items)
      ? value.items
      : [];
  const commands = rawCommands
    .map(parseImportedCommand)
    .filter((command): command is ImportedCommand => command !== null);
  if (!name && commands.length === 0) return null;
  return { name: name || "Imported", commands };
}

function parseObjectLibrary(data: unknown): ImportedTab[] | null {
  if (Array.isArray(data)) {
    const asTabs = data.map(parseImportedTab).filter((tab): tab is ImportedTab => tab !== null);
    if (asTabs.length > 0 && asTabs.some((tab) => tab.commands.length > 0)) return asTabs;
    const commands = data
      .map(parseImportedCommand)
      .filter((command): command is ImportedCommand => command !== null);
    if (commands.length === 0) return null;
    return [{ name: "Imported", commands }];
  }
  if (!isRecord(data)) return null;
  if (Array.isArray(data.tabs)) {
    const tabs = data.tabs.map(parseImportedTab).filter((tab): tab is ImportedTab => tab !== null);
    if (tabs.length) return tabs;
  }
  if (Array.isArray(data.commands)) {
    const commands = data.commands
      .map(parseImportedCommand)
      .filter((command): command is ImportedCommand => command !== null);
    if (commands.length) return [{ name: asString(data.name, "Imported"), commands }];
  }
  const single = parseImportedCommand(data);
  if (single) return [{ name: "Imported", commands: [single] }];
  return null;
}

function looksLikeYaml(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return false;
  return /^(tabs|commands|name|title|os|body)\s*:/m.test(trimmed) || /^\s*-\s+(name|title|body)\s*:/m.test(trimmed);
}

function parseFenceMeta(info: string): { os?: OsKind; tags?: string[] } {
  const osMatch = info.match(/\b(linux|windows|macos|generic)\b/i);
  const tagMatch = info.match(/tags=([^\s]+)/i);
  return {
    os: osMatch ? parseOs(osMatch[1]) : undefined,
    tags: tagMatch?.[1] ? parseTags(tagMatch[1].replace(/,/g, " ")) : undefined,
  };
}

export function parseMarkdownLibrary(text: string): ImportedTab[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const tabs: ImportedTab[] = [];
  let currentTab: ImportedTab = { name: "Imported", commands: [] };
  let current: {
    title: string;
    notes: string[];
    tags: string[];
    os: OsKind;
    favorite: boolean;
    body: string[];
    inFence: boolean;
  } | null = null;

  const flushCommand = () => {
    if (!current) return;
    const body = current.body.join("\n").trim();
    const notes = current.notes.join("\n").trim();
    if (current.title || body) {
      currentTab.commands.push({
        title: current.title || "Untitled command",
        notes,
        tags: current.tags,
        os: current.os,
        body,
        favorite: current.favorite,
      });
    }
    current = null;
  };

  const ensureTab = () => {
    if (!tabs.includes(currentTab)) tabs.push(currentTab);
  };

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading && !current?.inFence) {
      const level = heading[1]?.length ?? 1;
      const title = heading[2]?.trim() ?? "";
      if (level === 1) {
        flushCommand();
        ensureTab();
        currentTab = { name: title || "Imported", commands: [] };
        continue;
      }
      flushCommand();
      current = {
        title,
        notes: [],
        tags: [],
        os: "generic",
        favorite: false,
        body: [],
        inFence: false,
      };
      continue;
    }

    if (current && /^```/.test(line)) {
      if (current.inFence) {
        current.inFence = false;
      } else {
        current.inFence = true;
        const meta = parseFenceMeta(line.slice(3).trim());
        if (meta.os) current.os = meta.os;
        if (meta.tags) current.tags = meta.tags;
      }
      continue;
    }

    if (current?.inFence) {
      current.body.push(line);
      continue;
    }

    const metaLine = /^(os|tags|favorite|notes)\s*:\s*(.+)$/i.exec(line.trim());
    if (current && metaLine) {
      const key = metaLine[1]?.toLowerCase();
      const value = metaLine[2] ?? "";
      if (key === "os") current.os = parseOs(value);
      if (key === "tags") current.tags = parseTags(value);
      if (key === "favorite") current.favorite = /^(true|yes|1)$/i.test(value.trim());
      if (key === "notes") current.notes.push(value);
      continue;
    }

    if (current) {
      if (!current.body.length && line.startsWith("    ")) {
        current.body.push(line.slice(4));
      } else if (line.trim()) {
        current.notes.push(line.trim());
      }
    }
  }
  flushCommand();
  ensureTab();
  return tabs.filter((tab) => tab.commands.length > 0);
}

export function parseTextLibrary(text: string): ImportedTab[] {
  const chunks = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*---\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const commands: ImportedCommand[] = [];
  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const first = lines[0] ?? "";
    const rest = lines.slice(1).join("\n").trim();
    const title = first.replace(/^#+\s*/, "").trim();
    if (rest) {
      commands.push({ title: title || "Untitled command", body: rest });
    } else if (title) {
      commands.push({ title: title.slice(0, 48), body: chunk });
    }
  }
  return commands.length ? [{ name: "Imported", commands }] : [];
}

export function detectAndParse(text: string, filename = ""): ImportResult {
  const trimmed = text.trim();
  const lower = filename.toLowerCase();

  const tryJson = (): ImportedTab[] | null => {
    try {
      return parseObjectLibrary(JSON.parse(trimmed) as unknown);
    } catch {
      return null;
    }
  };

  const tryYaml = (): ImportedTab[] | null => {
    try {
      return parseObjectLibrary(yaml.load(trimmed) as unknown);
    } catch {
      return null;
    }
  };

  if (lower.endsWith(".json")) {
    const tabs = tryJson();
    if (tabs) return { tabs, format: "json" };
  }
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) {
    const tabs = tryYaml();
    if (tabs) return { tabs, format: "yaml" };
  }
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    return { tabs: parseMarkdownLibrary(trimmed), format: "markdown" };
  }
  if (lower.endsWith(".txt")) {
    const json = tryJson();
    if (json) return { tabs: json, format: "json" };
    return { tabs: parseTextLibrary(trimmed), format: "text" };
  }

  const json = tryJson();
  if (json) return { tabs: json, format: "json" };
  if (looksLikeYaml(trimmed)) {
    const yml = tryYaml();
    if (yml) return { tabs: yml, format: "yaml" };
  }
  if (/^#{1,3}\s+/m.test(trimmed) || /```/.test(trimmed)) {
    const md = parseMarkdownLibrary(trimmed);
    if (md.length) return { tabs: md, format: "markdown" };
  }
  const yml = tryYaml();
  if (yml) return { tabs: yml, format: "yaml" };
  return { tabs: parseTextLibrary(trimmed), format: "text" };
}

export function importedToTabs(result: ImportResult): Tab[] {
  return result.tabs.map((tab) =>
    createEmptyTab(
      tab.name,
      tab.commands.map((command) =>
        normalizeCommand({
          title: command.title,
          notes: command.notes ?? "",
          tags: command.tags ?? [],
          os: command.os as OsKind | undefined,
          body: command.body,
          favorite: command.favorite,
        }),
      ),
    ),
  );
}
