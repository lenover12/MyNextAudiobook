import { useEffect, useRef, useCallback } from "react";

export function useTsPulseCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  trigger: boolean,
  bookWrapperRef: React.RefObject<HTMLDivElement | null>,
  imageColour: string | null,
) {
  const requestRef = useRef<number | null>(null);
  const pulseIntervalRef = useRef<number | null>(null);
  const pulsesRef = useRef<{ size: number; opacity: number; fadeIn: boolean; source: "once" | "auto" }[]>([]);
  //holds the startLoop fn so pulseOnce and the trigger interval can kick off the rAF from outside the effect.
  const startLoopRef = useRef<(() => void) | null>(null);

  const pulseOnce = useCallback(() => {
    const canvas = canvasRef.current;
    const bookEl = bookWrapperRef.current;
    if (!canvas || !bookEl) return;

    const rect = bookEl.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    pulsesRef.current.push({ size: size + 4 * 2, opacity: 1, fadeIn: false, source: "once" });
    startLoopRef.current?.();
  }, [canvasRef, bookWrapperRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bookEl = bookWrapperRef.current;
    if (!canvas || !bookEl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //cached once updated on resize and when a new pulse is pushed & not every frame
    let cachedRect = bookEl.getBoundingClientRect();

    const pulses = pulsesRef.current;
    let lastTime = performance.now();

    const strokeWidth = 64;

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

      const centerX = cachedRect.left + cachedRect.width / 2;
      const centerY = cachedRect.top + cachedRect.height / 2;

      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        pulse.size += delta * 0.08;

        if (pulse.fadeIn && pulse.opacity < 1) {
          pulse.opacity += delta * 0.0012;
          if (pulse.opacity >= 1) {
            pulse.opacity = 1;
            pulse.fadeIn = false;
          }
        } else {
          pulse.opacity -= delta * 0.0012;
        }

        if (pulse.opacity <= 0) {
          pulses.splice(i, 1);
          i--;
          continue;
        }

        const halfSize = pulse.size / 2;

        ctx.save();
        drawRoundedRect(ctx, centerX - halfSize, centerY - halfSize, pulse.size, pulse.size, 16);
        ctx.lineWidth = strokeWidth;

        const rgb = imageColour ?? "255, 255, 255";
        ctx.strokeStyle = `rgba(${rgb}, ${pulse.opacity / 8})`;
        ctx.shadowColor = `rgba(${rgb}, ${pulse.opacity})`;

        ctx.stroke();
        ctx.restore();
      }

      //stop the loop when all pulses have drained, restarts only when a new pulse is pushed
      if (pulses.length > 0) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        requestRef.current = null;
      }
    };

    const startLoop = () => {
      if (requestRef.current === null) {
        //reset lastTime so the first delta isn't huge after an idle gap
        lastTime = performance.now();
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    startLoopRef.current = startLoop;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cachedRect = bookEl.getBoundingClientRect();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      startLoopRef.current = null;
      if (pulseIntervalRef.current !== null) {
        clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasRef, bookWrapperRef, imageColour]);

  useEffect(() => {
    if (trigger && pulseIntervalRef.current === null) {
      const canvas = canvasRef.current;
      const bookEl = bookWrapperRef.current;
      if (canvas && bookEl) {
        const rect = bookEl.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 0.8;
        pulsesRef.current.push({ size: size + 4 * 2, opacity: 0, fadeIn: true, source: "auto" });
        startLoopRef.current?.();
      }

      pulseIntervalRef.current = window.setInterval(() => {
        const canvas = canvasRef.current;
        const bookEl = bookWrapperRef.current;
        if (!canvas || !bookEl) return;
        const rect = bookEl.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 0.8;
        pulsesRef.current.push({ size: size + 4 * 2, opacity: 0, fadeIn: true, source: "auto" });
        startLoopRef.current?.();
      }, 800);
    } else if (!trigger && pulseIntervalRef.current !== null) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
  }, [trigger, canvasRef, bookWrapperRef]);

  return { pulseOnce };
}
