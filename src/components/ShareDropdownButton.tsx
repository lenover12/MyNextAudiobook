import React, { useState } from "react";

interface Props {
  title: string;
  url: string;
}

export default function ShareDropdownButton({ title, url }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="share-wrapper">
      <div
        className="share-button"
        onClick={() => setOpen((prev) => !prev)}
        role="button"
        aria-label="Share"
      >
        <i className="fa-solid fa-retweet" aria-hidden="true"></i>
      </div>

      {open && (
        <div className={`share-menu ${open ? "open" : ""}`}>
          <ul>
            <li>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  url
                )}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-twitter" aria-hidden="true"></i>
              </a>
            </li>
            <li>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  url
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-facebook" aria-hidden="true"></i>
              </a>
            </li>
            <li>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                  url
                )}&title=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-linkedin" aria-hidden="true"></i>
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
