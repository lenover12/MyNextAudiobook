import { useEffect, useRef } from "react";

interface ArrowNavigationOptions {
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  disabled?: boolean;
}

export function useArrowNavigation({
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  disabled,
}: ArrowNavigationOptions) {
  const lock = useRef(false);

  useEffect(() => {
    if (disabled) return;

    const handleKey = (e: KeyboardEvent) => {
      if (lock.current) return;

      if (e.key === "ArrowDown" && canGoNext) {
        lock.current = true;
        onNext();
      } else if (e.key === "ArrowUp" && canGoPrevious) {
        lock.current = true;
        onPrevious();
      }

      setTimeout(() => {
        lock.current = false;
      }, 150);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onPrevious, canGoNext, canGoPrevious, disabled]);
}
