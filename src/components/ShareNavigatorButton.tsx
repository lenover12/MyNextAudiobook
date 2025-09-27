import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRetweet } from "@fortawesome/free-solid-svg-icons";

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
      <FontAwesomeIcon icon={faRetweet} aria-hidden="true" style={{ width: "50%", height: "50%" }} />
    </button>
    </div>
  );
}
