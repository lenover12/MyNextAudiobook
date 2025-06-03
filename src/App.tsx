// import Heading from "./components/Heading";
import { useEffect, useState, useRef } from "react";
import { fetchRandom } from "./utils/itunesAPI";
import { getRandomLoadingImage } from './utils/loadingImages';
import { useAmbientCanvas } from "./hooks/useAmbientCanvas";
import { usePulseCanvas } from "./hooks/usePulseCanvas";
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

  //canvas pulse effect
  const pulseCanvasRef = useRef<HTMLCanvasElement>(null);
  usePulseCanvas(pulseCanvasRef, isLoaded);

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
          <div className="book-image-wrapper">
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
              />
            )}
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
            <audio controls src={book.previewUrl}></audio>
            </>
          )}
          </div>
    </div>
  )
}

export default App
