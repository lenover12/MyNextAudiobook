import { useEffect, useRef, useState } from "react";

export function useFitText(
  maxHeight: number,
  maxWidth: number,
  text: string,
  minSize = 0.5,
  maxSize = 3.5,
  step = 0.05
) {
  // const ref = useRef<HTMLHeadingElement>(null);
  const ref = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(maxSize);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!text || maxHeight === 0 || maxWidth === 0) {
      setIsReady(false);
      return;
    }
    
    const el = ref.current;
    if (!el) return;

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
  }, [maxHeight, maxWidth, text, minSize, maxSize, step]);

  return { ref, fontSize, isReady };
}
