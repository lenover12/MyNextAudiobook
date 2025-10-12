import React, { useEffect, useMemo, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import BookStickerPeel from './BookStickerPeel';
import { useFitText } from '../hooks/useFitText';
import DOMPurify from 'dompurify';

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
  bookSize: number;
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
  bookSize,
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

  const maxWidth = bookSize;
  const maxHeight = bookSize * 0.66;

  const rawDescription = book?.description?.trim() || book?.summary?.trim() || "Nothing here but us chickens 🐔";
  const safeDescription = useMemo(() => DOMPurify.sanitize(rawDescription), [rawDescription]);

  const { ref: fitRef, fontSize, isReady } = useFitText(
    maxHeight,
    maxWidth,
    safeDescription,
    0.1,
    0.5,
    0.05,
  );

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

  useEffect(() => {
    if (stickerOpen) {
      const handleClickOutside = () => setStickerOpen(false);
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
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
      <div className="sticker-reveal-text">
        <p
          ref={fitRef}
          style={{ 
            fontSize: isCurrent && isReady ? `${fontSize}rem` : 0,
            opacity: isCurrent ? 1 : 0,
            visibility: isCurrent && isReady ? "visible" : "hidden",
            transition: "opacity 0.5s ease, font-size 0.3s ease",
           }}
          className="sticker-reveal-description"
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        >
        </p>
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
