// import Heading from "./components/Heading";
import { useEffect, useState, useRef } from "react";
import { fetchRandom } from "./utils/itunesAPI";
import { getRandomLoadingImage } from './utils/loadingImages';
import { useAmbientCanvas } from "./hooks/useAmbientCanvas";
import { useColourFromImage } from "./hooks/useColourFromImage";
import { useTsPulseCanvas } from "./hooks/useTsPulseCanvas";
import { useFitText } from "./hooks/useFitText";

function BookTitle({ title, maxHeight }: { title: string; maxHeight: number }) {
  const { ref, fontSize } = useFitText(maxHeight);

  return (
    <h2
      ref={ref}
      className="urbanist-bold"
      style={{ fontSize: `${fontSize}rem`, margin: 0 }}
    >
      {title}
    </h2>
  );
}

function App() {
  const [book, setBook] = useState<any>(null);
  const [fadeInLoadingImg, setFadeInLoadingImg] = useState(false);
  const [loadingImg, setLoadingImg] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isFetching = useRef(false);

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

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setTsPulseEnabled(true);
      // setCssPulseVisible(true);
      pulseOnce();
    } else {
      audio.pause();
      setTsPulseEnabled(false);
      // setCssPulseVisible(false);
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

    if (isFetching.current) return;
    isFetching.current = true;

    fetchRandom({
      genre: "Sci-Fi & Fantasy",
      allowExplicit: false,
     })
      .then(setBook)
      .finally(() => {
        isFetching.current = false;
     });
  }, []);

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
              src={book.artworkUrl600 || book.artworkUrl100?.replace('100x100bb', '600x600bb')}
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
            <BookTitle title={book.collectionName} maxHeight={maxTitleHeight} />
          </div>
          <audio ref={audioRef} src={book.previewUrl}></audio>
          </>
        )}
      </div>
    </div>
  )
}

export default App
