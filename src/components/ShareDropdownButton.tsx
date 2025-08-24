import React, { useState, type JSX } from "react";

interface Props {
  title: string;
  url: string;
  author?: string;
  socialsOptions?: Record<string, boolean>;
}


export default function ShareDropdownButton({ title, url, author, socialsOptions }: Props) {
  const [open, setOpen] = useState(false);
  
  const getGoodreadsUrl = (title: string, author?: string) => {
    const query = author ? `${title} ${author}` : title;
    return `https://www.goodreads.com/search?utf8=✓&q=${encodeURIComponent(
      query
    )}&search_type=books`;
  };

  const socialButtonsMap: Record<string, JSX.Element> = {
    twitter: (
      <li key="twitter">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-x-twitter" aria-hidden="true" style={{color: 'rgb(255, 255, 255)', filter: 'drop-shadow(2px 2px 2px rgb(0, 0, 0))'}}></i>
        </a>
      </li>
    ),
    facebook: (
      <li key="facebook">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-facebook" aria-hidden="true" style={{color: 'rgb(58, 89, 152)', filter: 'drop-shadow(2px 2px 2px rgb(38, 44, 55))'}}></i>
        </a>
      </li>
    ),
    linkedin: (
      <li key="linkedin">
        <a
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-linkedin" aria-hidden="true" style={{color: 'rgb(0, 119, 181)', filter: 'drop-shadow(2px 2px 2px rgba(49, 51, 53, 1))'}}></i>
        </a>
      </li>
    ),
    goodreads: (
      <li key="goodreads">
        <a
          href={getGoodreadsUrl(title, author)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-goodreads" aria-hidden="true" style={{color: 'rgb(233, 229, 205)', filter: 'drop-shadow(2px 2px 2px rgba(117, 66, 14, 1))'}}></i>
        </a>
      </li>
    ),
    instagram: (
      <li key="instagram">
        <a
          href="https://www.instagram.com/booktokka"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i
            className="fa-brands fa-instagram"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))'
            }}
          ></i>
        </a>
      </li>
    ),
    pinterest: (
      <li key="pinterest">
        <a
          href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=&description=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-pinterest" aria-hidden="true" style={{color: '#E60023', filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))'}}></i>
        </a>
      </li>
    ),
    whatsapp: (
      <li key="whatsapp">
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title)}%20${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-whatsapp" aria-hidden="true" style={{color: '#25D366', filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))'}}></i>
        </a>
      </li>
    ),
    telegram: (
      <li key="telegram">
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-telegram" aria-hidden="true" style={{color: '#0088CC', filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))'}}></i>
        </a>
      </li>
    ),
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
            {Object.entries(socialsOptions || {}).map(([key, enabled]) => enabled && socialButtonsMap[key])}
          </ul>
        </div>
      )}
    </div>
  );
}
