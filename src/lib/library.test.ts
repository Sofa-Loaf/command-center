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
