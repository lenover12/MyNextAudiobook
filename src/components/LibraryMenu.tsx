import { useState } from "react";

export default function LibraryMenu() {
  const [active, setActive] = useState(false);

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

      <ul className={`library-box ${active ? "active" : ""}`}>
        <li><a className="library-item" href="#">Home</a></li>
        <li><a className="library-item" href="#">About</a></li>
        <li><a className="library-item" href="#">Team</a></li>
        <li><a className="library-item" href="#">Contact</a></li>
        <li><a className="library-item" href="#">Twitter</a></li>
      </ul>
    </div>
  );
}
