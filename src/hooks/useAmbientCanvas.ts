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
      canvas.width = 10;
      canvas.height = 6;
      // const rect = canvas.getBoundingClientRect();
      // canvas.width = rect.width;
      // canvas.height = rect.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!imageUrl || !trigger) {
        //default render
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#222");
        gradient.addColorStop(1, "#000");
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
        ctx.filter = "blur(2px)";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.style.transform = "translateZ(0.001px)";
        requestAnimationFrame(() => {
          canvas.style.transform = "";
        });
      };
    });
  }, [canvasRef, imageUrl, trigger]);
}
