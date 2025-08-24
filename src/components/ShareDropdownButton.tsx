import React, { useState } from "react";

interface Props {
  title: string;
  url: string;
  author?: string;
}


export default function ShareDropdownButton({ title, url, author }: Props) {
  const [open, setOpen] = useState(false);
  
  const getGoodreadsUrl = (title: string, author?: string) => {
    const query = author ? `${title} ${author}` : title;
    return `https://www.goodreads.com/search?utf8=✓&q=${encodeURIComponent(
      query
    )}&search_type=books`;
  };

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
                <i className="fa-brands fa-x-twitter" aria-hidden="true" style={{color: 'rgb(255, 255, 255)', filter: 'drop-shadow(2px 2px 2px rgb(0, 0, 0))'}}></i>
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
                <i className="fa-brands fa-facebook" aria-hidden="true" style={{color: 'rgb(58, 89, 152)', filter: 'drop-shadow(2px 2px 2px rgb(38, 44, 55))'}}></i>
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
                <i className="fa-brands fa-linkedin" aria-hidden="true" style={{color: 'rgb(0, 119, 181)', filter: 'drop-shadow(2px 2px 2px rgba(49, 51, 53, 1))'}}></i>
              </a>
            </li>
            <li>
              <a
                href={getGoodreadsUrl(title, author)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-goodreads" aria-hidden="true" style={{color: 'rgb(233, 229, 205)', filter: 'drop-shadow(2px 2px 2px rgba(117, 66, 14, 1))'}}></i>
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
