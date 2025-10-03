import React, { useEffect, useRef, useState, type JSX } from "react";
import { useOptions } from "../hooks/useOptions";
import type { Options } from "../utils/optionsStorage";
import { useHistory } from "../hooks/useHistory";
import { useFavourites } from "../hooks/useFavourites";
import { genreOptions } from "../dto/genres";
import { countryOptions, type CountryCode } from "../dto/countries";
import { languageOptions, type LanguageCode } from "../dto/languages";
import { trackEvent } from "../utils/analytics";
import { diffOptions } from "../utils/optionsDiff";
import { getStoredConsent, setConsentFromToggle } from "../utils/consent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faChevronDown, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faXTwitter, faFacebook, faLinkedin, faGoodreads, faInstagram, faPinterest, faWhatsapp, faTelegram } from "@fortawesome/free-brands-svg-icons";

const optionLabels: Record<string, string> = {
  allowExplicit: "Allow NSFW Audiobooks",
  allowFallback: "Allow Fallback",
  useQRCode: "Show QR Code",
  allowNavigatorShare: "Allow Navigator Share",
  bookIdsInDomain: "Book IDs in Domain",
  mustHaveAudible: "Only books with Audible",
  countryCode: "Country",
  languageCode: "Language",
  twitter: "Twitter",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  goodreads: "Goodreads",
  instagram: "Instagram",
  pinterest: "Pinterest",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  clearHistory: "Delete History",
  clearFavourites: "Delete Favourites",
  enableCookies: "Enable Cookies",
};

const brandIcons: Record<string, any> = {
  twitter: faXTwitter,
  facebook: faFacebook,
  linkedin: faLinkedin,
  goodreads: faGoodreads,
  instagram: faInstagram,
  pinterest: faPinterest,
  whatsapp: faWhatsapp,
  telegram: faTelegram,
};

interface OptionsMenuProps {
  active: boolean;
  setActive: React.Dispatch<React.SetStateAction<boolean>>;
  analyticsId: string;
}

