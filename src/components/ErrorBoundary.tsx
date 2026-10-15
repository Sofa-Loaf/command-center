import { Component, type ReactNode } from "react";
import { resetPersistedLibrary } from "../lib/libraryReset";

type BoundaryVariant = "app" | "pane" | "card" | "bar";

interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: BoundaryVariant;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

const COPY: Record<BoundaryVariant, { title: string; body: string }> = {
  app: {
    title: "Command Center couldn't open this library",
    body: "A saved or imported command failed while rendering, so the screen was left blank. Nothing was run. Try again, or reset the library stored in this browser.",
  },
  pane: {
    title: "These commands couldn't be shown",
    body: "One command failed while rendering. The rest of Command Center is still available. Nothing was run.",
  },
  card: {
    title: "This command couldn't be shown",
    body: "It failed while rendering. Other commands are still available. Nothing was run.",
  },
  bar: {
    title: "Placeholder values couldn't be shown",
    body: "A placeholder name failed while rendering. Commands below are still available. Nothing was run.",
  },
};

function CrashFallback({ variant, onRetry }: { variant: BoundaryVariant; onRetry: () => void }) {
  const copy = COPY[variant];
  return (
    <div className={`crash crash-${variant}`} role="alert">
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <div className="crash-actions">
        <button className="btn btn-accent" type="button" onClick={onRetry}>
          Try again
        </button>
        <button className="btn btn-danger" type="button" onClick={() => resetPersistedLibrary()}>
          Reset library
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <CrashFallback variant={this.props.variant ?? "app"} onRetry={this.retry} />;
    }
    return this.props.children;
  }
}
