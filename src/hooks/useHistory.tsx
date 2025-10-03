import React, { createContext, useContext, useState, useEffect } from "react";
import type { BookDBEntry } from "../dto/bookDB";
import { getHistory, addHistoryEntry, removeHistoryEntry, clearHistory } from "../utils/historyStorage";
import { trackEvent } from "../utils/analytics";

type HistoryContextValue = {
  history: BookDBEntry[];
  addEntry: (entry: BookDBEntry) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextValue | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<BookDBEntry[]>([]);

  const refresh = async () => {
    const maxItems = 500;
    const entries = await getHistory(maxItems);
    setHistory(entries);
  };

  const addEntryWrapper = async (entry: BookDBEntry) => {
    await addHistoryEntry(entry);
    await refresh();
  };

  const removeEntryWrapper = async (id: string) => {
    await removeHistoryEntry(id);
    await refresh();
  };

  const clearAllWrapper = async () => {
    await clearHistory();
    trackEvent("history_deleted_all");
    await refresh();
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <HistoryContext.Provider
      value={{ history, addEntry: addEntryWrapper, removeEntry: removeEntryWrapper, clearAll: clearAllWrapper, refresh }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within HistoryProvider");
  return ctx;
}
