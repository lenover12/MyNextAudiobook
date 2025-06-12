import { useState, useEffect, useCallback } from "react";
import { fetchRandom } from "../utils/itunesAPI";
import type { AudiobookEntry } from "../types/itunesTypes";
import type { FetchOptions } from "../utils/itunesAPI";

const PRELOAD_AHEAD = 5;

export function usePreloadBooks(options: FetchOptions = {}) {
  const [books, setBooks] = useState<AudiobookEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const preload = useCallback(async (count: number) => {
    const newBooks: AudiobookEntry[] = [];

    while (newBooks.length < count) {
      const book = await fetchRandom(options);
      if (book && !newBooks.some(b => b.collectionId === book.collectionId)) {
        newBooks.push(book);
      }
    }

    setBooks(prev => [...prev, ...newBooks]);
    setIsLoading(false);
  }, [options]);

  useEffect(() => {
    preload(PRELOAD_AHEAD + 1);
  }, [preload]);

  useEffect(() => {
    if (books.length - currentIndex <= PRELOAD_AHEAD && !isLoading) {
      preload(PRELOAD_AHEAD);
    }
  }, [books, currentIndex, preload, isLoading]);

  const next = useCallback(() => {
    if (currentIndex < books.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, books.length]);

  const previous = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  const currentBook = books[currentIndex] ?? null;

  return {
    books,
    currentBook,
    currentIndex,
    isLoading,
    next,
    previous,
  };
}
