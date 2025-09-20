import React, { useState, type JSX } from "react";
import { useOptions } from "../hooks/useOptions";
import type { Options } from "../utils/optionsStorage";

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
    label: "Socials",
    nested: "socialsOptions" as const,
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
};

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

  return (
    <div className="options-menu">
      <button
        className="options-button"
        onClick={handleClick}
        aria-label="Options"
      >
        <i className={`fa-solid fa-gear ${spinning ? "spin" : ""}`} />
      </button>

      {active && (
        <div
          className="options-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(false)}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="options-modal" onClick={(e) => e.stopPropagation()}>
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
                    <div>
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
                            onChange={(e) => setCountry(e.target.value)}
                            aria-label="Choose country"
                          >
                            <option value="us">United States</option>
                            <option value="au">Australia</option>
                            <option value="uk">United Kingdom</option>
                            <option value="ca">Canada</option>
                            <option value="in">India</option>
                          </select>
                        </div>
                      )}
                    </div>
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
