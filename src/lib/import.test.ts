import { describe, expect, it } from "vitest";
import { detectAndParse, importedToTabs } from "./import";
import { buildStarterDocument } from "./library";
import { searchCommands } from "./search";
import { libraryForExport, toJson } from "./export";

describe("search", () => {
  it("ranks title matches above body matches", () => {
    const doc = buildStarterDocument();
    const hits = searchCommands(
      doc.tabs.flatMap((tab) => tab.commands.map((command) => ({ tab, command }))),
      "ping",
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.command.title.toLowerCase()).toContain("ping");
  });
});

describe("import/export", () => {
  it("round-trips library JSON", () => {
    const doc = buildStarterDocument();
    const json = toJson(libraryForExport(doc));
    const parsed = detectAndParse(json, "library.json");
    expect(parsed.format).toBe("json");
    expect(parsed.tabs.map((tab) => tab.name)).toEqual(doc.tabs.map((tab) => tab.name));
    expect(importedToTabs(parsed)[0]?.commands.length).toBe(doc.tabs[0]?.commands.length);
  });

  it("imports yaml tabs", () => {
    const yaml = `
tabs:
  - name: Runbooks
    commands:
      - title: Disk pressure
        os: linux
        tags: [disk]
        body: df -h
`;
    const parsed = detectAndParse(yaml, "runbooks.yaml");
    expect(parsed.format).toBe("yaml");
    expect(parsed.tabs[0]?.name).toBe("Runbooks");
    expect(parsed.tabs[0]?.commands[0]?.body).toBe("df -h");
  });

  it("imports markdown fences", () => {
    const md = `
# Networking
## Show listeners
os: linux
tags: ports, ss

\`\`\`bash
ss -tulpn
\`\`\`

Who owns the port.
`;
    const parsed = detectAndParse(md, "net.md");
    expect(parsed.format).toBe("markdown");
    expect(parsed.tabs[0]?.name).toBe("Networking");
    expect(parsed.tabs[0]?.commands[0]?.title).toBe("Show listeners");
    expect(parsed.tabs[0]?.commands[0]?.body).toBe("ss -tulpn");
    expect(parsed.tabs[0]?.commands[0]?.os).toBe("linux");
  });

  it("imports dashed text blocks", () => {
    const text = `# Check disk\ndf -h\n---\n# Who\nwhoami`;
    const parsed = detectAndParse(text, "notes.txt");
    expect(parsed.format).toBe("text");
    expect(parsed.tabs[0]?.commands).toHaveLength(2);
    expect(parsed.tabs[0]?.commands[1]?.body).toBe("whoami");
  });
});
