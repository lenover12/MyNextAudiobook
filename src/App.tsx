import { useEffect, useState, useRef } from "react";
import { getRandomLoadingImage } from './utils/loadingImages';
import { useAmbientCanvas } from "./hooks/useAmbientCanvas";
import { useColourFromImage } from "./hooks/useColourFromImage";
import { useTsPulseCanvas } from "./hooks/useTsPulseCanvas";
import { useFitText } from "./hooks/useFitText";
import { getTitleElements } from "./utils/getTitleElements";
import { usePreloadBooks } from "./hooks/usePreloadBooks";
import { useScrollNavigation } from "./hooks/useScrollNavigation";
import { useSwipeNavigation } from "./hooks/useSwipeNavigation";

import { animated, useSpring } from '@react-spring/web';
import type { ReactNode } from "react";

function BookTitle({
  title,
  titleText,
  maxHeight,
  visible
}: {
  title: ReactNode;
  titleText: string;
  maxHeight: number;
  visible: boolean;
}) {
  const { ref, fontSize, isReady }  = useFitText(maxHeight, titleText);

  return (
    <h2
      ref={ref}
      className={`urbanist-bold book-title-element ${isReady ? "visible" : ""}`}
      style={{ 
        fontSize: `${fontSize}rem`,
        margin: 0,
        opacity: visible ? 1 : 0,
        transition: visible
          ? "opacity 0.6s ease"
          : "opacity 0.1s ease-out",
      }}
    >
      {title}
    </h2>
  );
}

