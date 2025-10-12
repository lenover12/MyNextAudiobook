import { useFitText } from "../hooks/useFitText";
import type { ReactNode } from "react";

export function BookTitle({
  title,
  titleText,
  maxHeight,
  maxWidth,
  visible,
}: {
  title: ReactNode;
  titleText: string;
  maxHeight: number;
  maxWidth: number;
  visible: boolean;
}) {
  const { ref, fontSize, isReady } = useFitText(maxHeight, maxWidth, titleText, 0.5, 3.5);
  
  return (
    <h2
      ref={ref}
      className={`urbanist-bold book-title-element ${isReady ? "visible" : ""}`}
      style={{
        fontSize: `${fontSize}rem`,
        margin: 0,
        opacity: visible ? 1 : 0,
        transition: visible
          ? "opacity 0.6s ease"
          : "opacity 0.1s ease-out",
      }}
    >
      {title}
    </h2>
  );
}
