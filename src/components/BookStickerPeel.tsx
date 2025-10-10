import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  imageSrc: string;
  visible?: boolean;
  onLoad?: () => void;
  onClick?: () => void;
  peelDirection?: number;
  peelBackActivePct?: number;
  className?: string;
  isCurrent?: boolean;
};

export default function BookStickerPeel({
  imageSrc,
  visible = true,
  onLoad,
  onClick,
  peelDirection = 200,
  peelBackActivePct = 66,
  className = "",
  isCurrent = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tease, setTease] = useState(false);
  const teaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cornerBtnRef = useRef<HTMLDivElement | null>(null);

  const cssVars = useMemo(
    () =>
      ({
        "--sticker-p": "300px", // required large pad
        "--sticker-peelback-active": `${peelBackActivePct}%`,
        "--sticker-peelback-tease": "-7%",
        "--peel-direction": `${peelDirection}deg`,
      }) as React.CSSProperties,
    [peelBackActivePct, peelDirection]
  );

  useEffect(() => {
    if (!isCurrent) {
      setTease(false);
      setIsOpen(false);
      if (teaseTimeoutRef.current) clearTimeout(teaseTimeoutRef.current);
      return;
    }

    if (teaseTimeoutRef.current) clearTimeout(teaseTimeoutRef.current);
    teaseTimeoutRef.current = setTimeout(() => {
      if (!isOpen) setTease(true);
    }, 5000);

    return () => {
      if (teaseTimeoutRef.current) clearTimeout(teaseTimeoutRef.current);
    };
  }, [isCurrent, isOpen]);

  useEffect(() => {
    const handleDocPointerDown = (e: PointerEvent) => {
      if (!isOpen) return;

      const btn = cornerBtnRef.current;
      if (btn && e.target instanceof Node && btn.contains(e.target)) {
        return;
      }

      setIsOpen(false);
      setTease(true);
    };

    document.addEventListener("pointerdown", handleDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", handleDocPointerDown, true);
  }, [isOpen]);

  const handleCornerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsOpen((prev) => {
      const next = !prev;
      setTease(!next);
      return next;
    });
  };

  return (
    <div
      className={`book-sticker-wrapper ${className} ${visible ? "visible" : ""}`}
      style={cssVars}
    >
      <div
        ref={cornerBtnRef}
        className={`peel-corner-button ${isOpen ? "active" : ""}`}
        onClick={handleCornerClick}
      >
      </div>
      <div className="sticker-container">
        <div className="sticker-rotator">
          <div className={`sticker-main ${isOpen ? "open" : tease ? "tease" : ""}`}>
            <div className="sticker-content">
              <img
                src={imageSrc}
                alt=""
                className="sticker-image"
                draggable={false}
                onLoad={onLoad}
                onClick={onClick}
              />
            </div>
          </div>

          <div className={`sticker-flap ${isOpen ? "open" : tease ? "tease" : ""}`}>
            <div className="sticker-flap-content">
              <img
                src={imageSrc}
                alt=""
                className="sticker-flap-image"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
