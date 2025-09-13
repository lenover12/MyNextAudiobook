import { useState } from "react";

export default function LibraryMenu() {
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState<"favourites" | "history">("favourites");

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

      <div
        className={`library-overlay ${active ? "active" : ""}`}
        onClick={closeMenu}
      >
        <div
          className={`library-box ${active ? "active" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
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
            <div
              className={`library-content ${tab === "favourites" ? "active" : ""}`}
            >
              <div className="library-grid">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="library-item-square">
                    Fav {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`library-content ${tab === "history" ? "active" : ""}`}
            >
              <div className="library-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="library-item-square">
                    Hist {i + 1}
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
