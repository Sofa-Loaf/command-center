import { describe, expect, it } from "vitest";
import { resolveScrollBehavior } from "./scroll";

describe("scroll motion", () => {
  it("follows reduced motion only in system mode", () => {
    expect(resolveScrollBehavior("system", true)).toBe("auto");
    expect(resolveScrollBehavior("system", false)).toBe("smooth");
    expect(resolveScrollBehavior("smooth", true)).toBe("smooth");
    expect(resolveScrollBehavior("instant", false)).toBe("auto");
  });
});