function App() {
  const {
    books,
    currentBook: book,
    currentIndex,
    isFetching,
    next,
    previous,
  } = usePreloadBooks({
    genre: "Sci-Fi & Fantasy",
    allowExplicit: false,
    allowFallback: true,
  });

  //book placement for scrolling
  const getBookByOffset = (offset: number) => {
    const idx = currentIndex + offset;
    return books[idx] ?? null;
  };
  const bookTriplet = [
    { book: getBookByOffset(-1), className: "book-previous", offset: "-100vh" },
    { book: getBookByOffset(0), className: "book-current", offset: "0vh" },
    { book: getBookByOffset(1), className: "book-next", offset: "+100vh" },
  ];

  const [loadingStates, setLoadingStates] = useState<Record<string, {
    isLoaded: boolean;
    fadeIn: boolean;
    loadingImg: string | null;
  }>>({});

  //canvas background effect
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bookTitleRef = useRef<HTMLDivElement>(null);
  const [maxTitleHeight, setMaxTitleHeight] = useState(0);

  //image color
  const imageColour = useColourFromImage(book?.itunesImageUrl ?? null);

  //canvas pulse effect
  const pulseCanvasRef = useRef<HTMLCanvasElement>(null);
  const bookImageWrapperRef = useRef<HTMLDivElement>(null);
  const [tsPulseEnabled, setTsPulseEnabled] = useState(false);
  const { pulseOnce } = useTsPulseCanvas(pulseCanvasRef, tsPulseEnabled, bookImageWrapperRef, imageColour);

  //css pulse effect
  const [cssPulseVisible, setCssPulseVisible] = useState(false);

  //audio
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPausedRef = useRef(false);
  const FADE_OUT_DURATION = 600;

  //scroll
  const [scrolled, setScrolled] = useState(false);

  //title fade
  const [titleVisible, setTitleVisible] = useState(true);
  const [titleText, setTitleText] = useState(book?.title ?? '');

  //supliment -webkit-user-drag: none; browser compatability
  useEffect(() => {
    const handler = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragstart", handler);
    return () => document.removeEventListener("dragstart", handler);
  }, []);

  const [lastBookId, setLastBookId] = useState<string | null>(null);

  const onScrollNext = () => {
    if (book?.itunesId) setLastBookId(book.itunesId.toString());
    isPausedRef.current = audioRef.current?.paused ?? true;
    next();
  };
  
  const onScrollPrevious = () => {
    if (book?.itunesId) setLastBookId(book.itunesId.toString());
    previous();
  };

  const isTouchDevice = /Mobi|Android|iPhone|iPad|iPod|Tablet|Touch/i.test(navigator.userAgent);

  if (!isTouchDevice) {
    useScrollNavigation({
      onNext: onScrollNext,
      onPrevious: onScrollPrevious,
      canGoNext: !!book,
      canGoPrevious: currentIndex > 0,
    });
  }

  const { y } = useSwipeNavigation({
    onNext: onScrollNext,
    onPrevious: onScrollPrevious,
    canGoNext: !!book,
    canGoPrevious: currentIndex > 0,
  });

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
  
    const pulseEl = bookImageWrapperRef.current?.querySelector(".css-pulse") as HTMLElement | null;
  
    if (audio.paused) {
      isPausedRef.current = false;

      pulseOnce();
      
      audio.play().then(() => {
        // setTsPulseEnabled(true);
        setCssPulseVisible(true);
        pulseEl?.classList.remove("fade-out-glow");
      }).catch(console.warn);
    } else {
      isPausedRef.current = true;

      // setTsPulseEnabled(false);

      audio.pause();
    
      pulseEl?.classList.remove("fade-out-glow");
      if (pulseEl) void pulseEl.offsetWidth;
    
      pulseEl?.classList.add("fade-out-glow");
    
      setTimeout(() => {
        if (isPausedRef.current) {
          setCssPulseVisible(false);
          pulseEl?.classList.remove("fade-out-glow");
        }
      }, FADE_OUT_DURATION);
    }    
  };

  //loading image state per book
  function initLoadingState(bookId: string) {
    setLoadingStates(prev => ({
      ...prev,
      [bookId]: {
        isLoaded: false,
        fadeIn: false,
        loadingImg: getRandomLoadingImage(),
      },
    }));
  }

  //autoplay new audio on change if already playing
  useEffect(() => {
  const audio = audioRef.current;

    if (audio && !isPausedRef.current) {
      const playNext = async () => {
        try {
          await audio.play();
          setCssPulseVisible(true);
        } catch (err) {
          console.warn("Audio play failed:", err);
        }
      };

      playNext();
    }
  }, [book]);

  //canvas image
  const currentId = book?.itunesId?.toString();
  const currentState = currentId ? loadingStates[currentId] : undefined;

  const canvasImage =
    currentState?.isLoaded && book?.itunesImageUrl
      ? book.itunesImageUrl
      : currentState?.fadeIn && currentState.loadingImg
        ? currentState.loadingImg
        : '';

  useAmbientCanvas(canvasRef, canvasImage, !!canvasImage);

  useEffect(() => {
    if (imageColour) {
      document.documentElement.style.setProperty('--pulse-colour', `rgb(${imageColour})`);
    }
  }, [imageColour]);
  
  useEffect(() => {
    const id = book?.itunesId?.toString();
    if (!id || loadingStates[id]) return;

    const loadingImg = getRandomLoadingImage();
    setLoadingStates(prev => ({
      ...prev,
      [id]: {
        isLoaded: false,
        fadeIn: false,
        loadingImg,
      },
    }));
  }, [book, loadingStates]);

  //book title height
  useEffect(() => {
    if (!bookTitleRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setMaxTitleHeight(entry.contentRect.height);
    });

    observer.observe(bookTitleRef.current);
    return () => observer.disconnect();
  }, [book]);

  //book title inner book-change fade effect for scroll
    useEffect(() => {
    const newTitle = book?.title ?? '';
    if (newTitle === titleText) return;

    setTitleVisible(false);

    const timeout = setTimeout(() => {
      setTitleText(newTitle);
      setTitleVisible(true);
    }, 600);

    return () => clearTimeout(timeout);
  }, [book?.title]);
  //book title outer drag-based fade effect for swipe
  const titleOpacity = y.to((val) => {
    const abs = Math.abs(val);
    return abs < 60 ? 1 : abs > 120 ? 0 : 1 - (abs - 60) / 60;
  });

  return (
    <div className="app">
      <animated.div
        className="book-swipe-layer"
        style={{
          transform: y.to((val) => `translateY(${val}px)`),
          touchAction: 'pan-y',
          willChange: 'transform',
        }}
      >
        {bookTriplet.map(({ book, className, offset }, i) => {
          const key = book?.itunesId ?? `placeholder-${i}`;
          const isCurrent = className === "book-current";
          const bookId = book?.itunesId?.toString();
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
            if (bookId && !loadingStates[bookId]) initLoadingState(bookId);
          }, [bookId]);

          const loadingState = bookId ? loadingStates[bookId] : null;

          return (
            <div
              key={key}
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
                    if (bookId) {
                      setLoadingStates(prev => ({
                        ...prev,
                        [bookId]: {
                          ...prev[bookId],
                          fadeIn: true,
                        },
                      }));
                    }
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
                    if (bookId) {
                      setLoadingStates(prev => ({
                        ...prev,
                        [bookId]: {
                          ...prev[bookId],
                          isLoaded: true,
                        },
                      }));
                    }
                  }}
                  onClick={togglePlayPause}
                />
              )}
              <animated.div className={`css-pulse ${cssPulseVisible ? "visible" : ""} ${wasJustCurrent ? "fade-out-glow" : ""}`} style={pulseSpring} />
            </div>
          );
        })}

      </animated.div>
      <div className="book-static-layer">
        <canvas
          ref={canvasRef}
          className={`canvas-background visible`}
          style={{ width: "100%", height: "auto" }}
        />

        <canvas
          ref={pulseCanvasRef}
          className="canvas-pulse"
          width={600}
          height={600}
        />

        {book && (
          <>
            {book.audiblePageUrl && (
              <animated.div
                className="redirect-badge-container"
                style={{ opacity: titleOpacity }}
              >
                <a
                  href={book.audiblePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/src/assets/badge/audible.png"
                    alt="Find on Audible"
                    className="redirect-badge"
                  />
                </a>
              </animated.div>
            )}
            <animated.div className="book-title" ref={bookTitleRef} style={{ opacity: titleOpacity }}>
              <BookTitle
                title={getTitleElements(titleText, 4, true)}
                titleText={titleText}
                maxHeight={maxTitleHeight}
                visible={titleVisible}
              />
            </animated.div>
            {book.audioPreviewUrl && (
              <audio ref={audioRef} src={book.audioPreviewUrl}></audio>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
