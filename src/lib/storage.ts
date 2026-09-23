import {
  defaultDocument,
  snapshot,
} from "./library";
import {
  DOCUMENT_KEY,
  SCHEMA_VERSION,
  LIST_DENSITIES,
  OS_KINDS,
  SCROLL_MOTIONS,
  THEME_PREFS,
  STANDARD_PLACEHOLDERS,
  type AppDocument,
  type Command,
  type ListDensity,
  type OsKind,
  type ScrollMotion,
  type Tab,
  type ThemePref,
} from "./types";
import { createId } from "./ids";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function isOsKind(value: unknown): value is OsKind {
  return typeof value === "string" && (OS_KINDS as readonly string[]).includes(value);
}

function isThemePref(value: unknown): value is ThemePref {
  return typeof value === "string" && (THEME_PREFS as readonly string[]).includes(value);
}

function isScrollMotion(value: unknown): value is ScrollMotion {
  return typeof value === "string" && (SCROLL_MOTIONS as readonly string[]).includes(value);
}

function isListDensity(value: unknown): value is ListDensity {
  return typeof value === "string" && (LIST_DENSITIES as readonly string[]).includes(value);
}

function parseCommand(value: unknown): Command | null {
  if (!isRecord(value)) return null;
  const title = asString(value.title).trim();
  const body = asString(value.body);
  if (!title && !body) return null;
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
    : [];
  return {
    id: asString(value.id) || createId("cmd"),
    title: title || "Untitled command",
    notes: asString(value.notes),
    tags,
    os: isOsKind(value.os) ? value.os : "generic",
    body,
    favorite: Boolean(value.favorite),
  };
}

function parseTab(value: unknown): Tab | null {
  if (!isRecord(value)) return null;
  const name = asString(value.name).trim();
  if (!name) return null;
  const rawCommands = Array.isArray(value.commands) ? value.commands : [];
  return {
    id: asString(value.id) || createId("tab"),
    name,
    commands: rawCommands.map(parseCommand).filter((command): command is Command => command !== null),
  };
}

export function sanitizeDocument(raw: unknown): AppDocument | null {
  if (!isRecord(raw)) return null;
  const tabs = Array.isArray(raw.tabs)
    ? raw.tabs.map(parseTab).filter((tab): tab is Tab => tab !== null)
    : [];
  if (tabs.length === 0) return null;

  const placeholders: Record<string, string> = {};
  for (const key of STANDARD_PLACEHOLDERS) placeholders[key] = "";
  if (isRecord(raw.placeholders)) {
    for (const [key, value] of Object.entries(raw.placeholders)) {
      if (typeof value === "string") placeholders[key.toLowerCase()] = value;
    }
  }

  const activeTabId = asString(raw.activeTabId);
  return {
    schemaVersion: SCHEMA_VERSION,
    theme: isThemePref(raw.theme) ? raw.theme : "system",
    scrollMotion: isScrollMotion(raw.scrollMotion) ? raw.scrollMotion : "system",
    listDensity: isListDensity(raw.listDensity) ? raw.listDensity : "comfortable",
    activeTabId: tabs.some((tab) => tab.id === activeTabId) ? activeTabId : (tabs[0]?.id ?? ""),
    placeholders,
    tabs,
    lastCopiedId: asString(raw.lastCopiedId) || null,
    updatedAt: asString(raw.updatedAt) || new Date().toISOString(),
  };
}

export function loadDocument(): AppDocument {
  if (typeof localStorage === "undefined") {
    return defaultDocument();
  }
  try {
    const raw = localStorage.getItem(DOCUMENT_KEY);
    if (!raw) return defaultDocument();
    const parsed = sanitizeDocument(JSON.parse(raw) as unknown);
    return parsed ?? defaultDocument();
  } catch {
    return defaultDocument();
  }
}

export function saveDocument(doc: AppDocument): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DOCUMENT_KEY, JSON.stringify(doc));
}

export function exportDocumentJson(doc: AppDocument): string {
  return `${JSON.stringify(snapshot(doc), null, 2)}\n`;
}

export function exportTabJson(tab: Tab): string {
  return `${JSON.stringify(
    {
      schemaVersion: SCHEMA_VERSION,
      tabs: [tab],
    },
    null,
    2,
  )}\n`;
}
