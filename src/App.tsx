// import Heading from "./components/Heading";
import { useEffect, useState } from "react";
import { fetchRandom } from "./utils/itunesAPI";

function App() {
  const [book, setBook] = useState<any>(null);

  useEffect(() => {
    fetchRandom().then(setBook);
  }, []);

  return (
    <div className="app">
      {book ? (
        <div>
          <img src={book.artworkUrl100.replace('100x100bb', '600x600bb')} alt={book.collectionName} />
          <h2>{book.collectionName}</h2>
          <audio controls src={book.previewUrl}></audio>
        </div>
      ) : (
        <p>loading...</p>
      )}
    </div>
  )
}

export default App
