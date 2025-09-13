import { useState } from "react";
import { useHistory } from "../hooks/useHistory";
import shelf from '../assets/shelf/shelf-4.png';
import cdCase from '../assets/shelf/cd-case-2.png';

export default function LibraryMenu() {
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState<"favourites" | "history">("favourites");
  const { history } = useHistory();

  const closeMenu = () => setActive(false);

  return (
    <div className="library-menu">
      <button
        className={`library-button ${active ? "active" : ""}`}
        onClick={() => setActive((prev) => !prev)}
        aria-label="Toggle library menu"
      >
        <div className="library-button-layers">
          <span className="one"></span>
          <span className="two"></span>
          <span className="three"></span>
        </div>
      </button>

      <div className={`library-overlay ${active ? "active" : ""}`} onClick={closeMenu}>
        <div className={`library-box ${active ? "active" : ""}`} onClick={(e) => e.stopPropagation()}>
          <div className="library-tabs">
            <button
              className={`library-tab ${tab === "favourites" ? "active" : ""}`}
              onClick={() => setTab("favourites")}
            >
              Favourites
            </button>
            <button
              className={`library-tab ${tab === "history" ? "active" : ""}`}
              onClick={() => setTab("history")}
            >
              History
            </button>
          </div>

          <div className="library-content-wrapper">
            <div className={`library-content ${tab === "favourites" ? "active" : ""}`}>
              <div className="library-grid">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="library-item-square">
                    Fav {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className={`library-content ${tab === "history" ? "active" : ""}`}>
              <div className="library-grid">
                {history.map((entry) => (
                  <div key={entry.asin ?? entry.itunesId} className="library-item-square">
                    <img
                      src={shelf}
                      className="library-single-shelf"
                    />
                    <div className="library-audiobook">
                      <img
                        src={cdCase}
                        className="library-thumb library-case"
                      />
                      {entry.thumbnailData ? (
                        <img
                          src={entry.thumbnailData}
                          alt={entry.title}
                          className="library-thumb"
                        />
                      ) : (
                        <span>
                          ?
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
