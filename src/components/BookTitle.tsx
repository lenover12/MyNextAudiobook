import { useFitText } from "../hooks/useFitText";
import type { ReactNode } from "react";

export function BookTitle({
  title,
  titleText,
  maxHeight,
  visible,
}: {
  title: ReactNode;
  titleText: string;
  maxHeight: number;
  visible: boolean;
}) {
  const { ref, fontSize, isReady } = useFitText(maxHeight, titleText);
  
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
