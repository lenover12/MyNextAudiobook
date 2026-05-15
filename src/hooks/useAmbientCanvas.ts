import { useEffect } from "react";

export function useAmbientCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  imageUrl: string | null,
  trigger: boolean
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    requestAnimationFrame(() => {

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width / 2;
      canvas.height = rect.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!imageUrl || !trigger) {
        //default render
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#444");
        gradient.addColorStop(1, "#0a0a0a");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      //image render
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    });
  }, [canvasRef, imageUrl, trigger]);
}
