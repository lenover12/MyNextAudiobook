import { useEffect, useState, useRef } from "react";
import { getRandomLoadingImage } from './utils/loadingImages';
import { useAmbientCanvas } from "./hooks/useAmbientCanvas";
import { useColourFromImage } from "./hooks/useColourFromImage";
import { useTsPulseCanvas } from "./hooks/useTsPulseCanvas";
import { useFitText } from "./hooks/useFitText";
import { getTitleElements } from "./utils/getTitleElements";
import { usePreloadBooks } from "./hooks/usePreloadBooks";

import type { ReactNode } from "react";

function BookTitle({
  title,
  maxHeight
}: {
  title: ReactNode;
  maxHeight: number;
}) {
  const { ref, fontSize, isReady }  = useFitText(maxHeight);

  return (
    <h2
      ref={ref}
      className={`urbanist-bold book-title-element ${isReady ? "visible" : ""}`}
      style={{ fontSize: `${fontSize}rem`, margin: 0,
      opacity: isReady ? 1 : 0,
      transition: "opacity 0.5s ease",
    }}
    >
    {title}
    </h2>
  );
}

function App() {
  const {
    currentBook: book,
    isFetching,
    next,
  } = usePreloadBooks({
    genre: "Sci-Fi & Fantasy",
    allowExplicit: false,
    allowFallback: true,
  });
  const [fadeInLoadingImg, setFadeInLoadingImg] = useState(false);
  const [loadingImg, setLoadingImg] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  //canvas background effect
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bookTitleRef = useRef<HTMLDivElement>(null);
  const [maxTitleHeight, setMaxTitleHeight] = useState(0);

  //image color
  const imageColour = useColourFromImage(book?.artworkUrl600 ?? null);

  //canvas pulse effect
  const pulseCanvasRef = useRef<HTMLCanvasElement>(null);
  const bookImageWrapperRef = useRef<HTMLDivElement>(null);
  const [tsPulseEnabled, setTsPulseEnabled] = useState(false);
  const { pulseOnce } = useTsPulseCanvas(pulseCanvasRef, tsPulseEnabled, bookImageWrapperRef, imageColour);

  //css pulse effect
  const [cssPulseVisible, setCssPulseVisible] = useState(false);

  //audio
  const audioRef = useRef<HTMLAudioElement>(null);
  const wasPausedRef = useRef(false);
  const FADE_OUT_DURATION = 600;

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
  
    const pulseEl = bookImageWrapperRef.current?.querySelector(".css-pulse") as HTMLElement | null;
  
    if (audio.paused) {
      wasPausedRef.current = false;

      pulseOnce();
      
      audio.play().then(() => {
        // setTsPulseEnabled(true);
        setCssPulseVisible(true);
        pulseEl?.classList.remove("fade-out-glow");
      }).catch(console.warn);
    } else {
      wasPausedRef.current = true;

      // setTsPulseEnabled(false);

      audio.pause();
    
      pulseEl?.classList.remove("fade-out-glow");
      if (pulseEl) void pulseEl.offsetWidth;
    
      pulseEl?.classList.add("fade-out-glow");
    
      setTimeout(() => {
        if (wasPausedRef.current) {
          setCssPulseVisible(false);
          pulseEl?.classList.remove("fade-out-glow");
        }
      }, FADE_OUT_DURATION);
    }    
  };


  //canvas image
  let canvasImage: string | null = null;
  let trigger = false;
  if (isLoaded && book?.artworkUrl600) {
    canvasImage = book.artworkUrl600;
    trigger = true;
  } else if (fadeInLoadingImg && loadingImg) {
    canvasImage = loadingImg;
    trigger = true;
  } else {
    canvasImage = null;
    trigger = true;
  }

  useAmbientCanvas(canvasRef, canvasImage, trigger);

  useEffect(() => {
    if (imageColour) {
      document.documentElement.style.setProperty('--pulse-colour', `rgb(${imageColour})`);
    }
  }, [imageColour]);
  
  useEffect(() => {
    setLoadingImg(getRandomLoadingImage());
    setIsLoaded(false);
    setFadeInLoadingImg(false);
  }, [book]);

  //book title height
  useEffect(() => {
    if (!bookTitleRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setMaxTitleHeight(entry.contentRect.height);
    });

    observer.observe(bookTitleRef.current);
    return () => observer.disconnect();
  }, [book]);

  return (
    <div className="app">
      <div className="book-container">
        <div className="book-image-wrapper" ref={bookImageWrapperRef}>                      
          {loadingImg && (
            <img
              className={`loading-image ${fadeInLoadingImg && !isLoaded ? 'visible' : ''}`}
              src={loadingImg}
              alt="Loading preview"
              onLoad={() => setFadeInLoadingImg(true)}
            />
          )}
          {book && (
            <img
              className={`book-image ${isLoaded ? 'visible' : ''}`}
              src={book.artworkUrl600}
              alt={book.collectionName}
              onLoad={() => setIsLoaded(true)}
              onClick={togglePlayPause}
            />
          )}
          <div className={`css-pulse ${cssPulseVisible ? "visible" : ""}`} />
        </div>

        <canvas
          ref={canvasRef}
          className={`canvas-background visible`}
          width={10} height={6} style={{ width: "100%", height: "auto" }}
        />

        <canvas
          ref={pulseCanvasRef}
          className="canvas-pulse"
          width={600}
          height={600}
        />

        {book && (
          <>
          <div className="book-title" ref={bookTitleRef}>
            <BookTitle
              title={getTitleElements(book.collectionName ?? '', 4, true)}
              maxHeight={maxTitleHeight}
            />
          </div>
          <audio ref={audioRef} src={book.previewUrl}></audio>
          </>
        )}
      </div>
    </div>
  )
}

export default App
