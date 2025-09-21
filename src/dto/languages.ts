export const languageOptions = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
] as const;

export type LanguageCode = (typeof languageOptions)[number]["code"];