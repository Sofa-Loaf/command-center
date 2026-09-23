import { describe, expect, it } from "vitest";
import { sanitizeDocument } from "./storage";

const tab = {
  id: "tab_1",
  name: "Diagnostics",
  commands: [{ id: "c1", title: "Ping", body: "ping {{host}}", os: "linux" }],
};

describe("sanitizeDocument display prefs", () => {
  it("defaults scroll prefs on older libraries", () => {
    const doc = sanitizeDocument({ tabs: [tab], theme: "dark" });
    expect(doc?.theme).toBe("dark");
    expect(doc?.scrollMotion).toBe("system");
    expect(doc?.listDensity).toBe("comfortable");
  });

  it("keeps valid scroll prefs and drops unknown values", () => {
    const doc = sanitizeDocument({
      tabs: [tab],
      scrollMotion: "instant",
      listDensity: "compact",
    });
    expect(doc?.scrollMotion).toBe("instant");
    expect(doc?.listDensity).toBe("compact");

    const invalid = sanitizeDocument({
      tabs: [tab],
      scrollMotion: "bounce",
      listDensity: "tiny",
    });
    expect(invalid?.scrollMotion).toBe("system");
    expect(invalid?.listDensity).toBe("comfortable");
  });
});
