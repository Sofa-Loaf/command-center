import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createPlaceholderMap, extractTokens, fillPlaceholders, uniqueTokenNames } from "./placeholders";

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

  it("leaves inherited names unfilled and renders them as text", () => {
    const body = "run {{constructor}} && echo ${toString} {{__proto__}}";
    const values: Record<string, string> = { user: "ada" };
    let result: ReturnType<typeof fillPlaceholders> | undefined;
    expect(() => {
      result = fillPlaceholders(body, values);
    }).not.toThrow();
    expect(result?.text).toBe(body);
    expect(result?.missing).toEqual(["constructor", "tostring", "__proto__"]);
    expect(result?.used).toEqual([]);

    const html = renderToStaticMarkup(React.createElement("span", null, result?.text));
    expect(html).toBe("<span>run {{constructor}} &amp;&amp; echo ${toString} {{__proto__}}</span>");
    expect(html).not.toContain("function");
  });

  it("still fills real placeholders beside inherited names", () => {
    const values = createPlaceholderMap({ user: "root", host: "10.0.0.8" });
    const result = fillPlaceholders("ssh {{user}}@{{host}} {{constructor}}", values);
    expect(result.text).toBe("ssh root@10.0.0.8 {{constructor}}");
    expect(result.missing).toEqual(["constructor"]);
    expect(result.used).toEqual(["user", "host"]);
    expect(Object.getPrototypeOf(values)).toBeNull();
  });

  it("ignores own non-string values instead of calling them", () => {
    const values = Object.create(null) as Record<string, string>;
    Object.defineProperty(values, "constructor", {
      value() {
        return "nope";
      },
      enumerable: true,
    });
    Object.defineProperty(values, "toString", {
      value: {
        trim() {
          throw new Error("called");
        },
      },
      enumerable: true,
    });
    const result = fillPlaceholders("{{constructor}} ${toString} {{__proto__}}", values);
    expect(result.text).toBe("{{constructor}} ${toString} {{__proto__}}");
    expect(result.missing).toEqual(["constructor", "tostring", "__proto__"]);
  });
});
