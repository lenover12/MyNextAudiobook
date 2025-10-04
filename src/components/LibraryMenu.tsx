import { useState } from "react";
import { useHistory } from "../hooks/useHistory";
import { useFavourites } from "../hooks/useFavourites";
import shelf from '../assets/shelf/shelf-4.png';
import cdCase from '../assets/shelf/cd-case-2.png';
import type { BookDBEntry } from "../dto/bookDB";
import { trackEvent } from "../utils/analytics";
import { useOptions } from "../hooks/useOptions";
import type { LanguageCode } from "../dto/languages";
import { t } from "../utils/translations";

interface LibraryMenuProps {
  onSelectBook: (book: BookDBEntry, source: "favourites" | "history") => void;
  active: boolean;
  setActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function LibraryMenu({ onSelectBook, active, setActive }: LibraryMenuProps) {
  const activeState = active;
  const setActiveState = setActive;
  const [tab, setTab] = useState<"favourites" | "history">("favourites");
  const { history } = useHistory();
  const { favourites } = useFavourites();
  const { options } = useOptions();
  const lang: LanguageCode = options.languageCode ?? "en";

  const closeMenu = () => setActiveState(false);

  return (
    <div className="library-menu">
      <button
        className={`library-button ${activeState ? "active" : ""}`}
        onClick={() => {
          setActiveState(prev => {
            const newState = !prev;
            if (newState) trackEvent("library_opened");
            return newState;
          });
        }}
        aria-label="Toggle library menu"
      >
        <div className="library-button-layers">
          <span className="one"></span>
          <span className="two"></span>
          <span className="three"></span>
        </div>
      </button>

      <div 
        className={`library-overlay ${activeState ? "active" : ""}`}
        onClick={closeMenu}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className={`library-box ${activeState ? "active" : ""}`} onClick={(e) => e.stopPropagation()}>
          <div className="library-tabs">
            <button
              className={`library-tab ${tab === "favourites" ? "active" : ""}`}
              onClick={() => setTab("favourites")}
            >
              {t(lang, "menu.favourites")}
            </button>
            <button
              className={`library-tab ${tab === "history" ? "active" : ""}`}
              onClick={() => setTab("history")}
            >
              {t(lang, "menu.history")}
            </button>
          </div>

          <div className="library-content-wrapper">
            <div className={`library-content ${tab === "favourites" ? "active" : ""}`}>
              <div className="library-grid">
                {favourites.map((entry) => (
                  <div
                    key={`${tab}-${entry.asin ?? entry.itunesId}`}
                    className="library-item-square"
                    onClick={() => {
                      trackEvent("favourite_item_clicked", {
                        book_id: (entry.asin ?? entry.itunesId)?.toString() ?? null
                      });
                      onSelectBook(entry, "favourites");
                    }}
                  >
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
                        <span> //TODO centre
                          ?
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`library-content ${tab === "history" ? "active" : ""}`}>
              <div className="library-grid">
                {history.map((entry) => (
                  <div
                    key={`${tab}-${entry.asin ?? entry.itunesId}`}
                    className="library-item-square"
                    onClick={() => {
                      trackEvent("history_item_clicked", {
                        book_id: (entry.asin ?? entry.itunesId)?.toString() ?? null
                      });
                      onSelectBook(entry, "history");
                    }}
                  >
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
          <div className="gradient-overlay gradient-bottom"></div>
        </div>
      </div>
    </div>
  );
}
