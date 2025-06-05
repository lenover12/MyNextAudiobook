import { useEffect, useRef } from "react";

export function usePulseCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  trigger: boolean,
  bookWrapperRef: React.RefObject<HTMLDivElement | null>
) {
  const requestRef = useRef<number | null>(null);
  const pulseIntervalRef = useRef<number | null>(null);
  const pulsesRef = useRef<{ size: number; opacity: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bookEl = bookWrapperRef.current;
    if (!canvas || !bookEl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const getTargetRect = () => {
      return bookEl.getBoundingClientRect();
    };

    const pulses = pulsesRef.current;
    let lastTime = performance.now();

    const strokeWidth = 4;
    const addPulse = () => {
      const rect = getTargetRect();
      const size = Math.max(rect.width, rect.height);
      pulsesRef.current.push({ size: size + strokeWidth * 2, opacity: 1 });
    };

    const drawRoundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const rect = getTargetRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        pulse.size += delta * 0.2;
        pulse.opacity -= delta * 0.0006;

        if (pulse.opacity <= 0) {
          pulses.splice(i, 1);
          i--;
          continue;
        }

        const halfSize = pulse.size / 2;
        drawRoundedRect(ctx, centerX - halfSize, centerY - halfSize, pulse.size, pulse.size, 16);
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse.opacity})`;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (pulseIntervalRef.current !== null) {
        clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasRef, bookWrapperRef]);

  useEffect(() => {
    if (trigger && pulseIntervalRef.current === null) {
      //first pulse is instant
      const canvas = canvasRef.current;
      const bookEl = bookWrapperRef.current;
      if (canvas && bookEl) {
        const rect = bookEl.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        pulsesRef.current.push({ size: size + 4 * 2, opacity: 1 });
      }
      
      //subsequent pulses
      pulseIntervalRef.current = window.setInterval(() => {
        const canvas = canvasRef.current;
        const bookEl = bookWrapperRef.current;
        if (!canvas || !bookEl) return;
  
        const rect = bookEl.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        pulsesRef.current.push({ size: size + 4 * 2, opacity: 1 });
      }, 800);
    } else if (!trigger && pulseIntervalRef.current !== null) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
  }, [trigger, canvasRef, bookWrapperRef]);
}
