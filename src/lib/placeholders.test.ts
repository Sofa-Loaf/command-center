import { describe, expect, it } from "vitest";
import { extractTokens, fillPlaceholders, uniqueTokenNames } from "./placeholders";

describe("placeholders", () => {
  it("extracts brace tokens with defaults", () => {
    const tokens = extractTokens("ssh {{user}}@{{host}} -p {{port:22}}");
    expect(tokens.map((token) => [token.name, token.defaultValue])).toEqual([
      ["user", undefined],
      ["host", undefined],
      ["port", "22"],
    ]);
  });

  it("extracts ${VAR} tokens", () => {
    const names = uniqueTokenNames("echo ${USER} ${HOST:lab}");
    expect(names).toEqual(["user", "host"]);
  });

  it("fills from last-used values and defaults", () => {
    const result = fillPlaceholders("ssh {{user}}@{{host}} -p {{port:22}}", {
      user: "root",
      host: "10.0.0.8",
      port: "",
    });
    expect(result.text).toBe("ssh root@10.0.0.8 -p 22");
    expect(result.missing).toEqual([]);
    expect(result.used).toEqual(["user", "host", "port"]);
  });

  it("reports empty placeholders and still returns the raw token", () => {
    const result = fillPlaceholders("ping {{host}} && curl ${IP}", { host: "", ip: "" });
    expect(result.text).toBe("ping {{host}} && curl ${IP}");
    expect(result.missing).toEqual(["host", "ip"]);
  });

  it("is case-insensitive for stored values", () => {
    const result = fillPlaceholders("id ${USER}", { user: "alice" });
    expect(result.text).toBe("id alice");
  });
});
