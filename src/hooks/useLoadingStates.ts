import { useState, useCallback } from "react";
import { getRandomLoadingImage } from "../utils/loadingImages";

export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, {
    isLoaded: boolean;
    fadeIn: boolean;
    loadingImg: string | null;
  }>>({});

  const initLoadingState = useCallback((bookId: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      [bookId]: {
        isLoaded: false,
        fadeIn: false,
        loadingImg: getRandomLoadingImage(),
      },
    }));
  }, []);

  const markFadeIn = useCallback((bookId: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        fadeIn: true,
      },
    }));
  }, []);

  const markLoaded = useCallback((bookId: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        isLoaded: true,
      },
    }));
  }, []);

  return { loadingStates, initLoadingState, markFadeIn, markLoaded };
}
