import { useMemo } from "react";

type Props = {
  imageSrc: string;
  visible?: boolean;
  onLoad?: () => void;
  onClick?: () => void;
  peelDirection?: number;
  peelBackHoverPct?: number;
  peelBackActivePct?: number;
  className?: string;
};

export default function BookStickerPeel({
  imageSrc,
  visible = true,
  onLoad,
  onClick,
  peelDirection = 200,
  peelBackHoverPct = 66,
  peelBackActivePct = 40,
  className = "",
}: Props) {
  const cssVars = useMemo(
    () => ({
      "--sticker-p": "300px",
      "--sticker-peelback-hover": `${peelBackHoverPct}%`,
      "--sticker-peelback-active": `${peelBackActivePct}%`,
      "--peel-direction": `${peelDirection}deg`,
    }),
    [peelBackHoverPct, peelBackActivePct, peelDirection]
  );

  return (
    <div
      className={`book-sticker-wrapper ${className} ${visible ? "visible" : ""}`}
      style={cssVars as React.CSSProperties}
    >
      <div className="sticker-container">
        <div className="sticker-rotator">
          <div className="sticker-main">
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
          <div className="sticker-flap">
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
