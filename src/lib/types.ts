export const DOCUMENT_KEY = "command-center:document";
export const SCHEMA_VERSION = 1 as const;

export const OS_KINDS = ["linux", "windows", "macos", "generic"] as const;
export type OsKind = (typeof OS_KINDS)[number];

export const THEME_PREFS = ["system", "light", "dark"] as const;
export type ThemePref = (typeof THEME_PREFS)[number];
export type ResolvedTheme = "light" | "dark";

/** System follows prefers-reduced-motion. Smooth and instant are explicit. */
export const SCROLL_MOTIONS = ["system", "smooth", "instant"] as const;
export type ScrollMotion = (typeof SCROLL_MOTIONS)[number];

export const LIST_DENSITIES = ["comfortable", "compact"] as const;
export type ListDensity = (typeof LIST_DENSITIES)[number];

export const STANDARD_PLACEHOLDERS = [
  "host",
  "ip",
  "user",
  "port",
  "path",
  "service",
  "pid",
  "interface",
  "days",
] as const;

export type StandardPlaceholder = (typeof STANDARD_PLACEHOLDERS)[number];

export interface Command {
  id: string;
  title: string;
  notes: string;
  tags: string[];
  os: OsKind;
  body: string;
  favorite: boolean;
}

export interface Tab {
  id: string;
  name: string;
  commands: Command[];
}

export interface AppDocument {
  schemaVersion: typeof SCHEMA_VERSION;
  theme: ThemePref;
  scrollMotion: ScrollMotion;
  listDensity: ListDensity;
  activeTabId: string;
  placeholders: Record<string, string>;
  tabs: Tab[];
  lastCopiedId: string | null;
  updatedAt: string;
}

export interface StarterCommand {
  title: string;
  notes: string;
  tags: string[];
  os: OsKind;
  body: string;
  favorite?: boolean;
}

export interface StarterTab {
  name: string;
  commands: StarterCommand[];
}

export interface StarterLibrary {
  schemaVersion: number;
  tabs: StarterTab[];
}

export interface ImportedCommand {
  title: string;
  notes?: string;
  tags?: string[];
  os?: string;
  body: string;
  favorite?: boolean;
}

export interface ImportedTab {
  name: string;
  commands: ImportedCommand[];
}

export interface ImportResult {
  tabs: ImportedTab[];
  format: "json" | "yaml" | "markdown" | "text";
}
