import { useEffect, useRef, useState } from "react";

export function useFitText(maxHeight: number, minSize = 0.5, maxSize = 3.5, step = 0.05) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(maxSize);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    let size = maxSize;

    const fits = () => el.scrollHeight <= maxHeight;

    const adjustFont = () => {
      el.style.fontSize = `${size}rem`;
      while (!fits() && size > minSize) {
        size -= step;
        el.style.fontSize = `${size}rem`;
      }
      setFontSize(size);
    };

    requestAnimationFrame(adjustFont);
  }, [maxHeight]);

  return { ref, fontSize };
}
