import React, { useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

type Book = {
  itunesId: number | null;
  itunesImageUrl?: string | null;
  title: string;
};

type LoadingState = {
  loadingImg: string | null;
  fadeIn: boolean;
  isLoaded: boolean;
};

type Props = {
  book: Book | null;
  bookId: string | null;
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
  bookId,
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

  const dragY = y.get();
  const isSwipingUp = dragY < 0;
  const isSwipingDown = dragY > 0;

  const shouldShowPulse = cssPulseVisible && isCurrent;
  const pulseSpring = useSpring({
    opacity: shouldShowPulse ? 1 : 0,
    config: { tension: 120, friction: 20 },
  });

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
      )}
      <animated.div
        className={`css-pulse ${cssPulseVisible ? "visible" : ""} ${wasJustCurrent ? "fade-out-glow" : ""}`}
        style={pulseSpring}
      />
      {/* share options */}
      {children} 
    </div>
  );
}
