// import Heading from "./components/Heading";
import { useEffect, useState, useRef } from "react";
import { fetchRandom } from "./utils/itunesAPI";
import { getRandomLoadingImage } from './utils/loadingImages';
import { useAmbientCanvas } from "./hooks/useAmbientCanvas";

function App() {
  const [book, setBook] = useState<any>(null);
  const [fadeInLoadingImg, setFadeInLoadingImg] = useState(false);
  const [loadingImg, setLoadingImg] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const isFetching = useRef(false);

  //canvas background effect
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

          {book && (
            <>
            <div className="book-title">
              <h2>{book.collectionName}</h2>
            </div>
            <audio controls src={book.previewUrl}></audio>
            </>
          )}
          </div>
    </div>
  )
}

export default App
