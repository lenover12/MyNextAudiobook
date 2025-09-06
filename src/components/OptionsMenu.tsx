import React, { useState, type JSX } from "react";
import { useOptions } from "../hooks/useOptions";
import type { Options } from "../utils/optionsStorage";

const menuStructure = [
  {
    label: "General",
    boolKeys: [
      "allowExplicit",
      "allowFallback",
      "useQRCode",
      "allowNavigatorShare",
      "bookIdsInDomain",
    ] as const,
  },
  {
    label: "Country",
    special: "countryCode" as const,
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

export default function OptionsMenu(): JSX.Element {
  const { options, setOptions } = useOptions();
  const [spinning, setSpinning] = useState(false);
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const handleClick = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 1100);
    setOpen(true);
  };

  const toggleMenu = (idx: number) => {
    setOpenMenu((prev) => (prev === idx ? null : idx));
  };

  const toggleBool = (key: BoolKey) => {
    if (typeof options[key] !== "boolean") return;
    setOptions((prev) => {
      const next = {
        ...prev,
        [key]: !(prev[key] as boolean),
      } as Options;
      return next;
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

  return (
    <div className="options-menu">
      <button
        className="options-button"
        onClick={handleClick}
        aria-label="Options"
      >
        <i className={`fa-solid fa-gear ${spinning ? "spin" : ""}`} />
      </button>

      {open && (
        <div
          className="options-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
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


                      {section.special === "countryCode" && (
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

                      {section.nested === "socialsOptions" && (
                        <div className="options-social-grid">
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
                                  data-idx={idx} // optional if you want to target row logic
                                >
                                  <i className={`fa-brands fa-${k}`} />
                                </button>
                              );
                            }
                          )}
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
