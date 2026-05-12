import { useEffect, useState } from "react";

const colourCache = new Map<string, string>();

//single reusable 8x8 canvas created once on first use, never inserted into the DOM.
//as 64 pixels for a representative average colour from a cover image
let samplerCanvas: HTMLCanvasElement | null = null;
let samplerCtx: CanvasRenderingContext2D | null = null;

function getSamplerCtx(): CanvasRenderingContext2D | null {
  if (!samplerCtx) {
    samplerCanvas = document.createElement("canvas");
    samplerCanvas.width = 8;
    samplerCanvas.height = 8;
    samplerCtx = samplerCanvas.getContext("2d");
  }
  return samplerCtx;
}

export function useColourFromImage(imageUrl: string | null): string | null {
  const [colour, setColour] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const cached = colourCache.get(imageUrl);
    if (cached) {
      setColour(cached);
      return;
    }

    let cancelled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      if (cancelled) return;

      const ctx = getSamplerCtx();
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 8, 8);
      const data = ctx.getImageData(0, 0, 8, 8).data;

      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      const result = `${Math.round(r / 64)}, ${Math.round(g / 64)}, ${Math.round(b / 64)}`;
      colourCache.set(imageUrl, result);
      setColour(result);
    };

    return () => { cancelled = true; };
  }, [imageUrl]);

  return colour;
}
