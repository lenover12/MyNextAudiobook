import { useRef, useState, useEffect } from "react";
import QRCode from "react-qr-code";

type Props = {
  url: string | null;
  style?: React.CSSProperties;
};

export function QRCodeCard({ url, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrSize, setQrSize] = useState(128);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Choose smaller dimension, minus padding, to keep it inside the div
      const size = Math.min(width, height) -5;
      setQrSize(Math.max(size, 40)); // min size 40px
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!url) return null;

  return (
    <div
      className="qr-code-card"
      ref={containerRef}
      style={style}
    >
      <QRCode value={url} size={qrSize} level="L" />
    </div>
  );
}
