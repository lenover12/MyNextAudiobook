import { useEffect, useRef, useCallback } from "react";

interface UseScrollNavigationOptions {
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  disabled?: boolean;
}

export function useScrollNavigation({
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  disabled,
}: UseScrollNavigationOptions) {
  const scrollLock = useRef(false);

  const handleScroll = useCallback(
    (deltaY: number) => {
      if (disabled) return;
      if (scrollLock.current) return;
      scrollLock.current = true;

      if (deltaY > 30 && canGoNext) {
        onNext();
      } else if (deltaY < -30 && canGoPrevious) {
        onPrevious();
      }

      setTimeout(() => {
        scrollLock.current = false;
      }, 150);
    },
    [onNext, onPrevious, canGoNext, canGoPrevious, disabled]
  );

  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      if (disabled) return;
      handleScroll(e.deltaY);
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (disabled) return;
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
  }, [handleScroll, disabled, canGoNext, canGoPrevious]);
}
