import { useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { type RefObject } from 'react';

interface SwipeNavigationOptions {
  swipeContainerRef?: React.RefObject<HTMLElement | null>;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  threshold?: number;
  disabled?: boolean;
}

export function useSwipeNavigation({
  swipeContainerRef,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  threshold = 100,
  disabled,
}: SwipeNavigationOptions) {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const rubberBand = (dy: number, limit: number) =>
    (dy / (Math.abs(dy) + limit)) * limit;

  useDrag(
    ({ movement: [, my], velocity: [, vy], direction: [, dy], last, }) => {
      if (disabled) return;

      const clampedY = rubberBand(
        my,
        window.innerHeight * 0.5
      );

      if (!last) {
        api.start({ y: clampedY, immediate: false });
      } else {
        const isFastEnough = vy > 0.5;
        const shouldGoNext =
          (my < -threshold && canGoNext) || (isFastEnough && dy < 0 && canGoNext);
        const shouldGoPrev =
          (my > threshold && canGoPrevious) || (isFastEnough && dy > 0 && canGoPrevious);

        if (shouldGoNext) {
          api.start({
            y: -window.innerHeight,
            config: { tension: 120, friction: 20 },
            onRest: () => api.set({ y: 0 }),
          });
          onNext();
        } else if (shouldGoPrev) {
          api.start({
            y: window.innerHeight,
            config: { tension: 120, friction: 20 },
            onRest: () => api.set({ y: 0 }),
          });
          onPrevious();
        } else {
          api.start({ y: 0, config: { tension: 120, friction: 20 } });
        }
      }
    },
    {
      axis: 'y',
      target: swipeContainerRef?.current ?? undefined,
      pointer: { touch: true, mouse: true, keys: false },
      eventOptions: { passive: false },
      enabled: !disabled,
    }
  );

  return { y };
}
