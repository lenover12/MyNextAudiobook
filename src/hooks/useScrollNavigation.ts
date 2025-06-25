import { useEffect, useRef, useCallback } from "react";

interface UseScrollNavigationOptions {
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function useScrollNavigation({
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: UseScrollNavigationOptions) {
  const scrollLock = useRef(false);

  const handleScroll = useCallback(
    (deltaY: number) => {
      if (scrollLock.current) return;
      scrollLock.current = true;

      if (deltaY > 30 && canGoNext) {
        onNext();
      } else if (deltaY < -30 && canGoPrevious) {
        onPrevious();
      }

      setTimeout(() => {
        scrollLock.current = false;
      }, 500);
    },
    [onNext, onPrevious, canGoNext, canGoPrevious]
  );

  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      handleScroll(e.deltaY);
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && canGoNext) {
        handleScroll(100);
      } else if (e.key === "ArrowUp" && canGoPrevious) {
        handleScroll(-100);
      }
    };

    window.addEventListener("wheel", wheelHandler, { passive: true });
    window.addEventListener("keydown", keyHandler);

    return () => {
      window.removeEventListener("wheel", wheelHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [handleScroll]);
}
