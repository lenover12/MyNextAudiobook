import { useState, useEffect, useRef, type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXTwitter, faFacebook, faLinkedin, faGoodreads, faInstagram, faPinterest, faWhatsapp, faTelegram } from "@fortawesome/free-brands-svg-icons";
import { faRetweet } from "@fortawesome/free-solid-svg-icons";
import { trackEvent } from "../utils/analytics";

interface Props {
  title: string;
  url: string;
  author?: string;
  socialsOptions?: Record<string, boolean>;
  bookSize: number;
}

export default function ShareDropdownButton({ title, url, author, socialsOptions, bookSize }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const instagramRef = useRef<SVGSVGElement | null>(null);
  
  const getGoodreadsUrl = (title: string, author?: string) => {
    const query = author ? `${title} ${author}` : title;
    return `https://www.goodreads.com/search?utf8=✓&q=${encodeURIComponent(
      query
    )}&search_type=books`;
  };

  const socialButtonsMap: Record<string, JSX.Element> = {
    twitter: (
      <li key="twitter">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_clicked", { platform: "twitterx" })}
        >
          <FontAwesomeIcon
            icon={faXTwitter}
            aria-hidden="true"
            style={{
              color: "rgb(255, 255, 255)",
              filter: "drop-shadow(2px 2px 2px rgb(0, 0, 0))",
            }}
          />
        </a>
      </li>
    ),
    facebook: (
      <li key="facebook">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_clicked", { platform: "facebook" })}
        >
          <FontAwesomeIcon
            icon={faFacebook}
            aria-hidden="true"
            style={{
              color: "rgb(58, 89, 152)",
              filter: "drop-shadow(2px 2px 2px rgb(38, 44, 55))",
            }}
          />
        </a>
      </li>
    ),
    linkedin: (
      <li key="linkedin">
        <a
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_clicked", { platform: "linkedin" })}
        >
          <FontAwesomeIcon
            icon={faLinkedin}
            aria-hidden="true"
            style={{
              color: "rgb(0, 119, 181)",
              filter: "drop-shadow(2px 2px 2px rgba(49, 51, 53, 1))",
            }}
          />
        </a>
      </li>
    ),
    goodreads: (
      <li key="goodreads">
        <a
          href={getGoodreadsUrl(title, author)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_clicked", { platform: "goodreads" })}
        >
          <FontAwesomeIcon
            icon={faGoodreads}
            aria-hidden="true"
            style={{
              color: "rgb(233, 229, 205)",
              filter: "drop-shadow(2px 2px 2px rgba(117, 66, 14, 1))",
            }}
          />
        </a>
      </li>
    ),
    instagram: (
      <li key="instagram">
        <a
          href="https://www.instagram.com/mynextaudiobook"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_clicked", { platform: "instagram" })}
        >
          <FontAwesomeIcon
            icon={faInstagram}
            ref={instagramRef}
            aria-hidden="true"
            style={{
              color: "rgb(233, 229, 205)",
              filter: "drop-shadow(2px 2px 2px rgba(117, 66, 14, 1))",
            }}
          />
        </a>
      </li>
    ),
    pinterest: (
      <li key="pinterest">
        <a
          href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=&description=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_clicked", { platform: "pinterest" })}
        >
          <FontAwesomeIcon
            icon={faPinterest}
            aria-hidden="true"
            style={{
              color: "#E60023",
              filter: "drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))",
            }}
          />
        </a>
      </li>
    ),
    whatsapp: (
      <li key="whatsapp">
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title)}%20${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_clicked", { platform: "whatsapp" })}
        >
          <FontAwesomeIcon
            icon={faWhatsapp}
            aria-hidden="true"
            style={{
              color: "#25D366",
              filter: "drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))",
            }}
          />
        </a>
      </li>
    ),
    telegram: (
      <li key="telegram">
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_clicked", { platform: "telegram" })}
        >
          <FontAwesomeIcon
            icon={faTelegram}
            aria-hidden="true"
            style={{
              color: "#0088CC",
              filter: "drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))",
            }}
          />
        </a>
      </li>
    ),
  };

  const pathDataRef = useRef<{
    path: string;
    bottomY: number;
    horizontalStartPercent: number;
  }>({ path: "", bottomY: 0, horizontalStartPercent: 0 });

  //instagram gradient
  useEffect(() => {
    const svgEl = instagramRef.current;
    if (!svgEl) return;

    const applyGradient = () => {
      const paths = svgEl.querySelectorAll("path");
      paths.forEach((p) => p.setAttribute("fill", "url(#instagramGradient)"));
    };

    applyGradient();

    //re-apply if react re-mounts
    const observer = new MutationObserver(applyGradient);
    observer.observe(svgEl, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [socialsOptions]);
  //inject gradient defs
  const InstagramGradientDefs = (
    <svg style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <linearGradient id="instagramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="25%" stopColor="#fd5949" />
          <stop offset="50%" stopColor="#d6249f" />
          <stop offset="75%" stopColor="#285AEB" />
        </linearGradient>
      </defs>
    </svg>
  );

  //dynamically update offset-path
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const updateOffsetPath = () => {
      const startX = bookSize * 0.1;
      const startY = 0;
      const bottomY = bookSize / 1.4;
      const horizontalEndX = startX - bookSize;
      const horizontalEndY = bottomY;
      
      const controlX = (startX + startX) / 1.5;
      const controlY = 0;
      
      const path = `M ${startX} ${startY} Q ${controlX} ${controlY}, ${startX} ${bottomY} L ${horizontalEndX} ${horizontalEndY}`;
      const horizontalStartPercent = (bottomY / (bottomY + bookSize)) * 100;

      pathDataRef.current = { path, bottomY, horizontalStartPercent };

      const lis = menu.querySelectorAll("li") as NodeListOf<HTMLElement>;
      lis.forEach(li => {
        (li.style as any).offsetPath = `path('${path}')`;
      });

      // debug overlay
      const debug = false;
      if (debug) {
        let svgPath = menu.querySelector("svg.debug-path") as SVGSVGElement | null;
        if (!svgPath) {
          svgPath = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svgPath.classList.add("debug-path");
          svgPath.setAttribute("style", "position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:9999;");
          const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
          pathEl.setAttribute("stroke", "red");
          pathEl.setAttribute("stroke-width", "2");
          pathEl.setAttribute("fill", "transparent");
          svgPath.appendChild(pathEl);
          menu.appendChild(svgPath);
        }
        const pathEl = svgPath.querySelector("path");
        if (pathEl) pathEl.setAttribute("d", path);
      }
    };

    updateOffsetPath();
    window.addEventListener("resize", updateOffsetPath);
    return () => {
      window.removeEventListener("resize", updateOffsetPath);
    };
  }, [bookSize, open]);

  //distribute the icons
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const lis = menu.querySelectorAll("li") as NodeListOf<HTMLElement>;
    if (!lis.length) return;

    if (!open) {
      lis.forEach(li => (li.style.offsetDistance = "0%"));
      return;
    }

    //--linear distribution
    // const minOffset = 7;
    // const maxOffset = 100;
    // const step = (maxOffset - minOffset) / (lis.length - 1 || 1);

    //--fixed step distribution
    const distancePerIcon = 7;
    const iconStep = 7;

    const { path, horizontalStartPercent } = pathDataRef.current;

    lis.forEach((li, index) => {
      //--linear distribution
      // const percent = minOffset + step * index;
      //--fixed step distribution
      const percent = distancePerIcon * index + iconStep;
      li.style.offsetPath = `path('${path}')`;
      li.style.offsetDistance = `${percent}%`;
      li.style.setProperty("--target-distance", `${percent}%`);

      // rotate when reaching the horizontal part
      if (percent >= horizontalStartPercent) {
        li.style.transform = `rotate(-90deg)`;
      }
    });
  }, [open, socialsOptions]);


  return (
    <div className="share-wrapper">
      {InstagramGradientDefs}
      <div
        className="share-button"
        onClick={() => setOpen(prev => !prev)}
        role="button"
        aria-label="Share"
      >
        <FontAwesomeIcon icon={faRetweet} aria-hidden="true" style={{ width: "50%", height: "50%" }} />
      </div>

      <div className={`share-menu ${open ? "open" : ""}`} ref={menuRef}>
        <ul key={JSON.stringify(socialsOptions)}>
          {Object.entries(socialsOptions || {}).map(([key, enabled]) =>
            enabled && socialButtonsMap[key])}
        </ul>
      </div>
    </div>
  );
}