export default function OptionsMenu({ active, setActive, analyticsId }: OptionsMenuProps): JSX.Element {
  const { options, setOptions } = useOptions();
  const [spinning, setSpinning] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<null | "clearHistory" | "clearFavourites">(null);
  const { clearAll: clearFavourites, favourites } = useFavourites();
  const { clearAll: clearHistory, history } = useHistory();

  const menuStructure = [
    {
      label: "General",
      boolKeys: [
        "allowExplicit",
        // "allowFallback",
        "useQRCode",
        // "allowNavigatorShare", (if viable)
        "bookIdsInDomain",
        "mustHaveAudible",
      ] as const,
    },
    {
      label: "Audiobook Genres",
      nested: "genresOptions" as const,
    },
    ...(!options.allowNavigatorShare
      ? [{ label: "Socials", nested: "socialsOptions" as const }]
      : []),
    {
      label: "Data",
      boolKeys: ["enableCookies"] as const,
      actions: ["clearHistory", "clearFavourites"] as const,
    },
  ];

  type BoolKey = NonNullable<(typeof menuStructure)[number]["boolKeys"]>[number];
  type SocialKey = keyof Options["socialsOptions"];

  const openedOptionsRef = useRef<Options | null>(null);

  const handleClick = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 1100);

    const consent = getStoredConsent();
    const enabled = consent === "accepted_all";
    openedOptionsRef.current = JSON.parse(JSON.stringify({
      ...options,
      enableCookies: enabled,
    }));
    setOptions((prev) => ({ ...prev, enableCookies: enabled }));
    setActive(true);
  };

  const toggleMenu = (idx: number) => {
    setOpenMenu((prev) => (prev === idx ? null : idx));
  };

  const toggleBool = (key: BoolKey) => {
    if (key === "enableCookies") {
      const nextEnabled = !options.enableCookies;
      setOptions((prev) => ({ ...prev, enableCookies: nextEnabled }));
      setConsentFromToggle(nextEnabled, analyticsId);
      trackEvent("option_changed", { key: "enableCookies", to: nextEnabled });
      return;
    }
    if (typeof options[key] !== "boolean") return;
    setOptions((prev) => ({
      ...prev,
      [key]: !(prev[key] as boolean),
    } as Options));
  };

  const toggleGenre = (genre: string) => {
    setOptions((prev) => {
      const exists = prev.enabledGenres.includes(genre);
      const newGenres = exists
        ? prev.enabledGenres.filter((g) => g !== genre)
        : [...prev.enabledGenres, genre];

      return {
        ...prev,
        enabledGenres: newGenres.filter((g): g is string => !!g),
      };
    });
  };

  const toggleSocial = (k: SocialKey) => {
    setOptions((prev) => ({
      ...prev,
      socialsOptions: {
        ...prev.socialsOptions,
        [k]: !prev.socialsOptions[k],
      },
    }));
  };

  const setCountry = (value: string) => {
    setOptions((prev) => ({
      ...prev,
      countryCode: value || undefined,
    }));
  };

  const setLanguage = (value: string) => {
    setOptions((prev) => ({
      ...prev,
      languageCode: value || undefined,
    }));
  };

  const deleteData = (action: "clearHistory" | "clearFavourites") => {
    if (action === "clearHistory") clearHistory();
    if (action === "clearFavourites") clearFavourites();
  };

  useEffect(() => {
    if (!active || openMenu === null) {
      setConfirmingAction(null);
    }
  }, [active, openMenu]);

  return (
    <div className="options-menu">
      <button
        className="options-button"
        onClick={handleClick}
        aria-label="Options"
      >
        <FontAwesomeIcon icon={faGear} className={spinning ? "spin" : ""} />
      </button>
        <div
          className={`options-overlay ${active ? "active" : ""}`}
          role="dialog"
          aria-modal="true"
          onClick={() => {
            //modal is closing
            const prev = openedOptionsRef.current;
            if (prev) {
              const delta = diffOptions(prev, options);
              if (delta) {
                //send compact events to analytics
                delta.toggles?.forEach(t => trackEvent("option_changed", { key: t.key, to: t.to }));
                if (delta.genres) {
                  if (delta.genres.added.length) trackEvent("genres_changed", { added: delta.genres.added });
                  if (delta.genres.removed.length) trackEvent("genres_changed", { removed: delta.genres.removed });
                }
                if (delta.socials) {
                  if (delta.socials.enabled.length) trackEvent("social_options_changed", { enabled: delta.socials.enabled });
                  if (delta.socials.disabled.length) trackEvent("social_options_changed", { disabled: delta.socials.disabled });
                }
                delta.selects?.forEach(s => trackEvent("option_changed", { key: s.key, to: s.to ?? null }));
              }
            }
            setActive(false);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className={`options-box ${active ? "active" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="options-modal">
              <h2 className="options-title">Options</h2>

              <div className="options-list">
                {menuStructure.map((section, idx) => {
                  const isOpen = openMenu === idx;
                  return (
                    <div className="options-section" key={section.label}>
                      <button
                        type="button"
                        className="options-section-header"
                        onClick={() => toggleMenu(idx)}
                        aria-expanded={isOpen}
                        aria-controls={`options-section-${idx}`}
                      >
                        <span>{section.label}</span>
                        <FontAwesomeIcon icon={faChevronDown} className={`arrow ${isOpen ? "open" : ""}`} />
                      </button>

                      <div
                        id={`options-section-${idx}`}
                        className={`options-submenu ${isOpen ? "expanded" : ""}`}
                      >
                        <div className="indent-the-children">
                          {section.boolKeys?.map((k) => (
                            <label
                              className="options-submenu-item"
                              key={k}
                              htmlFor={`opt-${k}`}
                            >
                              <span className="options-label">{optionLabels[k]}</span>

                              <div className="toggle">
                                <input
                                  id={`opt-${k}`}
                                  type="checkbox"
                                  checked={Boolean(options[k as keyof Options])}
                                  onChange={() => toggleBool(k)}
                                />
                                <label htmlFor={`opt-${k}`} />
                              </div>
                            </label>
                          ))}
                          {section.label === "General" && (
                            <div className="options-submenu-item">
                              <span className="options-label">Country</span>
                              <select
                                value={options.countryCode ?? ""}
                                onChange={(e) => setCountry(e.target.value as CountryCode)}
                                aria-label="Choose country"
                              >
                                {countryOptions.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {section.label === "General" && (
                            <div className="options-submenu-item">
                              <span className="options-label">Language</span>
                              <select
                                value={options.languageCode ?? ""}
                                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                                aria-label="Choose language"
                              >
                                {languageOptions.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {/* {section.label === "General" && (
                            <div className="options-submenu-item">
                              <span className="options-label">Preload Ahead</span>
                              <input
                                type="number"
                                min={0}
                                value={options.preloadAhead}
                                onChange={(e) =>
                                  setOptions((prev) => ({
                                    ...prev,
                                    preloadAhead: parseInt(e.target.value, 10) || 0,
                                  }))
                                }
                              />
                            </div>
                          )} */}
                        </div>
                        {section.nested === "genresOptions" && (
                          <div>
                            <p className="options-section-description">
                              limit results by specific genres
                            </p>
                            <div className="options-genre-flex">
                              {genreOptions.map((g) => {
                                const active = options.enabledGenres.includes(g.label);
                                return (
                                  <button
                                    key={g.label}
                                    type="button"
                                    className={`options-genre-pill ${active ? "active" : ""}`}
                                    onClick={() => toggleGenre(g.label)}
                                    aria-pressed={active}
                                  >
                                    {g.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {section.nested === "socialsOptions" && !options.allowNavigatorShare && (
                          <div>
                            <p className="options-section-description">Enable social media share options</p>
                            <div className="options-social-flex">
                              {(Object.keys(options.socialsOptions) as SocialKey[]).map(
                                (k, idx) => {
                                  const active = options.socialsOptions[k];
                                  return (
                                    <button
                                      key={k}
                                      type="button"
                                      className={`options-social-icon ${active ? "active" : ""}`}
                                      onClick={() => toggleSocial(k)}
                                      aria-pressed={active}
                                      aria-label={k}
                                      data-idx={idx}
                                    >
                                      <FontAwesomeIcon icon={brandIcons[k]} />
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                        <div className="options-danger-button-wrapper">
                          {section.actions?.map((action) => {
                            const isHistory = action === "clearHistory";
                            const isFavourites = action === "clearFavourites";

                            const isEnabled =
                              (isHistory && history.length > 1) ||
                              (isFavourites && favourites.length > 0);

                            return (
                              <div key={action} className="options-submenu-item">
                                {confirmingAction === action ? (
                                  <div className="confirm-buttons">
                                    <button
                                      type="button"
                                      className="options-cancel-button"
                                      onClick={() => setConfirmingAction(null)}
                                    >
                                      Cancel
                                    </button>
                                    <FontAwesomeIcon icon={faTrash} className="centre-icon" aria-hidden="true" />
                                    <button
                                      type="button"
                                      className="options-confirm-button"
                                      onClick={() => {
                                        deleteData(action);
                                        setConfirmingAction(null);
                                      }}
                                    >
                                      Confirm
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className={`options-danger-button ${!isEnabled ? "disabled" : ""}`}
                                    onClick={() => isEnabled && setConfirmingAction(action)}
                                    disabled={!isEnabled}
                                  >
                                    <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                                    <span>{optionLabels[action]}</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="gradient-overlay gradient-bottom options-modal-gradient"></div>
          </div>
        </div>
    </div>
  );
}
