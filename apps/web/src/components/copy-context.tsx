"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CopyMode } from "@/lib/copy";

const STORAGE_KEY = "inbox.copy-mode";
const EVENT_NAME = "inbox:copy-mode";

type CopyContextValue = {
  mode: CopyMode;
};

const CopyContext = createContext<CopyContextValue>({ mode: "simple" });

export function CopyProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CopyMode>("simple");

  // Read persisted mode on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "simple" || stored === "buzzword") {
        setMode(stored);
      }
    } catch {
      // ignore — localStorage may be unavailable
    }
  }, []);

  // Listen for toggle events dispatched from CopyToggle (or anywhere else).
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CopyMode>).detail;
      if (detail === "simple" || detail === "buzzword") {
        setMode(detail);
      }
    };
    window.addEventListener(EVENT_NAME, onChange as EventListener);
    return () =>
      window.removeEventListener(EVENT_NAME, onChange as EventListener);
  }, []);

  return (
    <CopyContext.Provider value={{ mode }}>{children}</CopyContext.Provider>
  );
}

export function useCopyMode(): CopyMode {
  return useContext(CopyContext).mode;
}
