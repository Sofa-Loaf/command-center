/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "./App";
import { placeholderLabel } from "./lib/placeholderLabels";
import { addCommand, buildStarterDocument } from "./lib/library";
import { saveDocument } from "./lib/storage";
import { StoreProvider } from "./state/store";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

function installMatchMedia() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  }));
  if (!HTMLElement.prototype.scrollTo) {
    HTMLElement.prototype.scrollTo = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

describe("hostile placeholder names", () => {
  it("uses literal labels for inherited object names", () => {
    expect(placeholderLabel("host")).toBe("Host");
    expect(placeholderLabel("constructor")).toBe("constructor");
    expect(placeholderLabel("toString")).toBe("toString");
    expect(placeholderLabel("__proto__")).toBe("__proto__");
    expect(typeof placeholderLabel("constructor")).toBe("string");
  });

  it("renders a saved command that names constructor, toString, and __proto__", () => {
    installMatchMedia();
    const starter = buildStarterDocument();
    const tabId = starter.tabs[0]?.id ?? "";
    saveDocument(
      addCommand(starter, tabId, {
        title: "Hostile tokens",
        body: "echo {{constructor}} ${toString} {{__proto__}} {{host}}",
      }),
    );

    render(
      <StoreProvider>
        <App />
      </StoreProvider>,
    );

    expect(screen.queryByRole("alert")).toBeNull();
    const card = screen.getByRole("heading", { name: "Hostile tokens" }).closest("article");
    expect(card?.textContent).toContain("echo {{constructor}} ${toString} {{__proto__}} {{host}}");
    expect(card?.textContent).not.toContain("function");
    expect(screen.getByLabelText("constructor")).toBeTruthy();
    expect(screen.getByLabelText("tostring")).toBeTruthy();
    expect(screen.getByLabelText("__proto__")).toBeTruthy();
    expect(screen.getByLabelText("Host")).toBeTruthy();
  });
});
