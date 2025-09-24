import React, { useState, useEffect, useRef, type JSX } from "react";
import { getCssVarInPx } from "../utils/getCssVarInPx";

interface Props {
  title: string;
  url: string;
  author?: string;
  socialsOptions?: Record<string, boolean>;
  bookRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ShareDropdownButton({ title, url, author, socialsOptions, bookRef }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  
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
        >
          <i className="fa-brands fa-x-twitter" aria-hidden="true" style={{color: 'rgb(255, 255, 255)', filter: 'drop-shadow(2px 2px 2px rgb(0, 0, 0))'}}></i>
        </a>
      </li>
    ),
    facebook: (
      <li key="facebook">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-facebook" aria-hidden="true" style={{color: 'rgb(58, 89, 152)', filter: 'drop-shadow(2px 2px 2px rgb(38, 44, 55))'}}></i>
        </a>
      </li>
    ),
    linkedin: (
      <li key="linkedin">
        <a
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-linkedin" aria-hidden="true" style={{color: 'rgb(0, 119, 181)', filter: 'drop-shadow(2px 2px 2px rgba(49, 51, 53, 1))'}}></i>
        </a>
      </li>
    ),
    goodreads: (
      <li key="goodreads">
        <a
          href={getGoodreadsUrl(title, author)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-goodreads" aria-hidden="true" style={{color: 'rgb(233, 229, 205)', filter: 'drop-shadow(2px 2px 2px rgba(117, 66, 14, 1))'}}></i>
        </a>
      </li>
    ),
    instagram: (
      <li key="instagram">
        <a
          href="https://www.instagram.com/booktokka"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i
            className="fa-brands fa-instagram"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))'
            }}
          ></i>
        </a>
      </li>
    ),
    pinterest: (
      <li key="pinterest">
        <a
          href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=&description=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-pinterest" aria-hidden="true" style={{color: '#E60023', filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))'}}></i>
        </a>
      </li>
    ),
    whatsapp: (
      <li key="whatsapp">
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title)}%20${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-whatsapp" aria-hidden="true" style={{color: '#25D366', filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))'}}></i>
        </a>
      </li>
    ),
    telegram: (
      <li key="telegram">
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-telegram" aria-hidden="true" style={{color: '#0088CC', filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))'}}></i>
        </a>
      </li>
    ),
  };

  const pathDataRef = useRef<{
    path: string;
    bottomY: number;
    horizontalStartPercent: number;
  }>({ path: "", bottomY: 0, horizontalStartPercent: 0 });

  //dynamically update offset-path
    useEffect(() => {
    const menu = menuRef.current;
    const bookEl = bookRef?.current;
    if (!menu || !bookEl) return;

    const updateOffsetPath = () => {
      const bookSizePx = getCssVarInPx(bookEl, "--book-size");
      const startX = bookSizePx * 0.1;
      const startY = 0;
      const bottomY = bookSizePx / 1.4;
      const horizontalEndX = startX - bookSizePx;
      const horizontalEndY = bottomY;
      
      const controlX = (startX + startX) / 1.5;
      const controlY = 0;
      
      const path = `M ${startX} ${startY} Q ${controlX} ${controlY}, ${startX} ${bottomY} L ${horizontalEndX} ${horizontalEndY}`;
      const horizontalStartPercent = (bottomY / (bottomY + bookSizePx)) * 100;

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

    const ro = new ResizeObserver(updateOffsetPath);
    ro.observe(bookEl);

    window.addEventListener("resize", updateOffsetPath);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateOffsetPath);
    };
  }, [bookRef, open]);

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
      <div
        className="share-button"
        onClick={() => setOpen(prev => !prev)}
        role="button"
        aria-label="Share"
      >
        <i className="fa-solid fa-retweet" aria-hidden="true"></i>
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
