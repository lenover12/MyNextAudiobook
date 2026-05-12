import { useEffect, useRef, useState } from "react";

export function useFitText(
  maxHeight: number,
  maxWidth: number,
  titleText: string,
  minSize = 0.5,
  maxSize = 3.5,
  step = 0.05
) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(maxSize);
  const [isReady, setIsReady] = useState(false);
  //only hide on the very first measurement (component mount / remount)
  //layout-driven re-measurements (e.g. QR container appearing) must not flash the title invisible
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    let size = maxSize;
    if (isFirstRunRef.current) {
      setIsReady(false);
    }

    const fits = () => {
      const withinHeight = el.scrollHeight <= maxHeight;
      const withinWidth = el.scrollWidth <= maxWidth;
      return withinHeight && withinWidth;
    };

    const adjustFont = () => {
      el.style.fontSize = `${size}rem`;
      while (!fits() && size > minSize) {
        size -= step;
        el.style.fontSize = `${size}rem`;
      }
      setFontSize(size);
      setIsReady(true);
      isFirstRunRef.current = false;
    };

    requestAnimationFrame(adjustFont);
  }, [maxHeight, maxWidth, titleText]);

  return { ref, fontSize, isReady };
}
