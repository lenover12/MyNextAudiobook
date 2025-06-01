// import Heading from "./components/Heading";
import { useEffect, useState, useRef } from "react";
import { fetchRandom } from "./utils/itunesAPI";
import { getRandomLoadingImage } from './utils/loadingImages';

function App() {
  const [book, setBook] = useState<any>(null);
  const [fadeInLoadingImg, setFadeInLoadingImg] = useState(false);
  const [loadingImg, setLoadingImg] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const isFetching = useRef(false);
  
  useEffect(() => {
    setLoadingImg(getRandomLoadingImage());
    setIsLoaded(false);
    setFadeInLoadingImg(false);

    const timeout = setTimeout(() => {
      setFadeInLoadingImg(true);
    }, 30);


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

     return () => clearTimeout(timeout);
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
