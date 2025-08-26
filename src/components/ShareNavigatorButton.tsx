import React from "react";

interface Props {
  title: string;
  url: string;
  text?: string;
}

export default function ShareNavigatorButton({ title, url, text }: Props) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (err) {
        console.error("Share canceled or failed", err);
      }
    }
  };

  return (
    <div className="share-wrapper">
    <button className="share-button" onClick={handleShare}>
      <i className="fa-solid fa-retweet" aria-hidden="true"></i>
    </button>
    </div>
  );
}
