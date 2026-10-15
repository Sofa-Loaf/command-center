/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { libraryReset, resetPersistedLibrary } from "../lib/libraryReset";
import { DOCUMENT_KEY } from "../lib/types";

const originalReset = {
  confirm: libraryReset.confirm,
  reload: libraryReset.reload,
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  libraryReset.confirm = originalReset.confirm;
  libraryReset.reload = originalReset.reload;
  vi.restoreAllMocks();
});

function Boom(): never {
  throw new Error("bad command");
}

function silenceReactErrorLog() {
  vi.spyOn(console, "error").mockImplementation(() => {});
}

describe("error boundary", () => {
  it("renders a fallback when a child throws and leaves siblings mounted", () => {
    silenceReactErrorLog();
    render(
      <div>
        <p>Library chrome</p>
        <ErrorBoundary variant="pane">
          <Boom />
        </ErrorBoundary>
        <ErrorBoundary variant="card">
          <p>Good command</p>
        </ErrorBoundary>
      </div>,
    );

    expect(screen.getByText("Library chrome")).toBeTruthy();
    expect(screen.getByText("Good command")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("These commands couldn't be shown");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset library" })).toBeTruthy();
  });

  it("shows a single bad card without hiding the others", () => {
    silenceReactErrorLog();
    render(
      <div>
        <ErrorBoundary variant="card">
          <p>Good command</p>
        </ErrorBoundary>
        <ErrorBoundary variant="card">
          <Boom />
        </ErrorBoundary>
      </div>,
    );

    expect(screen.getByText("Good command")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("This command couldn't be shown");
  });

  it("tries again after the child can render", () => {
    silenceReactErrorLog();
    function Flaky({ fail }: { fail: boolean }) {
      if (fail) throw new Error("bad command");
      return <p>Command shown</p>;
    }
    function Harness() {
      const [fail, setFail] = useState(true);
      return (
        <div>
          <button type="button" onClick={() => setFail(false)}>
            heal
          </button>
          <ErrorBoundary variant="app">
            <Flaky fail={fail} />
          </ErrorBoundary>
        </div>
      );
    }

    render(<Harness />);
    expect(screen.getByRole("alert").textContent).toContain("couldn't open this library");
    fireEvent.click(screen.getByRole("button", { name: "heal" }));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Command shown")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears command-center:document after confirm and leaves it when cancelled", () => {
    silenceReactErrorLog();
    const reload = vi.fn();
    libraryReset.reload = reload;
    localStorage.setItem(DOCUMENT_KEY, "{\"bad\":true}");

    libraryReset.confirm = () => false;
    expect(resetPersistedLibrary()).toBe(false);
    expect(localStorage.getItem(DOCUMENT_KEY)).toBe("{\"bad\":true}");
    expect(reload).not.toHaveBeenCalled();

    render(
      <ErrorBoundary variant="app">
        <Boom />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset library" }));
    expect(localStorage.getItem(DOCUMENT_KEY)).toBe("{\"bad\":true}");

    libraryReset.confirm = () => true;
    fireEvent.click(screen.getByRole("button", { name: "Reset library" }));
    expect(localStorage.getItem(DOCUMENT_KEY)).toBeNull();
    expect(reload).toHaveBeenCalledOnce();
  });
});
