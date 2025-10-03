import { useEffect, useState } from "react";
import {
  applyConsent,
  storeConsent,
  loadGA,
  needsConsent,
  type ConsentChoice,
} from "../utils/consent";
import { trackEvent } from "../utils/analytics";

type Props = {
  analyticsId: string;
  forceOpen?: boolean;
  onClose?: () => void;
  onActiveChange?: (active: boolean) => void;
};

export default function CookieConsentModal({ analyticsId, forceOpen = false, onClose, onActiveChange, }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (forceOpen || needsConsent()) setActive(true);
  }, [forceOpen]);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  const decide = (choice: ConsentChoice) => {
    storeConsent(choice);
    applyConsent(choice);
    trackEvent("consent_decided", { choice });
    if (choice === "accepted_all") loadGA(analyticsId);
    setActive(false);
    onClose?.();
  };

  if (!active) return null;

  return (
    <div className="cookies-modal">
      <div
        className={`cookies-overlay ${active ? "active" : ""}`}
        role="dialog"
        aria-modal="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div
          className={`cookies-box ${active ? "active" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cookies-modal-contents">
            <h2 className="cookies-title">Privacy & Cookies</h2>

            <div className="cookies-list">
              <span className="cookies-section-header">Consent</span>

              <p className="cookies-section-description">
                We use lightweight analytics to understand usage and improve the app.
                Choose <strong>Only necessary</strong> to continue without analytics cookies.
              </p>

              <div className="cookies-button-wrapper">
                <button
                  type="button"
                  className="cookies-only-neccesary-button"
                  onClick={() => decide("necessary_only")}
                >
                  Only necessary
                </button>

                <button
                  type="button"
                  className="cookies-accept-all-button"
                  onClick={() => decide("accepted_all")}
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>

          <div className="gradient-overlay gradient-bottom cookies-modal-gradient"></div>
        </div>
      </div>
    </div>
  );
}
