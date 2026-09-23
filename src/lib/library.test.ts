import { describe, expect, it } from "vitest";
import {
  addCommand,
  addTab,
  buildStarterDocument,
  deleteCommand,
  deleteTab,
  duplicateCommand,
  moveTab,
  renameTab,
  resetLibrary,
  setListDensity,
  setScrollMotion,
  toggleFavorite,
} from "./library";

describe("library", () => {
  it("seeds the eight default tabs with starter commands", () => {
    const doc = buildStarterDocument();
    const names = doc.tabs.map((tab) => tab.name);
    expect(names).toEqual([
      "Diagnostics",
      "Networking",
      "Troubleshooting",
      "System Info",
      "Disk/Storage",
      "Users/Auth",
      "Services",
      "Logs",
    ]);
    expect(doc.tabs.every((tab) => tab.commands.length > 0)).toBe(true);
    expect(doc.tabs.some((tab) => tab.commands.some((command) => command.os === "linux"))).toBe(true);
    expect(doc.tabs.some((tab) => tab.commands.some((command) => command.os === "windows"))).toBe(true);
    expect(doc.tabs.some((tab) => tab.commands.some((command) => command.favorite))).toBe(true);
    expect(doc.scrollMotion).toBe("system");
    expect(doc.listDensity).toBe("comfortable");
  });

  it("keeps theme and scroll prefs when the library is reset", () => {
    const doc = {
      ...buildStarterDocument(),
      theme: "light" as const,
      scrollMotion: "instant" as const,
      listDensity: "compact" as const,
    };
    const reset = resetLibrary(doc);
    expect(reset.theme).toBe("light");
    expect(reset.scrollMotion).toBe("instant");
    expect(reset.listDensity).toBe("compact");
    expect(reset.tabs.map((tab) => tab.name)).toEqual(doc.tabs.map((tab) => tab.name));
  });

  it("updates scroll motion and density without dropping tabs", () => {
    const doc = buildStarterDocument();
    const next = setListDensity(setScrollMotion(doc, "smooth"), "compact");
    expect(next.scrollMotion).toBe("smooth");
    expect(next.listDensity).toBe("compact");
    expect(next.tabs.length).toBe(doc.tabs.length);
  });

  it("supports tab crud and reorder", () => {
    let doc = buildStarterDocument();
    const firstId = doc.tabs[0]?.id ?? "";
    doc = addTab(doc, "Runbooks");
    expect(doc.tabs.at(-1)?.name).toBe("Runbooks");
    const runbookId = doc.tabs.at(-1)?.id ?? "";
    doc = renameTab(doc, runbookId, "Field runbooks");
    expect(doc.tabs.at(-1)?.name).toBe("Field runbooks");
    doc = moveTab(doc, runbookId, 0);
    expect(doc.tabs[0]?.name).toBe("Field runbooks");
    doc = deleteTab(doc, firstId);
    expect(doc.tabs.some((tab) => tab.id === firstId)).toBe(false);
  });

  it("duplicates, favorites, and deletes commands", () => {
    let doc = buildStarterDocument();
    const tab = doc.tabs[0];
    expect(tab).toBeTruthy();
    if (!tab) return;
    doc = addCommand(doc, tab.id, {
      title: "Custom ping",
      body: "ping {{host}}",
      os: "linux",
      tags: ["icmp"],
      notes: "",
    });
    const created = doc.tabs[0]?.commands[0];
    expect(created?.title).toBe("Custom ping");
    if (!created) return;
    doc = toggleFavorite(doc, created.id);
    expect(doc.tabs[0]?.commands[0]?.favorite).toBe(true);
    doc = duplicateCommand(doc, created.id);
    expect(doc.tabs[0]?.commands[1]?.title).toBe("Custom ping (copy)");
    doc = deleteCommand(doc, created.id);
    expect(doc.tabs[0]?.commands.some((command) => command.id === created.id)).toBe(false);
  });
});
