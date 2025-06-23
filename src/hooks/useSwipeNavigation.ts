import { useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface SwipeNavigationOptions {
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  threshold?: number;
}

export function useSwipeNavigation({
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  threshold = 100,
}: SwipeNavigationOptions) {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  useDrag(
    ({ movement: [, my], velocity: [, vy], direction: [, dy], last, }) => {
      const clampedY = Math.max(
        canGoPrevious ? -window.innerHeight * 0.5 : 0,
        Math.min(my, canGoNext ? window.innerHeight * 0.5 : 0)
      );
      const isSwipeUp = dy < 0;
      const isSwipeDown = dy > 0;

      if (last) {
        const isFastEnough = vy > 0.5;
      
        const shouldGoNext =
          (my < -threshold && canGoNext) || (isFastEnough && isSwipeUp && canGoNext);
        const shouldGoPrev =
          (my > threshold && canGoPrevious) || (isFastEnough && isSwipeDown && canGoPrevious);
      
        if (shouldGoNext) {
          api.start({
            y: -window.innerHeight,
            config: { tension: 250, friction: 28 },
            onRest: () => api.set({ y: 0 }),
          });
          onNext();
        } else if (shouldGoPrev) {
          api.start({
            y: window.innerHeight,
            config: { tension: 250, friction: 28 },
            onRest: () => api.set({ y: 0 }),
          });
          onPrevious();
        } else {
          api.start({ y: 0, config: { tension: 180, friction: 24 } });
        }
      } else {
        api.start({
          y: clampedY,
          immediate: true,
        });
      }
    },
    {
      axis: 'y',
      target: typeof window !== 'undefined' ? window : undefined,
      pointer: { touch: true },
      eventOptions: { passive: false },
    }
  );


  return { y };
}
