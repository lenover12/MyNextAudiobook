import { useState, useEffect, useCallback, useRef } from "react";
import { fetchRandom, enrichBookWithAudible } from "../utils/audiobookAPI";
import { type AudiobookDTO, mergeAudiobookDTOs } from "../dto/audiobookDTO";
import type { FetchOptions } from "../utils/itunesAPI";
import { shouldSkipAudibleRequest } from "../utils/audibleAPI";
import { popCachedBook } from "../utils/cacheStorage";
import { PLACEHOLDER_BOOK } from "../utils/placeholderBook";

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

  const [books, setBooks] = useState<AudiobookDTO[]>([PLACEHOLDER_BOOK]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const isPreloadingRef = useRef(false);
  const booksRef = useRef<AudiobookDTO[]>([]);
  const indexRef = useRef(0);
  const isCacheFillingRef = useRef(false);

  const lastScrollTimeRef = useRef(Date.now());
  const SCROLL_SPEED_THRESHOLD = 800;

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

  useEffect(() => {
    if (!seed) return;

    const first = booksRef.current[0];
    if (!first?.__isPlaceholder) return;

    console.log("[usePreloadBooks] Upgrading placeholder with seed");

    setBooks(prev => {
      const upgraded = mergeAudiobookDTOs(first, {
        ...seed,
        __isPlaceholder: false,
      });
      const next = [...prev];
      next[0] = upgraded;
      booksRef.current = next;
      return next;
    });

    setCurrentIndex(0);
  }, [seed]);


  const enrichInBackground = useCallback(async (book: AudiobookDTO) => {
    const enriched = await enrichBookWithAudible(book);
    if (!enriched) return;
    setBooks(prev => {
      const idx = prev.findIndex(b => b.itunesId === book.itunesId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = enriched;
      booksRef.current = next;
      return next;
    });
  }, []);

  const preload = useCallback(async (count: number) => {
    const existingBooks = booksRef.current.filter(
      b => !b.__isPlaceholder
    );
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
      let consecutiveFailures = 0;
      const MAX_FAILURES = 3;

      while (newBooks.length < Math.min(count, needed)) {
        const book = await fetchRandom(fetchOptions);
        if (
          book &&
          book.itunesId !== null &&
          !newBooks.some(b => b.itunesId === book.itunesId) &&
          !existingBooks.some(b => b.itunesId === book.itunesId)
        ) {
          if (mustHaveAudible && !shouldSkipAudibleRequest()) {
            //await enrichment to confirm an Audible match exists
            const enriched = await enrichBookWithAudible(book);
            if (!enriched?.audiblePageUrl) {
              consecutiveFailures++;
              if (consecutiveFailures >= MAX_FAILURES) break;
              continue;
            }
            const first = booksRef.current[0];
            if (first?.__isPlaceholder && indexRef.current === 0) {
              console.log("[Preload] Upgrading placeholder with first fetched book");
              setBooks(prev => {
                const upgraded = mergeAudiobookDTOs(first, { ...enriched, __isPlaceholder: false });
                const next = [...prev];
                next[0] = upgraded;
                booksRef.current = next;
                return next;
              });
              preloadMedia(enriched);
              console.log("Fetched [replacing loading placeholder]:", enriched.title);
              return;
            }
            consecutiveFailures = 0;
            newBooks.push({ ...enriched, __fromCache: false });
            preloadMedia(enriched);
            console.log("Fetched:", enriched.title);
          } else {
            //replace placeholder loading book on 1st page load
            const first = booksRef.current[0];
            if (first?.__isPlaceholder && indexRef.current === 0) {
              console.log("[Preload] Upgrading placeholder with first fetched book");
              setBooks(prev => {
                const upgraded = mergeAudiobookDTOs(first, { ...book, __isPlaceholder: false });
                const next = [...prev];
                next[0] = upgraded;
                booksRef.current = next;
                return next;
              });
              preloadMedia(book);
              console.log("Fetched [replacing loading placeholder]:", book.title);
              void enrichInBackground(book);
              return;
            }
            consecutiveFailures = 0;
            newBooks.push({ ...book, __fromCache: false });
            preloadMedia(book);
            console.log("Fetched:", book.title);
            void enrichInBackground(book);
          }
        } else {
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_FAILURES) break;
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
  }, [fetchOptions, mustHaveAudible, preloadAhead, enrichInBackground]);

  const fillFromCache = useCallback(
    async ({ used = false }: { used?:boolean } = {}) => {
    if (isCacheFillingRef.current) return;
    
    isCacheFillingRef.current = true;
    try {
      const lang = (fetchOptions as any)?.language ?? "unknown";
      
      //build list of IDs currently visible/loaded
      const currentIds = new Set(
        booksRef.current
          .map(b => (b.asin ?? b.itunesId))
          .filter((id): id is string | number => id != null)
          .map(id => id.toString())
      );

      const cached = await popCachedBook(lang, used, currentIds);

      if (cached) {
        console.log("[Cache] Instant fill from cache:", cached.title);

        setBooks(prev => {
          const updated = [...prev, cached];
          booksRef.current = updated;
          return updated;
        });
        return cached;
      }
    } catch (err) {
      console.warn("Cache fill failed:", err);
    } finally {
      isCacheFillingRef.current = false;
    }
  }, [fetchOptions]);

  //fetch a book if there's no book at the current index (initial bootstrap / safety net)
  useEffect(() => {
    const bookAtCurrentIndex = booksRef.current[indexRef.current];

    if (!bookAtCurrentIndex && !isPreloadingRef.current) {
      preload(1);
    }
  }, [currentIndex, preload]);

  useEffect(() => {
    const forwardCount = booksRef.current.length - indexRef.current - 1;
    const needed = preloadAhead - forwardCount;
    // if (needed > 0) {
    if (needed > 0 && !isPreloadingRef.current) {
      preload(needed + 1);
    }
  }, [books.length, currentIndex, preloadAhead, preload]);

  // const next = useCallback(() => {
  //   if (currentIndex < books.length - 1) {
  //     setCurrentIndex(i => i + 1);
  //   }
  // }, [currentIndex, books.length]);

  const previous = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  const smartNext = useCallback(async () => {
    const now = Date.now();
    const isFast = now - lastScrollTimeRef.current < SCROLL_SPEED_THRESHOLD;
    const hasNext = currentIndex < booksRef.current.length - 1;

    //if we have the next book already then just scroll to it
    if (hasNext) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    //determine if we use "used" books from cache based on scroll speed
    const cachedBook = await fillFromCache({ used: isFast });
    
    if (cachedBook) {
      const scrollType = isFast ? "fast" : "slow";
      const bookType = isFast ? "used" : "unused";
      console.log(`[${scrollType} scroll] served ${bookType} book from cache:`, cachedBook.title);
      
      //wait one more frame to ensure React has rendered
      requestAnimationFrame(() => {
        setCurrentIndex((i) => i + 1);
        preload(1);
      });
      
      lastScrollTimeRef.current = now;
    }
  }, [fillFromCache, preload, currentIndex]);

  const currentBook = books[currentIndex] ?? null;

  return {
    books,
    currentBook,
    currentIndex,
    isFetching,
    previous,
    smartNext,
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
