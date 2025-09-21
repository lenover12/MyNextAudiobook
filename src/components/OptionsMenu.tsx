import React, { useEffect, useState, type JSX } from "react";
import { useOptions } from "../hooks/useOptions";
import type { Options } from "../utils/optionsStorage";
import { useHistory } from "../hooks/useHistory";
import { useFavourites } from "../hooks/useFavourites";
import { genreOptions } from "../dto/genres";
import { countryOptions, type CountryCode } from "../dto/countries";

const menuStructure = [
  {
    label: "General",
    boolKeys: [
      "allowExplicit",
      // "allowFallback",
      "useQRCode",
      // "allowNavigatorShare",
      "bookIdsInDomain",
    ] as const,
  },
  {
    label: "Audiobook Genres",
    nested: "genresOptions" as const,
  },
  {
    label: "Socials",
    nested: "socialsOptions" as const,
  },
  {
    label: "Data",
    actions: ["clearHistory", "clearFavourites"] as const,
  },
];

const optionLabels: Record<string, string> = {
  allowExplicit: "Allow NSFW Audiobooks",
  allowFallback: "Allow Fallback",
  useQRCode: "Use QR Code",
  allowNavigatorShare: "Allow Navigator Share",
  bookIdsInDomain: "Book IDs in Domain",
  countryCode: "Country",
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
};

//TODO localization
const languageOptions = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];


type BoolKey = NonNullable<(typeof menuStructure)[number]["boolKeys"]>[number];
type SocialKey = keyof Options["socialsOptions"];

interface OptionsMenuProps {
  active: boolean;
  setActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OptionsMenu({ active, setActive }: OptionsMenuProps): JSX.Element {
  const { options, setOptions } = useOptions();
  const [spinning, setSpinning] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<null | "clearHistory" | "clearFavourites">(null);
  const { clearAll: clearFavourites, favourites } = useFavourites();
  const { clearAll: clearHistory, history } = useHistory();

  const handleClick = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 1100);
    setActive(true);
  };

  const toggleMenu = (idx: number) => {
    setOpenMenu((prev) => (prev === idx ? null : idx));
  };

  const toggleBool = (key: BoolKey) => {
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
        <i className={`fa-solid fa-gear ${spinning ? "spin" : ""}`} />
      </button>
        <div
          className={`options-overlay ${active ? "active" : ""}`}
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(false)}
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
                        <i
                          className={`fa-solid fa-chevron-down arrow ${
                            isOpen ? "open" : ""
                          }`}
                          aria-hidden
                        />
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
                        {section.nested === "socialsOptions" && (
                          <div>
                            <p className="options-section-description">Enable these bad bois and they will create a share link on each audiobook</p>
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
                                      <i className={`fa-brands fa-${k}`} />
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
                                    <i className="fa-solid fa-trash centre-icon" aria-hidden="true"></i>
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
                                    <i className="fa-solid fa-trash" aria-hidden="true"></i>
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
          </div>
        </div>
    </div>
  );
}
