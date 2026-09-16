import { describe, expect, it } from "vitest";
import { cycleTheme, resolveTheme } from "./theme";

describe("theme", () => {
  it("respects prefers-color-scheme in system mode", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("cycles system → dark → light → system", () => {
    expect(cycleTheme("system")).toBe("dark");
    expect(cycleTheme("dark")).toBe("light");
    expect(cycleTheme("light")).toBe("system");
  });
});
