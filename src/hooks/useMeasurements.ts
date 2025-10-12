import { useState, useEffect } from "react";

export function useMeasurements() {
  // compute vmin in pixels
  const computeBookSize = () => (Math.min(window.innerWidth, window.innerHeight) * 65) / 100;

  const [bookSize, setBookSize] = useState(() => computeBookSize());

  useEffect(() => {
    const handleResize = () => {
      setBookSize(computeBookSize());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { bookSize };
}
