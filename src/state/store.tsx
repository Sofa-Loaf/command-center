import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { copyText } from "../lib/clipboard";
import {
  addCommand,
  addTab,
  deleteCommand,
  deleteTab,
  duplicateCommand,
  markCopied,
  mergeImportedTabs,
  moveCommand,
  moveTab,
  renameTab,
  replaceWithImportedTabs,
  resetLibrary,
  setActiveTab,
  setListDensity,
  setPlaceholders,
  setScrollMotion,
  setTheme,
  snapshot,
  toggleFavorite,
  updateCommand,
} from "../lib/library";
import { fillPlaceholders } from "../lib/placeholders";
import { loadDocument, saveDocument } from "../lib/storage";
import { applyScroll, prefersReducedMotion, resolveScrollBehavior } from "../lib/scroll";
import { applyTheme, cycleTheme, prefersDark, resolveTheme } from "../lib/theme";
import type { AppDocument, Command, ListDensity, ScrollMotion, ThemePref } from "../lib/types";

export interface ToastItem {
  id: string;
  message: string;
  tone?: "ok" | "warn";
  undo?: () => void;
}

interface StoreValue {
  doc: AppDocument;
  resolvedTheme: "light" | "dark";
  toasts: ToastItem[];
  copiedId: string | null;
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
  withUndo: (message: string, mutate: (doc: AppDocument) => AppDocument) => void;
  setDoc: (doc: AppDocument) => void;
  cycleColorMode: () => void;
  setColorMode: (theme: ThemePref) => void;
  setScrollMotion: (motion: ScrollMotion) => void;
  setListDensity: (density: ListDensity) => void;
  resolvedScroll: "smooth" | "auto";
  updatePlaceholders: (patch: Record<string, string>) => void;
  selectTab: (id: string) => void;
  createTab: (name: string) => void;
  rename: (tabId: string, name: string) => void;
  removeTab: (tabId: string) => void;
  reorderTab: (tabId: string, toIndex: number) => void;
  saveCommand: (tabId: string, command: Command, isNew: boolean) => void;
  removeCommand: (command: Command) => void;
  dupCommand: (commandId: string) => void;
  starCommand: (commandId: string) => void;
  relocateCommand: (commandId: string, tabId: string, index: number) => void;
  importTabs: (tabs: AppDocument["tabs"], mode: "merge" | "replace") => void;
  restoreStarter: () => void;
  copyCommand: (command: Command, mode: "filled" | "raw") => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

function toastId(): string {
  return `toast_${Math.random().toString(36).slice(2, 10)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [doc, setDocState] = useState<AppDocument>(() => loadDocument());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [systemDark, setSystemDark] = useState(prefersDark);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const copiedTimer = useRef<number | null>(null);

  const resolvedTheme = resolveTheme(doc.theme, systemDark);
  const resolvedScroll = resolveScrollBehavior(doc.scrollMotion, reducedMotion);

  useEffect(() => {
    applyTheme(doc.theme, resolvedTheme);
  }, [doc.theme, resolvedTheme]);

  useEffect(() => {
    applyScroll(doc.scrollMotion, resolvedScroll, doc.listDensity);
  }, [doc.listDensity, doc.scrollMotion, resolvedScroll]);

  useEffect(() => {
    saveDocument(doc);
  }, [doc]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setDoc = useCallback((next: AppDocument) => {
    setDocState(next);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = toastId();
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 7000);
  }, []);

  const withUndo = useCallback(
    (message: string, mutate: (current: AppDocument) => AppDocument) => {
      const previous = snapshot(doc);
      setDocState(mutate(doc));
      pushToast({
        message,
        undo: () => setDocState(previous),
      });
    },
    [doc, pushToast],
  );

  const copyCommand = useCallback(
    async (command: Command, mode: "filled" | "raw") => {
      const filled = fillPlaceholders(command.body, doc.placeholders);
      const text = mode === "raw" ? command.body : filled.text;
      try {
        await copyText(text);
      } catch {
        pushToast({ tone: "warn", message: "Clipboard permission denied — select the command body and copy manually." });
        return;
      }
      setDocState(markCopied(doc, command.id));
      setCopiedId(command.id);
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopiedId(null), 1200);
      if (mode === "filled" && filled.missing.length > 0) {
        pushToast({
          tone: "warn",
          message: `Copied with empty placeholders: ${filled.missing.join(", ")}`,
        });
      } else {
        pushToast({
          message: mode === "raw" ? `Copied raw · ${command.title}` : `Copied · ${command.title}`,
        });
      }
    },
    [doc, pushToast],
  );

  const value = useMemo<StoreValue>(
    () => ({
      doc,
      resolvedTheme,
      toasts,
      copiedId,
      pushToast,
      dismissToast,
      withUndo,
      setDoc,
      cycleColorMode: () => setDocState(setTheme(doc, cycleTheme(doc.theme))),
      setColorMode: (theme) => setDocState(setTheme(doc, theme)),
      setScrollMotion: (motion) => setDocState(setScrollMotion(doc, motion)),
      setListDensity: (density) => setDocState(setListDensity(doc, density)),
      resolvedScroll,
      updatePlaceholders: (patch) => setDocState(setPlaceholders(doc, patch)),
      selectTab: (id) => setDocState(setActiveTab(doc, id)),
      createTab: (name) => setDocState(addTab(doc, name)),
      rename: (tabId, name) => setDocState(renameTab(doc, tabId, name)),
      removeTab: (tabId) =>
        withUndo("Tab deleted", (current) => deleteTab(current, tabId)),
      reorderTab: (tabId, toIndex) => setDocState(moveTab(doc, tabId, toIndex)),
      saveCommand: (tabId, command, isNew) =>
        setDocState(
          isNew
            ? addCommand(doc, tabId, command)
            : updateCommand(doc, command.id, command),
        ),
      removeCommand: (command) =>
        withUndo(`Deleted ${command.title}`, (current) => deleteCommand(current, command.id)),
      dupCommand: (commandId) => setDocState(duplicateCommand(doc, commandId)),
      starCommand: (commandId) => setDocState(toggleFavorite(doc, commandId)),
      relocateCommand: (commandId, tabId, index) =>
        setDocState(moveCommand(doc, commandId, tabId, index)),
      importTabs: (tabs, mode) =>
        setDocState(mode === "replace" ? replaceWithImportedTabs(doc, tabs) : mergeImportedTabs(doc, tabs)),
      restoreStarter: () =>
        withUndo("Library reset to starter pack", (current) => resetLibrary(current)),
      copyCommand,
    }),
    [copiedId, copyCommand, dismissToast, doc, pushToast, resolvedScroll, resolvedTheme, setDoc, toasts, withUndo],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("StoreProvider missing");
  return value;
}
