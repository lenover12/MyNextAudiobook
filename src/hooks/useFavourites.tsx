import React, { createContext, useContext, useState, useEffect } from "react";
import type { BookDBEntry } from "../dto/bookDB";
import { getFavourites, addFavouritesEntry, removeFavouritesEntry, clearFavourites } from "../utils/favouritesStorage";

type FavouritesContextValue = {
  favourites: BookDBEntry[];
  addEntry: (entry: BookDBEntry) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
};

const FavouritesContext = createContext<FavouritesContextValue | undefined>(undefined);

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<BookDBEntry[]>([]);

  const refresh = async () => {
    const maxItems = 500;
    const entries = await getFavourites(maxItems);
    setFavourites(entries);
  };

  const addEntryWrapper = async (entry: BookDBEntry) => {
    await addFavouritesEntry(entry);
    await refresh();
  };

  const removeEntryWrapper = async (id: string) => {
    await removeFavouritesEntry(id);
    await refresh();
  };

  const clearAllWrapper = async () => {
    await clearFavourites();
    await refresh();
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <FavouritesContext.Provider
      value={{ favourites, addEntry: addEntryWrapper, removeEntry: removeEntryWrapper, clearAll: clearAllWrapper, refresh }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}
