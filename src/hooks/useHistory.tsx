import React, { createContext, useContext, useState, useEffect } from "react";
import type { BookHistoryEntry } from "../dto/bookHistory";
import { getHistory, addHistoryEntry, removeHistoryEntry, clearHistory } from "../utils/historyStorage";

type HistoryContextValue = {
  history: BookHistoryEntry[];
  addEntry: (entry: BookHistoryEntry) => Promise<void>;
  removeEntry: (asin: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextValue | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<BookHistoryEntry[]>([]);

  const refresh = async () => {
    const entries = await getHistory();
    setHistory(entries);
  };

  const addEntryWrapper = async (entry: BookHistoryEntry) => {
    await addHistoryEntry(entry);
    await refresh();
  };

  const removeEntryWrapper = async (asin: string) => {
    await removeHistoryEntry(asin);
    await refresh();
  };

  const clearAllWrapper = async () => {
    await clearHistory();
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
