import { useEffect, useRef } from "react";

export function usePulseCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  trigger: boolean
) {
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trigger) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pulses: { radius: number; opacity: number }[] = [];
    let lastTime = performance.now();

    const addPulse = () => {
      pulses.push({ radius: 0, opacity: 1 });
    };

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        pulse.radius += delta * 0.1;
        pulse.opacity -= delta * 0.0005;

        if (pulse.opacity <= 0) {
          pulses.splice(i, 1);
          i--;
          continue;
        }

        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, pulse.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse.opacity})`;
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    const pulseInterval = setInterval(addPulse, 800); //8 second pulse
    addPulse();
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(pulseInterval);
      cancelAnimationFrame(requestRef.current!);
    };
  }, [canvasRef, trigger]);
}
