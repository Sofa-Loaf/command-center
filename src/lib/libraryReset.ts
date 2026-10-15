import { DOCUMENT_KEY } from "./types";

export const RESET_LIBRARY_MESSAGE =
  "Reset library? This clears the saved command-center:document data in this browser and reloads the starter pack. This cannot be undone.";

/** Swappable in tests. Production uses window.confirm and a full reload. */
export const libraryReset = {
  confirm(message: string): boolean {
    return window.confirm(message);
  },
  reload(): void {
    window.location.reload();
  },
};

export function resetPersistedLibrary(): boolean {
  if (!libraryReset.confirm(RESET_LIBRARY_MESSAGE)) return false;
  try {
    localStorage.removeItem(DOCUMENT_KEY);
  } catch {
    // Storage can be blocked; reload still drops the broken in-memory view.
  }
  libraryReset.reload();
  return true;
}
