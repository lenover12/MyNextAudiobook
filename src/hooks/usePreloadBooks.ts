import { useState, useEffect, useCallback, useRef } from "react";
import { fetchRandom } from "../utils/audiobookAPI";
import type { AudiobookDTO } from "../dto/audiobookDTO";
import type { FetchOptions } from "../utils/itunesAPI";

const PRELOAD_AHEAD = 1;

function preloadMedia(book: AudiobookDTO) {
  console.log(book);
  if (book.itunesImageUrl) {
    const img = new Image();
    img.src = book.itunesImageUrl;
  }

  if (book.audioPreviewUrl) {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = book.audioPreviewUrl;
  }
}

export function usePreloadBooks(options: FetchOptions = {}) {
  const [books, setBooks] = useState<AudiobookDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const isPreloadingRef = useRef(false);
  const booksRef = useRef<AudiobookDTO[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const preload = useCallback(async (count: number) => {
    const existingBooks = booksRef.current;
    const forwardCount = existingBooks.length - indexRef.current - 1;
    const needed = PRELOAD_AHEAD - forwardCount;

    if (needed <= 0 || isPreloadingRef.current) return;

    isPreloadingRef.current = true;
    setIsFetching(true);

    try{
      const newBooks: AudiobookDTO[] = [];

      while (newBooks.length < Math.min(count, needed)) {
        const book = await fetchRandom(options);
        if (
          book &&
          book.itunesId !== null &&
          !newBooks.some(b => b.itunesId === book.itunesId) &&
          !existingBooks.some(b => b.itunesId === book.itunesId)
        ) {
          newBooks.push(book);
          preloadMedia(book);
          console.log("Fetched:", book.title);
        }
      }

      setBooks(prev => {
        const updated = [...prev, ...newBooks];
        booksRef.current = updated;
        return updated;
      });
    } finally {
      isPreloadingRef.current = false;
      setIsFetching(false);
    }
  }, [options]);

  //fetch a book if there's no book at the current index
  useEffect(() => {
    const bookAtCurrentIndex = booksRef.current[indexRef.current];
    if (!bookAtCurrentIndex) {
      preload(1);
    }
  }, [preload]);

  useEffect(() => {
    const forwardCount = booksRef.current.length - indexRef.current - 1;
    const needed = PRELOAD_AHEAD - forwardCount;
    if (needed > 0) {
      preload(needed + 1);
    }
  }, [preload]);

  useEffect(() => {
    const forwardCount = books.length - currentIndex - 1;
    const needed = PRELOAD_AHEAD - forwardCount;

    if (needed > 0 && !isPreloadingRef.current) {
      preload(needed);
    }
  }, [books, currentIndex, preload]);

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
    isFetching,
    next,
    previous,
  };
}
