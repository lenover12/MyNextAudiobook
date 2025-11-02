import React, { useEffect, useMemo, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import BookStickerPeel from './BookStickerPeel';
// import { useFitText } from '../hooks/useFitText';
import DOMPurify from 'dompurify';
import note3 from '../assets/description/note3.png'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSortDown, faSortUp } from "@fortawesome/free-solid-svg-icons";


type Book = {
  itunesId: number | null;
  itunesImageUrl?: string | null;
  title: string;
  description?: string | null;
  summary?: string | null;
};

type LoadingState = {
  loadingImg: string | null;
  fadeIn: boolean;
  isLoaded: boolean;
};

type Props = {
  book: Book | null;
  className: string;
  offset: string;
  y: any;
  isCurrent: boolean;
  lastBookId: string | null;
  cssPulseVisible: boolean;
  loadingState: LoadingState | null;
  initLoadingState: (bookId: string) => void;
  markFadeIn: (bookId: string) => void;
  markLoaded: (bookId: string) => void;
  togglePlayPause: () => void;
  bookImageWrapperRef?: React.RefObject<HTMLDivElement>;
  children?: React.ReactNode
};

export function BookImageWrapper({
  book,
  className,
  offset,
  y,
  isCurrent,
  lastBookId,
  cssPulseVisible,
  loadingState,
  initLoadingState,
  markFadeIn,
  markLoaded,
  togglePlayPause,
  bookImageWrapperRef,
  children,
}: Props) {
  const bookId = book?.itunesId?.toString() ?? null;

  const dragY = y.get();
  const isSwipingUp = dragY < 0;
  const isSwipingDown = dragY > 0;

  const shouldShowPulse = cssPulseVisible && isCurrent;
  const pulseSpring = useSpring({
    opacity: shouldShowPulse ? 1 : 0,
    config: { tension: 120, friction: 20 },
  });


  const textRef = useRef<HTMLDivElement>(null);
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(true);
  const SCROLL_STEP = 80;
  const SCROLL_DURATION = 200;

  const scrollToY = (targetY: number) => {
    const el = textRef.current;
    if (!el) return;
    const startY = el.scrollTop;
    const delta = targetY - startY;
    const startTime = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / SCROLL_DURATION, 1);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * progress); // sine ease
      el.scrollTop = startY + delta * eased;
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  };

  const scrollDown = () => {
    if (!textRef.current) return;
    scrollToY(textRef.current.scrollTop + SCROLL_STEP);
  };

  const scrollUp = () => {
    if (!textRef.current) return;
    scrollToY(textRef.current.scrollTop - SCROLL_STEP);
  };

  // detect top/bottom
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const onScroll = () => {
      setShowUp(el.scrollTop > 0);
      setShowDown(el.scrollTop + el.clientHeight < el.scrollHeight);
    };

    onScroll(); // initial
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const rawDescription = book?.description?.trim() || book?.summary?.trim() || "Nothing here but us chickens 🐔";
  const safeDescription = useMemo(() => DOMPurify.sanitize(rawDescription), [rawDescription]);

  const wasJustCurrent =
    cssPulseVisible &&
    lastBookId &&
    bookId === lastBookId &&
    !isCurrent;

  const shouldHide =
    (className === "book-previous" && isSwipingDown) ||
    (className === "book-next" && isSwipingUp);

  useEffect(() => {
    if (bookId && !loadingState) {
      initLoadingState(bookId);
    }
  }, [bookId, loadingState, initLoadingState]);

  const [stickerOpen, setStickerOpen] = useState(false);
  const descriptionBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const box = descriptionBoxRef.current;
      if (!box) return;
      // use composedPath so portals/shadow DOM don’t break inside checks
      const path = (event.composedPath && event.composedPath()) || [];
      const clickedInside = path.includes(box) || box.contains(event.target as Node);
      if (clickedInside) return; // inside -> do nothing
      setStickerOpen(false);     // outside -> close
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [stickerOpen]);



  return (
    <div
      key={bookId ?? `placeholder-${className}`}
      ref={isCurrent ? bookImageWrapperRef : undefined}
      className={`book-image-wrapper ${className}`}
      style={{
        transform: `translate(-50%, calc(-50% + ${offset}))`,
        transition: 'transform 0.5s ease',
        opacity: shouldHide ? 0 : 1,
        pointerEvents: shouldHide ? 'none' : 'auto',
      }}
    >
      <div
        className="description-reveal-box"
        style={{
          backgroundImage: `url(${note3})`,
          pointerEvents: stickerOpen ? "auto" : "none",
        }}
        ref={descriptionBoxRef}
        onClick={(e) => e.stopPropagation()} 
      >
        <button
          className="description-reveal-up-button description-reveal-button"
          onClick={(e) => {
            e.stopPropagation();
            scrollUp();
          }}
          style={{ display: showUp ? "flex" : "none" }}
        >
          <FontAwesomeIcon icon={faSortUp} />
        </button>
        <p
          style={{ 
            opacity: isCurrent ? 1 : 0,
            transition: "opacity 0.5s ease, font-size 0.3s ease",
           }}
          className="description-reveal-text"
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        >
        </p>
        <button
          className="description-reveal-down-button description-reveal-button"
          onClick={(e) => {
            e.stopPropagation();
            scrollDown();
          }}
          style={{ display: showDown ? "flex" : "none" }}
        >
          <FontAwesomeIcon icon={faSortDown} />
        </button>
      </div>
      {loadingState?.loadingImg && (
        <img
          className={`loading-image ${loadingState.fadeIn && !loadingState.isLoaded ? 'visible' : ''}`}
          src={loadingState.loadingImg}
          alt="Loading preview"
          draggable={false}
          onLoad={() => {
            if (bookId) markFadeIn(bookId);
          }}
        />
      )}
      {book && book.itunesImageUrl && (
        <BookStickerPeel
          imageSrc={book.itunesImageUrl}
          visible={loadingState?.isLoaded ?? false}
          isCurrent={isCurrent}
          onLoad={() => bookId && markLoaded(bookId)}
          onClick={togglePlayPause}
          peelDirection={200}
          peelBackActivePct={66}
        />
      )}
      {/* {book && book.itunesImageUrl && (
        <img
          className={`book-image ${loadingState?.isLoaded ? 'visible' : ''}`}
          src={book.itunesImageUrl}
          alt={book.title}
          draggable={false}
          onLoad={() => {
            if (bookId) markLoaded(bookId);
          }}
          onClick={togglePlayPause}
        />
      )} */}
      <animated.div
        className={`css-pulse ${cssPulseVisible ? "visible" : ""} ${wasJustCurrent ? "fade-out-glow" : ""}`}
        style={pulseSpring}
      />
      {/* share options */}
      {children} 
    </div>
  );
}
