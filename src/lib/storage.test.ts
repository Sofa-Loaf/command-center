import { describe, expect, it } from "vitest";
import { sanitizeDocument } from "./storage";
import { fillPlaceholders } from "./placeholders";

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

  it("stores placeholder values on a null prototype and keeps only strings", () => {
    const raw = JSON.parse(
      `{"tabs":${JSON.stringify([tab])},"placeholders":{"host":"lab","constructor":"kept","toString":{"not":"a string"},"__proto__":"own-string"}}`,
    ) as unknown;

    const doc = sanitizeDocument(raw);
    expect(doc).not.toBeNull();
    expect(Object.getPrototypeOf(doc?.placeholders)).toBeNull();
    expect(doc?.placeholders.host).toBe("lab");
    expect(doc?.placeholders.constructor).toBe("kept");
    expect(doc?.placeholders.__proto__).toBe("own-string");
    expect(doc?.placeholders.toString).toBeUndefined();
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();

    const filled = fillPlaceholders("ping {{host}} {{constructor}} {{__proto__}}", doc!.placeholders);
    expect(filled.text).toBe("ping lab kept own-string");
  });
});
