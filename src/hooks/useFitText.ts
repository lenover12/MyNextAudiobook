import { useEffect, useRef, useState } from "react";

export function useFitText(maxHeight: number, titleText: string, minSize = 0.5, maxSize = 3.5, step = 0.05) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(maxSize);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    let size = maxSize;
    setIsReady(false);

    const fits = () => el.scrollHeight <= maxHeight;

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
  }, [maxHeight, titleText]);

  return { ref, fontSize, isReady };
}
