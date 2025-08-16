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

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    let size = maxSize;
    setIsReady(false);

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
    };

    requestAnimationFrame(adjustFont);
  }, [maxHeight, maxWidth, titleText]);

  return { ref, fontSize, isReady };
}
