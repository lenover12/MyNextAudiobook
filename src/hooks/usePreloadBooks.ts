import { useState, useEffect, useCallback, useRef } from "react";
import { fetchRandom } from "../utils/audiobookAPI";
import type { AudiobookDTO } from "../dto/audiobookDTO";
import type { FetchOptions } from "../utils/itunesAPI";
import { shouldSkipAudiMetaRequest } from "../utils/audimetaAPI";
import { popCachedBook } from "../utils/cacheStorage";

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

export function usePreloadBooks(
  options: FetchOptions & {
    seed?: AudiobookDTO | null;
    preloadAhead: number;
    mustHaveAudible: boolean;
  }
) {
  const {
    seed = null,
    preloadAhead,
    mustHaveAudible,
    ...fetchOptions
  } = options;

  const [books, setBooks] = useState<AudiobookDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const isPreloadingRef = useRef(false);
  const booksRef = useRef<AudiobookDTO[]>([]);
  const indexRef = useRef(0);
  const isCacheFillingRef = useRef(false);

  useEffect(() => {
    if (seed && books.length === 0) {
      console.log("[usePreloadBooks] Seeding initial book:", seed);
      setBooks([seed]);
      booksRef.current = [seed];
      setCurrentIndex(0);
    }
  }, [seed, books.length]);

  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const preload = useCallback(async (count: number) => {
    const existingBooks = booksRef.current;
    const forwardCount = existingBooks.length - indexRef.current - 1;
    const needed = preloadAhead - forwardCount;

    if (isPreloadingRef.current) {
      console.log("[Preload] Skipping — already fetching.");
      return;
    }

    if (needed <= 0) {
      return;
    }

    isPreloadingRef.current = true;
    setIsFetching(true);

    try {
      const newBooks: AudiobookDTO[] = [];

      while (newBooks.length < Math.min(count, needed)) {
        const book = await fetchRandom(fetchOptions);
        if (
          book &&
          book.itunesId !== null &&
          !newBooks.some(b => b.itunesId === book.itunesId) &&
          !existingBooks.some(b => b.itunesId === book.itunesId) &&
          (
            !mustHaveAudible ||
            book.audiblePageUrl != null ||
            shouldSkipAudiMetaRequest() //relax restriction if AudiMeta is unreachable
          )
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
  }, [fetchOptions, mustHaveAudible, preloadAhead]);

  const fillFromCache = useCallback(async () => {
    if (isCacheFillingRef.current) return;
    
    isCacheFillingRef.current = true;
    try {
      const lang = (fetchOptions as any)?.language ?? "unknown";
      const cached = await popCachedBook(lang);
      if (cached) {
        console.log("[Cache] Instant fill from cache:", cached.title);

        setBooks(prev => {
          const updated = [...prev];
          updated.splice(indexRef.current + 1, 0, cached);
          booksRef.current = updated;
          return updated;
        });
      }
    } catch (err) {
      console.warn("Cache fill failed:", err);
    } finally {
      isCacheFillingRef.current = false;
    }
  }, [fetchOptions]);

  //fetch a book if there's no book at the current index
  useEffect(() => {
    const bookAtCurrentIndex = booksRef.current[indexRef.current];
    const nextBook = booksRef.current[indexRef.current + 1];

    if (!bookAtCurrentIndex) {
      preload(1);
      return;
    }

    if (!nextBook) {
      fillFromCache();
      
      if (!isPreloadingRef.current) {
        preload(1);
      }
    }
  }, [currentIndex, preload, fillFromCache]);

  useEffect(() => {
    const forwardCount = booksRef.current.length - indexRef.current - 1;
    const needed = preloadAhead - forwardCount;
    // if (needed > 0) {
    if (needed > 0 && !isPreloadingRef.current) {
      preload(needed + 1);
    }
  }, [preloadAhead]);

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
    jumpTo: (index: number) => setCurrentIndex(index),
    insertNext: (book: AudiobookDTO) => {
      setBooks(prev => {
        const updated = [...prev];
        updated.splice(currentIndex + 1, 0, book);
        return updated;
      });
      setCurrentIndex(i => i + 1);
    },
  };

}
