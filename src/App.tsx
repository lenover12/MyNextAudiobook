// import Heading from "./components/Heading";
import { useEffect, useState, useRef } from "react";
import { fetchRandom } from "./utils/itunesAPI";
import { getRandomLoadingImage } from './utils/loadingImages';

function App() {
  const [book, setBook] = useState<any>(null);
  const [loadingImg, setLoadingImg] = useState<string | null>(null);

  const isFetching = useRef(false);
  
  useEffect(() => {
    setLoadingImg(getRandomLoadingImage());
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
      {book ? (
        <div className="book-container">
          <div className="book-image-wrapper">
            <img
              className="book-image"
              src={book.artworkUrl600 || book.artworkUrl100?.replace('100x100bb', '600x600bb')} alt={book.collectionName}
            />
          </div>
          <div className="book-title">
            <h2>{book.collectionName}</h2>
          </div>
          <audio controls src={book.previewUrl}></audio>
        </div>
      ) : (
        <div className="loading-image-wrapper">
          {loadingImg && (
            <img
              className="book-image"
              src={loadingImg}
              alt="Loading preview"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default App
